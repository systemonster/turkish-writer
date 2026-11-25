import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  protectedValueRisks, editMetrics, descriptiveMetrics, stabilityMetrics,
  parseJudgeOutput, validateSemanticFixtures, buildJudgePayload, expectedJudgeChoice,
} from '../diagnostic-metrics.mjs';

const fixtures = readFileSync(new URL('../semantic-mutations-v10.jsonl', import.meta.url), 'utf8')
  .trim().split(/\r?\n/u).map(line => JSON.parse(line));

test('literal risk checks catch changed units, reordered values and protected structure', () => {
  const source = '# Ölçüm\n\nİlk kaba 5 ml, ikinci kaba 10 ml kondu. Oran %12.\n\n[Kaynak](/olcum)\n\n```js\nx = 5;\n```';
  const changed = '# Deneme\n\nİlk kaba 10 ml, ikinci kaba 5 L kondu. Oran 12.\n\n[Kaynak](/baska)\n\n```js\nx = 10;\n```';
  const result = protectedValueRisks(source, changed);
  const categories = result.flags.map(x => x.category);
  for (const name of ['numbers', 'quantities_with_units', 'headings', 'links', 'fenced_code']) assert.ok(categories.includes(name), name);
  const reordered = protectedValueRisks('A 10, B 20.', 'A 20, B 10.');
  assert.equal(reordered.flags.find(x => x.category === 'numbers').order_only, true);
  const unitOnly = protectedValueRisks('Oran %12, miktar 5 ml.', 'Oran 12, miktar 5 L.');
  assert.equal(unitOnly.flags.some(x => x.category === 'numbers'), false);
  assert.equal(unitOnly.flags.some(x => x.category === 'quantities_with_units'), true);
});

test('modality and negation can escape literal flags and never receive a semantic pass', () => {
  for (const [source, output] of [['İşlem kolaylaşabilir.', 'İşlem kolaylaşır.'], ['Zil sesi duyulmuyor.', 'Zil sesi duyuluyor.']]) {
    const result = protectedValueRisks(source, output);
    assert.equal(result.has_literal_or_structure_risk, false);
    assert.equal(result.requires_semantic_review, true);
    assert.equal(result.semantic_fidelity, 'not_assessed');
    assert.equal('passed' in result, false);
  }
  const custom = protectedValueRisks('Yalnız ilk prova ücretsiz.', 'Prova ücretsiz.', {protectedValues: ['Yalnız']});
  assert.equal(custom.flags[0].category, 'custom_literal');
  assert.equal(custom.flags[0].before_count, 1);
  assert.equal(custom.flags[0].after_count, 0);
});

test('token edit distance measures changes without calling identical or altered text successful', () => {
  const equal = editMetrics('Kutu kapandı.', 'Kutu kapandı.');
  assert.equal(equal.exact_match, true);
  assert.equal(equal.token_levenshtein_distance, 0);
  assert.equal(equal.editorial_success, 'not_assessed');
  const changed = editMetrics('Kutu kapandı.', 'Kutu açıldı.');
  assert.equal(changed.token_levenshtein_distance, 1);
  assert.equal(changed.normalized_token_distance, 1 / 3);
  assert.equal(changed.semantic_fidelity, 'not_assessed');
  assert.equal(editMetrics('Kutu  kapandı.', 'Kutu kapandı.').whitespace_only_change, true);
  assert.equal(editMetrics('', '').normalized_token_distance, 0);
  const limited = editMetrics('bir iki üç', 'dört beş altı', {maxDistanceCells: 1});
  assert.equal(limited.token_levenshtein_distance, null);
  assert.equal(limited.distance_not_computed_reason, 'distance_cell_limit');
});

test('descriptive repetition and sentence metrics have no quality thresholds or empty-text NaN', () => {
  const result = descriptiveMetrics('Kutu bugün açıldı. Kutu bugün açıldı.\n\nRaf boş kaldı.');
  assert.equal(result.words, 9);
  assert.equal(result.paragraphs, 2);
  assert.equal(result.sentences, 3);
  assert.equal(result.repeated_sentences.excess_occurrences, 1);
  assert.ok(result.repeated_trigrams.excess_occurrences >= 1);
  assert.equal(result.words_per_sentence.mean, 3);
  assert.equal('quality_score' in result, false);
  assert.equal(descriptiveMetrics('').words_per_sentence.mean, null);
  assert.equal(descriptiveMetrics('').type_token_ratio, null);
  assert.equal(descriptiveMetrics('```txt\nmetin içinde üç sözcük\n```').words, 0);
});

