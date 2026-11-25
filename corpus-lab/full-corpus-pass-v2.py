#!/usr/bin/env python3
"""Full-pass research on the already licensed development sources.
No raw text exported. Every eligible paragraph and all BOUN train tokens are
processed. Prior selected historical revision pairs are all compared. The
result is an aggregate research aid, not human-reviewed editorial gold.
"""
import argparse, collections as C, hashlib, importlib.util, json, os, pathlib, re, tarfile, tempfile, urllib.request
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("context",HERE/"extract-editorial-context-v1.py")
ctx=importlib.util.module_from_spec(spec);spec.loader.exec_module(ctx)
p=ctx.profile
WIKI_SHA="4c086b0d882fb7a056179b002e2269c98e5c3361523267fadca6f3a420647177"
MARKERS={
 "contrast":r"^(?:ama|ancak|fakat|oysa|hâlbuki|buna rağmen|yine de|ne var ki)\b",
 "explanation":r"^(?:yani|başka bir deyişle|daha doğrusu|bir başka deyişle)\b",
 "example":r"^(?:örneğin|mesela|diyelim ki)\b",
 "inference":r"^(?:böylece|dolayısıyla|bu nedenle|bu yüzden|nitekim|demek ki)\b",
 "sequence":r"^(?:önce|sonra|ardından|şimdi|daha sonra)\b",
 "addition":r"^(?:ayrıca|üstelik|bir de|hatta|bunun yanı sıra)\b",
 "summary":r"^(?:kısacası|özetle|sonuç olarak)\b",
 "condition":r"^(?:eğer|şayet)\b",
}
def sha(b):return hashlib.sha256(b).hexdigest()
def all_daron():
    root="daron-turkce-blog-"+ctx.DREV
    url="https://codeload.github.com/daronyondem/daron-turkce-blog/tar.gz/"+ctx.DREV
    docs=[];seen=0;reject=C.Counter();license_ok=False
    req=urllib.request.Request(url,headers={"User-Agent":"TurkishWriter-corpus-research/2.0"})
    with tempfile.TemporaryFile() as tmp:
        total=0
        with urllib.request.urlopen(req,timeout=60) as r:
            while True:
                chunk=r.read(1024*1024)
                if not chunk:break
                total+=len(chunk)
                if total>1_200_000_000:raise RuntimeError("bounded archive exceeded")
                tmp.write(chunk)
        tmp.seek(0)
        with tarfile.open(fileobj=tmp,mode="r|gz") as tf:
            for m in tf:
                if not m.isfile():continue
                if m.name==root+"/README.md":
                    license_ok="CC BY-SA 4.0" in tf.extractfile(m).read().decode()
                if not m.name.startswith(root+"/posts/") or not m.name.endswith(".md"):continue
                seen+=1
                if m.size>2_000_000:reject["oversized"]+=1;continue
                name=pathlib.PurePosixPath(m.name).name
                if not re.match(r"^20(?:0[7-9]|1[0-8])-\d{2}-\d{2}.*\.md$",name):reject["date_or_name"]+=1;continue
                s=tf.extractfile(m).read().decode("utf-8")
                paras=p.prose_blocks(s)
                if not paras:reject["no_eligible_prose"]+=1;continue
                docs.append((name[:4],paras))
    if not license_ok or seen!=1038:raise RuntimeError("source/license coverage mismatch "+str(seen))
    return docs,{"files_seen":seen,"files_with_eligible_prose":len(docs),"excluded":dict(reject),"archive_bytes":total,"revision":ctx.DREV}
