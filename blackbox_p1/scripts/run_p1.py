from __future__ import annotations
import json, os, pickle
from pathlib import Path
from dotenv import load_dotenv
from agent.gemini_agent import GeminiAgent, build_p1_task
from agent.gemini_client import GeminiClient
from agent.scenarios import get_scenario
from core.models import Fault
from ml.diagnose import diagnose_run, load_runs
from ml.p1_adapter import adapt_for_p0_model, verify_root_cause
from replay.causal import run_causal_check
from replay.diff import diff_runs
from replay.live_replay import LiveReplayEngine

ROOT=Path(__file__).resolve().parents[1]; DATA_DIR=ROOT/'data'/'p1_runs'; MODEL_PATH=ROOT/'data'/'model.pkl'

def load_model():
    with MODEL_PATH.open('rb') as f: return pickle.load(f)

def choose_unrelated(suspect):
    return next(i for i in range(5) if i!=suspect)

def main():
    load_dotenv(ROOT/'.env')
    test=os.getenv('P1_TEST','travel').strip().lower()
    requested_fault=os.getenv('P1_FAULT','').strip().lower()
    clean_mode = requested_fault in {'', 'none', 'clean', 'no_fault'}

    if test=='refund':
        task=build_p1_task('refund')
        fault=Fault(injected=False)
        patch={'target':'output','value':{'query':'refund within 7 days','documents':[{'title':'Refund Policy','text':'Refunds are available within 7 days of purchase.'}],'source':'replay_patch'}}
        if not clean_mode:
            fault=Fault(injected=True,step_idx=1,fault_type='wrong_retrieval',description='A plausible but incorrect refund-policy document is returned.')
    else:
        cfg=get_scenario(test)
        task=build_p1_task(test)
        fault_type=cfg['fault_type']
        if clean_mode:
            fault=Fault(injected=False)
        else:
            if requested_fault != fault_type:
                raise ValueError(f'P1_FAULT={requested_fault!r} is not supported for P1_TEST={test!r}. Expected {fault_type!r}, or use P1_FAULT=none for a clean run.')
            fault=Fault(injected=True,step_idx=cfg['fault_step'],fault_type=fault_type,description=cfg['fault_description'])
        patch=cfg['patch']

    client=GeminiClient(); agent=GeminiAgent(client); run=agent.run(task,fault=fault)
    DATA_DIR.mkdir(parents=True,exist_ok=True)
    original_path=DATA_DIR/f'{test}_{run.run_id}.json'; original_path.write_text(json.dumps(run.model_dump(),indent=2),encoding='utf8')

    print('\nBLACK BOX P1')
    print(f'Test        : {test}')
    print(f'Fault       : {"NONE (clean run)" if not fault.injected else f"{fault.fault_type} at Step {fault.step_idx}"}')
    print(f'Agent model : {getattr(client,"model","unknown")}')
    print(f'Run         : {run.run_id}')
    print(f'Outcome     : {run.status.upper()}')
    print(f'Answer      : {run.final_answer}')

    # Healthy executions should stop here. Do not invent a suspect, replay, or causal proof.
    if not fault.injected:
        result={
            'test':test,
            'ground_truth_fault':fault.model_dump(),
            'original':run.model_dump(),
            'diagnosis':None,
            'ml_suspect_step':None,
            'verified_step':None,
            'replay':None,
            'fixed_run':None,
            'diff':None,
            'causal_check':None,
            'unrelated_run':None,
            'clean_run':True,
        }
        result_path=DATA_DIR/f'{test}_{run.run_id}_result.json'
        result_path.write_text(json.dumps(result,indent=2),encoding='utf8')
        if run.status == 'success':
            print('Diagnosis   : NO FAULT DETECTED')
            print('Replay      : SKIPPED (healthy run)')
            print('Causal check: SKIPPED (healthy run)')
        else:
            print('Diagnosis   : CLEAN MODE BUT RUN FAILED')
            print('Replay      : SKIPPED')
            print('Causal check: SKIPPED')
            print('WARNING: The clean execution failed; this should be investigated before calling the run healthy.')
        print(f'\nSaved: {result_path}')
        return

    p0_runs=load_runs(); payload=load_model(); model_input=adapt_for_p0_model(run,payload['clean_stats']); diagnosis=diagnose_run(model_input,p0_runs)
    print(f'ML suspect  : Step {diagnosis.suspect_step_idx}')
    print('Ranking:')
    for x in diagnosis.ranking: print(f'  Step {x.step_idx}: blame={x.blame_score:.4f} relative={x.relative:.2%}')
    ml_suspect=diagnosis.suspect_step_idx
    verified_step=verify_root_cause(run)
    if verified_step is None:
        verified_step=ml_suspect
    if ml_suspect!=verified_step:
        print(f'P1 verifier  : Step {verified_step} (earliest semantic fault)')
        print(f'NOTE: XGBoost ranked Step {ml_suspect}; downstream consequence detected, so replay uses verified Step {verified_step}.')
    else:
        print(f'P1 verifier  : Step {verified_step}')
    verified_patch = patch if verified_step == fault.step_idx else {"target":"output","value":next(s.output for s in run.steps if s.step_idx==verified_step)}
    engine=LiveReplayEngine(agent); fixed,replay=engine.replay(run,verified_step,verified_patch,keep_faults=True); diff=diff_runs(run,fixed); unrelated=choose_unrelated(verified_step); causal,_,unrelated_run=run_causal_check(engine,run,verified_step,verified_patch,unrelated)
    output={'test':test,'ground_truth_fault':fault.model_dump(),'original':run.model_dump(),'diagnosis':diagnosis.model_dump(),'ml_suspect_step':ml_suspect,'verified_step':verified_step,'replay':replay.model_dump(),'fixed_run':fixed.model_dump(),'diff':diff.model_dump(),'causal_check':causal.model_dump(),'unrelated_run':unrelated_run.model_dump(),'clean_run':False}
    result_path=DATA_DIR/f'{test}_{run.run_id}_result.json'; result_path.write_text(json.dumps(output,indent=2),encoding='utf8')
    print('\nREPLAY'); print(f'Checkpoint  : Step {replay.forked_from_step}'); print(f'Prefix reuse: {replay.prefix_reused} step(s)'); print(f'Steps rerun : {replay.steps_rerun}'); print(f'Outcome     : {replay.original_outcome} -> {replay.new_outcome}'); print(f'First diff  : Step {diff.first_divergence}')
    print('\nCAUSAL CHECK'); [print(f'  Step {t.step_idx}: {t.patch} -> {t.new_outcome}') for t in causal.trials]
    print(f'\nSaved: {result_path}')
if __name__=='__main__': main()
