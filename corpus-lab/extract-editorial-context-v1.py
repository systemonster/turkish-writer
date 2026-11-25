#!/usr/bin/env python3
"""Contextual corpus evidence, not a model test or a quality score.

Only development corpora: pinned, licensed Daron archive, BOUN train,
and existing SUDO private source freeze. Public stdout contains aggregate
counts and IDs, never excerpts. Context windows go to the private research
dataset with attribution and source locators, not to the distributed skill.
"""
import argparse, collections, hashlib, importlib.util, io, json, os, pathlib, re, tarfile, urllib.request
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("profile",HERE/"profile-historical-blog.py")
profile=importlib.util.module_from_spec(spec);spec.loader.exec_module(profile)
spec=importlib.util.spec_from_file_location("history",HERE/"run-review-select-v11.py")
history=importlib.util.module_from_spec(spec);spec.loader.exec_module(history)
DREV=profile.REVISION
BREV="09521f40c90904df85524b8e0b43afba6e4c7823"
SREV="0b1b8308559a935e6f3be060fe42bc00ed556f02"
DEST=history.DEST
LICENSE="CC BY-SA 4.0"
# Surface-pattern retrieval; the editorial role is assigned only after reading context.
PATTERNS={
 "question_answer":r"\?\s*(?:[\"”']\s*)?$",
 "contrast":r"^(?:ama|fakat|ancak|oysa|buna rağmen|yine de)\b",
 "reformulation":r"^(?:yani|başka bir deyişle|bir başka deyişle|daha doğrusu)\b",
 "example":r"^(?:örneğin|mesela|diyelim ki)\b",
 "inference":r"^(?:böylece|dolayısıyla|bu nedenle|bu yüzden|o halde)\b",
 "sequence":r"\b(?:\w+(?:dıktan|dikten|duktan|dükten|tıktan|tikten|tuktan|tükten)\s+sonra|\w+(?:madan|meden)\s+önce)\b",
 "conditional":r"\b(?:eğer|şayet)\b|\b\w+(?:sa|se)\s+(?:da|de|ise)\b",
 "nominal_heaviness":r"\b(?:\w+(?:ma|me)\s+işlem(?:i|ini|inin|inde)|\w+(?:masının|mesinin)\s+\w+(?:ması|mesi)|\w+(?:ma|me)\s+(?:gerçekleştir\w*|sağla\w*))\b",
 "author_position":r"\b(?:bence|bana göre|sanırım|bildiğim kadarıyla|bilmiyorum|hatırladığım kadarıyla|benim için)\b",
}
def sha(s):return hashlib.sha256(s.encode()).hexdigest()
def read_url(url,max_bytes):
    req=urllib.request.Request(url,headers={"User-Agent":"TurkishWriter-corpus-research/1.0"})
    with urllib.request.urlopen(req,timeout=60) as r: data=r.read(max_bytes+1)
    if len(data)>max_bytes:raise RuntimeError("download bound exceeded")
    return data
def stable_pick(items,n=6):
    # one per document first, deterministic across runs
    out=[];seen=set()
    for x in sorted(items,key=lambda r:sha(r["id"])):
        if x["document_id"] in seen:continue
        seen.add(x["document_id"]);out.append(x)
        if len(out)==n:break
    return out
def contextual(doc,paragraphs):
    flat=[(i,j,s) for i,p in enumerate(paragraphs) for j,s in enumerate(profile.sentences(p))]
    matches=collections.defaultdict(list)
    for k,(i,j,s) in enumerate(flat):
        lower=profile.tr_lower(s)
        for tag,pat in PATTERNS.items():
            if not re.search(pat,lower):continue
            prev=flat[k-1][2] if k else ""
            nxt=flat[k+1][2] if k+1<len(flat) else ""
            # Avoid email and numeric contact-like strings in retained windows.
            context=[prev,s,nxt]
            if any(re.search(r"\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|\b(?:\+?90[\s-]?)?0?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b",v,re.I) for v in context):continue
            if max(map(len,context))>800:continue
            ident=sha(doc["document_id"]+":"+str(i)+":"+str(j)+":"+tag)[:20]
            matches[tag].append(dict(doc,id=ident,category=tag,paragraph=i,sentence=j,previous=prev,focus=s,next=nxt,
                paragraph_start=j==0,focus_sha256=sha(s),source_is_edited_gold=False))
    return matches,len(flat)