def prose(docs):
    stats=C.Counter();positions=C.defaultdict(C.Counter);next_types=C.Counter();transitions=C.Counter();years=C.Counter();length_by_marker=C.defaultdict(list)
    for year,paras in docs:
        years[year]+=1;stats["documents"]+=1;stats["paragraphs"]+=len(paras)
        prev=None
        for i,par in enumerate(paras):
            words=p.WORD.findall(par);stats["words"]+=len(words)
            ss=p.sentences(par)
            stats["sentences"]+=len(ss)
            if not ss:stats["unsegmented_paragraphs"]+=1;continue
            for k,s in enumerate(ss):
                lower=p.tr_lower(s); tags=[name for name,pat in MARKERS.items() if re.search(pat,lower)]
                tag=tags[0] if tags else "unmarked"
                pos="opening" if i==0 and k==0 else ("paragraph_start" if k==0 else "inside_paragraph")
                positions[tag][pos]+=1
                if prev:
                    transitions[(prev,tag)]+=1
                    if prev=="question":next_types[tag]+=1
                prev="question" if s.rstrip().endswith("?") else tag
                if prev=="question":stats["questions"]+=1
                if tag!="unmarked":length_by_marker[tag].append(len(p.WORD.findall(s)))
    return {"coverage":dict(stats),"years":dict(years),"marker_position_counts":{k:dict(v) for k,v in positions.items()},"after_question_counts":dict(next_types),"adjacent_marker_counts":[[a,b,n] for (a,b),n in transitions.most_common()],"marker_sentence_lengths":{k:p.dist(v) for k,v in length_by_marker.items()}}
def syntax():
    url="https://raw.githubusercontent.com/UniversalDependencies/UD_Turkish-BOUN/"+ctx.BREV+"/tr_boun-ud-train.conllu"
    raw=ctx.read_url(url,40_000_000)
    if sha(raw)!="ae54aef82e69cb7ccc54703a07e2ebcde66c2e4453a5debfac1eb78dfed60e9f":raise RuntimeError("train source hash mismatch")
    total=C.Counter();genres=C.defaultdict(C.Counter);frames=C.Counter();conv=C.Counter();focus=C.Counter();feats=C.Counter();verb_cases=C.defaultdict(C.Counter)
    for block in re.split(r"\r?\n\r?\n",raw.decode()):
        sid=re.search(r"(?m)^# sent_id = (.+)$",block)
        if not sid:continue
        g=sid.group(1).split("-")[0].split("_")[0]
        total["sentences"]+=1;genres[g]["sentences"]+=1
        toks={}
        for line in block.splitlines():
            x=line.split("\t")
            if len(x)==10 and x[0].isdigit():toks[int(x[0])]=x
        for i,t in toks.items():
            total["tokens"]+=1
            if t[3]!="PUNCT" and t[3]!="SYM":total["nonpunct_tokens"]+=1
            if t[3]=="VERB":
                total["verbs"]+=1
                for f in t[5].split("|"):
                    if f.startswith(("VerbForm=","Mood=","Tense=","Aspect=","Voice=","Polarity=","Evident=")):feats[f]+=1
                if "VerbForm=Conv" in t[5]:
                    total["converb_tokens"]+=1;conv[(t[7],re.sub(r"[^a-zA-Z=:]","",next((x for x in t[5].split("|") if x.startswith("VerbForm=")),"")))]+=1
            if t[3] in {"NOUN","PROPN","PRON"} and t[6].isdigit():
                h=toks.get(int(t[6]));rel=t[7].split(":")[0]
                if h and h[3]=="VERB" and rel in {"obj","obl","nsubj"}:
                    case=re.search(r"(?:^|\|)Case=([^|]+)",t[5])
                    if case:
                        c=case.group(1);total["verb_nominal_dependencies"]+=1
                        verb_cases[h[2]][rel+":"+c]+=1
                        # Only aggregate common lexical pair counts; never named entities.
                        if t[3]=="NOUN" and t[2]!="_" and h[2]!="_":frames[(h[2],t[2],rel,c)]+=1
                        focus[(rel,"before" if i<int(t[6]) else "after")]+=1
    if total["sentences"]!=7803:raise RuntimeError("train coverage mismatch")
    return {"coverage":dict(total),"source_sha256":sha(raw),"verb_features":dict(feats),"relation_direction_counts":[[a,b,n] for (a,b),n in focus.most_common()],"verb_frames":[[v,dict(c)] for v,c in sorted(verb_cases.items()) if sum(c.values())>=15 and len(c)>1],"common_noun_verb_pairs":[[*k,n] for k,n in frames.most_common() if n>=3],"converb_dependencies":[[a,b,n] for (a,b),n in conv.most_common()]}
