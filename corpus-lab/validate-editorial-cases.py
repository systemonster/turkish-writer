#!/usr/bin/env python3
"""Validate independently reviewed edit pairs; group splits by source.

Structural validation does not establish editorial quality or factual fidelity.
No model is asked to infer the reason for a real edit.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path

DECISIONS = {'keep', 'edit', 'conditional'}
CATEGORIES = {'syntax', 'word_choice', 'collocation', 'flow', 'repetition',
              'register', 'spelling', 'meaning', 'structure', 'keep'}

def split_for(group):
    # Stable source-group holdout; never split near-duplicates across arms by row.
    h = int(hashlib.sha256(group.encode('utf-8')).hexdigest()[:8], 16) % 100
    return 'development' if h < 70 else 'validation' if h < 85 else 'test'

def validate(rows):
    seen_ids, text_groups, counts, errors = set(), {}, Counter(), []
    for i, r in enumerate(rows, 1):
        issues = []
        required = ('id', 'source_group', 'source_url', 'rights_evidence', 'reviewer_id',
                    'before', 'after', 'reason', 'genre')
        if not all(isinstance(r.get(k), str) and r[k].strip() for k in required):
            issues.append('missing required string')
        if r.get('status') != 'editor_verified':
            issues.append('missing human review')
        if r.get('decision') not in DECISIONS:
            issues.append('invalid decision')
        if r.get('decision') == 'keep' and r.get('before') != r.get('after'):
            issues.append('keep changed')
        if r.get('decision') == 'edit' and r.get('before') == r.get('after'):
            issues.append('edit unchanged')
        cats = r.get('categories')
        if not isinstance(cats, list) or not cats or any(c not in CATEGORIES for c in cats):
            issues.append('invalid categories')
        protected = r.get('protected', [])
        if not isinstance(protected, list) or any(not isinstance(s, str) or not s.strip() for s in protected):
            issues.append('invalid protected list')
        elif isinstance(r.get('before'), str) and isinstance(r.get('after'), str):
            if any(s not in r['before'] or s not in r['after'] for s in protected):
                issues.append('protected phrase absent or lost')
        rid = r.get('id')
        if isinstance(rid, str):
            if rid in seen_ids:
                issues.append('duplicate id')
            seen_ids.add(rid)
        if not issues:
            group = r['source_group']
            for key in ('before', 'after'):
                digest = hashlib.sha256(' '.join(r[key].split()).encode('utf-8')).hexdigest()
                if digest in text_groups and text_groups[digest] != group:
                    issues.append('identical text in multiple source groups')
                text_groups[digest] = group
        if issues:
            errors.append({'line': i, 'errors': issues})
        else:
            counts[split_for(r['source_group'])] += 1
    return {'valid': not errors, 'counts': dict(counts), 'errors': errors,
            'scope': 'structural validation; human reviewer must verify fidelity and rights'}

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('jsonl')
    args = p.parse_args()
    with Path(args.jsonl).open(encoding='utf-8') as f:
        result = validate(json.loads(line) for line in f if line.strip())
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result['valid'] and result['counts'] else 1

if __name__ == '__main__':
    raise SystemExit(main())