def daron():
    raw=read_url("https://codeload.github.com/daronyondem/daron-turkce-blog/tar.gz/"+DREV,100_000_000)
    root="daron-turkce-blog-"+DREV
    docs=[]
    with tarfile.open(fileobj=io.BytesIO(raw),mode="r:gz") as tf:
        readme=tf.extractfile(root+"/README.md").read().decode()
        if "CC BY-SA 4.0" not in readme:raise RuntimeError("Daron license declaration missing")
        for m in tf.getmembers():
            if not m.isfile() or not m.name.startswith(root+"/posts/"):continue
            name=pathlib.PurePosixPath(m.name).name
            if not re.match(r"^20(?:0[7-9]|1[0-7])-\d{2}-\d{2}[^/]*\.md$",name):continue
            s=tf.extractfile(m).read().decode()
            p=profile.prose_blocks(s)
            if len(p)<3 or sum(len(profile.WORD.findall(x)) for x in p)<200:continue
            doc={"corpus":"daron","document_id":sha(name)[:20],"author":"Daron Yöndem","source_revision":DREV,
                "source_url":"https://github.com/daronyondem/daron-turkce-blog/blob/"+DREV+"/posts/"+name,
                "license":LICENSE}
            docs.append((doc,p))
    if len(docs)!=503:raise RuntimeError("archive selection drift: "+str(len(docs)))
    return docs
def sudo(api):
    from huggingface_hub import hf_hub_download
    p=hf_hub_download(DEST,filename="v10/source-candidates.jsonl",repo_type="dataset",revision=SREV,token=api.token)
    raw=pathlib.Path(p).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=history.SOURCE_SHA:raise RuntimeError("SUDO source hash mismatch")
    docs=[]
    for x in map(json.loads,raw.decode().splitlines()):
        if x.get("license")!=LICENSE or sha(x["source"])!=x["source_sha256"]:raise RuntimeError("SUDO identity/license mismatch")
        # Existing attribution preserved in the frozen source file. No extra person data.
        doc={"corpus":"sudo","document_id":x["id"],"author_group":x["author_group"],"source_revision":x["source_revision"],
             "source_url":x["source_url"],"license":LICENSE,"attribution_record":"v10/source-candidates.jsonl#"+x["id"]}
        docs.append((doc,profile.prose_blocks(x["source"])))
    if len(docs)!=20:raise RuntimeError("SUDO coverage")
    return docs
def boun():
    base="https://raw.githubusercontent.com/UniversalDependencies/UD_Turkish-BOUN/"+BREV+"/"
    raw=read_url(base+"tr_boun-ud-train.conllu",40_000_000)
    readme=read_url(base+"README.md",1_000_000).decode()
    if "CC BY-SA" not in readme and "CC-BY-SA" not in readme and "creativecommons.org/licenses/by-sa/4.0" not in readme:
        # The canonical UD repository license declaration is also in LICENSE.txt.
        lic=read_url(base+"LICENSE.txt",1_000_000).decode()
        if "Attribution-ShareAlike" not in lic:raise RuntimeError("BOUN license missing")
    out=collections.defaultdict(list);n=0
    for block in re.split(r"\r?\n\r?\n",raw.decode()):
        sid=re.search(r"(?m)^# sent_id = (.+)$",block)
        txt=re.search(r"(?m)^# text = (.+)$",block)
        if not sid or not txt:continue
        n+=1
        s=txt.group(1)
        if len(s)>600 or re.search(r"[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:\+?90[\s-]?)?0?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b",s,re.I):continue
        tokens={}
        for line in block.splitlines():
            x=line.split("\t")
            if len(x)==10 and x[0].isdigit():tokens[int(x[0])]=x
        hits={}
        for i,t in tokens.items():
            if t[3]=="VERB" and "VerbForm=Conv" in t[5]:
                hits.setdefault("annotated_converb",{"form":t[1],"lemma":t[2],"relation":t[7]})
            if t[3] in {"NOUN","PROPN","PRON"} and t[6].isdigit():
                head=tokens.get(int(t[6]))
                if head and head[3]=="VERB" and t[7].split(":")[0] in {"obj","obl","nsubj"}:
                    case=re.search(r"(?:^|\|)Case=([^|]+)",t[5])
                    if case:
                        tag="verb_dependent_"+t[7].split(":")[0]+"_"+case.group(1)
                        hits.setdefault(tag,{"noun_lemma":t[2],"verb_lemma":head[2],"case":case.group(1),"relation":t[7]})
        for tag,e in hits.items():
            ident=sha(sid.group(1)+":"+tag)[:20]
            out[tag].append({"id":ident,"corpus":"boun-train","document_id":sid.group(1),"category":tag,"focus":s,
                "source_url":"https://github.com/UniversalDependencies/UD_Turkish-BOUN/blob/"+BREV+"/tr_boun-ud-train.conllu",
                "source_revision":BREV,"license":LICENSE,"attribution":"UD Turkish BOUN / TABILAB, Boğaziçi University and contributors",
                "annotation":e,"focus_sha256":sha(s),"source_is_edited_gold":False})
    if n!=7803:raise RuntimeError("BOUN train count mismatch "+str(n))
    return out,n,hashlib.sha256(raw).hexdigest()
