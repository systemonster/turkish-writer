#!/usr/bin/env python3
"""Resumable bounded FineWeb text batches, same scanner as validated v3 pilot.

Workers only read source text in memory. Parent serializes private aggregate
checkpoint uploads. Never run more than one range job for a given shard.
"""
import argparse, concurrent.futures as cf, hashlib, importlib.util, json, os, pathlib
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("broad",HERE/"broad-text-research-v3.py")
broad=importlib.util.module_from_spec(spec);spec.loader.exec_module(broad)
def artifact(shard):
    return f"editorial-corpus-v2/fineweb-text/shard-{shard:03d}.json"
def validate(d,shard):
    if d["shard"]!=shard or d["revision"]!=broad.FINE_REV:raise ValueError("wrong shard/revision")
    inv=d["inventory"];counts=d["fixed_cues"]["counts"]
    if inv["rows"]!=sum(n for k,n in inv.items() if k!="rows"):raise ValueError("row accounting")
    if inv["rows"]<=0 or inv.get("texts_processed",0)>inv["rows"]:raise ValueError("empty or invalid inventory")
    n=counts.get("heuristic_sentences",0)
    if sum(x[2] for x in d["fixed_cues"]["marker_positions"])!=n:raise ValueError("marker accounting")
    if sum(counts.get(k,0) for k in ("length_1_7","length_8_15","length_16_30","length_31_plus"))!=n:raise ValueError("sentence accounting")
    if sum(x[2] for x in d["fixed_cues"]["transitions"])>n:raise ValueError("transition accounting")
    return d
def worker(shard):
    from huggingface_hub import HfApi
    api=HfApi(token=os.environ["HF_TOKEN"])
    return validate(broad.fineweb(api,shard),shard)
def self_test():
    broad.self_test()
    fixture={"shard":1,"revision":broad.FINE_REV,"inventory":{"rows":2,"texts_processed":1,"metadata_not_selected":1},"fixed_cues":{"counts":{"heuristic_sentences":1,"length_1_7":1},"marker_positions":[["line_start","unmarked",1]],"transitions":[]}}
    assert validate(fixture,1)==fixture
    for key,value in [("shard",2),("revision","other"),("inventory",{"rows":2,"texts_processed":1})]:
        bad={**fixture,key:value}
        try:validate(bad,1)
        except ValueError:pass
        else:raise AssertionError("invalid checkpoint accepted")
    print("FINEWEB_RANGE_SELF_TEST_COMPLETE",flush=True)
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--self-test",action="store_true");ap.add_argument("--start",type=int,default=1);ap.add_argument("--end",type=int,default=24);ap.add_argument("--workers",type=int,default=4)
    a=ap.parse_args();self_test()
    if a.self_test:return
    if not (0<=a.start<=a.end<203 and 1<=a.workers<=4):ap.error("invalid bounded range")
    from huggingface_hub import HfApi,hf_hub_download
    api=HfApi(token=os.environ["HF_TOKEN"])
    if not api.repo_info(broad.DEST,repo_type="dataset").private:raise RuntimeError("private destination required")
    existing=set(api.list_repo_files(broad.DEST,repo_type="dataset"));missing=[];done=[]
    for shard in range(a.start,a.end+1):
        path=artifact(shard)
        if path not in existing:missing.append(shard);continue
        raw=pathlib.Path(hf_hub_download(broad.DEST,path,repo_type="dataset",token=api.token)).read_bytes()
        d=validate(json.loads(raw),shard)
        done.append(shard)
        print("FINEWEB_RANGE_RESUME "+json.dumps({"shard":shard,"inventory":d["inventory"],"sha256":hashlib.sha256(raw).hexdigest()}),flush=True)
    if missing:
        with cf.ProcessPoolExecutor(max_workers=a.workers) as pool:
            tasks={pool.submit(worker,shard):shard for shard in missing}
            for future in cf.as_completed(tasks):
                shard=tasks[future];d=future.result()
                sha=broad.upload(api,artifact(shard),d);done.append(shard)
                print("FINEWEB_RANGE_SHARD_COMPLETE "+json.dumps({"shard":shard,"inventory":d["inventory"],"sha256":sha}),flush=True)
    if sorted(done)!=list(range(a.start,a.end+1)):raise RuntimeError("incomplete range")
    print("FINEWEB_RANGE_COMPLETE "+json.dumps({"start":a.start,"end":a.end,"shards":sorted(done)}),flush=True)
if __name__=="__main__":main()
