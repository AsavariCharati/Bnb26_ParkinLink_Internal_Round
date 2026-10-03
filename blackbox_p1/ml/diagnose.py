from __future__ import annotations
import json,pickle
from typing import List
import numpy as np
from core.models import Diagnosis,Evidence,HealthyReference,RankingItem,Run
from ml.features import FEATURE_NAMES,extract_step_features
RUNS_PATH="data/runs.jsonl";MODEL_PATH="data/model.pkl"

def load_runs()->List[Run]:
    with open(RUNS_PATH,"r",encoding="utf-8") as f:
        return [Run.model_validate(json.loads(x)) for x in f if x.strip()]

def load_model():
    with open(MODEL_PATH,"rb") as f:return pickle.load(f)

def find_healthy_reference(run,suspect_idx,runs):
    candidates=[r for r in runs if r.meta.split!="demo" and not r.fault.injected and r.status=="success" and r.task.template==run.task.template]
    if not candidates:return None
    ref=sorted(candidates,key=lambda x:x.run_id)[0]
    step=next((s for s in ref.steps if s.step_idx==suspect_idx),None)
    return HealthyReference(run_id=ref.run_id,step_idx=suspect_idx,output=step.output) if step else None

def build_causal_chain(run,suspect_idx,max_length=6):
    chain=[suspect_idx];current=suspect_idx
    while len(chain)<max_length:
        nxt=[step.step_idx for step in run.steps for read in step.reads if read.get("step_idx")==current]
        if not nxt:break
        n=min(nxt)
        if n in chain:break
        chain.append(n);current=n
    return chain

def diagnose_run(run,runs):
    payload=load_model();model=payload["model"];stats=payload["clean_stats"]
    rows=[]
    for step in run.steps:
        f=extract_step_features(step,run.steps,stats)
        rows.append([f.get(n,0.0) for n in FEATURE_NAMES])
    scores=model.predict_proba(np.asarray(rows,dtype=float))[:,1]
    order=sorted(range(len(run.steps)),key=lambda i:float(scores[i]),reverse=True)
    total=float(scores.sum())
    ranking=[RankingItem(step_idx=run.steps[i].step_idx,blame_score=float(scores[i]),relative=float(scores[i]/total if total else 0.0)) for i in order]
    suspect_idx=run.steps[order[0]].step_idx
    sf=extract_step_features(run.steps[order[0]],run.steps,stats)
    evidence=[]
    if sf["numeric_deviation"]>0.10:evidence.append(Evidence(feature="output_deviation",value=f"{sf['numeric_deviation']:.1%}",typical="near clean-run baseline"))
    if sf["downstream_readers"]>=2:evidence.append(Evidence(feature="downstream_readers",value=str(int(sf["downstream_readers"])),typical="0-1"))
    if sf["error_flag"]>0:evidence.append(Evidence(feature="error_flag",value="true",typical="false"))
    if sf["schema_match"]<1:evidence.append(Evidence(feature="schema_match",value=f"{sf['schema_match']:.2f}",typical="1.00"))
    if sf["consistency"]<0.8:evidence.append(Evidence(feature="consistency",value=f"{sf['consistency']:.2f}",typical="near 1.00"))
    return Diagnosis(run_id=run.run_id,ranking=ranking,suspect_step_idx=suspect_idx,evidence=evidence,healthy_reference=find_healthy_reference(run,suspect_idx,runs),causal_chain=build_causal_chain(run,suspect_idx))

def main():
    runs=load_runs();faulty=[r for r in runs if r.fault.injected and r.status=="failed"]
    if not faulty:raise RuntimeError("No faulty runs found.")
    d=diagnose_run(sorted(faulty,key=lambda r:r.run_id)[0],runs)
    print(json.dumps(d.model_dump(),indent=2,default=str))
if __name__=="__main__":main()
