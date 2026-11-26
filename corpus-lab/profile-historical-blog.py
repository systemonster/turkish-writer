#!/usr/bin/env python3
"""Aggregate prose profile of the author's openly licensed historical Turkish blog archive.

No excerpts, names, or article-level text are emitted. This is one author and one genre;
heuristic Markdown/sentence parsing is not a grammar or editorial-quality score.
"""
import argparse, collections, datetime, json, pathlib, re, statistics, subprocess

SOURCE="https://github.com/daronyondem/daron-turkce-blog"
REVISION="e5a5885a9f70d2f30519560a80c6de622aeac945"
LICENSE="CC BY-SA 4.0"
TR_CHAR=re.compile(r"[çğıöşüÇĞİÖŞÜ]")
WORD=re.compile(r"[^\W\d_]+(?:['’][^\W\d_]+)?",re.UNICODE)
CONNECTIVES=("ama","ancak","fakat","oysa","çünkü","dolayısıyla","yani","aslında","örneğin","mesela","peki","şimdi","böylece","nitekim","üstelik","ayrıca","kısacası","özetle")
def tr_lower(s):
    return s.translate(str.maketrans({"I":"ı","İ":"i"})).lower()

def prose_blocks(text):
    # Preserve paragraph boundaries; Markdown exports can wrap a paragraph across lines.
    text=re.sub(r"(?ms)^\s*(?:```|~~~)[^\n]*\n.*?^\s*(?:```|~~~)\s*(?:\n|$)","\n",text)
    text=re.sub(r"(?is)<(?:script|style|pre|code|iframe)\b[^>]*>.*?</(?:script|style|pre|code|iframe)>"," ",text)
    text=re.sub(r"!\[[^\]]*\]\([^)]*\)"," ",text,flags=re.S)
    text=re.sub(r"\[([^\]\n]+)\]\([^)]*\)",r"\1",text)
    text=re.sub(r"`[^`\n]+`"," ",text)
    text=re.sub(r"https?://\S+|<[^>]+>"," ",text)
    blocks=[]
    for raw in re.split(r"\n\s*\n",text):
        lines=[]
        for line in raw.splitlines():
            s=line.strip()
            if not s or re.match(r"^\s{4,}|^\t",line) or re.match(r"^(?:#{1,6}\s|>|[-*+]\s|\d+[.)]\s|\||[=_-]{3,}$|\[\d+\]:)",s):continue
            if re.match(r"^bu yaz[ıi]\s+(?:https?://|adresinde|\d{4})",tr_lower(s)):continue
            if re.search(r"\b(?:namespace|public static|console\.writeline|return null|using system|function\s*\(|var\s+\w+\s*=)\b",s,re.I):continue
            if sum(c in "{}<>;=" for c in s)>max(3,len(s)//20):continue
            lines.append(s)
        body=" ".join(lines).strip()
        body=re.sub(r"\[\s*\]\s*\([^)]*\)|[*_~]+","",body)
        if not body or re.search(r"\bbu yaz[ıi].{0,100}(?:yayınlanmıştır|yayimlanmistir|yayinlanmistir|yayımlanmıştır)",tr_lower(body)):continue
        words=WORD.findall(body)
        if len(words)<8 or not TR_CHAR.search(body) or not any(c in body for c in ".!?"):continue
        blocks.append(body)
    return blocks

def sentences(text):
    # Do not split common abbreviations, URLs removed above, or decimal numbers.
    protected=re.sub(r"(?i)(?<!\w)(örn|vb|vs|dr|prof|doç|sn|bkz|no)\.",lambda m: m.group(1)+"\u2024",text)
    protected=re.sub(r"(?<=\d)\.(?=\d)","\u2024",protected)
    return [s.strip().replace("\u2024",".") for s in re.split(r"(?<=[.!?])\s+(?=[\"“'‘(]*[A-ZÇĞİÖŞÜ0-9])",protected) if len(WORD.findall(s))>=3]

def dist(xs):
    xs=sorted(xs)
    if not xs:return {"n":0}
    def quantile(q):return xs[round((len(xs)-1)*q)]
    return {"n":len(xs),"mean":round(statistics.mean(xs),2),"median":statistics.median(xs),"p10":quantile(.1),"p90":quantile(.9)}

def profile(files):
    doc_lengths=[]; paragraph_lengths=[]; sentence_lengths=[]; first_para=[]; per_doc_sd=[]
    starts=collections.Counter(); connectors=collections.Counter()
    years=collections.Counter(); excluded=collections.Counter()
    question_docs=short_paragraph_docs=multi_para_docs=0
    total_words=0; total_sentences=0
    for p in sorted(files):
        match=re.match(r"^(20\d{2})-\d{2}-\d{2}(?:[^/]*)\.md$",p.name)
        if not match or not "2007"<=match.group(1)<="2017":
            excluded["outside_2007_2017_or_filename"]+=1;continue
        raw=p.read_text(encoding="utf-8")
        paras=prose_blocks(raw)
        lens=[len(WORD.findall(x)) for x in paras]
        n=sum(lens)
        if n<200 or len(paras)<3:
            excluded["under_200_prose_words_or_3_paragraphs"]+=1;continue
        sents=[s for par in paras for s in sentences(par)]
        sl=[len(WORD.findall(s)) for s in sents]
        if not sl:
            excluded["no_segmented_sentences"]+=1;continue
        years[match.group(1)]+=1
        doc_lengths.append(n);total_words+=n;total_sentences+=len(sents)
        paragraph_lengths.extend(lens);sentence_lengths.extend(sl);first_para.append(lens[0])
        if len(sl)>1:per_doc_sd.append(statistics.pstdev(sl))
        question_docs+=any("?" in x for x in paras)
        short_paragraph_docs+=any(x<=15 for x in lens)
        multi_para_docs+=len(paras)>=5
        for para in paras:
            tokens=[tr_lower(x) for x in WORD.findall(para)]
            connectors.update(x for x in tokens if x in CONNECTIVES)
        for sent in sents:
            tokens=WORD.findall(sent)
            if tokens and tr_lower(tokens[0]) in CONNECTIVES:starts[tr_lower(tokens[0])]+=1
    if not doc_lengths:raise ValueError("no accepted prose documents")
    return {"source":SOURCE,"source_revision":REVISION,"source_license":LICENSE,
        "attribution":"Daron Yöndem, Türkçe Blog İçeriği (2007–2018); aggregate research notes only",
        "scope":"One author's historical technical/personal blog archive; heuristically selected prose, not a representative corpus or verified professional editing benchmark.",
        "criteria":{"filename_years":[2007,2017],"min_prose_words":200,"min_prose_blocks":3,"min_words_per_block":8,"min_words_per_segmented_sentence":3},
        "files_examined":len(files),"documents_retained":len(doc_lengths),"excluded":dict(excluded),"years":dict(sorted(years.items())),
        "prose_words":total_words,"segmented_sentences":total_sentences,"paragraphs":len(paragraph_lengths),
        "words_per_document":dist(doc_lengths),"words_per_paragraph":dist(paragraph_lengths),"words_per_first_paragraph":dist(first_para),"words_per_sentence":dist(sentence_lengths),
        "within_document_sentence_word_sd":dist(per_doc_sd),
        "documents_with_question_mark":question_docs,"documents_with_short_paragraph_15_words_or_less":short_paragraph_docs,"documents_with_5_or_more_paragraphs":multi_para_docs,
        "surface_connective_counts":dict(connectors),"sentence_initial_connective_counts":dict(starts),
        "limitations":["No native-speaker authorship claim beyond archive provenance; documents not individually editor-reviewed.","Markdown stripping, language screening, word and sentence segmentation are heuristic and omit some valid prose.","The word counts are Unicode word matches, not BPE tokens; sentence segmentation is approximate.","Selection favors long articles, is dominated by earlier years and one writer; no quota or universal style rule follows."]}

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("archive",type=pathlib.Path)
    a=p.parse_args()
    root=a.archive.resolve()
    sha=subprocess.check_output(["git","rev-parse","HEAD"],cwd=root,text=True).strip()
    if sha!=REVISION:raise SystemExit("Unexpected archive revision")
    if "CC BY-SA 4.0" not in (root/"README.md").read_text(encoding="utf-8"):raise SystemExit("License declaration missing")
    result=profile(list((root/"posts").glob("*.md")))
    print(json.dumps(result,ensure_ascii=False,indent=2))
