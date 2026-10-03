from __future__ import annotations
import hashlib, json
from copy import deepcopy
from typing import Optional

from .models import Task, Fault, Run, Step, Lineage, Meta
from .sim_llm import sim_llm
from .tools import lookup_db, search_docs, WRONG_REFUND_DOC

def canon(x):
    return json.dumps(x, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

def h(x):
    return hashlib.sha1(canon(x).encode()).hexdigest()

def metrics(i, typ, name, inp, out):
    n = int(h({"i":i,"t":typ,"n":name,"in":inp,"out":out})[:8], 16)
    return 20+n%81, (40+n%121 if typ in {"llm_call","parse"} else 0)

def make_step(i, typ, name, inp, out, before, after, reads=None, writes=None, prompt=None):
    lat,tok=metrics(i,typ,name,inp,out)
    return Step(
        step_idx=i,type=typ,name=name,prompt=prompt,input=inp,output=deepcopy(out),
        latency_ms=lat,tokens=tok,reads=reads or [],writes=writes or [],
        state_after=deepcopy(after),pre_state_hash=h(before),
        cache_key=h({"type":typ,"name":name,"input":inp,"pre_state":before})
    )

def apply_fault(template, idx, fault, output, state):
    if not fault.injected or fault.step_idx != idx:
        return output, state

    out=deepcopy(output)
    st=deepcopy(state)
    ft=fault.fault_type

    if template=="price_compare_gst":
        if ft in {"wrong_tool","bad_argument"} and idx in {1,2}:
            if idx==1:
                st["laptop_x_price"]=60000
                out={"key":"calculator_result","value":60000,"source":ft}
            else:
                st["laptop_y_price"]=90000
                out={"key":"calculator_result","value":90000,"source":ft}
        elif ft in {"corrupted_output","misread_output"} and idx==3:
            out={"cheaper":"X","x_price":st.get("laptop_x_price"),"y_price":st.get("laptop_y_price"),"source":ft}
            st["cheaper"]="X"
        elif ft in {"corrupted_output","misread_output"} and idx==4:
            out={"answer":"Laptop X","source":ft}

    elif template=="policy_lookup":
        if ft in {"bad_argument","wrong_retrieval"} and idx==1:
            st["retrieved_docs"]=[dict(WRONG_REFUND_DOC)]
            out={"query":"refund within 30 days","documents":[dict(WRONG_REFUND_DOC)],"source":ft}
        elif ft in {"corrupted_output","misread_output"} and idx==3:
            out={"refund_days":st.get("refund_days"),"eligible":False,"source":ft}
            st["eligible"]=False
        elif ft in {"corrupted_output","misread_output"} and idx==4:
            out={"answer":"Refund not eligible","source":ft}

    return out,st

def run_agent(task, seed, fault:Optional[Fault]=None, lineage:Optional[Lineage]=None, patch=None):
    task=task if isinstance(task,Task) else Task(**task)
    fault=fault or Fault()
    lineage=lineage or Lineage()
    state={}
    steps=[]

    if task.template=="price_compare_gst":
        before=deepcopy(state)
        prompt=f"price_compare_gst stage=x seed={seed}"
        out=sim_llm("planner",prompt,state)
        steps.append(make_step(0,"plan","planner_x",{"prompt":prompt},out,before,state,writes=["next_action"]))

        before=deepcopy(state); out=lookup_db("laptop_x_price"); state["laptop_x_price"]=out["value"]
        out,state=apply_fault(task.template,1,fault,out,state)
        steps.append(make_step(1,"tool_call","lookup_db",{"key":"laptop_x_price"},out,before,state,writes=["laptop_x_price"]))

        before=deepcopy(state); out=lookup_db("laptop_y_price"); state["laptop_y_price"]=out["value"]
        out,state=apply_fault(task.template,2,fault,out,state)
        steps.append(make_step(2,"tool_call","lookup_db",{"key":"laptop_y_price"},out,before,state,writes=["laptop_y_price"]))

        before=deepcopy(state); out=sim_llm("reasoner","Determine cheaper laptop.",state)
        state["cheaper"]=out.get("cheaper")
        out,state=apply_fault(task.template,3,fault,out,state)
        steps.append(make_step(3,"llm_call","reasoner",{"state":before},out,before,state,
            reads=[{"step_idx":1,"key":"laptop_x_price"},{"step_idx":2,"key":"laptop_y_price"}],
            writes=["cheaper"],prompt="Determine cheaper laptop."))

        before=deepcopy(state); out=sim_llm("answer","Return the final answer.",state)
        out,state=apply_fault(task.template,4,fault,out,state)
        answer=out.get("answer","Unknown")
        steps.append(make_step(4,"final_answer","answer",{"state":before},out,before,state,
            reads=[{"step_idx":3,"key":"cheaper"}]))

    elif task.template=="policy_lookup":
        before=deepcopy(state)
        prompt=f"policy_lookup stage=docs seed={seed}"
        out=sim_llm("planner",prompt,state)
        steps.append(make_step(0,"plan","planner",{"prompt":prompt},out,before,state,writes=["next_action"]))

        before=deepcopy(state)
        docs=search_docs("refund within 7 days")
        state["retrieved_docs"]=deepcopy(docs)
        out={"query":"refund within 7 days","documents":deepcopy(docs)}
        out,state=apply_fault(task.template,1,fault,out,state)
        steps.append(make_step(1,"retrieval","search_docs",{"query":"refund within 7 days"},out,before,state,writes=["retrieved_docs"]))

        before=deepcopy(state)
        out=sim_llm("parser","Extract refund duration.",state)
        state["refund_days"]=out.get("days")
        steps.append(make_step(2,"parse","parser",{"documents":state["retrieved_docs"]},out,before,state,
            reads=[{"step_idx":1,"key":"retrieved_docs"}],writes=["refund_days"],prompt="Extract refund duration."))

        before=deepcopy(state)
        out=sim_llm("reasoner","Determine refund eligibility.",state)
        state["eligible"]=out.get("eligible")
        out,state=apply_fault(task.template,3,fault,out,state)
        steps.append(make_step(3,"llm_call","reasoner",{"state":before},out,before,state,
            reads=[{"step_idx":2,"key":"refund_days"}],writes=["eligible"],prompt="Determine refund eligibility."))

        before=deepcopy(state)
        out=sim_llm("answer","Return the final answer.",state)
        out,state=apply_fault(task.template,4,fault,out,state)
        answer=out.get("answer","Unknown")
        steps.append(make_step(4,"final_answer","answer",{"state":before},out,before,state,
            reads=[{"step_idx":3,"key":"eligible"}]))
    else:
        raise ValueError(f"Unknown template: {task.template}")

    status="success" if answer==task.expected_answer else "failed"
    run_id="run_"+h({"task":task.model_dump(),"seed":seed,"fault":fault.model_dump()})[:12]
    return Run(
        run_id=run_id,task=task,status=status,final_answer=answer,
        agent_kind="simulated",steps=steps,fault=fault,lineage=lineage,meta=Meta()
    )
