#!/usr/bin/env node
// Summarize generated development experiments. Never promotes a skill or asserts
// semantic fidelity from literal preservation, change counts, or model agreement.
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  protectedValueRisks, editMetrics, descriptiveMetrics, stabilityMetrics,
  parseJudgeOutput, validateSemanticFixtures, buildJudgePayload, expectedJudgeChoice,
} from './diagnostic-metrics.mjs';

const sha = value => createHash('sha256').update(value, 'utf8').digest('hex');
const average = values => {
  const valid = values.filter(x => typeof x === 'number' && Number.isFinite(x));
  return valid.length ? valid.reduce((sum, x) => sum + x, 0) / valid.length : null;
};
const mapById = (rows, label) => {
  const map = new Map();
  for (const row of rows) {
    if (!row?.id || map.has(row.id)) throw new Error(`Missing or duplicate ${label} id: ${row?.id}`);
    map.set(row.id, row);
  }
  return map;
};
const isTruncated = row => ['length', 'max_tokens', 'max_output_tokens'].includes(row.finish_reason);
// The runner uses Python json.dumps(ensure_ascii=False) for flat string payloads.
const runnerPayload = value => '{' + Object.entries(value).map(([key, text]) => JSON.stringify(key) + ': ' + JSON.stringify(text)).join(', ') + '}';

export function readResultLines(text) {
  const rows = [];
  for (const [index, raw] of text.split(/\r?\n/u).entries()) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('DIAGNOSTIC_RESULT ')) {
      rows.push(JSON.parse(line.slice('DIAGNOSTIC_RESULT '.length)));
    } else if (line.startsWith('{')) rows.push(JSON.parse(line));
    else if (!line.startsWith('DIAGNOSTIC_')) {
      // Runtime log chatter is allowed only when result markers identify a log.
      if (!text.includes('DIAGNOSTIC_RESULT ')) throw new Error(`Unexpected result line ${index + 1}`);
    }
  }
  return rows;
}

function summarizeCounts(records) {
  const eligible = records.filter(row => row.analysis_eligible);
  const judged = records.filter(row => row.judge);
  const validJudged = judged.filter(row => row.judge.eligible);
  return {
    recorded: records.length,
    runner_complete: records.filter(row => row.result.complete === true).length,
    incomplete: records.filter(row => row.result.complete !== true).length,
    analysis_eligible: eligible.length,
    integrity_rejected: records.filter(row => row.integrity_issues.length).length,
    blocked_dependency: records.filter(row => row.result.status === 'blocked_dependency').length,
    context_overflow: records.filter(row => row.result.status === 'context_overflow').length,
    truncated: records.filter(row => isTruncated(row.result)).length,
    final_channel_parse_error: records.filter(row => Boolean(row.result.parse_error)).length,
    empty_final: records.filter(row => typeof row.result.final !== 'string' || !row.result.final.trim()).length,
    judge_attempts_recorded: judged.length,
    judge_parser_invalid: judged.filter(row => !row.judge.parsed.valid).length,
    judge_parser_invalid_on_complete: judged.filter(row => row.result.complete === true && !row.judge.parsed.valid).length,
    judge_valid_eligible: validJudged.length,
    semantic_choice_correct: validJudged.filter(row => row.judge.correct).length,
    semantic_choice_wrong: validJudged.filter(row => !row.judge.correct).length,
    semantic_choice_correct_fraction_of_valid: validJudged.length ? validJudged.filter(row => row.judge.correct).length / validJudged.length : null,
    text_outputs_with_literal_risk: eligible.filter(row => row.text?.protected_values.has_literal_or_structure_risk).length,
    mean_source_edit_distance: average(eligible.map(row => row.text?.edit.normalized_token_distance)),
    mean_output_words: average(eligible.map(row => row.text?.output_description.words ?? row.brief?.output_description.words)),
    note: 'Failure counters can overlap. Correctness applies only to project-labelled semantic choices; no editorial quality or semantic-fidelity score.',
  };
}

function groupCounts(records, key) {
  const groups = new Map();
  for (const row of records) {
    const name = key(row);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(row);
  }
  return Object.fromEntries([...groups].map(([name, rows]) => [name, summarizeCounts(rows)]));
}

