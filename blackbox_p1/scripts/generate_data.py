from pathlib import Path
import json
from core.agent import run_agent
from core.faults import make_fault, supported_faults
from core.models import Task

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"data"/"runs.jsonl"

def task_instance(template,seed):
    if template=="price_compare_gst":
        return Task(template=template,task_seed=seed,
            prompt=f"Compare laptop X and laptop Y. seed={seed}",
            expected_answer="Laptop Y")
    return Task(template=template,task_seed=seed,
        prompt=f"Check refund eligibility within 7 days. seed={seed}",
        expected_answer="Refund eligible")

def check(r):
    assert len(r.steps)==5
    assert [s.step_idx for s in r.steps]==[0,1,2,3,4]
    assert all(s.cache_key and s.pre_state_hash for s in r.steps)

def main():
    runs=[]

    for i in range(600):
        t=["price_compare_gst","policy_lookup"][i%2]
        task=task_instance(t,i)
        r=run_agent(task,i)
        assert r.status=="success",f"Clean failed: {t} -> {r.final_answer}"
        check(r); runs.append(r)

    fault_plan = (
        [("price_compare_gst", ft) for ft in supported_faults("price_compare_gst")]
        + [("policy_lookup", ft) for ft in supported_faults("policy_lookup")]
    )

    for i in range(800):
        t, ft = fault_plan[i % len(fault_plan)]
        f=make_fault(t,ft,i)
        seed=10000+i
        r=run_agent(task_instance(t,seed),seed,fault=f)
        assert r.status=="failed",(
            f"Fault did not cause failure: {r.run_id} template={t} "
            f"fault={ft} step={f.step_idx} answer={r.final_answer}"
        )
        check(r); runs.append(r)

    for i in range(30):
        t=["price_compare_gst","policy_lookup"][i%2]
        r=run_agent(task_instance(t,20000+i),20000+i)
        r.meta.split="demo"; r.meta.is_decoy=True
        runs.append(r)

    for i in [0,1,42,101,599]:
        task=task_instance(["price_compare_gst","policy_lookup"][i%2],i)
        assert run_agent(task,i).model_dump()==run_agent(task,i).model_dump()

    OUT.parent.mkdir(exist_ok=True)
    with OUT.open("w",encoding="utf-8") as f:
        for r in runs:
            f.write(json.dumps(r.model_dump(),sort_keys=True)+"\n")

    from collections import Counter
    print("DATASET OK")
    print("total:",len(runs))
    print("faults:",Counter(r.fault.fault_type if r.fault.injected else "clean" for r in runs))
    print("saved:",OUT)

if __name__=="__main__":
    main()
