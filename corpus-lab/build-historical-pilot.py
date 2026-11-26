#!/usr/bin/env python3
"""Freeze a source-disjoint historical prose pilot. Not human-verified or a final holdout."""
import argparse, collections, hashlib, json, pathlib, re, subprocess

REPO="https://github.com/ubuntu-tr/ubuntu-tr.github.io"
REV="18cd8b55645f92578d120e9fb105487f236fed79"
LICENSE="CC BY-SA 4.0"
RIGHTS="https://ubuntu-tr.github.io/cekirdek-nedir-ne-yapar"
TERMS="https://bugra9.github.io/sendeyaz/"
WORD=re.compile(r"[^\W\d_]+(?:['’][^\W\d_]+)?",re.UNICODE)
TR=re.compile("[çğıöşüÇĞİÖŞÜ]")
def digest(s):return hashlib.sha256(s.encode("utf-8")).hexdigest()
def field(header,key):
    match=re.search(r"^"+re.escape(key)+r":\s*(.+)$",header,re.M)
    return match.group(1).strip().strip('"').strip("'") if match else ""
def clean_paragraph(s):
    s=s.strip()
    if not s or any(x in s for x in ("{{","{%","![","http://","https://","<",">","[^",chr(96),"~~~","[","]","\t")):return None
    if re.search(r"(?m)^\s*(?:#{1,6}\s|[-*+]\s|\d+[.)]\s|\|| {4,})",s):return None
    if re.search(r"(?i)\b(?:kaynaklar?|referanslar?|çeviri|tercüme|alıntı)\s*:",s):return None
    if sum(ch in "{};=|" for ch in s)>max(2,len(s)//60):return None
    if not TR.search(s) or not re.search(r"[.!?]",s):return None
    n=len(WORD.findall(s))
    if not 15<=n<=140:return None
    return s
def extract(raw):
    raw=raw.replace("\r\n","\n")
    if not raw.startswith("---\n") or "\n---\n" not in raw[4:]:return None
    header,body=raw[4:].split("\n---\n",1)
    if re.search(r"(?i)\b(?:çeviren|çeviri|tercüme|translated by|translation of)\b",header+"\n"+body[:1000]):return None
    author=field(header,"author");title=field(header,"title");date=field(header,"date")[:10];slug=field(header,"permalink")
    if not author or not title or not re.fullmatch(r"20\d{2}-\d{2}-\d{2}",date) or date>"2017-12-31":return None
    if not re.fullmatch(r"[a-zA-Z0-9_-]+",slug):return None
    chunks=re.split(r"\n[ \t]*\n",body)
    blocks=[clean_paragraph(p) for p in chunks]
    for start in range(len(blocks)):
        ps=[]
        for end in range(start,min(start+7,len(blocks))):
            x=blocks[end]
            if x is None:break
            ps.append(x)
            txt="\n\n".join(ps)
            n=len(WORD.findall(txt))
            if n>330:break
            if len(ps)>=3 and n>=150:
                return {"title":title,"author":author,"date":date,"slug":slug,"source":txt,"paragraphs":len(ps),"words":n,"start_block":start,"end_block":end}
    return None
def main():
    p=argparse.ArgumentParser();p.add_argument("archive",type=pathlib.Path);p.add_argument("out",type=pathlib.Path);p.add_argument("--limit",type=int,default=20)
    a=p.parse_args()
    if not 8<=a.limit<=30:p.error("limit 8–30")
    if subprocess.check_output(["git","rev-parse","HEAD"],cwd=a.archive,text=True).strip()!=REV:raise SystemExit("archive revision mismatch")
    fs=sorted((a.archive/"_posts").glob("*.md"),key=lambda x:digest("historical-v10:"+x.name))
    rows=[];authors=collections.Counter();reject=collections.Counter();seen=set()
    for file in fs:
        x=extract(file.read_text(encoding="utf-8-sig"))
        if not x:reject["no_eligible_contiguous_prose"]+=1;continue
        if authors[x["author"]]>=2:reject["author_cap"]+=1;continue
        sha=digest(x["source"])
        if sha in seen:reject["duplicate"]+=1;continue
        seen.add(sha);authors[x["author"]]+=1
        rows.append({"id":"sudo-"+sha[:16],"source_group":"sudo-portal","author_group":digest("sudo:"+x["author"])[:16],"source_url":"https://ubuntu-tr.github.io/"+x["slug"],"source_path":"_posts/"+file.name,"source_revision":REV,"source_sha256":sha,"rights_evidence":[RIGHTS,TERMS],"license":LICENSE,"review_status":"source_candidate_not_editor_verified","split":"external_pilot","genre":"tarihsel teknoloji blogu / dergi yazısı","purpose":"Dönemin olgularını, yazarın sesini ve anlamı koruyarak yalnız gerekli Türkçe yayın düzenlemesini yap; güncel bilgi ekleme.",**{k:v for k,v in x.items() if k!="slug"}})
        if len(rows)>=a.limit:break
    if len(rows)<8 or len(authors)<4:raise SystemExit("insufficient independent source candidates")
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text("".join(json.dumps(r,ensure_ascii=False)+"\n" for r in rows),encoding="utf-8")
    manifest=[{k:v for k,v in r.items() if k!="source"} for r in rows]
    print("PILOT_MANIFEST "+json.dumps({"scope":"new-source historical multi-author pilot; not independent human-verified holdout; no expected edit decision; model pretraining overlap unknown","archive":REPO,"revision":REV,"license":LICENSE,"articles":len(rows),"authors":len(authors),"words":sum(r["words"] for r in rows),"rejections":dict(reject),"documents":manifest},ensure_ascii=False),flush=True)
if __name__=="__main__":main()
