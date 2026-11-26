#!/usr/bin/env python3
"""V12 historical replay: order-balanced next-token choice.
V11 alignment/data/model pins are reused; review protocol AND granularity change.
Development replay, not blind evidence. No source text in public logs.
"""
import argparse
import importlib.util
import json
import math
import os
import pathlib
import subprocess
import time

HERE = pathlib.Path(__file__).resolve().parent
def load(name, file):
    spec = importlib.util.spec_from_file_location(name, HERE / file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

v11 = load("v11", "run-review-select-v11.py")
choice = load("choice", "review-choice-v12.py")
REV = "0b1b8308559a935e6f3be060fe42bc00ed556f02"
ARM = "balanced_next_token_v12"

def labels(tokenizer):
    result = []
    for letter in ("A", "B"):
        ids = set()
        for surface in (letter, " " + letter):
            seq = tokenizer.encode(surface, add_special_tokens=False)
            if len(seq) == 1 and tokenizer.decode(seq).strip() == letter:
                ids.add(seq[0])
        if not ids:
            raise RuntimeError("missing single-token choice label")
        result.append(sorted(ids))
    if set(result[0]) & set(result[1]):
        raise RuntimeError("ambiguous token label")
    return result

def review(row, score):
    if row["draft_limited"]:
        raise RuntimeError("truncated source draft")
    result = choice.select(row["source"], row["draft"], v11.plan_review, v11.blocks, score)
    eligible, _ = v11.plan_review(row["source"], row["draft"])
    if len(result["evidence"]) != len(eligible):
        raise RuntimeError("proposal coverage mismatch")
    return {"id": row["id"], "arm": ARM,
            "source_sha256": v11.sha(row["source"]),
            "draft_sha256": row["v10_draft_sha256"], **result,
            "output_sha256": v11.sha(result["output"]), "eligible": len(eligible),
            "license": "CC BY-SA 4.0"}

def self_test():
    v11.self_test()
    source = "Kapının açılması sinyali tetikledi.\n\nEtiketleme işlemini yaptık."
    draft = "Sinyal kapının açılmasını tetikledi.\n\nEtiketledik."
    row = {"id":"synthetic-test","source":source,"draft":draft,
           "draft_limited":False,"v10_draft_sha256":v11.sha(draft)}
    def mock_score(prompts):
        assert len(prompts) == 2
        if "A: Kapının açılması" in prompts[0]:
            return [(-1.,-2.),(-2.,-1.)]
        return [(-2.,-1.),(-1.,-2.)]
    r = review(row, mock_score)
    assert r["output"] == "Kapının açılması sinyali tetikledi.\n\nEtiketledik."
    assert r["accepted"] == [1] and r["eligible"] == 2
    assert review(row, lambda _: [(-1.,-1.),(-1.,-1.)])["output"] == source
    class FakeTokenizer:
        def encode(self, text, **kwargs): return [1 if text.strip()=="A" else 2]
        def decode(self, seq): return {1:"A",2:"B"}[seq[0]]
    assert labels(FakeTokenizer()) == [[1],[2]]
    print("V12_INTEGRATION_SELF_TEST_COMPLETE", flush=True)

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--self-test",action="store_true")
    p.add_argument("--preflight",action="store_true")
    p.add_argument("--model",choices=v11.MODELS)
    args=p.parse_args()
    self_test()
    if args.self_test: return
    from huggingface_hub import HfApi
    from transformers import AutoTokenizer, AutoConfig
    api=HfApi(token=os.environ["HF_TOKEN"])
    if not api.repo_info(v11.DEST,repo_type="dataset").private:
        raise RuntimeError("private artifact repository required")
    if not args.model and not args.preflight: p.error("model required")
    for model in ([args.model] if args.model else v11.MODELS):
        rows=v11.load_inputs(api,model,REV)
        if len(rows)!=8 or any(r["draft_limited"] for r in rows):
            raise RuntimeError("invalid frozen inputs")
        revision=v11.MODELS[model]
        tokenizer=AutoTokenizer.from_pretrained(model,revision=revision,trust_remote_code=False)
        config=AutoConfig.from_pretrained(model,revision=revision,trust_remote_code=False)
        ids=labels(tokenizer)
        qwen=model.startswith("Qwen/")
        def rendered(text):
            return tokenizer.apply_chat_template([{"role":"user","content":text}],
                tokenize=False,add_generation_prompt=True,**({"enable_thinking":False} if qwen else {}))
        eligible=sum(len(v11.plan_review(r["source"],r["draft"])[0]) for r in rows)
        for row in rows:
            trial=review(row,lambda prompts: [(-1.,-1.),(-1.,-1.)])
            assert trial["output"]==row["source"]
            for proposal in v11.plan_review(row["source"],row["draft"])[0]:
                for prompt in choice.choices(row["source"],proposal):
                    n=len(tokenizer.encode(rendered(prompt),add_special_tokens=False))
                    if n>min(int(getattr(config,"max_position_embeddings",4096)),4096):
                        raise RuntimeError("context bound exceeded")
        print("V12_INPUTS_VERIFIED "+json.dumps({"model":model,"revision":revision,
            "cases":len(rows),"eligible":eligible,"label_ids":ids}),flush=True)
        if args.preflight: continue
        import torch
        from transformers import AutoModelForCausalLM
        llm=AutoModelForCausalLM.from_pretrained(model,revision=revision,trust_remote_code=False,
                dtype=torch.bfloat16,device_map={"":"cuda:0"},attn_implementation="sdpa" if qwen else "eager").eval()
        def score(prompts):
            scores=[]
            for prompt in prompts:
                inputs=tokenizer(rendered(prompt),return_tensors="pt",add_special_tokens=False).to("cuda:0")
                with torch.inference_mode():
                    logits=llm(**inputs,use_cache=False).logits[0,-1,:].float().log_softmax(dim=-1)
                    pair=[float(torch.logsumexp(logits[group],dim=0).item()) for group in ids]
                if not all(math.isfinite(x) for x in pair):
                    raise RuntimeError("nonfinite model score")
                scores.append(pair)
            return scores
        info={"model":model,"model_revision":revision,"dataset_revision":REV,"arm":ARM,
            "git":subprocess.check_output(["git","rev-parse","HEAD"],cwd=HERE,text=True).strip(),
            "scope":"V10 historical development replay, V11 alignment fixed; not blind",
            "gpu":torch.cuda.get_device_name(0),"label_ids":ids}
        results=[]
        for row in rows:
            result={"model":model,**review(row,score)}
            results.append(result)
            print("V12_RESULT "+json.dumps({k:v for k,v in result.items() if k!="output"}),flush=True)
            api.upload_file(path_or_fileobj=json.dumps({"run":info,"results":results,
                "complete":len(results)==len(rows)},ensure_ascii=False,allow_nan=False).encode(),
                path_in_repo="v12/"+v11.slug(model)+".json",repo_id=v11.DEST,repo_type="dataset",
                commit_message="V12 bounded choice review checkpoint")
        print("V12_MODEL_COMPLETE "+json.dumps({"model":model,"cases":len(results)}),flush=True)
    if args.preflight: print("V12_PREFLIGHT_COMPLETE",flush=True)
if __name__=="__main__": main()
