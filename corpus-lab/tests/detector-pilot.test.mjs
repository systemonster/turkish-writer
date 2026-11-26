import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  validateCases, buildPlan, buildRequest, normalizeResponse, executePilot, sha256,
} from '../detector-pilot.mjs';

const inputText = `${'Kurmacadaki kitabevi bu hafta okurlarıyla buluşuyor. '.repeat(20).trim()} Son.`;
const sample = (id, arm, text = inputText) => ({
  id, pair_id: 'fixture-pair', arm, text, genre: 'fictional_explainer', language: 'tr',
  ownership: 'project-owned', declared_source_type: 'synthetic_ai_original',
  author_type: 'model', source_evidence: 'Synthetic unit-test fixture, not a human control.',
});
const cases = [sample('fixture-raw', 'raw'), sample('fixture-edited', 'edited')];
const response = payload => ({ ok: true, status: 200, json: async () => payload });
const pangramResult = (text = inputText) => ({
  stage: 'STAGE_SUCCESS', text, version: '4.1', prediction_short: 'AI',
  fraction_ai: 1, fraction_ai_assisted: 0, fraction_human: 0,
  windows: [{ text, start_index: 0, end_index: text.length, label: 'AI-Generated',
    confidence: 'High', ai_assistance_score: 1, class_probabilities: [0, 0, 1] }],
});
async function temporary(t) {
  const dir = await mkdtemp(join(tmpdir(), 'turkish-writer-detector-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test('plan preserves declared provenance, flags missing human controls, and never exposes keys or full text', () => {
  const plan = buildPlan(cases, ['pangram'], { PANGRAM_API_KEY: 'secret-only-in-memory' });
  assert.equal(plan.external_scans_completed, 0);
  assert.equal(plan.pairs[0].human_control_present, false);
  assert.match(plan.limitations.join(' '), /false-positive rates cannot be estimated/);
  assert.equal(plan.cases[0].declared_source_type, 'synthetic_ai_original');
  assert.equal(plan.cases[0].text_sha256, sha256(inputText));
  assert.equal(JSON.stringify(plan).includes('secret-only-in-memory'), false);
  assert.equal(plan.cases[0].text, undefined);
});

test('validation rejects relabeled generated human controls and third-party submissions', () => {
  assert.throws(() => validateCases([{ ...cases[0], declared_source_type: 'project_human_original' }, cases[1]]), /cannot be relabeled/);
  assert.throws(() => validateCases([{ ...cases[0], ownership: 'third-party' }, cases[1]]), /project-owned/);
  assert.throws(() => validateCases([{ ...cases[0], source_evidence: '' }, cases[1]]), /provenance must not be guessed/);
});

test('different genres are rejected; unmatched lengths are visible in the plan', () => {
  assert.throws(() => validateCases([cases[0], { ...cases[1], genre: 'poetry' }]), /genre mismatch/);
  const plan = buildPlan([cases[0], { ...cases[1], text: inputText.repeat(2) }], ['pangram'], {});
  assert.equal(plan.pairs[0].length_matched_at_1_25, false);
  assert.match(plan.limitations.join(' '), /differs in length/);
});

test('missing or malformed API data cannot become a zero-AI pass', () => {
  for (const provider of ['pangram', 'originality', 'gptzero']) {
    const record = normalizeResponse(provider, {}, cases[0]);
    assert.equal(record.status, 'incomplete');
    assert.deepEqual(record.document_scores, {});
    assert.equal(record.editorial_quality_verdict, null);
    assert.ok(record.issues.includes('missing_model_version'));
  }
  const malformed = normalizeResponse('pangram', { ...pangramResult(), fraction_ai: 2 }, cases[0]);
  assert.equal(malformed.status, 'incomplete');
  assert.ok(malformed.issues.includes('invalid_fractions'));
});

test('provider-normalized offsets are not silently attached to different original text', () => {
  const analyzed = inputText.replace(' Son.', '\nSon.');
  const record = normalizeResponse('pangram', pangramResult(analyzed), cases[0]);
  assert.equal(record.status, 'completed');
  assert.equal(record.provider_changed_text, true);
  assert.deepEqual(record.spans[0].verified_utf16_offsets, { start: 0, end: analyzed.length });
  assert.equal(record.spans[0].original_utf16_offsets, null);
  assert.equal(record.spans[0].confidence, 'High');
  const broken = pangramResult(analyzed);
  broken.windows[0].end_index -= 1;
  assert.equal(normalizeResponse('pangram', broken, cases[0]).status, 'incomplete');
});

test('provider score semantics and reported versions stay separate', () => {
  const originality = normalizeResponse('originality', { results: {
    properties: { content: inputText },
    ai: { model: 'model-5.0', prediction_label: 'AI', ai_assisted_percent: 92,
      sentences: [{ text: inputText, start_index: 0, end_index: inputText.length, ai_score: 0.92 }] },
  } }, cases[0]);
  const gptzero = normalizeResponse('gptzero', { version: 'test-version', documents: [{
    predicted_class: 'mixed', class_probabilities: { human: 0.1, ai: 0.2, mixed: 0.7 },
    sentences: [{ sentence: inputText, generated_prob: 0.8, highlight_sentence_for_ai: true }],
  }] }, cases[0]);
  assert.equal(originality.status, 'completed');
  assert.equal(gptzero.status, 'completed');
  assert.deepEqual(originality.document_scores, { ai_assisted_percent: 92 });
  assert.deepEqual(gptzero.document_scores, { human: 0.1, ai: 0.2, mixed: 0.7 });
  assert.match(originality.score_semantics, /percentage/);
  assert.match(gptzero.score_semantics, /class probabilities/);
  assert.equal(originality.model_reported, 'model-5.0');
  assert.equal(gptzero.spans[0].highlighted, true);
});

test('requests disable unrequested services and public sharing', () => {
  const pangram = buildRequest('pangram', cases[0]);
  assert.equal(pangram.body.public_dashboard_link, false);
  const originality = buildRequest('originality', cases[0]);
  for (const key of ['check_plagiarism', 'check_facts', 'check_readability', 'check_grammar', 'storeScan']) {
    assert.equal(originality.body[key], false);
  }
  assert.equal(originality.body.check_ai, true);
  assert.equal(originality.body.aiModelVersion, 'model-5.0');
});

test('missing credentials and unverified auto top-up prevent every network request', async t => {
  const outdir = await temporary(t);
  let calls = 0;
  const result = await executePilot(cases, { outdir, providers: ['pangram', 'originality'],
    env: { ORIGINALITY_API_KEY: 'secret' }, fetchImpl: async () => { calls++; throw new Error('must not fetch'); } });
  assert.equal(calls, 0);
  assert.equal(result.external_scans_completed, 0);
  assert.equal(result.complete, false);
  assert.equal(result.records.filter(r => r.status === 'blocked_missing_credential').length, 2);
  assert.equal(result.records.filter(r => r.status === 'blocked_unverified_autotopup_setting').length, 2);
  assert.equal((await readFile(join(outdir, 'results.json'), 'utf8')).includes('secret'), false);
});

test('unknown POST outcome is not resubmitted on rerun and transport secrets do not leak', async t => {
  const outdir = await temporary(t);
  let posts = 0;
  const fetchImpl = async (_url, options) => {
    if (options.method === 'GET') return response({ models: ['pangram-4'] });
    posts++;
    throw new Error('network secret-fixture-key');
  };
  const options = { outdir, providers: ['pangram'], env: { PANGRAM_API_KEY: 'secret-fixture-key' }, fetchImpl };
  const first = await executePilot(cases, options);
  assert.equal(posts, 2);
  assert.equal(first.external_scans_completed, 0);
  const second = await executePilot(cases, options);
  assert.equal(posts, 2);
  assert.ok(second.records.every(r => /previous_request_outcome_unknown/.test(r.reason)));
  for (const filename of await readdir(outdir)) {
    assert.equal((await readFile(join(outdir, filename), 'utf8')).includes('secret-fixture-key'), false);
  }
});

test('saved async tasks resume without another POST and completed raw responses are cached', async t => {
  const outdir = await temporary(t);
  let posts = 0;
  let terminal = false;
  const fetchImpl = async (url, options) => {
    if (url.endsWith('/models')) return response({ models: ['pangram-4'] });
    if (options.method === 'POST') return response({ task_id: `fixture-task-${++posts}` });
    return response(terminal ? pangramResult() : { task_id: url.split('/').at(-1), stage: 'STAGE_RUNNING' });
  };
  const options = { outdir, providers: ['pangram'], env: { PANGRAM_API_KEY: 'test-only-key' }, fetchImpl, pollLimit: 1, pollMs: 0 };
  const first = await executePilot(cases, options);
  assert.equal(first.external_scans_completed, 0);
  assert.equal(posts, 2);
  terminal = true;
  const second = await executePilot(cases, options);
  assert.equal(second.complete, true);
  assert.equal(second.external_scans_completed, 2);
  assert.equal(posts, 2);
  const third = await executePilot(cases, options);
  assert.equal(third.complete, true);
  assert.equal(posts, 2);
  const raw = JSON.parse(await readFile(second.records[0].raw_file, 'utf8'));
  assert.equal(raw.version, '4.1');
  assert.equal(second.records[0].raw_response_sha256, sha256(JSON.stringify(raw)));
});

test('unavailable model catalog prevents paid task creation', async t => {
  const outdir = await temporary(t);
  const methods = [];
  const result = await executePilot(cases, { outdir, providers: ['pangram'], env: { PANGRAM_API_KEY: 'test-only-key' },
    fetchImpl: async (_url, options) => { methods.push(options.method); return response({ models: ['default'] }); } });
  assert.deepEqual(methods, ['GET']);
  assert.ok(result.records.every(r => r.status === 'blocked_model_discovery'));
});
