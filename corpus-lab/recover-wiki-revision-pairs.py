#!/usr/bin/env python3
"""Recover the exact 50 previously selected historical Wikipedia revision pairs.
Read-only Wikimedia API, no usernames or comments. Store only changed prose in
the existing private research dataset. No human/editor-verified claim.
"""
import argparse, hashlib, json, os, pathlib, re, time, urllib.parse, urllib.request
HERE=pathlib.Path(__file__).resolve().parent
DEST="lovefengis/turkish-writer-historical-review-v10"
SOURCE="https://tr.wikipedia.org/w/api.php"
RIGHTS="https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use"
LICENSE="https://creativecommons.org/licenses/by-sa/4.0/"
def sha(s):return hashlib.sha256(s.encode()).hexdigest()
def pair(row,old,new):
    if old["pageid"]!=new["pageid"] or old["pageid"]!=int(row["source_group"].split(":")[1]):return None,"page_mismatch"
    if new["parentid"]!=old["revid"] or old["timestamp"]!=row["previous_timestamp"] or new["timestamp"]!=row["revision_timestamp"]:return None,"revision_mismatch"
    if any(re.search(r"revert|rollback|undo|vandal|bot",t,re.I) for r in (old,new) for t in r.get("tags",[])):return None,"tagged"
    a=[s.strip() for s in old["content"].splitlines() if s.strip()]
    b=[s.strip() for s in new["content"].splitlines() if s.strip()]
    if len(a)!=len(b):return None,"structure"
    changed=[i for i,(x,y) in enumerate(zip(a,b)) if x!=y]
    if len(changed)!=1:return None,"multiple_changes"
    i=changed[0];x,y=a[i],b[i]
    if any(not 80<=len(t)<=2200 or re.search(r"[<>{}\\[\\]|#=*]|https?://|www\\.|@|'{2,}|^[:;!]",t,re.I) or re.search(r"[\\x00-\\x1f\\x7f]",t) for t in (x,y)):return None,"markup_or_private_data"
    if re.findall(r"\\d+",x)!=re.findall(r"\\d+",y):return None,"numeric_change"
    # Reject potential personal-contact identifiers even if numbers were unchanged.
    if any(re.search(r"\\b(?:\\+?90[ -]?)?0?5\\d{2}[ -]?\\d{3}[ -]?\\d{2}[ -]?\\d{2}\\b|\\b\\d{11}\\b",t) for t in (x,y)):return None,"private_data_risk"
    return {**row,"page_title":old["title"],"before":x,"after":y,"before_sha256":sha(x),"after_sha256":sha(y),
        "attribution":{"contributors":"Wikipedia contributors; see linked article history and stable revisions",
        "previous_revision":"https://tr.wikipedia.org/w/index.php?oldid="+str(old["revid"]),
        "revised_revision":"https://tr.wikipedia.org/w/index.php?oldid="+str(new["revid"]),
        "history":"https://tr.wikipedia.org/w/index.php?curid="+str(old["pageid"])+"&action=history"},
        "rights_evidence":RIGHTS,"license":LICENSE,"status":"candidate_not_editor_verified","excerpt_only":True},None
def self_test():
    row={"source_group":"trwiki:1","previous_timestamp":"2016-01-01T00:00:00Z","revision_timestamp":"2016-01-02T00:00:00Z"}
    a={"pageid":1,"revid":2,"timestamp":row["previous_timestamp"],"title":"Sentetik","content":"Bu kayıt işleminin tamamlanmasının ardından diğer işlemlerin yapılması için gereken süre belirlenir.","tags":[]}
    b={**a,"revid":3,"parentid":2,"timestamp":row["revision_timestamp"],"content":"Bu kayıt tamamlandıktan sonra diğer işlemlerin yapılması için gereken süre ayrıca belirlenir."}
    r,reason=pair(row,a,b)
    assert r and not reason and r["before_sha256"]!=r["after_sha256"],reason
    assert pair(row,a,{**b,"parentid":99})[1]=="revision_mismatch"
    assert pair(row,a,{**b,"content":b["content"]+" https://example.org"})[1]=="markup_or_private_data"
    print("WIKI_PAIR_SELF_TEST_COMPLETE",flush=True)
def fetch(ids):
    q=urllib.parse.urlencode({"action":"query","prop":"revisions","revids":"|".join(map(str,ids)),
        "rvprop":"ids|timestamp|tags|content|contentmodel","rvslots":"main","format":"json","formatversion":2,"maxlag":5})
    req=urllib.request.Request(SOURCE+"?"+q,headers={"User-Agent":"TurkishWriterCorpusBot/0.2 (https://github.com/systemonster/turkish-writer)","Accept":"application/json"})
    with urllib.request.urlopen(req,timeout=40) as res:
        raw=res.read(12_000_001)
    if len(raw)>12_000_000:raise RuntimeError("bounded response exceeded")
    data=json.loads(raw)
    if "error" in data:raise RuntimeError("MediaWiki API "+str(data["error"].get("code")))
    result={}
    for p in data.get("query",{}).get("pages",[]):
        if p.get("ns")!=0:continue
        for r in p.get("revisions",[]):
            s=r.get("slots",{}).get("main",{})
            if s.get("contentmodel")!="wikitext" or not isinstance(s.get("content"),str) or r.get("texthidden") or r.get("suppressed"):continue
            result[r["revid"]]={**{k:r[k] for k in ("revid","parentid","timestamp","tags")}, "content":s["content"],"pageid":p["pageid"],"title":p["title"]}
    return result
def main():
    p=argparse.ArgumentParser();p.add_argument("--self-test",action="store_true");args=p.parse_args()
    self_test()
    if args.self_test:return
    from huggingface_hub import HfApi
    api=HfApi(token=os.environ["HF_TOKEN"])
    if not api.repo_info(DEST,repo_type="dataset").private:raise RuntimeError("private destination required")
    report=json.loads((HERE/"results/wiki-historical-pilot-v1.json").read_text())
    rows=report["cases"];assert len(rows)==50 and len({r["id"] for r in rows})==50
    ids=sorted({int(x) for r in rows for x in r["id"].split("-")[1:]})
    revisions={}
    for k in range(0,len(ids),10):
        revisions.update(fetch(ids[k:k+10]))
        print("WIKI_FETCH_PROGRESS "+json.dumps({"requested":min(k+10,len(ids)),"received":len(revisions),"total":len(ids)}),flush=True)
        time.sleep(1)
    accepted=[];skipped=[]
    for r in rows:
        a,b=map(int,r["id"].split("-")[1:])
        if a not in revisions or b not in revisions:
            skipped.append({"id":r["id"],"reason":"missing_revision"});continue
        item,reason=pair(r,revisions[a],revisions[b])
        if item:accepted.append(item)
        else:skipped.append({"id":r["id"],"reason":reason})
    result={"scope":"previous historical development candidates; no human approval; later reverts/rights still require review","requested_pairs":len(rows),"records":accepted,"skipped":skipped,"source_license":LICENSE,"source_rights":RIGHTS}
    data=json.dumps(result,ensure_ascii=False,indent=2).encode()
    api.upload_file(path_or_fileobj=data,path_in_repo="editorial-corpus-v1/wiki-revision-pairs.json",repo_id=DEST,repo_type="dataset",commit_message="Private contextual historical revision candidate evidence")
    print("WIKI_PAIR_COMPLETE "+json.dumps({"requested":len(rows),"retrieved":len(accepted),"skipped":skipped,"artifact_sha256":hashlib.sha256(data).hexdigest(),"ids":[r["id"] for r in accepted]}),flush=True)
if __name__=="__main__":main()
