#!/usr/bin/env python3
"""Bounded, project-scoped monitor for a single historical pilot rerun.

No cancellation, no account-wide mutation, no retries of code or billing failures.
Only this fixed worker can be submitted. Terminal errors are recorded immediately.
"""
import json,os,time,sys
from huggingface_hub import HfApi

NS="lovefengis"
DEST="lovefengis/turkish-writer-historical-review-v10"
NAME="turkish-writer-historical-prose-comparison-v10-r2"
PRECEDING_ID="6b06b26f1460ffe1d5ea6130"
PREFLIGHT_ID="6b06b3d5d0582cfbbefe35b5"
CODE="e855943131ebd9f471614593ca5068a3a11bd6aa"
TERMINAL={"COMPLETED","ERROR","CANCELED","DELETED"}
WORKER="set -eu\nif ! command -v git >/dev/null; then apt-get update -qq && apt-get install -y -qq git; fi\nmkdir /tmp/writer && cd /tmp/writer\ngit init -q\ngit fetch --depth 1 https://github.com/systemonster/turkish-writer.git e855943131ebd9f471614593ca5068a3a11bd6aa\ngit checkout --detach FETCH_HEAD\ntest \"$(git rev-parse HEAD)\" = e855943131ebd9f471614593ca5068a3a11bd6aa\npython -m py_compile corpus-lab/run-historical-pilot.py\npython corpus-lab/run-historical-pilot.py --self-test\npython -m pip install -q 'transformers==4.57.3' 'accelerate>=1.4,<2' sentencepiece protobuf hf_xet\nmkdir -p corpus-lab/work\npython - <<'PY'\nimport os,hashlib,pathlib\nfrom huggingface_hub import HfApi,hf_hub_download\nrepo=\"lovefengis/turkish-writer-historical-review-v10\"\ntoken=os.environ[\"HF_TOKEN\"]\napi=HfApi(token=token)\ninfo=api.repo_info(repo,repo_type=\"dataset\")\nassert info.private\np=pathlib.Path(hf_hub_download(repo,filename=\"v10/source-candidates.jsonl\",repo_type=\"dataset\",revision=info.sha,token=token))\nraw=p.read_bytes()\nassert hashlib.sha256(raw).hexdigest()==\"e7ecd643614bde335854a5a19f20b7061cb1aa85b9f7022fc8a39e4c2ded8e05\"\npathlib.Path(\"corpus-lab/work/historical-v10.jsonl\").write_bytes(raw)\nprint(\"FROZEN_INPUT_VERIFIED\",info.sha,flush=True)\nPY\npython -u corpus-lab/run-historical-pilot.py --model Qwen/Qwen3-32B --revision 9216db5781bf21249d130ec9da846c4624c16137 --input corpus-lab/work/historical-v10.jsonl --batch 2\npython -u corpus-lab/run-historical-pilot.py --model ytu-ce-cosmos/Turkish-Gemma-9b-v0.1 --revision 1bbe9f19a26a70dc4d0c709e1a816e6a9378a7f5 --input corpus-lab/work/historical-v10.jsonl --batch 4\necho HISTORICAL_RETRY_COMPLETE"
def stage(job):
    v=job.status.stage
    return str(getattr(v,"value",v))
def name(job):return (getattr(job,"labels",None) or {}).get("name","")
def gpu(job):
    v=getattr(job,"flavor","")
    return not str(getattr(v,"value",v)).lower().startswith("cpu")
def report(event,**data):
    print("SUPERVISOR "+json.dumps({"event":event,**data},ensure_ascii=False),flush=True)
def main():
    token=os.environ["HF_TOKEN"]
    api=HfApi(token=token)
    if not api.repo_info(DEST,repo_type="dataset").private:raise RuntimeError("private artifact repository required")
    before=api.inspect_job(PRECEDING_ID,namespace=NS)
    pre=api.inspect_job(PREFLIGHT_ID,namespace=NS)
    if name(before)!="turkish-writer-v10-qwen32b-thinking" or name(pre)!="turkish-writer-historical-preflight-fix" or stage(pre)!="COMPLETED":
        raise RuntimeError("unexpected dependency or failed preflight")
    report("PREFLIGHT_VERIFIED",id=PREFLIGHT_ID)
    existing=None
    started=time.monotonic()
    prev=None
    while time.monotonic()-started<3900:
        jobs=list(api.list_jobs(namespace=NS))
        matches=[j for j in jobs if name(j)==NAME]
        if len(matches)>1:raise RuntimeError("duplicate worker labels; refusing submission")
        if matches:
            existing=matches[0]
            report("WORKER_ALREADY_EXISTS",id=existing.id,status=stage(existing))
            break
        own=[j for j in jobs if name(j).startswith("turkish-writer-") and gpu(j) and stage(j) not in TERMINAL]
        predecessor=api.inspect_job(PRECEDING_ID,namespace=NS)
        active=sorted((j.id,stage(j)) for j in own)
        signature=(stage(predecessor),active)
        if signature!=prev:
            report("WAITING_FOR_SLOT",preceding=stage(predecessor),active_turkish_writer_gpu=active)
            prev=signature
        if stage(predecessor) in TERMINAL and not own:
            existing=api.run_job(image="pytorch/pytorch:2.8.0-cuda12.8-cudnn9-runtime",command=["/bin/sh","-lc",WORKER],flavor="rtx-pro-6000",timeout="90m",namespace=NS,labels={"name":NAME,"project":"turkish-writer","experiment":"historical-v10-r2"},secrets={"HF_TOKEN":token})
            report("WORKER_SUBMITTED",id=existing.id,status=stage(existing),code=CODE,timeout_seconds=5400)
            break
        time.sleep(15)
    if existing is None:raise TimeoutError("no isolated GPU slot within bounded wait")
    if name(existing)!=NAME:raise RuntimeError("unexpected child job identity")
    deadline=time.monotonic()+5700
    previous=None
    while time.monotonic()<deadline:
        j=api.inspect_job(existing.id,namespace=NS)
        s=stage(j)
        if s!=previous:
            report("WORKER_STATUS",id=j.id,status=s)
            previous=s
        if s in TERMINAL:
            result={"child_id":j.id,"stage":s,"code":CODE,"timeout_seconds":5400}
            if s!="COMPLETED":
                try:
                    lines=list(api.fetch_job_logs(j.id,namespace=NS,follow=False,tail=35))
                    result["error_tail"]=[str(line).replace(token,"[REDACTED]")[-1000:] for line in lines[-15:]]
                except Exception as e:
                    result["log_error"]=type(e).__name__
            else:
                try:
                    lines=list(api.fetch_job_logs(j.id,namespace=NS,follow=False,tail=100))
                    result["completion_marker"]=any("HISTORICAL_RETRY_COMPLETE" in str(line) for line in lines)
                except Exception:
                    result["completion_marker"]=False
            api.upload_file(path_or_fileobj=json.dumps(result,ensure_ascii=False,indent=2).encode(),path_in_repo="v10/supervisor-r2.json",repo_id=DEST,repo_type="dataset",commit_message="Record supervised historical worker terminal status")
            report("WORKER_TERMINAL",**{k:v for k,v in result.items() if k!="error_tail"})
            if s!="COMPLETED" or not result.get("completion_marker"):
                raise RuntimeError("worker did not complete verified generation; inspect saved status")
            return
        time.sleep(15)
    report("MONITOR_TIMEOUT",child_id=existing.id)
    raise TimeoutError("worker did not reach terminal state before monitor deadline")
if __name__=="__main__":main()