function textAnalysis(source, output, fixture = {}) {
  return {
    edit: editMetrics(source, output),
    protected_values: protectedValueRisks(source, output, {protectedValues: fixture.protected_literals || []}),
    source_description: descriptiveMetrics(source),
    output_description: descriptiveMetrics(output),
    protected_facts_for_semantic_review: fixture.protected_facts || [],
    seeded_span_observations: (fixture.seeded_defects || []).map(defect => ({
      type: defect.type,
      injected_span_present_in_source: source.includes(defect.after),
      injected_span_still_present: output.includes(defect.after),
      original_span_present: output.includes(defect.before),
      interpretation: 'Literal observation only: removing a seeded span can still lose meaning; other repairs may be valid.',
    })),
  };
}

function comparison(left, right) {
  if (!left?.analysis_eligible || !right?.analysis_eligible || !left.text || !right.text) return {
    available: false,
    left_task: left?.id || null,
    right_task: right?.id || null,
    reason: 'Both tasks need complete provenance-valid text outputs',
  };
  return {
    available: true,
    left_task: left.id,
    right_task: right.id,
    output_difference: editMetrics(left.result.final, right.result.final),
    source_edit_distance_delta: right.text.edit.normalized_token_distance === null || left.text.edit.normalized_token_distance === null
      ? null : right.text.edit.normalized_token_distance - left.text.edit.normalized_token_distance,
    output_words_delta: right.text.output_description.words - left.text.output_description.words,
    literal_risk_flags_delta: right.text.protected_values.flags.length - left.text.protected_values.flags.length,
    repeated_trigram_fraction_delta: right.text.output_description.repeated_trigrams.excess_fraction === null || left.text.output_description.repeated_trigrams.excess_fraction === null
      ? null : right.text.output_description.repeated_trigrams.excess_fraction - left.text.output_description.repeated_trigrams.excess_fraction,
    interpretation: 'Right minus left describes behavior; lower change, fewer flags, or less repetition is not automatically better.',
  };
}

function briefAnalysis(fixture, output) {
  const facts = fixture.facts.join('\n');
  const risks = protectedValueRisks(facts, output);
  const categories = new Set(['numbers', 'quantities_with_units', 'links', 'quotes', 'custom_literal']);
  const flags = risks.flags.filter(row => categories.has(row.category));
  const numbers = text => new Set(text.match(/[+-]?\p{N}+(?:[.,:/–-]\p{N}+)*/gu) || []);
  const before = numbers(facts), after = numbers(output);
  return {
    pair_id: fixture.pair_id,
    style_variant: fixture.style_variant,
    output_description: descriptiveMetrics(output),
    fact_literal_risks: {...risks, flags, has_literal_or_structure_risk: flags.length > 0},
    new_numeric_tokens: [...after].filter(value => !before.has(value)),
    absent_numeric_tokens: [...before].filter(value => !after.has(value)),
    protected_facts_for_semantic_review: fixture.facts,
    interpretation: 'Compare fact inventory, not brief word-count instructions. Formatting, number spelling, repetitions or valid calculations can change literals; this is not semantic recall or hallucination proof.',
  };
}

