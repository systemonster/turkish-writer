import test from 'node:test';
import assert from 'node:assert/strict';
import {validateHoldout} from '../validate-holdout.mjs';
const a={
  "id": "a",
  "source_group": "s1",
  "author_group": "a1",
  "topic_group": "t1",
  "source_url": "https://example.invalid/a",
  "rights_evidence": "synthetic fixture",
  "reviewer_id": "fixture-not-a-real-review",
  "source_sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "split": "development",
  "review_status": "editor_verified",
  "paragraphs": 3,
  "words": 200
};
const b={
  "id": "b",
  "source_group": "s2",
  "author_group": "a2",
  "topic_group": "t2",
  "source_url": "https://example.invalid/a",
  "rights_evidence": "synthetic fixture",
  "reviewer_id": "fixture-not-a-real-review",
  "source_sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "split": "test",
  "review_status": "editor_verified",
  "paragraphs": 3,
  "words": 200
};
// These are fabricated schema fixtures, not reviewed samples.
test('separate groups',()=>assert.equal(validateHoldout([a,b]).valid,true));
for(const key of ['source_group','author_group','topic_group','source_sha256'])test('reject '+key+' leakage',()=>assert.equal(validateHoldout([a,{...b,[key]:a[key]}]).valid,false));
test('reject unreviewed row',()=>assert.equal(validateHoldout([a,{...b,review_status:'candidate'}]).valid,false));
test('reject short text',()=>assert.equal(validateHoldout([a,{...b,words:100}]).valid,false));
test('reject absent test partition',()=>assert.equal(validateHoldout([a]).valid,false));
test('reject empty inventory',()=>assert.equal(validateHoldout([]).valid,false));
