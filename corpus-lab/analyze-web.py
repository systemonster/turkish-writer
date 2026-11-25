#!/usr/bin/env python3
"""Describe a reviewed corpus without exporting any source prose.

Document length, paragraph count, and sentence size are diagnostics only.
The approximate sentence splitter is not a grammatical analyzer.
"""
import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re
import statistics

WORD = re.compile(r"[^\W\d_]+(?:['’][^\W\d_]+)*", re.UNICODE)
# Deliberately limited fallback; report approximate results.
ABBR = re.compile(r"\b(?:Dr|Prof|Doç|Av|Sn|vb|vs|örn|bkz|No)\.", re.I)

def words(s):
    return WORD.findall(s)

def sentence_lengths(text):
    lengths = []
    for paragraph in re.split(r'\n\s*\n', text):
        protected = ABBR.sub(lambda m: m.group()[:-1] + '\uE000', paragraph)
        protected = re.sub(r'(?<=\d)\.(?=\d)', '\uE000', protected)
        for sentence in re.split(r'(?<=[.!?…])(?:["”’»])?\s+', protected):
            n = len(words(sentence))
            if n:
                lengths.append(n)
    return lengths

def quantiles(values):
    if not values:
        return None
    x = sorted(values)
    return {'min': x[0], 'p25': x[(len(x)-1)*25//100],
            'median': statistics.median(x), 'p75': x[(len(x)-1)*75//100], 'max': x[-1]}

def summarize(rows):
    groups = defaultdict(lambda: {'doc_words': [], 'paragraphs': [], 'sentence_words': [],
                                  'domains': Counter(), 'docs': 0})
    skipped = Counter()
    seen = set()
    for r in rows:
        if r.get('status') != 'editor_verified' or not r.get('rights_evidence') or not r.get('reviewer_id'):
            skipped['not_reviewed_or_no_rights'] += 1
            continue
        text, genre, host = r.get('text'), r.get('genre'), r.get('domain')
        if not all(isinstance(x, str) and x.strip() for x in (text, genre, host)):
            skipped['missing_fields'] += 1
            continue
        digest = hashlib.sha256(' '.join(text.split()).encode('utf-8')).hexdigest()
        if digest in seen:
            skipped['duplicate'] += 1
            continue
        seen.add(digest)
        g = groups[genre]
        g['docs'] += 1
        g['domains'][host] += 1
        g['doc_words'].append(len(words(text)))
        g['paragraphs'].append(len([p for p in re.split(r'\n\s*\n', text) if p.strip()]))
        g['sentence_words'].extend(sentence_lengths(text))
    return {'schema': 1, 'method': 'heuristic sentence boundaries; Unicode letter tokens; descriptive, not rules',
            'skipped': dict(skipped), 'genres': {k: {
                'documents': v['docs'], 'domain_count': len(v['domains']),
                'document_words': quantiles(v['doc_words']),
                'paragraph_count': quantiles(v['paragraphs']),
                'approximate_sentence_words': quantiles(v['sentence_words']),
                'approximate_sentence_count': len(v['sentence_words'])
            } for k, v in sorted(groups.items())}}

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('reviewed_jsonl')
    p.add_argument('report_json')
    args = p.parse_args()
    inp, out = Path(args.reviewed_jsonl), Path(args.report_json)
    with inp.open(encoding='utf-8') as f:
        report = summarize(json.loads(line) for line in f if line.strip())
    if not report['genres']:
        p.error('No editor-verified, rights-documented documents.')
    report['source_file_sha256'] = hashlib.sha256(inp.read_bytes()).hexdigest()
    with out.open('x', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
        f.write('\n')

if __name__ == '__main__':
    main()
