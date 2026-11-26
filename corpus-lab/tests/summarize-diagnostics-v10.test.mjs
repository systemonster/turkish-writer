import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {summarizeDiagnostics, readResultLines} from '../summarize-diagnostics-v10.mjs';
import {buildJudgePayload} from '../diagnostic-metrics.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const semanticAll = readFileSync(new URL('../semantic-mutations-v10.jsonl', import.meta.url), 'utf8').trim().split('\n').map(JSON.parse);
const pythonPayload = value => '{' + Object.entries(value).map(([key, text]) => JSON.stringify(key) + ': ' + JSON.stringify(text)).join(', ') + '}';

function fixture() {
  const documents = [{id: 'doc', pair_id: 'pair', arm: 'source_clean', decision: 'keep', source: 'Kaba 5 ml su kondu. Kap rafa kaldırıldı.', protected_literals: ['5 ml'], protected_facts: ['Miktar 5 ml.'], seeded_defects: []}];
  const semanticFixtures = [semanticAll[0], semanticAll[16]];
  const briefs = [{id: 'brief', pair_id: 'brief-pair', style_variant: 'neutral', brief: '650–900 sözcük yaz. Kaba 5 ml su kondu.', facts: ['Kaba 5 ml su kondu.']}];
  const tasks = [];
  const add = (id, kind, arm, sourceId, payload, extra = {}) => {
    const user = payload === '' ? '' : JSON.stringify(payload);
    tasks.push({id, kind, arm, source_id: sourceId, user, source_sha256: sha(user), ...extra});
  };
  for (const f of semanticFixtures) for (const swap of [false, true]) add(f.id + (swap ? ':reverse' : ':forward'), 'semantic_choice', 'judge', f.id, buildJudgePayload(f, {swap}), {swap});
  for (const arm of ['baseline', 'core', 'full']) add('doc:' + arm, 'longform_edit', arm, 'doc', {kaynak: documents[0].source});
  add('doc:drop_examples', 'ablation', 'drop_examples', 'doc', {kaynak: documents[0].source});
  add('doc:pass2', 'stability', 'full', 'doc', '', {depends_on: 'doc:full', pass_no: 2, purpose: 'Deneme', genre: 'blog'});
  add('doc:pass3', 'stability', 'full', 'doc', '', {depends_on: 'doc:pass2', pass_no: 3, purpose: 'Deneme', genre: 'blog'});
  add('brief:baseline', 'brief_generation', 'baseline', 'brief', {brif: briefs[0].brief});
  const manifest = {experiment: 'diagnostics-v10', tasks, source_hashes: {doc: sha(documents[0].source)}, bundles: {drop_examples: {removed: ['examples']}}};
  const manifestText = JSON.stringify(manifest);
  const results = tasks.map(task => {
    const final = task.kind === 'semantic_choice'
      ? JSON.stringify({choice: task.source_id === semanticFixtures[1].id ? 'ESIT' : task.swap ? 'B' : 'A'})
      : task.kind === 'brief_generation' ? 'Kaba 5 ml su kondu.' : documents[0].source;
    return {
      model: 'test/model', model_revision: 'a'.repeat(40), manifest_sha256: sha(manifestText), git: 'b'.repeat(40), task_count: tasks.length,
      id: task.id, kind: task.kind, arm: task.arm, source_id: task.source_id,
      status: 'complete', complete: true, final, finish_reason: 'stop', parse_error: null, final_sha256: sha(final),
      source_payload_sha256: task.depends_on ? sha(pythonPayload({amac: task.purpose, tur: task.genre, kaynak: documents[0].source})) : sha(task.user),
      depends_on: task.depends_on || null,
    };
  });
  return {manifest, manifestText, results, documents, semanticFixtures, briefs};
}

test('summary scores swapped and equal controls, paired arms, ablations and stable passes', () => {
  const report = summarizeDiagnostics(fixture());
  assert.equal(report.overall.recorded, 11);
  assert.equal(report.overall.analysis_eligible, 11);
  assert.equal(report.overall.semantic_choice_correct, 4);
  assert.equal(report.models[0].semantic_order_summary.both_orders_correct, 2);
  assert.equal(report.models[0].semantic_order_summary.order_consistent, 2);
  assert.equal(report.models[0].longform_comparisons[0].baseline_vs_full.available, true);
  assert.equal(report.models[0].ablation_comparisons[0].full_vs_ablation.available, true);
  assert.equal(report.models[0].stability[0].completed_consecutive_passes, 3);
  assert.equal(report.models[0].stability[0].metrics.editorial_success, 'not_assessed');
  assert.equal(report.semantic_fidelity_proved, false);
  assert.equal(report.automatic_promotion, false);
});