export function summarizeDiagnostics({manifest, manifestText, results, documents, semanticFixtures, briefs,
  excludeSemanticIds = [], exclusionReason = 'Explicitly selected annotation sensitivity exclusion; original labels and every raw record are preserved.'}) {
  if (manifest.experiment !== 'diagnostics-v10' || !Array.isArray(manifest.tasks)) throw new Error('Expected diagnostics-v10 manifest');
  const manifestHash = sha(manifestText);
  const tasks = mapById(manifest.tasks, 'task'), docs = mapById(documents, 'document');
  const semantic = mapById(semanticFixtures, 'semantic fixture'), briefMap = mapById(briefs, 'brief');
  validateSemanticFixtures(semanticFixtures);
  if (!Array.isArray(excludeSemanticIds) || excludeSemanticIds.some(id => typeof id !== 'string' || !semantic.has(id))
    || new Set(excludeSemanticIds).size !== excludeSemanticIds.length) throw new Error('Semantic exclusions must be unique known fixture IDs');
  if (typeof exclusionReason !== 'string' || !exclusionReason.trim()) throw new Error('A nonempty sensitivity exclusion reason is required');
  const excludedSemantic = new Set(excludeSemanticIds);
  const byModel = new Map(), seen = new Set();
  for (const result of results) {
    if (!result || typeof result.model !== 'string' || typeof result.model_revision !== 'string' || !result.id) throw new Error('Result missing model/revision/id');
    const modelKey = result.model + '@' + result.model_revision, key = modelKey + ':' + result.id;
    if (seen.has(key)) throw new Error(`Duplicate result: ${key}`);
    seen.add(key);
    if (!byModel.has(modelKey)) byModel.set(modelKey, []);
    byModel.get(modelKey).push(result);
  }
  const models = [];
  for (const [modelKey, rawRows] of byModel) {
    const rawById = new Map(rawRows.map(row => [row.id, row]));
    const records = rawRows.map(result => {
      const task = tasks.get(result.id), issues = [];
      if (!task) issues.push('unknown_task_id');
      if (result.manifest_sha256 !== manifestHash) issues.push('manifest_hash_mismatch');
      if (task && ['kind', 'arm', 'source_id'].some(key => result[key] !== task[key])) issues.push('task_metadata_mismatch');
      if (result.final_sha256 && (typeof result.final !== 'string' || sha(result.final) !== result.final_sha256)) issues.push('final_hash_mismatch');
      let source = null, fixture = null;
      if (task) {
        try {
          if (task.kind === 'longform_edit' || task.kind === 'ablation' || task.kind === 'stability') {
            fixture = docs.get(task.source_id);
            if (!fixture) issues.push('missing_document_fixture');
            else if (manifest.source_hashes?.[task.source_id] !== sha(fixture.source)) issues.push('document_source_hash_mismatch');
          } else if (task.kind.startsWith('semantic_')) {
            fixture = semantic.get(task.source_id);
            if (!fixture) issues.push('missing_semantic_fixture');
          } else if (task.kind === 'brief_generation') {
            fixture = briefMap.get(task.source_id);
            if (!fixture) issues.push('missing_brief_fixture');
          }
          if (task.kind === 'stability') {
            const previous = rawById.get(task.depends_on);
            if (result.complete && (!previous?.complete || typeof previous.final !== 'string')) issues.push('completed_stability_without_completed_parent');
            if (previous?.complete && typeof previous.final === 'string') {
              source = previous.final;
              if (result.source_payload_sha256 && result.source_payload_sha256 !== sha(runnerPayload({amac: task.purpose, tur: task.genre, kaynak: source}))) issues.push('dependency_payload_hash_mismatch');
            }
            if (result.depends_on && result.depends_on !== task.depends_on) issues.push('dependency_id_mismatch');
          } else {
            if (task.source_sha256 !== sha(task.user)) issues.push('manifest_task_payload_hash_mismatch');
            if (result.source_payload_sha256 && result.source_payload_sha256 !== sha(task.user)) issues.push('result_payload_hash_mismatch');
            const payload = JSON.parse(task.user);
            if (task.kind === 'semantic_choice' && fixture) {
              const expected = buildJudgePayload(fixture, {swap: task.swap});
              if (JSON.stringify(payload) !== JSON.stringify(expected)) issues.push('semantic_fixture_payload_mismatch');
            } else if (task.kind === 'brief_generation' && fixture) {
              if (payload.brif !== fixture.brief) issues.push('brief_fixture_payload_mismatch');
            } else if (fixture) {
              if (payload.kaynak !== fixture.source) issues.push('source_fixture_payload_mismatch');
              source = fixture.source;
            }
          }
        } catch (error) { issues.push('fixture_or_payload_error:' + error.message); }
      }
      const complete = result.complete === true && result.status === 'complete' && result.finish_reason === 'stop'
        && !result.parse_error && typeof result.final === 'string' && Boolean(result.final.trim());
      const row = {
        id: result.id, kind: task?.kind || result.kind || 'unknown', arm: task?.arm || result.arm || 'unknown',
        source_id: task?.source_id || result.source_id || null,
        integrity_issues: issues, analysis_eligible: complete && !issues.length,
        exclusion_reasons: [...issues, ...(!complete ? ['incomplete_or_empty_final'] : [])], result,
      };
      if (task?.kind === 'semantic_choice') {
        const parsed = parseJudgeOutput(result.final, {atLimit: isTruncated(result), finishReason: result.finish_reason});
        const expected = fixture?.gold ? expectedJudgeChoice(fixture, {swap: task.swap}) : null;
        const eligible = row.analysis_eligible && parsed.valid && expected !== null;
        row.judge = {
          parsed, expected_choice: expected, swap: task.swap, category: fixture?.category || null,
          test_kind: fixture?.test_kind || null, context: fixture?.context || null,
          eligible, correct: eligible ? parsed.choice === expected : null,
          canonical_choice: parsed.valid ? (task.swap && parsed.choice !== 'ESIT' ? (parsed.choice === 'A' ? 'B' : 'A') : parsed.choice) : null,
          label_scope: 'project_generated_development_not_human_gold',
        };
      } else if (row.analysis_eligible && task?.kind === 'brief_generation' && fixture) row.brief = briefAnalysis(fixture, result.final);
      else if (row.analysis_eligible && source !== null) row.text = textAnalysis(source, result.final, fixture);
      return row;
    });
    const byId = new Map(records.map(row => [row.id, row]));
    // Downstream metrics must not use a complete-looking parent with failed provenance.
    for (const row of records.filter(item => item.kind === 'stability')) {
      let parentId = tasks.get(row.id)?.depends_on, invalidAncestor = false;
      const ancestors = new Set([row.id]);
      while (parentId) {
        if (ancestors.has(parentId) || !byId.get(parentId)?.analysis_eligible) { invalidAncestor = true; break; }
        ancestors.add(parentId);
        parentId = tasks.get(parentId)?.depends_on;
      }
      if (row.analysis_eligible && invalidAncestor) {
        row.analysis_eligible = false;
        row.integrity_issues.push('dependency_not_analysis_eligible');
        row.exclusion_reasons.push('dependency_not_analysis_eligible');
        delete row.text;
      }
    }
    const positions = [];
    for (const fixture of semanticFixtures) {
      const forward = byId.get(fixture.id + ':forward'), reverse = byId.get(fixture.id + ':reverse');
      if (!forward && !reverse) continue;
      const eligible = Boolean(forward?.judge?.eligible && reverse?.judge?.eligible);
      positions.push({
        source_id: fixture.id, category: fixture.category, test_kind: fixture.test_kind,
        forward_task: forward?.id || null, reverse_task: reverse?.id || null, both_orders_eligible: eligible,
        order_consistent: eligible ? forward.judge.canonical_choice === reverse.judge.canonical_choice : null,
        both_orders_correct: eligible ? forward.judge.correct && reverse.judge.correct : null,
        forward_correct: forward?.judge?.correct ?? null, reverse_correct: reverse?.judge?.correct ?? null,
        note: 'Disagreement combines presentation sensitivity and sampling variation; it does not isolate causal position bias.',
      });
    }
    const longform = documents.map(doc => ({
      source_id: doc.id, pair_id: doc.pair_id, source_condition: doc.arm, expected_development_decision: doc.decision,
      arms: Object.fromEntries(['baseline', 'core', 'full'].map(arm => [arm, {
        task_id: doc.id + ':' + arm, recorded: byId.has(doc.id + ':' + arm), eligible: byId.get(doc.id + ':' + arm)?.analysis_eligible || false,
      }])),
      baseline_vs_core: comparison(byId.get(doc.id + ':baseline'), byId.get(doc.id + ':core')),
      baseline_vs_full: comparison(byId.get(doc.id + ':baseline'), byId.get(doc.id + ':full')),
      core_vs_full: comparison(byId.get(doc.id + ':core'), byId.get(doc.id + ':full')),
    }));
    const ablations = records.filter(row => row.kind === 'ablation').map(row => ({
      source_id: row.source_id, variant: row.arm,
      removed_passages: manifest.bundles?.[row.arm]?.removed || [],
      full_vs_ablation: comparison(byId.get(row.source_id + ':full'), row),
    }));
    const briefPairs = [];
    for (const pairId of new Set(briefs.map(item => item.pair_id))) for (const arm of ['baseline', 'full']) {
      const pair = briefs.filter(item => item.pair_id === pairId);
      const members = pair.map(item => ({fixture: item, row: byId.get(item.id + ':' + arm)}));
      if (!members.some(item => item.row)) continue;
      const completeMembers = members.filter(item => item.row?.analysis_eligible && item.row.brief);
      const neutral = completeMembers.find(item => item.fixture.style_variant === 'neutral');
      const directive = completeMembers.find(item => item.fixture.style_variant === 'overdirective');
      briefPairs.push({
        pair_id: pairId, arm,
        members: members.map(item => ({source_id: item.fixture.id, style_variant: item.fixture.style_variant, task_id: item.row?.id || null, eligible: item.row?.analysis_eligible || false})),
        neutral_vs_overdirective: neutral && directive ? {
          available: true,
          output_difference: editMetrics(neutral.row.result.final, directive.row.result.final),
          output_words_delta: directive.row.brief.output_description.words - neutral.row.brief.output_description.words,
          literal_risk_flags_delta: directive.row.brief.fact_literal_risks.flags.length - neutral.row.brief.fact_literal_risks.flags.length,
          interpretation: 'Overdirective minus neutral; prompt-style sensitivity, not a quality ranking.',
        } : {available: false, reason: 'Both completed variants are required'},
      });
    }
    const stability = [];
    for (const sourceId of new Set(manifest.tasks.filter(t => t.kind === 'stability').map(t => t.source_id))) {
      const doc = docs.get(sourceId), ids = [sourceId + ':full', sourceId + ':pass2', sourceId + ':pass3'];
      const rows = ids.map(id => byId.get(id));
      if (!rows.some(Boolean)) continue;
      const outputs = [];
      for (const row of rows) { if (!row?.analysis_eligible) break; outputs.push(row.result.final); }
      stability.push({
        source_id: sourceId,
        task_states: ids.map((id, i) => ({id, recorded: Boolean(rows[i]), eligible: rows[i]?.analysis_eligible || false, reasons: rows[i]?.exclusion_reasons || ['not_recorded_in_file']})),
        completed_consecutive_passes: outputs.length,
        metrics: doc && outputs.length ? stabilityMetrics(doc.source, outputs, {protectedValues: doc.protected_literals || []}) : null,
      });
    }
    const declaredCounts = [...new Set(rawRows.map(row => row.task_count).filter(Number.isInteger))];
    const declared = declaredCounts.length === 1 ? declaredCounts[0] : null;
    const recordedKnown = records.filter(row => tasks.has(row.id)).length;
    models.push({
      model_key: modelKey, model: rawRows[0].model, revision: rawRows[0].model_revision,
      git_commits: [...new Set(rawRows.map(row => row.git).filter(Boolean))],
      declared_selected_task_counts: declaredCounts,
      manifest_task_count: tasks.size,
      recorded_known_tasks: recordedKnown,
      declared_selected_tasks_not_recorded: declared === null ? null : Math.max(0, declared - recordedKnown),
      manifest_tasks_without_result: manifest.tasks.filter(task => !byId.has(task.id)).map(task => ({id: task.id, kind: task.kind, arm: task.arm})),
      selection_note: 'Absent manifest tasks may be unselected or unfinished. The result file does not identify the selected ID set; absence alone is not a model failure.',
      overall: summarizeCounts(records), by_kind: groupCounts(records, row => row.kind),
      by_kind_and_variant: groupCounts(records, row => row.kind + ':' + row.arm),
      semantic_by_category: groupCounts(records.filter(row => row.judge), row => row.judge.category || 'unknown'),
      semantic_order_summary: {
        recorded_fixture_pairs: positions.length,
        both_orders_eligible: positions.filter(row => row.both_orders_eligible).length,
        both_orders_correct: positions.filter(row => row.both_orders_correct === true).length,
        order_consistent: positions.filter(row => row.order_consistent === true).length,
        order_inconsistent: positions.filter(row => row.order_consistent === false).length,
      },
      semantic_sensitivity: {
        exclusions: excludeSemanticIds.map(id => ({id, reason: exclusionReason})),
        excluded_record_count: records.filter(row => row.judge && excludedSemantic.has(row.source_id)).length,
        included_counts: summarizeCounts(records.filter(row => row.judge && !excludedSemantic.has(row.source_id))),
        included_order_summary: {
          recorded_fixture_pairs: positions.filter(row => !excludedSemantic.has(row.source_id)).length,
          both_orders_eligible: positions.filter(row => !excludedSemantic.has(row.source_id) && row.both_orders_eligible).length,
          both_orders_correct: positions.filter(row => !excludedSemantic.has(row.source_id) && row.both_orders_correct === true).length,
          order_consistent: positions.filter(row => !excludedSemantic.has(row.source_id) && row.order_consistent === true).length,
          order_inconsistent: positions.filter(row => !excludedSemantic.has(row.source_id) && row.order_consistent === false).length,
        },
        interpretation: 'Sensitivity view of semantic_choice only. All original fixture totals, labels and records remain elsewhere in this report; semantic_edit diagnostics are not removed.',
      },
      semantic_order_pairs: positions, longform_comparisons: longform, ablation_comparisons: ablations, brief_pairs: briefPairs,
      stability, records,
    });
  }
  const all = models.flatMap(model => model.records);
  return {
    schema: 1, experiment: 'diagnostics-v10', manifest_sha256: manifestHash,
    scope: 'generated_development_diagnostics_only', human_validated: false, independent_holdout: false,
    semantic_fidelity_proved: false, automatic_promotion: false,
    overall: summarizeCounts(all), by_kind: groupCounts(all, row => row.kind),
    by_kind_and_variant: groupCounts(all, row => row.kind + ':' + row.arm), models,
    semantic_sensitivity: {
      exclusions: excludeSemanticIds.map(id => ({id, reason: exclusionReason})),
      excluded_record_count: all.filter(row => row.judge && excludedSemantic.has(row.source_id)).length,
      included_counts: summarizeCounts(all.filter(row => row.judge && !excludedSemantic.has(row.source_id))),
      interpretation: 'Additional sensitivity analysis, not relabeling or replacement of the full-fixture result. Selection timing is documented externally, not inferred by this tool.',
    },
    limitations: [
      'No detector probability, text change count, literal check or model agreement establishes editorial quality.',
      'Semantic labels are project-generated expectations; controls and mutated pairs are not human-approved independent evidence.',
      'Incomplete, truncated or provenance-invalid outputs are retained but excluded from complete-text comparisons.',
      'Paired comparisons require both outputs. Missing arms are reported and are not silently dropped.',
      'Repetition and length are descriptive and sensitive to genre and document size.',
      'Brief numeric flags can reflect correct formatting or calculations; source-claim review remains necessary.',
      'Static ablations remove named passages; related guidance can remain elsewhere.',
    ],
  };
}