test('successive passes distinguish observed stability, unobserved stability and edit cycles', () => {
  const stable = stabilityMetrics('Kaynak.', ['İlk düzenleme.', 'İlk düzenleme.', 'İlk düzenleme.']);
  assert.equal(stable.exact_stability_observed_after_pass, 1);
  assert.equal(stable.editorial_success, 'not_assessed');
  assert.equal(stable.semantic_fidelity, 'not_assessed');
  assert.equal(stabilityMetrics('Kaynak.', ['İlk düzenleme.']).exact_stability_observed_after_pass, null);
  const cycle = stabilityMetrics('Kutu kapandı.', ['Kutu açıldı.', 'Kutu kapandı.', 'Kutu açıldı.']);
  assert.equal(cycle.exact_stability_observed_after_pass, null);
  assert.deepEqual(cycle.exact_cycles, [{from_pass: 0, to_pass: 2}, {from_pass: 1, to_pass: 3}]);
  const unchanged = stabilityMetrics('Kusurlu metin.', ['Kusurlu metin.', 'Kusurlu metin.']);
  assert.equal(unchanged.transitions[0].edit.exact_match, true);
  assert.equal(unchanged.editorial_success, 'not_assessed');
  assert.throws(() => stabilityMetrics('x', []), /one to three/u);
});

test('judge parser rejects truncated, malformed, ambiguous and duplicate-key responses', () => {
  assert.deepEqual(parseJudgeOutput('A', {atLimit: true}), {valid: false, choice: null, reason: 'truncated', format: null, explanation: null});
  assert.equal(parseJudgeOutput('{"choice":"A"').valid, false);
  assert.equal(parseJudgeOutput('A çünkü daha kısa.').valid, false);
  assert.equal(parseJudgeOutput('{"choice":"A","secim":"B"}').valid, false);
  assert.equal(parseJudgeOutput('{"choice":"A","choice":"B"}').reason, 'duplicate_json_keys');
  assert.equal(parseJudgeOutput('{"choice":"A","confidence":1}').valid, false);
  assert.equal(parseJudgeOutput('["A"]').valid, false);
  assert.equal(parseJudgeOutput('{"choice":"C"}').valid, false);
  assert.equal(parseJudgeOutput('{"choice":"A","reason":{}}').valid, false);
  assert.equal(parseJudgeOutput('B', {finishReason: 'length'}).valid, false);
});

test('judge parser accepts labels and explicit JSON while preserving protocol format', () => {
  assert.equal(parseJudgeOutput(' A ').choice, 'A');
  assert.equal(parseJudgeOutput('eşit').choice, 'ESIT');
  assert.equal(parseJudgeOutput('EŞİT').choice, 'ESIT');
  const json = parseJudgeOutput('{"choice":"B","reason":"Kaynakta olasılık var."}');
  assert.equal(json.choice, 'B');
  assert.equal(json.format, 'json');
  assert.equal(json.explanation, 'Kaynakta olasılık var.');
  const fenced = parseJudgeOutput('```json\n{"secim":"ESIT","gerekce":"İki aday da aynı bilgiyi koruyor."}\n```');
  assert.equal(fenced.choice, 'ESIT');
  assert.equal(fenced.format, 'fenced_json');
  // Escaped quotes in a legitimate explanation are not object keys.
  assert.equal(parseJudgeOutput(JSON.stringify({choice: 'A', reason: 'Metindeki "choice": etiketi veri.'})).valid, true);
});

test('fresh fixtures are development-only, balanced controls and explicit paragraph contexts', () => {
  assert.equal(validateSemanticFixtures(fixtures).total, 24);
  assert.equal(fixtures.filter(x => x.context === 'short').length, 12);
  assert.equal(fixtures.filter(x => x.context === 'paragraph').length, 12);
  assert.equal(fixtures.filter(x => x.test_kind === 'contrast').length, 16);
  assert.equal(fixtures.filter(x => x.test_kind === 'paraphrase_control').length, 8);
  for (const choice of ['A', 'B', 'ESIT']) assert.equal(fixtures.filter(x => x.gold.choice === choice).length, 8);
  for (const category of ['modality', 'negation', 'agent', 'time', 'causality', 'scope', 'attribution', 'number', 'unit']) assert.ok(fixtures.some(x => x.category === category), category);
  assert.throws(() => validateSemanticFixtures([{...fixtures[0], human_reviewed: true}]), /Invalid semantic fixture/u);
  assert.throws(() => validateSemanticFixtures([fixtures[0], fixtures[0]]), /Invalid semantic fixture/u);
});

test('judge payloads exclude all gold and identity metadata and swapping reverses only comparison labels', () => {
  for (const fixture of fixtures) {
    const payload = buildJudgePayload({...fixture, secret_reference: 'NEVER_SEND'});
    assert.deepEqual(Object.keys(payload), ['kaynak', 'A', 'B']);
    assert.equal(payload.kaynak, fixture.source);
    assert.equal(JSON.stringify(payload).includes('NEVER_SEND'), false);
    assert.equal(JSON.stringify(payload).includes(fixture.gold.explanation), false);
    const swapped = buildJudgePayload(fixture, {swap: true});
    assert.equal(swapped.A, payload.B);
    assert.equal(swapped.B, payload.A);
    assert.equal(swapped.kaynak, payload.kaynak);
    const choice = expectedJudgeChoice(fixture);
    assert.equal(expectedJudgeChoice(fixture, {swap: true}), choice === 'ESIT' ? 'ESIT' : choice === 'A' ? 'B' : 'A');
  }
});