test('truncation, channel parsing, judge parsing and missing tasks remain distinct', () => {
  const input = fixture();
  const row = id => input.results.find(x => x.id === id);
  Object.assign(row('doc:full'), {complete: false, status: 'incomplete', finish_reason: 'length'});
  Object.assign(row('doc:core'), {complete: false, status: 'incomplete', parse_error: 'missing_final_channel', final: '', final_sha256: sha('')});
  const judge = input.results.find(x => x.kind === 'semantic_choice');
  judge.final = '{"choice":'; judge.final_sha256 = sha(judge.final);
  input.results = input.results.filter(x => x.id !== 'doc:drop_examples');
  const report = summarizeDiagnostics(input), model = report.models[0];
  assert.equal(report.overall.truncated, 1);
  assert.equal(report.overall.final_channel_parse_error, 1);
  assert.equal(report.overall.judge_parser_invalid_on_complete, 1);
  assert.equal(report.overall.semantic_choice_wrong, 0);
  assert.equal(model.longform_comparisons[0].baseline_vs_full.available, false);
  assert.equal(model.declared_selected_tasks_not_recorded, 1);
  assert.ok(model.manifest_tasks_without_result.some(x => x.id === 'doc:drop_examples'));
  assert.equal(model.stability[0].completed_consecutive_passes, 0);
});

test('a valid wrong reverse choice is incorrect and order-inconsistent, not parser-invalid', () => {
  const input = fixture(), row = input.results.find(x => x.id === semanticAll[0].id + ':reverse');
  row.final = '{"choice":"A"}'; row.final_sha256 = sha(row.final);
  const report = summarizeDiagnostics(input);
  assert.equal(report.overall.semantic_choice_wrong, 1);
  assert.equal(report.overall.judge_parser_invalid, 0);
  assert.equal(report.models[0].semantic_order_summary.order_inconsistent, 1);
});

test('bad provenance and changed fixtures cannot score, including downstream passes in reverse row order', () => {
  const input = fixture();
  input.results.find(x => x.id === 'doc:full').manifest_sha256 = '0'.repeat(64);
  input.results.reverse();
  input.semanticFixtures = input.semanticFixtures.map((x, i) => i ? x : {...x, source: x.source + ' Ek bilgi.'});
  const report = summarizeDiagnostics(input), rows = report.models[0].records;
  assert.equal(report.overall.semantic_choice_correct, 2);
  for (const id of ['doc:full', 'doc:pass2', 'doc:pass3']) assert.equal(rows.find(x => x.id === id).analysis_eligible, false);
  assert.ok(rows.find(x => x.kind === 'semantic_choice' && x.source_id === semanticAll[0].id).integrity_issues.includes('semantic_fixture_payload_mismatch'));
  assert.equal(report.models[0].stability[0].completed_consecutive_passes, 0);
});

test('brief inventory excludes requested word counts and does not claim literal facts were semantically proved', () => {
  const input = fixture();
  const report = summarizeDiagnostics(input), brief = report.models[0].records.find(x => x.kind === 'brief_generation').brief;
  assert.deepEqual(brief.absent_numeric_tokens, []);
  assert.deepEqual(brief.new_numeric_tokens, []);
  assert.equal(brief.fact_literal_risks.semantic_fidelity, 'not_assessed');
  const row = input.results.find(x => x.kind === 'brief_generation');
  row.final = 'Kaba 5 L su ve 8 g tuz kondu.'; row.final_sha256 = sha(row.final);
  const changed = summarizeDiagnostics(input).models[0].records.find(x => x.kind === 'brief_generation').brief;
  assert.ok(changed.new_numeric_tokens.includes('8'));
  assert.ok(changed.fact_literal_risks.flags.some(x => x.category === 'quantities_with_units'));
});

test('duplicate outputs reject instead of inflating denominators; log extraction retains only result records', () => {
  const input = fixture();
  assert.throws(() => summarizeDiagnostics({...input, results: [...input.results, input.results[0]]}), /Duplicate result/u);
  const raw = 'runtime message\nDIAGNOSTIC_RUN_INFO {}\nDIAGNOSTIC_RESULT ' + JSON.stringify(input.results[0]) + '\nDIAGNOSTIC_COMPLETE {}\n';
  assert.deepEqual(readResultLines(raw), [input.results[0]]);
  assert.throws(() => readResultLines('{broken'), /JSON/u);
});

test('semantic exclusions add sensitivity totals without changing original labels, totals or records', () => {
  const input = fixture();
  const report = summarizeDiagnostics({...input, excludeSemanticIds: [semanticAll[0].id], exclusionReason: 'Predeclared annotation ambiguity in frozen notes.'});
  assert.equal(report.overall.semantic_choice_correct, 4);
  assert.equal(report.models[0].records.length, input.results.length);
  assert.equal(report.semantic_sensitivity.excluded_record_count, 2);
  assert.equal(report.semantic_sensitivity.included_counts.semantic_choice_correct, 2);
  assert.equal(report.models[0].semantic_sensitivity.included_order_summary.both_orders_correct, 1);
  assert.equal(report.models[0].semantic_order_summary.both_orders_correct, 2);
  assert.equal(report.semantic_sensitivity.exclusions[0].reason, 'Predeclared annotation ambiguity in frozen notes.');
  assert.throws(() => summarizeDiagnostics({...input, excludeSemanticIds: ['unknown']}), /unique known/u);
  assert.throws(() => summarizeDiagnostics({...input, excludeSemanticIds: [semanticAll[0].id, semanticAll[0].id]}), /unique known/u);
});
