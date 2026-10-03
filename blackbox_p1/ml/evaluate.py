from __future__ import annotations
import hashlib,json,pickle
from collections import defaultdict
import numpy as np
from core.models import Run
from ml.features import FEATURE_NAMES,build_clean_stats,extract_step_features
RUNS_PATH="data/runs.jsonl";MODEL_PATH="data/model.pkl";RESULT_PATH="data/eval_results.json"

def load_runs():
    with open(RUNS_PATH,"r",encoding="utf-8") as f:return [Run.model_validate(json.loads(x)) for x in f if x.strip()]
def load_model():
    with open(MODEL_PATH,"rb") as f:return pickle.load(f)
def task_group(r):return f"{r.task.template}:{r.task.task_seed//20}"
def score_run(model,stats,run):
    X=[]
    for s in run.steps:
        f=extract_step_features(s,run.steps,stats)
        X.append([f.get(n,0.0) for n in FEATURE_NAMES])
    return model.predict_proba(np.asarray(X,dtype=float))[:,1].tolist()
def true_idx(r):return next((i for i,s in enumerate(r.steps) if s.step_idx==r.fault.step_idx),None)
def ranking_metrics(preds):
    if not preds:return {"n":0,"top1":0.0,"top3":0.0,"mean_rank":0.0}
    ranks=[]
    for scores,t in preds:
        order=sorted(range(len(scores)),key=lambda i:scores[i],reverse=True);ranks.append(order.index(t)+1)
    return {"n":len(ranks),"top1":sum(r==1 for r in ranks)/len(ranks),"top3":sum(r<=3 for r in ranks)/len(ranks),"mean_rank":sum(ranks)/len(ranks)}
def evaluate_model(model,stats,runs):
    return ranking_metrics([(score_run(model,stats,r),true_idx(r)) for r in runs if r.fault.injected and r.status=="failed" and true_idx(r) is not None])
def baseline_ranks(runs,chooser):
    preds=[]
    for r in runs:
        if not r.fault.injected:continue
        t=true_idx(r)
        if t is None:continue
        scores=[0.0]*len(r.steps);scores[chooser(r)]=1.0;preds.append((scores,t))
    return ranking_metrics(preds)
def last(r):return len(r.steps)-1
def first_error(r):
    for i,s in enumerate(r.steps):
        if s.error_flag:return i
    return 0
def slowest(r):return max(range(len(r.steps)),key=lambda i:r.steps[i].latency_ms)
def random_pick(r):return int(hashlib.sha1(r.run_id.encode()).hexdigest()[:8],16)%len(r.steps)
def per_fault(model,stats,runs):
    g=defaultdict(list)
    for r in runs:
        if r.fault.injected and r.status=="failed":
            t=true_idx(r)
            if t is not None:g[r.fault.fault_type].append((score_run(model,stats,r),t))
    return {k:ranking_metrics(v) for k,v in g.items()}
def feature_importance(model):
    return {n:float(v) for n,v in sorted(zip(FEATURE_NAMES,model.feature_importances_),key=lambda x:float(x[1]),reverse=True)}
def train_temp_model(train,test):
    from xgboost import XGBClassifier
    clean=[r for r in train if not r.fault.injected and r.meta.split!="demo"]
    faulty=[r for r in train if r.fault.injected and r.status=="failed" and r.meta.split!="demo"]
    if not clean or not faulty or not test:return None
    stats=build_clean_stats(clean);X=[];y=[]
    for r in clean+faulty:
        for s in r.steps:
            f=extract_step_features(s,r.steps,stats);X.append([f.get(n,0.0) for n in FEATURE_NAMES]);y.append(int(r.fault.injected and s.step_idx==r.fault.step_idx))
    pos=sum(y);neg=len(y)-pos
    if not pos:return None
    m=XGBClassifier(n_estimators=180,max_depth=4,learning_rate=0.05,subsample=.9,colsample_bytree=.9,objective="binary:logistic",eval_metric="logloss",random_state=42,scale_pos_weight=neg/max(pos,1),n_jobs=1)
    m.fit(np.asarray(X),np.asarray(y))
    return evaluate_model(m,stats,test)
def unseen_faults(runs):
    out={}
    types=sorted({r.fault.fault_type for r in runs if r.fault.injected and r.meta.split!="demo"})
    for held in types:
        train=[r for r in runs if r.meta.split!="demo" and (not r.fault.injected or r.fault.fault_type!=held)]
        test=[r for r in runs if r.meta.split!="demo" and r.fault.injected and r.status=="failed" and r.fault.fault_type==held]
        v=train_temp_model(train,test)
        if v:out[held]=v
    return out
def unseen_templates(runs):
    out={}
    for held in sorted({r.task.template for r in runs if r.meta.split!="demo"}):
        train=[r for r in runs if r.meta.split!="demo" and r.task.template!=held]
        test=[r for r in runs if r.meta.split!="demo" and r.task.template==held and r.fault.injected and r.status=="failed"]
        v=train_temp_model(train,test)
        if v:out[held]=v
    return out
def main():
    runs=load_runs();p=load_model();model=p["model"];stats=p["clean_stats"];groups=set(p["test_groups"])
    test=[r for r in runs if r.meta.split!="demo" and r.fault.injected and r.status=="failed" and task_group(r) in groups]
    main_result=evaluate_model(model,stats,test)
    bases={"last_step":baseline_ranks(test,last),"first_error":baseline_ranks(test,first_error),"slowest_step":baseline_ranks(test,slowest),"random":baseline_ranks(test,random_pick)}
    result={"is_example":False,"n_train":len(p["train_groups"]),"n_test":len(test),"top1":main_result["top1"],"top3":main_result["top3"],"mean_rank":main_result["mean_rank"],"baselines":{k:v["top1"] for k,v in bases.items()},"baselines_detail":bases,"unseen_fault_types":unseen_faults(runs),"leave_one_template_out":unseen_templates(runs),"feature_importance":feature_importance(model)}
    with open(RESULT_PATH,"w",encoding="utf-8") as f:json.dump(result,f,indent=2)
    print("BLACK BOX ML EVALUATION");print(f"Evaluation runs: {len(test)}");print(f"Top-1: {main_result['top1']:.2%}");print(f"Top-3: {main_result['top3']:.2%}");print(f"Mean rank: {main_result['mean_rank']:.2f}")
    print("BASELINES")
    for k,v in bases.items():print(f"{k:15s}: {v['top1']:.2%}")
    print("PER FAULT TYPE")
    for k,v in per_fault(model,stats,test).items():print(f"{k:20s} Top-1={v['top1']:.2%} Top-3={v['top3']:.2%} Rank={v['mean_rank']:.2f}")
    print("TOP FEATURES")
    for k,v in list(result["feature_importance"].items())[:10]:print(f"{k:25s} {v:.4f}")
    print(f"Saved to {RESULT_PATH}")
if __name__=="__main__":main()