def wiki(api):
    from huggingface_hub import hf_hub_download
    path=hf_hub_download(ctx.DEST,filename="editorial-corpus-v1/wiki-revision-pairs.json",repo_type="dataset",token=api.token)
    raw=pathlib.Path(path).read_bytes()
    # The scheduled run may have recovered the identical pairs in a different JSON
    # representation. Require exact candidate IDs and verified per-paragraph hashes.
    d=json.loads(raw);expected=json.loads((HERE/"results/wiki-historical-pilot-v1.json").read_text())["cases"]
    rows=d["records"]
    assert len(rows)==50 and {x["id"] for x in rows}=={x["id"] for x in expected}
    for x in rows:
        assert sha(x["before"].encode())==x["before_sha256"] and sha(x["after"].encode())==x["after_sha256"]
    counts=C.Counter(x["provisional_label"] for x in expected)
    return {"pairs":len(rows),"categories":dict(counts),"artifact_sha256":sha(raw),"matches_prior_artifact_hash":sha(raw)==WIKI_SHA,"scope":"all 50 previously selected pairs; not all 2643 historical revisions; existing review reused, no new human labels"}
def main():
    a=argparse.ArgumentParser();a.add_argument("--self-test",action="store_true");args=a.parse_args()
    s=prose([("test",["Bu bir örnek. Peki ne oldu?","Ancak başka bir sorun vardı. Sonra eve döndük."])])
    assert s["coverage"]["sentences"]==4 and s["marker_position_counts"]["contrast"]["paragraph_start"]==1 and s["after_question_counts"]["contrast"]==1
    print("FULL_CORPUS_SELF_TEST_COMPLETE",flush=True)
    if args.self_test:return
    from huggingface_hub import HfApi
    api=HfApi(token=os.environ["HF_TOKEN"])
    assert api.repo_info(ctx.DEST,repo_type="dataset").private
    d,inventory=all_daron();print("FULL_DARON_INVENTORY "+json.dumps(inventory),flush=True)
    daron=prose(d)
    sudo=prose([("historical",paras) for _,paras in ctx.sudo(api)])
    boun=syntax()
    w=wiki(api)
    report={"scope":"all eligible prose in pinned Daron archive; all previously frozen SUDO excerpts, all BOUN train annotation tokens, all previously selected Wikipedia pairs; no independent holdout or quality claim","license":"CC BY-SA 4.0","daron_inventory":inventory,"daron":daron,"sudo_frozen":sudo,"boun_train":boun,"wiki_selected":w,"limitations":["Markdown and sentence splitting heuristic; non-prose, very short blocks, and unrecognized date names excluded with coverage counts.","Daron single author; SUDO only frozen excerpts, not all SUDO publications.","BOUN dev/test reserved, no training leakage.","Marker counts and dependency frames are candidates, not universal rules or editorial gold.","No raw source text in the output; no individual review claim."]}
    payload=json.dumps(report,ensure_ascii=False,indent=2).encode()
    api.upload_file(path_or_fileobj=payload,path_in_repo="editorial-corpus-v2/full-pass-licensed.json",repo_id=ctx.DEST,repo_type="dataset",commit_message="Full-pass licensed corpus aggregate research")
    print("FULL_CORPUS_COMPLETE "+json.dumps({"artifact_sha256":sha(payload),"daron":daron["coverage"],"sudo":sudo["coverage"],"boun":boun["coverage"],"wiki":w,"inventory":inventory}),flush=True)
if __name__=="__main__":main()
