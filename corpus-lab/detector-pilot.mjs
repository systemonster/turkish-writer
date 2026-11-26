#!/usr/bin/env node
/** Optional authorship diagnostics. Never an editorial-quality or release gate. */
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

export const PROVIDERS = Object.freeze({
  pangram: {
    key: 'PANGRAM_API_KEY',
    base: 'https://text.external-api.pangram.com',
    model: 'pangram-4',
    docs: 'https://docs.pangram.com/api-reference/ai-detection',
  },
  originality: {
    key: 'ORIGINALITY_API_KEY',
    base: 'https://api.originality.ai/api/v3',
    model: 'model-5.0',
    docs: 'https://docs.originality.ai/',
  },
  gptzero: {
    key: 'GPTZERO_API_KEY',
    base: 'https://api.gptzero.me',
    model: null,
    docs: 'https://docs.gptzero.me/api-reference/',
  },
});

const SOURCE_TYPES = new Set(['synthetic_ai_original', 'synthetic_ai_edited', 'project_human_original']);
export const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');
export const wordCount = text => text.trim().split(/\s+/u).filter(Boolean).length;
const now = () => new Date().toISOString();
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,95}$/.test(value);
const isNumber = value => typeof value === 'number' && Number.isFinite(value);
const probability = value => isNumber(value) && value >= 0 && value <= 1;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exists = async path => { try { await access(path); return true; } catch { return false; } };
const json = value => JSON.stringify(value, null, 2) + '\n';

export function validateCases(cases) {
  if (!Array.isArray(cases) || cases.length === 0) throw new Error('A nonempty case array is required.');
  const ids = new Set();
  const pairs = new Map();
  for (const item of cases) {
    if (!object(item)) throw new Error('Every case must be an object.');
    for (const field of ['id', 'pair_id', 'arm']) {
      if (!validId(item[field])) throw new Error(`Invalid ${field}.`);
    }
    if (ids.has(item.id)) throw new Error(`Duplicate case id: ${item.id}`);
    ids.add(item.id);
    if (item.language !== 'tr') throw new Error(`${item.id}: this pilot requires language=tr.`);
    if (typeof item.genre !== 'string' || !item.genre.trim()) throw new Error(`${item.id}: genre required.`);
    if (item.ownership !== 'project-owned') throw new Error(`${item.id}: project-owned text required.`);
    if (!SOURCE_TYPES.has(item.declared_source_type)) throw new Error(`${item.id}: declared_source_type required.`);
    if (typeof item.source_evidence !== 'string' || !item.source_evidence.trim()) {
      throw new Error(`${item.id}: source_evidence required; provenance must not be guessed.`);
    }
    if (item.declared_source_type === 'project_human_original' && item.author_type !== 'human') {
      throw new Error(`${item.id}: a generated passage cannot be relabeled as a human control.`);
    }
    if (item.declared_source_type.startsWith('synthetic_ai_') && item.author_type !== 'model') {
      throw new Error(`${item.id}: generated texts must declare author_type=model.`);
    }
    if (typeof item.text !== 'string' || wordCount(item.text) < 100) {
      throw new Error(`${item.id}: at least 100 whitespace-delimited words required for the common pilot.`);
    }
    if (item.text.length > 50000) throw new Error(`${item.id}: pilot input exceeds 50,000 characters.`);
    const pair = pairs.get(item.pair_id) ?? [];
    if (pair.some(other => other.arm === item.arm)) throw new Error(`${item.pair_id}: duplicate arm.`);
    pair.push(item);
    pairs.set(item.pair_id, pair);
  }
  return [...pairs].map(([pair_id, members]) => {
    if (members.length < 2) throw new Error(`${pair_id}: comparison requires at least two arms.`);
    if (new Set(members.map(item => item.genre)).size !== 1) throw new Error(`${pair_id}: genre mismatch.`);
    const counts = members.map(item => wordCount(item.text));
    const ratio = Math.max(...counts) / Math.min(...counts);
    return {
      pair_id, genre: members[0].genre,
      arms: members.map(item => item.arm),
      word_counts: Object.fromEntries(members.map(item => [item.arm, wordCount(item.text)])),
      length_ratio: ratio, length_matched_at_1_25: ratio <= 1.25,
      human_control_present: members.some(item => item.declared_source_type === 'project_human_original'),
    };
  });
}

