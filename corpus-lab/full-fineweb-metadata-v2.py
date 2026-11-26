#!/usr/bin/env python3
"""Complete metadata census of the pinned TurkishFineweb2 dataset.

All 203 parquet shards; project only metadata columns, not document text.
Checkpoint per shard in a private research dataset, never retain full URLs or
document text. Candidate domains and crawl dates are NOT rights or quality
verification. Resume only verified checkpoints at the same revision.
"""
import argparse, collections as C, hashlib, json, math, os, pathlib, re
from urllib.parse import urlsplit
REVISION="7c5bd76fa456f1748ceb603d8e57acf24a173339"
REPO="datasets/moganai/turkishfineweb2-cleaned"
DEST="lovefengis/turkish-writer-historical-review-v10"
PREFIX="editorial-corpus-v2/fineweb-metadata"
FIELDS=("url","date","language_score","fasttext_clean_score")
N=203
WIKI={"tr.wikipedia.org","tr.wikibooks.org","tr.wikisource.org","tr.wikinews.org","tr.wikivoyage.org","tr.wikiversity.org"}
def row_counts(rows,flat=True):
    counts=C.Counter();years=C.Counter();selected=C.Counter();domains=C.Counter();wiki=C.Counter()
    for row in rows:
        counts["rows"]+=1
        m=row if flat else row.get("metadata")
        if not isinstance(m,dict):counts["invalid_metadata"]+=1;continue
        y=str(m.get("date",""))[:4]
        if not re.fullmatch(r"20\d\d",y):counts["invalid_metadata"]+=1;continue
        years[y]+=1
        try:lang=float(m["language_score"]);quality=float(m["fasttext_clean_score"])
        except (TypeError,KeyError,ValueError):counts["invalid_metadata"]+=1;continue
        if not (math.isfinite(lang) and math.isfinite(quality) and 0<=lang<=1.01 and 0<=quality<=1.01):
            counts["invalid_metadata"]+=1;continue
        if not ("2013"<=y<="2021" and .90<=lang<=1.01 and .80<=quality<=1.01):continue
        try:
            u=urlsplit(m.get("url",""));domain=u.hostname or ""
        except (TypeError,ValueError):counts["invalid_url"]+=1;continue
        if u.scheme not in ("http","https") or u.username or u.password or not domain:
            counts["invalid_url"]+=1;continue
        # Never retain full URLs, user info, raw text or person identifiers.
        counts["metadata_candidates"]+=1;selected[y]+=1;domain=domain.lower().rstrip(".")
        if domain in WIKI:wiki[domain]+=1
        domains[domain]+=1
    return counts,years,selected,domains,wiki
def combine(parts):
    out=[C.Counter() for _ in range(5)]
    for p in parts:
        for i,c in enumerate(p):out[i].update(c)
    return out
def self_test():
    rows=[{"url":"https://tr.wikipedia.org/wiki/Example","date":"2016-01-01","language_score":.95,"fasttext_clean_score":.9},
          {"url":"https://example.com/?secret=x","date":"2020-01-01","language_score":.95,"fasttext_clean_score":1.00001},
          {"url":"https://example.org","date":"2023-01-01","language_score":.95,"fasttext_clean_score":.9}]
    x=row_counts(rows)
    assert x[0]["rows"]==3 and x[0]["metadata_candidates"]==2 and x[4]["tr.wikipedia.org"]==1
    assert "secret" not in json.dumps(x)
    assert row_counts([{"metadata":rows[0]}],False)[0]["metadata_candidates"]==1
    print("FINEWEB_CENSUS_SELF_TEST_COMPLETE",flush=True)
def valid_checkpoint(d,shard):
    return d.get("revision")==REVISION and d.get("shard")==shard and d.get("complete") is True and d.get("row_count",0)>0 and d.get("row_count")==d.get("counts",{}).get("rows") and sum(d.get("years",{}).values())<=d["row_count"]
def main():
    p=argparse.ArgumentParser();p.add_argument("--self-test",action="store_true");p.add_argument("--start",type=int,default=0);p.add_argument("--end",type=int,default=N);a=p.parse_args()
    self_test()
    if a.self_test:return
    if not 0<=a.start<a.end<=N:p.error("bounded shard range required")
    from huggingface_hub import HfApi,HfFileSystem,hf_hub_download
    import pyarrow.parquet as pq
    api=HfApi(token=os.environ["HF_TOKEN"]);fs=HfFileSystem(token=api.token)
    if not api.repo_info(DEST,repo_type="dataset").private:raise RuntimeError("private research destination required")
    paths=set(api.list_repo_files(DEST,repo_type="dataset"))
    for shard in range(a.start,a.end):
        key=f"{PREFIX}/shard-{shard:03d}.json"
        if key in paths:
            d=json.loads(pathlib.Path(hf_hub_download(DEST,key,repo_type="dataset",token=api.token)).read_text())
            if not valid_checkpoint(d,shard):raise RuntimeError("invalid checkpoint")
            print("FINEWEB_RESUME "+json.dumps({"shard":shard,"rows":d["row_count"]}),flush=True)
            continue
        source=f"{REPO}@{REVISION}/data/train-{shard:05d}-of-00203.parquet"
        sums=[C.Counter() for _ in range(5)]
        with fs.open(source,"rb",block_size=4*1024*1024) as f:
            pf=pq.ParquetFile(f)
            cols=pf.schema_arrow.names
            flat=all(k in cols for k in FIELDS)
            if not flat and "metadata" not in cols:raise RuntimeError("unsupported metadata layout")
            for batch in pf.iter_batches(batch_size=16384,columns=list(FIELDS) if flat else ["metadata"]):
                for i,c in enumerate(row_counts(batch.to_pylist(),flat)):sums[i].update(c)
            if sums[0]["rows"]!=pf.metadata.num_rows:raise RuntimeError("incomplete shard")
        counts,years,selected,domains,wiki=sums
        # Retain only aggregate repeated hostnames privately, plus Wikimedia counts.
        # Rare hosts may contain personal names; do not retain them.
        d={"revision":REVISION,"shard":shard,"row_count":counts["rows"],"complete":True,"counts":dict(counts),"years":dict(years),"candidate_years":dict(selected),"repeated_domain_counts":{k:v for k,v in domains.items() if v>=5},"wikimedia_counts":dict(wiki),"thresholds":{"year":[2013,2021],"language":[.90,1.01],"quality":[.80,1.01]},"scope":"all metadata rows in shard, no article text; score range permits upstream float rounding; candidate counts not rights or human quality"}
        assert valid_checkpoint(d,shard)
        raw=json.dumps(d,ensure_ascii=False,sort_keys=True).encode()
        api.upload_file(path_or_fileobj=raw,path_in_repo=key,repo_id=DEST,repo_type="dataset",commit_message=f"FineWeb full metadata census shard {shard:03d}")
        print("FINEWEB_SHARD_COMPLETE "+json.dumps({"shard":shard,"rows":counts["rows"],"candidates":counts["metadata_candidates"],"sha256":hashlib.sha256(raw).hexdigest()}),flush=True)
    print("FINEWEB_RANGE_COMPLETE "+json.dumps({"start":a.start,"end_exclusive":a.end,"revision":REVISION}),flush=True)
if __name__=="__main__":main()
