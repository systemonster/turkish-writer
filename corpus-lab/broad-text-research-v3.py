#!/usr/bin/env python3
"""Broader text research: entire SUDO archive and an actual FineWeb text shard.

The inputs are read for linguistic research only. Public results are fixed
category counts; no web article text, full URLs, names or raw n-grams are
retained from FineWeb. SUDO source windows, if used in later review, require
separate attribution and privacy checks. Neither corpus is editorial gold.
"""
import argparse, collections as C, hashlib, importlib.util, json, math, os, pathlib, re, tarfile, tempfile, urllib.request
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("full",HERE/"full-corpus-pass-v2.py")
full=importlib.util.module_from_spec(spec);spec.loader.exec_module(full)
ctx,p=full.ctx,full.p
SUDO_REV="18cd8b55645f92578d120e9fb105487f236fed79"
FINE_REV="7c5bd76fa456f1748ceb603d8e57acf24a173339"
FINE_REPO="datasets/moganai/turkishfineweb2-cleaned"
DEST=ctx.DEST
MARKERS={k:re.compile(v) for k,v in full.MARKERS.items()}
# Surface cues, not claims about morphological analysis or discourse truth.
CUES={
 "uncertainty":re.compile(r"\b(?:belki|sanırım|galiba|muhtemelen|henüz|olasılıkla)\b"),
 "stance":re.compile(r"\b(?:bence|bana göre|bildiğim kadarıyla|hatırladığım kadarıyla)\b"),
 "scope":re.compile(r"\b(?:yalnızca|sadece|en az|en çok|bir kısmı|çoğu|hariç)\b"),
 "before_after":re.compile(r"\b\w+(?:dıktan|dikten|duktan|dükten|tıktan|tikten|tuktan|tükten)\s+sonra\b|\b\w+(?:madan|meden)\s+önce\b"),
 "without":re.compile(r"\b\w+(?:madan|meden)\b"),
 "method_cue":re.compile(r"\b\w+(?:arak|erek)\b"),
 "nominal_chain":re.compile(r"\b\w+(?:masının|mesinin)\s+\w+(?:ması|mesi)\b"),
 "reported":re.compile(r"\b(?:dedi|söyledi|belirtti|aktardı|anlattı|yazdı)\b"),
}
DIALOGUE=re.compile(r"^\s*(?:—|–)\s*\S")
def sha(b):return hashlib.sha256(b).hexdigest()
def upload(api,path,d):
    raw=json.dumps(d,ensure_ascii=False,sort_keys=True).encode()
    api.upload_file(path_or_fileobj=raw,path_in_repo=path,repo_id=DEST,repo_type="dataset",commit_message="Aggregate editorial corpus research; no source text")
    return sha(raw)
def scan_text(text):
    """Only count predefined cues, not actual strings or author identity."""
    totals=C.Counter()
    transitions=C.Counter()
    positions=C.Counter()
    previous=None
    for line in text.splitlines():
        line=line.strip()
        if not line:continue
        totals["nonempty_lines"]+=1
        if DIALOGUE.search(line):totals["dialogue_line_cues"]+=1
        # Split using the same conservative sentence heuristic as existing work.
        sentences=p.sentences(line)
        for i,s in enumerate(sentences):
            lo=p.tr_lower(s)
            totals["heuristic_sentences"]+=1
            words=len(p.WORD.findall(s))
            totals["words_in_segments"]+=words
            totals["length_"+("1_7" if words<=7 else "8_15" if words<=15 else "16_30" if words<=30 else "31_plus")]+=1
            kind=next((tag for tag,rx in MARKERS.items() if rx.search(lo)),"unmarked")
            positions[("line_start" if i==0 else "inside_line",kind)]+=1
            for tag,rx in CUES.items():
                if rx.search(lo):totals[tag+"_sentence_cues"]+=1
            if previous is not None:transitions[(previous,kind)]+=1
            previous="question" if s.rstrip().endswith("?") else kind
            if previous=="question":totals["question_endings"]+=1
    return totals,positions,transitions