export function buildPlan(cases, providers = ['pangram', 'originality'], env = process.env) {
  const pairs = validateCases(cases);
  if (!providers.length || new Set(providers).size !== providers.length || providers.some(p => !PROVIDERS[p])) {
    throw new Error('Choose distinct supported providers.');
  }
  return {
    schema_version: 1, mode: 'plan', external_scans_completed: 0, created_at: now(),
    purpose: 'Diagnostic authorship signals; no editorial-quality threshold and no release decision.',
    case_count: cases.length, pair_count: pairs.length, pairs,
    total_words_per_provider: cases.reduce((n, item) => n + wordCount(item.text), 0),
    providers: providers.map(provider => ({
      provider, credential_available: Boolean(env[PROVIDERS[provider].key]),
      status: env[PROVIDERS[provider].key] ? 'ready_for_explicit_execution' : 'blocked_missing_credential',
      model_requested: PROVIDERS[provider].model, docs: PROVIDERS[provider].docs,
    })),
    cases: cases.map(({ text, ...item }) => ({ ...item, text_sha256: sha256(text), words: wordCount(text) })),
    limitations: [
      'A detector score is not evidence of editing quality, truthfulness, or semantic fidelity.',
      'Do not average scores across providers or model versions.',
      ...(pairs.some(p => !p.human_control_present) ? ['No verified human control in at least one pair; false-positive rates cannot be estimated.'] : []),
      ...(pairs.some(p => !p.length_matched_at_1_25) ? ['At least one pair differs in length by more than 25%; analyze that confound separately.'] : []),
    ],
  };
}

function numericFields(value, fields) {
  return Object.fromEntries(fields.filter(key => isNumber(value?.[key])).map(key => [key, value[key]]));
}

function spanRecord(span, basis, original, scores, label) {
  const start = span.start_index;
  const end = span.end_index;
  const text = typeof span.text === 'string' ? span.text : null;
  const valid = Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end > start &&
    end <= basis.length && text !== null && basis.slice(start, end) === text;
  return {
    text, label: typeof label === 'string' ? label : null, scores,
    confidence: typeof span.confidence === 'string' ? span.confidence : null,
    provider_start: start ?? null, provider_end: end ?? null,
    coordinate_basis: 'provider_returned_text',
    verified_utf16_offsets: valid ? { start, end } : null,
    original_utf16_offsets: valid && basis === original ? { start, end } : null,
    exact_span_binding: valid,
  };
}

