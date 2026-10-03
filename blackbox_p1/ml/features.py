from __future__ import annotations
from collections import defaultdict
from typing import Any, Dict, Iterable, List
import math
from core.models import Run, Step

BASE_FEATURES=["input_len","output_len","prompt_len","latency_ms","tokens","error_flag","read_count","write_count","downstream_readers","schema_match","numeric_deviation","latency_zscore","consistency","retrieval_cosine"]
TYPE_FEATURES=["type_plan","type_llm_call","type_tool_call","type_retrieval","type_parse","type_final_answer"]
TOOL_FEATURES=["tool_lookup_db","tool_search_docs","tool_calculator","tool_other"]
FEATURE_NAMES=BASE_FEATURES+TYPE_FEATURES+TOOL_FEATURES

def _safe_len(value):
    if value is None:return 0.0
    if isinstance(value,str):return float(len(value))
    return float(len(str(value)))

def _flatten_numbers(value):
    result=[]
    if isinstance(value,bool):return result
    if isinstance(value,(int,float)):result.append(float(value));return result
    if isinstance(value,dict):
        for v in value.values():result.extend(_flatten_numbers(v))
    if isinstance(value,list):
        for v in value:result.extend(_flatten_numbers(v))
    return result

def _safe_mean(values):return sum(values)/len(values) if values else 0.0
def _safe_std(values):
    if len(values)<2:return 1.0
    m=_safe_mean(values)
    return math.sqrt(sum((x-m)**2 for x in values)/len(values)) or 1.0

def _numeric_deviation(output,typical_values):
    current=_flatten_numbers(output)
    if not current or not typical_values:return 0.0
    return abs(_safe_mean(current)-_safe_mean(typical_values))/max(abs(_safe_mean(typical_values)),1.0)

def _tool_family(step):
    if step.type=="tool_call":
        if step.name=="lookup_db":return "tool_lookup_db"
        if step.name=="search_docs":return "tool_search_docs"
        if step.name=="calculator":return "tool_calculator"
        return "tool_other"
    if step.type=="retrieval":return "tool_search_docs"
    return "tool_other"

def _schema_match(step):
    output=step.output
    if step.type=="tool_call" and step.name=="lookup_db":
        return float(isinstance(output,dict) and ("value" in output or "error" in output))
    if step.type=="tool_call" and step.name=="calculator":
        return float(isinstance(output,dict) and ("result" in output or "value" in output or "error" in output))
    if step.type=="retrieval":
        return float(isinstance(output,list) or (isinstance(output,dict) and isinstance(output.get("documents"),list)))
    if step.type in {"parse","llm_call"}:return float(isinstance(output,dict))
    return 1.0

def _consistency(step):
    score=1.0
    if step.error_flag:score-=0.4
    if step.output is None:score-=0.4
    if step.type in {"tool_call","retrieval"} and step.output in ({},[],""):score-=0.2
    return max(0.0,min(1.0,score))

def _downstream_counts(steps):
    counts=defaultdict(int)
    for step in steps:
        for read in step.reads:
            idx=read.get("step_idx")
            if idx is not None:counts[int(idx)]+=1
    return dict(counts)

def build_clean_stats(clean_runs:Iterable[Run]):
    latency_values=defaultdict(list); numeric_values=defaultdict(list)
    for run in clean_runs:
        for step in run.steps:
            key=(step.type,_tool_family(step))
            latency_values[key].append(float(step.latency_ms))
            numeric_values[key].extend(_flatten_numbers(step.output))
    latency_stats={k:{"mean":_safe_mean(v),"std":_safe_std(v)} for k,v in latency_values.items()}
    return {"latency":latency_stats,"numeric":dict(numeric_values)}

def extract_step_features(step,all_steps,clean_stats):
    downstream=_downstream_counts(all_steps)
    key=(step.type,_tool_family(step))
    latency_stat=clean_stats.get("latency",{}).get(key,{"mean":0.0,"std":1.0})
    numeric_reference=clean_stats.get("numeric",{}).get(key,[])
    features={
        "input_len":_safe_len(step.input),"output_len":_safe_len(step.output),"prompt_len":_safe_len(step.prompt),
        "latency_ms":float(step.latency_ms),"tokens":float(step.tokens),"error_flag":float(step.error_flag),
        "read_count":float(len(step.reads)),"write_count":float(len(step.writes)),
        "downstream_readers":float(downstream.get(step.step_idx,0)),
        "schema_match":_schema_match(step),
        "numeric_deviation":_numeric_deviation(step.output,numeric_reference),
        "latency_zscore":(step.latency_ms-latency_stat["mean"])/max(latency_stat["std"],1.0),
        "consistency":_consistency(step),"retrieval_cosine":0.0,
    }
    for n in TYPE_FEATURES:features[n]=float(n==f"type_{step.type}")
    family=_tool_family(step)
    for n in TOOL_FEATURES:features[n]=float(n==family)
    return features

def runs_to_matrix(runs,clean_stats,include_clean=True):
    X=[];y=[];metadata=[]
    for run in runs:
        fault_idx=run.fault.step_idx if run.fault.injected else None
        for step in run.steps:
            f=extract_step_features(step,run.steps,clean_stats)
            X.append([float(f.get(n,0.0)) for n in FEATURE_NAMES])
            y.append(int(fault_idx is not None and step.step_idx==fault_idx))
            metadata.append({"run_id":run.run_id,"step_idx":step.step_idx,"template":run.task.template,"task_seed":run.task.task_seed,"fault_type":run.fault.fault_type if run.fault.injected else None})
    return X,y,metadata
