#!/usr/bin/env python3
"""Bounded developer-only sample from the Mogan dataset, explicit permissions required."""
import argparse, hashlib, json, re
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit

def domain(url):
    try:
        p = urlsplit(url)
        if p.scheme not in ('http', 'https') or p.username or p.password or not p.hostname:
            return ''
        return p.hostname.lower()
    except ValueError:
        return ''

def permitted(url, approvals):
    # Prefixes are exact-host/path prefixes; require a trailing slash (or full URL).
    try:
        p = urlsplit(url)
        if not domain(url):
            return None
        for a in approvals:
            q = urlsplit(a['url_prefix'])
            if not domain(a['url_prefix']) or q.query or q.fragment:
                continue
            if p.scheme == q.scheme and p.netloc.lower() == q.netloc.lower() and (p.path == q.path or (q.path.endswith('/') and p.path.startswith(q.path))):
                return a
    except (ValueError, KeyError, TypeError):
        pass
    return None

def candidate(row, approvals):
    m = row.get('metadata')
    if not isinstance(m, dict):
        return None, 'metadata'
    url = m.get('url')
    if not isinstance(url, str):
        return None, 'url'
    a = permitted(url, approvals)
    if a is None:
        return None, 'unapproved_source'
    date = str(m.get('date', ''))
    if not re.match(r'^20\d{2}-\d{2}-\d{2}', date) or not '2013' <= date[:4] <= '2017':
        return None, 'crawl_date'
    try:
        lang, quality = float(m['language_score']), float(m['fasttext_clean_score'])
        if not 0.90 <= lang <= 1 or not 0.80 <= quality <= 1:
            return None, 'scores'
    except (KeyError, TypeError, ValueError):
        return None, 'scores'
    text = row.get('text')
    if not isinstance(text, str) or not 300 <= len(text.split()) <= 3000:
        return None, 'length'
    digest = hashlib.sha256(' '.join(text.split()).encode('utf-8')).hexdigest()
    return {'id': row.get('id'), 'url': url, 'crawl_date': date, 'publication_date': None,
            'domain': domain(url), 'genre': a['genre'], 'rights': a['rights'],
            'rights_evidence': a['evidence'], 'language_score': lang, 'quality_score': quality,
            'sha256': digest, 'text': text, 'status': 'candidate_not_editor_verified'}, None

def sample(rows, approvals, limit, scan_limit, per_domain, write):
    seen, domains, skipped = set(), Counter(), Counter()
    scanned = accepted = 0
    from itertools import islice
    for row in islice(rows, scan_limit):
        scanned += 1
        c, why = candidate(row, approvals)
        if c is None:
            skipped[why] += 1
            continue
        if c['sha256'] in seen:
            skipped['duplicate'] += 1
            continue
        if domains[c['domain']] >= per_domain:
            skipped['domain_cap'] += 1
            continue
        seen.add(c['sha256'])
        domains[c['domain']] += 1
        write(c)
        accepted += 1
        if accepted >= limit:
            break
    return {'scanned': scanned, 'accepted': accepted, 'domains': dict(domains), 'skipped': dict(skipped)}

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--approvals', required=True)
    p.add_argument('--revision', required=True, help='Pinned 40-character HF git commit')
    p.add_argument('--out', required=True)
    p.add_argument('--limit', type=int, default=500)
    p.add_argument('--scan-limit', type=int, default=100000)
    p.add_argument('--per-domain', type=int, default=50)
    args = p.parse_args()
    if not re.fullmatch(r'[0-9a-f]{40}', args.revision):
        p.error('Use an exact dataset commit.')
    if min(args.limit, args.scan_limit, args.per_domain) < 1:
        p.error('Positive limits required.')
    approvals = json.loads(Path(args.approvals).read_text(encoding='utf-8'))['approved_sources']
    if not approvals or any(not all(isinstance(a.get(k), str) and a[k].strip() for k in ('url_prefix','rights','evidence','genre')) for a in approvals):
        p.error('Explicit documented source approvals required; example does not grant rights.')
    if any(not domain(a['url_prefix']) or urlsplit(a['url_prefix']).query or urlsplit(a['url_prefix']).fragment for a in approvals):
        p.error('Invalid approval URLs.')
    out = Path(args.out).resolve()
    work = (Path(__file__).resolve().parent / 'work').resolve()
    if work not in out.parents:
        p.error('Raw samples must stay in corpus-lab/work/.')
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        p.error('Output already exists.')
    from datasets import load_dataset
    rows = load_dataset('moganai/turkishfineweb2-cleaned', split='train', streaming=True, revision=args.revision)
    with out.open('x', encoding='utf-8') as h:
        report = sample(rows, approvals, args.limit, args.scan_limit, args.per_domain,
                        lambda r: h.write(json.dumps(r, ensure_ascii=False) + '\n'))
    report['revision'] = args.revision
    report['thresholds'] = {'language': .90, 'quality': .80, 'crawl_years': [2013,2017], 'words': [300,3000], 'per_domain': args.per_domain}
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