/** Preserve provider-native semantics. Missing/malformed payloads never become zero-AI passes. */
export function normalizeResponse(provider, raw, item, modelRequested = PROVIDERS[provider]?.model) {
  if (!PROVIDERS[provider] || !object(raw)) throw new Error('Unsupported provider or non-object response.');
  let basis = null;
  let model = null;
  let label = null;
  let scores = {};
  let spans = [];
  let semantics = '';
  const issues = [];

  if (provider === 'pangram') {
    if (raw.stage !== 'STAGE_SUCCESS') issues.push(`non_success_stage:${raw.stage ?? 'missing'}`);
    basis = typeof raw.text === 'string' ? raw.text : null;
    model = typeof raw.version === 'string' && raw.version ? raw.version : null;
    label = typeof raw.prediction_short === 'string' ? raw.prediction_short : null;
    scores = numericFields(raw, ['fraction_ai', 'fraction_ai_assisted', 'fraction_human']);
    if (Object.keys(scores).length !== 3 || !Object.values(scores).every(probability) ||
        Math.abs(Object.values(scores).reduce((a, b) => a + b, 0) - 1) > 0.025) issues.push('invalid_fractions');
    semantics = 'Character-weighted fractions classified as AI, AI-assisted, and human; not editorial quality.';
    if (!Array.isArray(raw.windows) || !raw.windows.length) issues.push('missing_spans');
    else spans = raw.windows.map(span => spanRecord(span, basis ?? '', item.text, {
      ...numericFields(span, ['ai_assistance_score', 'humanizer_score']),
      ...(Array.isArray(span.class_probabilities) ? { class_probabilities: span.class_probabilities } : {}),
    }, span.label));
  } else if (provider === 'originality') {
    const results = raw.results;
    const ai = results?.ai;
    if (!object(ai) || ai.error) issues.push('missing_or_failed_ai_result');
    basis = typeof results?.properties?.content === 'string' ? results.properties.content : null;
    model = typeof ai?.model === 'string' && ai.model ? ai.model : null;
    label = typeof ai?.prediction_label === 'string' ? ai.prediction_label : null;
    scores = numericFields(ai, ['ai_assisted_percent']);
    if (!isNumber(scores.ai_assisted_percent) || scores.ai_assisted_percent < 0 || scores.ai_assisted_percent > 100) {
      issues.push('missing_or_invalid_ai_assisted_percent');
    }
    if (model && !['model-5.0', 'model-5.0-max'].includes(model)) issues.push('unsupported_score_semantics_for_model');
    semantics = 'Originality 5.x estimated percentage of AI involvement, not the legacy confidence score.';
    if (!Array.isArray(ai?.sentences) || !ai.sentences.length) issues.push('missing_spans');
    else spans = ai.sentences.map(span => spanRecord(span, basis ?? '', item.text,
      numericFields(span, ['ai_score']), null));
  } else {
    const docs = raw.documents;
    if (!Array.isArray(docs) || docs.length !== 1) issues.push('expected_one_document');
    const doc = docs?.[0] ?? {};
    model = typeof raw.version === 'string' && raw.version ? raw.version : null;
    label = typeof doc.predicted_class === 'string' ? doc.predicted_class : null;
    scores = numericFields(doc.class_probabilities, ['human', 'ai', 'mixed']);
    if (Object.keys(scores).length !== 3 || !Object.values(scores).every(probability) ||
        Math.abs(Object.values(scores).reduce((a, b) => a + b, 0) - 1) > 0.025) issues.push('invalid_class_probabilities');
    semantics = 'GPTZero document class probabilities (human/AI/mixed); not percentages of text or quality.';
    basis = item.text;
    if (!Array.isArray(doc.sentences) || !doc.sentences.length) issues.push('missing_spans');
    else {
      let cursor = 0;
      spans = doc.sentences.map(sentence => {
        const text = typeof sentence.sentence === 'string' ? sentence.sentence : '';
        const start = text ? basis.indexOf(text, cursor) : -1;
        const end = start >= 0 ? start + text.length : -1;
        if (start >= 0) cursor = end;
        return {
          ...spanRecord({ text, start_index: start, end_index: end }, basis, item.text,
            numericFields(sentence, ['generated_prob']), null),
          coordinate_basis: 'sequential_exact_match_to_submitted_text',
          highlighted: typeof sentence.highlight_sentence_for_ai === 'boolean' ? sentence.highlight_sentence_for_ai : null,
        };
      });
    }
  }
  if (!model) issues.push('missing_model_version');
  if (!label) issues.push('missing_classification');
  if (basis === null) issues.push('missing_analyzed_text');
  if (spans.some(span => !span.exact_span_binding)) issues.push('unverified_span_offsets');
  return {
    schema_version: 1, provider, case_id: item.id, pair_id: item.pair_id, arm: item.arm,
    genre: item.genre, language: item.language, declared_source_type: item.declared_source_type,
    status: issues.length ? 'incomplete' : 'completed', issues,
    observed_at: now(), model_requested: modelRequested, model_reported: model,
    input_sha256: sha256(item.text), input_words: wordCount(item.text),
    analyzed_text: basis, analyzed_text_sha256: basis === null ? null : sha256(basis),
    provider_changed_text: basis === null ? null : basis !== item.text,
    classification: label, document_scores: scores, score_semantics: semantics, spans,
    raw_response_sha256: sha256(JSON.stringify(raw)),
    editorial_quality_verdict: null,
  };
}