def combine(acc,parts):
    for a,b in zip(acc,parts):a.update(b)
def finish(acc):
    return {"counts":dict(acc[0]),"marker_positions":[[a,b,n] for (a,b),n in acc[1].most_common()],"transitions":[[a,b,n] for (a,b),n in acc[2].most_common()]}
def sudo():
    url="https://codeload.github.com/ubuntu-tr/ubuntu-tr.github.io/tar.gz/"+SUDO_REV
    root="ubuntu-tr.github.io-"+SUDO_REV
    docs=[];inventory=C.Counter();year_counts=C.Counter();author_groups=set();acc=[C.Counter(),C.Counter(),C.Counter()]
    req=urllib.request.Request(url,headers={"User-Agent":"TurkishWriter-corpus-research/2.0"})
    with tempfile.TemporaryFile() as tmp:
        total=0
        with urllib.request.urlopen(req,timeout=60) as res:
            while True:
                chunk=res.read(1024*1024)
                if not chunk:break
                total+=len(chunk)
                if total>2_000_000_000:raise RuntimeError("bounded SUDO archive exceeded")
                tmp.write(chunk)
        tmp.seek(0)
        with tarfile.open(fileobj=tmp,mode="r|gz") as tf:
            for m in tf:
                if not m.isfile() or not m.name.startswith(root+"/_posts/") or not m.name.lower().endswith((".md",".markdown")):continue
                inventory["post_files_seen"]+=1
                if m.size>4_000_000:inventory["oversized"]+=1;continue
                name=pathlib.PurePosixPath(m.name).name
                if not re.match(r"^20\d{2}-\d{2}-\d{2}",name):inventory["unexpected_filename"]+=1;continue
                raw=tf.extractfile(m).read().decode("utf-8",errors="strict")
                year=name[:4]
                if year>"2021":inventory["post_2021"]+=1;continue
                front=re.match(r"^---\s*\n(.*?)\n---\s*\n",raw,re.S)
                if front:
                    a=re.search(r"(?m)^author:\s*(.+)$",front.group(1))
                    if a:author_groups.add(sha(a.group(1).strip().encode())[:16])
                    body=raw[front.end():]
                else:body=raw
                paras=p.prose_blocks(body)
                if not paras:inventory["no_eligible_prose"]+=1;continue
                inventory["prose_posts"]+=1;year_counts[year]+=1
                docs.append((year,paras))
                combine(acc,scan_text("\n".join(paras)))
    if not inventory["post_files_seen"] or not docs:raise RuntimeError("missing SUDO post archive")
    return {"scope":"entire pinned archive Markdown post inventory; eligible pre-2022 prose only, automatic parsing, not human editorial gold",
      "source":"https://github.com/ubuntu-tr/ubuntu-tr.github.io/tree/"+SUDO_REV,
      "source_attribution":"SUDO Portal authors; individual article attribution and original publication remain in upstream archive",
      "rights_evidence":["https://ubuntu-tr.github.io/cekirdek-nedir-ne-yapar","https://bugra9.github.io/sendeyaz/"],
      "inventory":dict(inventory),"archive_bytes":total,"year_counts":dict(year_counts),
      "distinct_author_metadata_groups":len(author_groups),"discourse_profile":full.prose(docs),"fixed_cues":finish(acc),
      "limitations":["The pinned archive is not the whole Turkish web or a representative literary corpus.","Some posts may be translations, quotes, or technical code; no original-author verification at the individual article level.","No raw text or author identity exported."]}