function readJsonl(path) {
  return readFileSync(path, 'utf8').split(/\r?\n/u).filter(line => line.trim()).map(line => JSON.parse(line));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const values = {};
    for (let i = 2; i < process.argv.length; i += 2) {
      const key = process.argv[i], value = process.argv[i + 1];
      if (!['--manifest', '--results', '--fixtures-dir', '--out', '--exclude-semantic', '--exclusion-reason'].includes(key) || !value || values[key]) throw new Error('Usage: --manifest PATH --results PATH --fixtures-dir corpus-lab --out PATH [--exclude-semantic id1,id2] [--exclusion-reason TEXT]');
      values[key] = value;
    }
    for (const key of ['--manifest', '--results', '--out']) if (!values[key]) throw new Error(`Missing ${key}`);
    const directory = resolve(values['--fixtures-dir'] || 'corpus-lab');
    const manifestText = readFileSync(values['--manifest'], 'utf8');
    const report = summarizeDiagnostics({
      manifest: JSON.parse(manifestText), manifestText,
      results: readResultLines(readFileSync(values['--results'], 'utf8')),
      documents: readJsonl(resolve(directory, 'longform-v10.jsonl')),
      semanticFixtures: readJsonl(resolve(directory, 'semantic-mutations-v10.jsonl')),
      briefs: readJsonl(resolve(directory, 'brief-pairs-v10.jsonl')),
      excludeSemanticIds: values['--exclude-semantic'] ? values['--exclude-semantic'].split(',').map(id => id.trim()) : [],
      ...(values['--exclusion-reason'] ? {exclusionReason: values['--exclusion-reason']} : {}),
    });
    const out = resolve(values['--out']);
    mkdirSync(dirname(out), {recursive: true});
    writeFileSync(out, JSON.stringify(report, null, 2) + '\n', {encoding: 'utf8', flag: 'wx'});
    console.log(JSON.stringify({out, models: report.models.length, overall: report.overall}));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