/** Reads only explicit provider environment variables. Never returns credentials. */
export function buildRequest(provider, item, model = PROVIDERS[provider]?.model) {
  if (!PROVIDERS[provider]) throw new Error('Unsupported provider.');
  if (provider === 'pangram') return {
    path: '/task', body: { text: item.text, model, public_dashboard_link: false },
  };
  if (provider === 'originality') return {
    path: '/scan', body: {
      title: `Turkish Writer diagnostic ${item.id}`, content: item.text,
      check_ai: true, check_plagiarism: false, check_facts: false,
      check_readability: false, check_grammar: false, storeScan: false,
      aiModelVersion: model,
    },
  };
  return { path: '/v2/predict/text', body: { document: item.text, ...(model ? { modelVersion: model } : {}) } };
}

async function providerJson(provider, path, key, body, fetchImpl) {
  const config = PROVIDERS[provider];
  const authHeader = provider === 'originality' ? 'X-OAI-API-KEY' : 'x-api-key';
  let response;
  try {
    response = await fetchImpl(config.base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { [authHeader]: key, 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      redirect: 'error', signal: AbortSignal.timeout(45000),
    });
  } catch {
    throw new Error('transport_failed; request may have been accepted; no automatic POST retry');
  }
  if (!response.ok) throw new Error(`provider_http_${response.status}; no automatic POST retry`);
  try { return await response.json(); } catch { throw new Error('provider_returned_invalid_json'); }
}

/** Execute an authorized pilot or emit a truthful blocked result without contacting vendors. */
export async function executePilot(cases, {
  providers = ['pangram', 'originality'], outdir, env = process.env,
  fetchImpl = globalThis.fetch, originalityAutoTopupDisabled = false,
  models = {}, pollMs = 2000, pollLimit = 30,
} = {}) {
  const plan = buildPlan(cases, providers, env);
  if (!outdir) throw new Error('outdir required.');
  await mkdir(outdir, { recursive: true });
  const planPath = join(outdir, 'plan.json');
  if (await exists(planPath)) {
    const old = JSON.parse(await readFile(planPath, 'utf8'));
    if (JSON.stringify(old.cases) !== JSON.stringify(plan.cases)) {
      throw new Error('Output directory belongs to different inputs; choose a new directory.');
    }
  } else await writeFile(planPath, json(plan), { flag: 'wx' });
  const records = [];
  for (const provider of providers) {
    const key = env[PROVIDERS[provider].key];
    const model = models[provider] ?? PROVIDERS[provider].model;
    if (!key || (provider === 'originality' && !originalityAutoTopupDisabled)) {
      const reason = !key ? 'blocked_missing_credential' : 'blocked_unverified_autotopup_setting';
      for (const item of cases) records.push({ provider, case_id: item.id, pair_id: item.pair_id, arm: item.arm,
        status: reason, model_requested: model, input_sha256: sha256(item.text), external_request_submitted: false });
      continue;
    }
    if (provider === 'pangram') {
      try {
        const catalog = await providerJson(provider, '/models', key, undefined, fetchImpl);
        if (!Array.isArray(catalog.models) || !catalog.models.includes(model)) throw new Error('requested_model_unavailable');
        await writeFile(join(outdir, 'pangram-model-catalog.json'), json(catalog));
      } catch (error) {
        for (const item of cases) records.push({ provider, case_id: item.id, status: 'blocked_model_discovery',
          reason: error.message, external_request_submitted: false });
        continue;
      }
    }
    for (const item of cases) {
      const stem = `${provider}-${item.id}-${sha256(`${item.text}\n${model ?? ''}`).slice(0, 12)}`;
      const rawPath = join(outdir, `${stem}.raw.json`);
      const startedPath = join(outdir, `${stem}.submitted.json`);
      const taskPath = join(outdir, `${stem}.task.json`);
      let raw;
      try {
        if (await exists(rawPath)) {
          raw = JSON.parse(await readFile(rawPath, 'utf8'));
        } else if (provider === 'pangram' && await exists(taskPath)) {
          const task = JSON.parse(await readFile(taskPath, 'utf8'));
          raw = { task_id: task.task_id };
        } else {
          if (await exists(startedPath)) throw new Error('previous_request_outcome_unknown; inspect provider before any resubmission');
          const request = buildRequest(provider, item, model);
          await writeFile(startedPath, json({ provider, case_id: item.id, input_sha256: sha256(item.text),
            model_requested: model, submitted_at: now() }), { flag: 'wx' });
          raw = await providerJson(provider, request.path, key, request.body, fetchImpl);
          if (provider === 'pangram') {
            if (typeof raw.task_id !== 'string' || !/^[A-Za-z0-9_-]+$/.test(raw.task_id)) throw new Error('missing_or_invalid_task_id');
            await writeFile(taskPath, json(raw), { flag: 'wx' });
          }
        }
        if (provider === 'pangram' && raw.stage !== 'STAGE_SUCCESS' && raw.stage !== 'STAGE_FAILED') {
          const taskId = raw.task_id;
          if (typeof taskId !== 'string' || !/^[A-Za-z0-9_-]+$/.test(taskId)) throw new Error('invalid_saved_task_id');
          for (let attempt = 0; attempt < pollLimit; attempt++) {
            raw = await providerJson(provider, `/task/${taskId}`, key, undefined, fetchImpl);
            if (['STAGE_SUCCESS', 'STAGE_FAILED'].includes(raw.stage)) break;
            await new Promise(done => setTimeout(done, pollMs));
          }
          if (!['STAGE_SUCCESS', 'STAGE_FAILED'].includes(raw.stage)) throw new Error('task_pending; saved_task_can_be_resumed_without_resubmission');
        }
        if (!await exists(rawPath)) await writeFile(rawPath, json(raw), { flag: 'wx' });
        records.push({ ...normalizeResponse(provider, raw, item, model), raw_file: rawPath, external_request_submitted: true });
      } catch (error) {
        records.push({ provider, case_id: item.id, pair_id: item.pair_id, arm: item.arm,
          input_sha256: sha256(item.text), status: 'failed_or_pending', reason: error.message,
          model_requested: model, external_request_submitted: await exists(startedPath) });
      }
    }
  }
  const summary = {
    schema_version: 1, mode: 'execution', observed_at: now(),
    external_scans_completed: records.filter(record => record.status === 'completed').length,
    expected_scans: providers.length * cases.length,
    complete: records.length === providers.length * cases.length && records.every(record => record.status === 'completed'),
    records, limitations: plan.limitations,
    editorial_quality_verdict: null,
  };
  await writeFile(join(outdir, 'results.json'), json(summary));
  return summary;
}