def fineweb(api,shard):
    from huggingface_hub import HfFileSystem
    import pyarrow.parquet as pq
    fs=HfFileSystem(token=api.token)
    source=f"{FINE_REPO}@{FINE_REV}/data/train-{shard:05d}-of-00203.parquet"
    acc=[C.Counter(),C.Counter(),C.Counter()];inventory=C.Counter()
    with fs.open(source,"rb",block_size=8*1024*1024) as f:
        pf=pq.ParquetFile(f);cols=pf.schema_arrow.names
        required=["text","date","language_score","fasttext_clean_score"]
        if not all(k in cols for k in required):raise RuntimeError("Unsupported text schema: "+str(cols))
        for batch in pf.iter_batches(batch_size=1024,columns=required):
            for row in batch.to_pylist():
                inventory["rows"]+=1
                y=str(row.get("date",""))[:4]
                try:lang=float(row["language_score"]);quality=float(row["fasttext_clean_score"])
                except (TypeError,ValueError,KeyError):inventory["invalid_metadata"]+=1;continue
                if not ("2013"<=y<="2021" and .9<=lang<=1.01 and .8<=quality<=1.01):
                    inventory["metadata_not_selected"]+=1;continue
                text=row.get("text")
                if not isinstance(text,str) or len(text)<80:inventory["short_or_empty"]+=1;continue
                if len(text)>200000:inventory["over_length_bound"]+=1;continue
                inventory["texts_processed"]+=1
                combine(acc,scan_text(text))
            if inventory["rows"]%32768<1024:print("TEXT_PASS_PROGRESS "+json.dumps({"shard":shard,"rows":inventory["rows"],"texts":inventory["texts_processed"]}),flush=True)
        if inventory["rows"]!=pf.metadata.num_rows:raise RuntimeError("incomplete text shard")
    return {"scope":"Actual eligible FineWeb article text analyzed in memory, entire shard inventory, no source text/URL retained; not author or quality verification","source":"https://huggingface.co/datasets/moganai/turkishfineweb2-cleaned","revision":FINE_REV,"shard":shard,"inventory":dict(inventory),"thresholds":{"crawl_year":[2013,2021],"language":[.9,1.01],"quality":[.8,1.01],"max_text_chars":200000},"fixed_cues":finish(acc),"limitations":["Crawl date is not publication date or authorship proof.","Quality-classifier score is a filter, not proof of good prose.","Cue matches are heuristic; not morphological parses or validated discourse labels.","Only fixed aggregate counts, no personal data or copied passages."]}
def self_test():
    a,b,c=scan_text("Bu işi yaptık. Peki sonuç ne oldu?\nAncak sonuç henüz belli değil.\n— Sen geldin mi?")
    assert a["heuristic_sentences"]==4 and a["question_endings"]==2 and a["uncertainty_sentence_cues"]==1
    assert a["dialogue_line_cues"]==1 and c[("question","contrast")]==1
    assert b[("line_start","contrast")]==1
    print("BROAD_TEXT_SELF_TEST_COMPLETE",flush=True)
def main():
    ap=argparse.ArgumentParser();ap.add_argument("--self-test",action="store_true");ap.add_argument("--mode",choices=["sudo","fineweb"]);ap.add_argument("--shard",type=int,default=0);args=ap.parse_args()
    self_test()
    if args.self_test:return
    if not args.mode or not 0<=args.shard<203:ap.error("mode and valid shard required")
    from huggingface_hub import HfApi
    api=HfApi(token=os.environ["HF_TOKEN"])
    if not api.repo_info(DEST,repo_type="dataset").private:raise RuntimeError("private research destination required")
    if args.mode=="sudo":
        d=sudo();path="editorial-corpus-v2/sudo-full-text-aggregate.json"
    else:
        d=fineweb(api,args.shard);path=f"editorial-corpus-v2/fineweb-text/shard-{args.shard:03d}.json"
    print("BROAD_TEXT_COMPLETE "+json.dumps({"mode":args.mode,"inventory":d["inventory"],"artifact":path,"sha256":upload(api,path,d),"counts":d["fixed_cues"]["counts"]}),flush=True)
if __name__=="__main__":main()