def main():
    p=argparse.ArgumentParser();p.add_argument("--self-test",action="store_true");a=p.parse_args()
    fixture={"document_id":"fixture"}
    m,n=contextual(fixture,["Önce kapıyı açtık. Sonra ne oldu?","Ancak ışık yanmadı. Yani cihaz çalışmıyordu."])
    assert n==4 and m["question_answer"][0]["focus"]=="Sonra ne oldu?" and m["contrast"][0]["previous"]=="Sonra ne oldu?"
    if a.self_test:print("CORPUS_CONTEXT_SELF_TEST_COMPLETE");return
    from huggingface_hub import HfApi
    api=HfApi(token=os.environ["HF_TOKEN"])
    if not api.repo_info(DEST,repo_type="dataset").private:raise RuntimeError("private destination required")
    summary={"scope":"heuristic contextual retrieval on licensed development sources; not human gold, not independent holdout","corpora":{},"license":LICENSE}
    evidence=[]
    for corpus,docs in (("daron",daron()),("sudo",sudo(api))):
        matches=collections.defaultdict(list);n=0
        for doc,paras in docs:
            m,k=contextual(doc,paras);n+=k
            for tag,rows in m.items():matches[tag].extend(rows)
        counts={tag:len(matches[tag]) for tag in PATTERNS}
        sample=[x for tag in PATTERNS for x in stable_pick(matches[tag],6)]
        summary["corpora"][corpus]={"documents":len(docs),"heuristic_sentences":n,"pattern_hits":counts,"sample_contexts":len(sample)}
        evidence.extend(sample)
    matches,n,blob=boun()
    tags=["annotated_converb","verb_dependent_obj_Acc","verb_dependent_obl_Dat","verb_dependent_obl_Abl","verb_dependent_obl_Loc"]
    sample=[x for tag in tags for x in stable_pick(matches[tag],8)]
    evidence.extend(sample)
    summary["corpora"]["boun-train"]={"sentences":n,"source_sha256":blob,"annotated_hits":{tag:len(matches[tag]) for tag in tags},"sample_contexts":len(sample)}
    summary["evidence_records"]=len(evidence)
    summary["method"]="Deterministic hash sample, max one per document per pattern, source context kept private; surface hits are candidates, not confirmed discourse/grammatical categories."
    payload=json.dumps({"summary":summary,"evidence":evidence},ensure_ascii=False,indent=2).encode()
    api.upload_file(path_or_fileobj=payload,path_in_repo="editorial-corpus-v1/context-evidence.json",repo_id=DEST,repo_type="dataset",commit_message="Private contextual evidence from licensed Daron, SUDO and BOUN development corpora")
    summary["private_artifact_sha256"]=hashlib.sha256(payload).hexdigest()
    print("CORPUS_CONTEXT_RESULT "+json.dumps(summary,ensure_ascii=False),flush=True)
    print("CORPUS_CONTEXT_COMPLETE",flush=True)
if __name__=="__main__":main()