async function main() {
  const { values } = parseArgs({ options: {
    input: { type: 'string' }, out: { type: 'string' }, providers: { type: 'string', default: 'pangram,originality' },
    execute: { type: 'boolean', default: false }, 'max-words': { type: 'string', default: '20000' },
    'originality-autotopup-disabled': { type: 'boolean', default: false }, help: { type: 'boolean' },
  }});
  if (values.help) {
    console.log('node corpus-lab/detector-pilot.mjs --input cases.jsonl --out results/detector-pilot [--execute] [--providers pangram,originality,gptzero]');
    return;
  }
  if (!values.input || !values.out) throw new Error('--input and --out required.');
  const cases = (await readFile(resolve(values.input), 'utf8')).split(/\r?\n/u).filter(line => line.trim()).map(line => JSON.parse(line));
  const providers = values.providers.split(',');
  const plan = buildPlan(cases, providers);
  const limit = Number(values['max-words']);
  if (!Number.isInteger(limit) || limit < 1 || plan.total_words_per_provider > limit) throw new Error('Invalid or exceeded --max-words budget.');
  const outdir = resolve(values.out);
  if (!values.execute) {
    await mkdir(outdir, { recursive: true });
    await writeFile(join(outdir, 'plan.json'), json(plan), { flag: 'wx' });
    console.log(json({ mode: 'plan', external_scans_completed: 0, outdir, providers: plan.providers }));
    return;
  }
  const result = await executePilot(cases, { providers, outdir,
    originalityAutoTopupDisabled: values['originality-autotopup-disabled'] });
  console.log(json({ mode: 'execution', complete: result.complete,
    external_scans_completed: result.external_scans_completed, expected_scans: result.expected_scans, outdir,
    status_counts: result.records.reduce((counts, record) => ({ ...counts, [record.status]: (counts[record.status] ?? 0) + 1 }), {}) }));
  if (!result.complete) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
