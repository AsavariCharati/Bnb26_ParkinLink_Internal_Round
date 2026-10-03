from __future__ import annotations
import json, os, pickle
import numpy as np
from xgboost import XGBClassifier
from core.models import Run
from ml.features import FEATURE_NAMES, build_clean_stats, runs_to_matrix

RUNS_PATH="data/runs.jsonl"; MODEL_PATH="data/model.pkl"

def load_runs():
    runs=[]
    with open(RUNS_PATH,"r",encoding="utf-8") as f:
        for line in f:
            if line.strip():runs.append(Run.model_validate(json.loads(line)))
    return runs

def faulty_group(run):return f"{run.task.template}:{run.task.task_seed//20}"

def train():
    runs=load_runs()
    clean=[r for r in runs if not r.fault.injected and r.meta.split!="demo"]
    faulty=[r for r in runs if r.fault.injected and r.status=="failed" and r.meta.split!="demo"]
    groups=sorted({faulty_group(r) for r in faulty})
    split=max(1,min(int(len(groups)*0.8),len(groups)-1))
    train_groups=set(groups[:split]);test_groups=set(groups[split:])
    train_faulty=[r for r in faulty if faulty_group(r) in train_groups]
    test_faulty=[r for r in faulty if faulty_group(r) in test_groups]
    stats=build_clean_stats(clean)
    X,y,_=runs_to_matrix(clean+train_faulty,stats)
    X=np.asarray(X,dtype=float);y=np.asarray(y,dtype=int)
    print(f"Training clean runs : {len(clean)}")
    print(f"Training faulty runs: {len(train_faulty)}")
    print(f"Held-out faulty runs: {len(test_faulty)}")
    print(f"Rows: {len(X)}")
    print(f"Positive rows: {int(y.sum())}")
    print(f"Features: {len(FEATURE_NAMES)}")
    print(f"Train groups: {len(train_groups)}")
    print(f"Test groups: {len(test_groups)}")
    pos=int(y.sum());neg=len(y)-pos
    if not pos or not neg:raise RuntimeError("Degenerate training labels.")
    model=XGBClassifier(n_estimators=180,max_depth=4,learning_rate=0.05,subsample=0.9,colsample_bytree=0.9,objective="binary:logistic",eval_metric="logloss",random_state=42,scale_pos_weight=neg/max(pos,1),n_jobs=1)
    model.fit(X,y)
    os.makedirs("data",exist_ok=True)
    with open(MODEL_PATH,"wb") as f:pickle.dump({"model":model,"feature_names":FEATURE_NAMES,"clean_stats":stats,"train_groups":sorted(train_groups),"test_groups":sorted(test_groups)},f)
    print(f"Saved model to {MODEL_PATH}")

if __name__=="__main__":train()
