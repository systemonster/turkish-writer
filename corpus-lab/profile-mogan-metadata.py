#!/usr/bin/env python3
"""Metadata-only systematic sample of the pinned TurkishFineweb2 release."""
import argparse
import collections
import json
import re
from urllib.parse import urlsplit

REVISION="7c5bd76fa456f1748ceb603d8e57acf24a173339"
REPO="datasets/moganai/turkishfineweb2-cleaned"
FIELDS=("url","date","language_score","fasttext_clean_score")
WIKI={"tr.wikipedia.org","tr.wikibooks.org","tr.wikisource.org","tr.wikinews.org","tr.wikivoyage.org","tr.wikiversity.org"}
SHARDS=[0,22,45,67,90,112,135,157,180,202]

def run(per_shard):
    from huggingface_hub import HfFileSystem
    import pyarrow.parquet as pq
    fs=HfFileSystem()
    years=collections.Counter(); eligible_years=collections.Counter()
    domains=collections.Counter(); wiki=collections.Counter()
    invalid=0; reports=[]
    for shard in SHARDS:
        path=f"{REPO}@{REVISION}/data/train-{shard:05d}-of-00203.parquet"
        count=eligible=0
        with fs.open(path,"rb",block_size=4*1024*1024) as f:
            pf=pq.ParquetFile(f)
            cols=pf.schema_arrow.names
            flat=all(k in cols for k in FIELDS)
            if not flat and "metadata" not in cols:
                raise ValueError("Unsupported schema: "+str(cols))
            selected=list(FIELDS) if flat else ["metadata"]
            for batch in pf.iter_batches(batch_size=8192,columns=selected):
                for row in batch.to_pylist():
                    if count>=per_shard:break
                    count+=1
                    m=row if flat else row.get("metadata")
                    if not isinstance(m,dict):
                        invalid+=1;continue
                    y=str(m.get("date",""))[:4]
                    if not re.fullmatch(r"20\d\d",y):
                        invalid+=1;continue
                    years[y]+=1
                    try:
                        lang=float(m["language_score"]); quality=float(m["fasttext_clean_score"])
                    except (TypeError,KeyError,ValueError):
                        invalid+=1;continue
                    if not ("2013"<=y<="2017" and .90<=lang<=1 and .80<=quality<=1):continue
                    try:
                        url=urlsplit(m.get("url",""))
                        domain=url.hostname or ""
                    except (ValueError,TypeError):continue
                    if url.scheme not in ("http","https") or url.username or url.password or not domain:continue
                    domain=domain.lower()
                    eligible+=1;eligible_years[y]+=1;domains[domain]+=1
                    if domain in WIKI:wiki[domain]+=1
                if count>=per_shard:break
        if count==0:raise ValueError("Unexpected empty sample")
        reports.append({"shard":shard,"scanned":count,"eligible_metadata":eligible,"layout":"flat" if flat else "nested"})
        print("PROGRESS "+json.dumps({"shard":shard,"rows":sum(x["scanned"] for x in reports),"eligible":sum(eligible_years.values())}),flush=True)
    if not years or invalid>sum(r["scanned"] for r in reports)/2:
        raise ValueError("Metadata schema/date validation failed")
    return {"schema":1,"source":"https://huggingface.co/datasets/moganai/turkishfineweb2-cleaned","revision":REVISION,"scope":"metadata-only systematic shard-prefix pilot, not a representative sample or editorial quality measurement; no document text or full URLs collected","shards":reports,"rows":sum(r["scanned"] for r in reports),"invalid_metadata":invalid,"crawl_years":dict(sorted(years.items())),"eligible_years":dict(sorted(eligible_years.items())),"thresholds":{"crawl_years":[2013,2017],"language":.90,"quality":.80},"eligible_domain_count":len(domains),"most_common_domains":domains.most_common(30),"wikimedia_domain_counts":dict(wiki),"human_verified":0}

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--per-shard",type=int,default=10000)
    a=p.parse_args()
    if not 1<=a.per_shard<=200000:p.error("per-shard 1–200000")
    print("PROFILE_RESULT "+json.dumps(run(a.per_shard),ensure_ascii=False),flush=True)
