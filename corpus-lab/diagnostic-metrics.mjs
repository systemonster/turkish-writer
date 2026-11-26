// Development diagnostics only. These measurements do not establish editorial quality,
// semantic fidelity, authorship, or human approval. No detector score is optimized here.

const SCOPE = 'descriptive_development_diagnostics_not_quality_or_authorship';

function requireText(value, name) {
  if (typeof value !== 'string') throw new TypeError(`${name} must be a string`);
  return value;
}

function words(text) {
  return text.match(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*|\p{N}+(?:[.,]\p{N}+)*/gu) || [];
}

function editTokens(text) {
  return text.match(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*|\p{N}+(?:[.,]\p{N}+)*|[^\s]/gu) || [];
}

function frequency(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return counts;
}

function valueDifference(before, after) {
  const a = frequency(before), b = frequency(after), removed = [], added = [];
  for (const value of new Set([...a.keys(), ...b.keys()])) {
    const delta = (b.get(value) || 0) - (a.get(value) || 0);
    for (let i = 0; i < Math.abs(delta); i++) (delta > 0 ? added : removed).push(value);
  }
  const sequenceChanged = JSON.stringify(before) !== JSON.stringify(after);
  return {
    changed: sequenceChanged,
    removed,
    added,
    order_only: sequenceChanged && !removed.length && !added.length,
  };
}

function codeAndProse(text) {
  const lines = text.split('\n'), code = [], prose = [];
  let opening = null, buffer = [];
  for (const line of lines) {
    const fence = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/u);
    if (!opening && fence) {
      opening = {char: fence[1][0], length: fence[1].length};
      buffer = [line];
      prose.push('');
    } else if (opening) {
      buffer.push(line);
      prose.push('');
      if (fence && fence[1][0] === opening.char && fence[1].length >= opening.length && !fence[2].trim()) {
        code.push(buffer.join('\n'));
        opening = null;
        buffer = [];
      }
    } else prose.push(line);
  }
  // Preserve an unclosed fence as a literal risk; do not silently discard its content.
  if (opening) code.push(buffer.join('\n'));
  return {code, prose: prose.join('\n')};
}

function protectedSnapshot(text) {
  const {code, prose} = codeAndProse(text);
  return {
    numbers: text.match(/[+-]?\p{N}+(?:[.,:/–-]\p{N}+)*/gu) || [],
    quantities_with_units: text.match(/(?:[%₺€$]\s*[+-]?\p{N}+(?:[.,]\p{N}+)*|[+-]?\p{N}+(?:[.,]\p{N}+)*\s*(?:kg|mg|µg|μg|g|ml|mL|m²|m³|cm|mm|km|m|L|l|kWh|Wh|kW|W|°C|TL|TRY|USD|EUR|₺|€|\$|%|saniye|dakika|saat|gün|hafta|ay|yıl))(?![\p{L}\p{M}])/gu) || [],
    links: prose.match(/!?\[[^\]\n]*\]\([^)\n]*\)|https?:\/\/[^\s<>()]+/gu) || [],
    quotes: prose.match(/“[^”]*”|«[^»]*»|"(?:\\.|[^"\\])*"/gu) || [],
    inline_code: prose.match(/`[^`\n]+`/gu) || [],
    fenced_code: code,
    headings: prose.split('\n').filter(line => /^ {0,3}#{1,6}(?:\s|$)/u.test(line)),
    table_lines: prose.split('\n').filter(line => /^\s*\|.*\|\s*$/u.test(line)),
    list_markers: [...prose.matchAll(/^\s*(?:[-*+]|\d+[.)])(?=\s)/gmu)].map(m => m[0].trim()),
  };
}

function literalCount(text, value) {
  let count = 0, start = 0;
  while ((start = text.indexOf(value, start)) !== -1) {
    count++;
    start += value.length;
  }
  return count;
}

export function protectedValueRisks(source, output, {protectedValues = []} = {}) {
  requireText(source, 'source'); requireText(output, 'output');
  if (!Array.isArray(protectedValues) || protectedValues.some(x => typeof x !== 'string' || !x)) {
    throw new TypeError('protectedValues must contain nonempty literal strings');
  }
  const before = protectedSnapshot(source), after = protectedSnapshot(output), flags = [];
  for (const category of Object.keys(before)) {
    const difference = valueDifference(before[category], after[category]);
    if (difference.changed) flags.push({category, ...difference});
  }
  for (const value of new Set(protectedValues)) {
    const beforeCount = literalCount(source, value), afterCount = literalCount(output, value);
    if (beforeCount !== afterCount) flags.push({category: 'custom_literal', value, before_count: beforeCount, after_count: afterCount});
  }
  return {
    scope: SCOPE,
    has_literal_or_structure_risk: flags.length > 0,
    flags,
    semantic_fidelity: 'not_assessed',
    requires_semantic_review: true,
  };
}

function tokenDistance(a, b, cellLimit) {
  let start = 0, endA = a.length, endB = b.length;
  while (start < endA && start < endB && a[start] === b[start]) start++;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) { endA--; endB--; }
  let x = a.slice(start, endA), y = b.slice(start, endB);
  if (!x.length || !y.length) return {distance: x.length + y.length, reason: null};
  if (x.length * y.length > cellLimit) return {distance: null, reason: 'distance_cell_limit'};
  if (x.length > y.length) [x, y] = [y, x];
  let previous = Array.from({length: x.length + 1}, (_, i) => i);
  for (let j = 1; j <= y.length; j++) {
    const current = new Array(x.length + 1);
    current[0] = j;
    for (let i = 1; i <= x.length; i++) {
      current[i] = Math.min(current[i - 1] + 1, previous[i] + 1, previous[i - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return {distance: previous[x.length], reason: null};
}

export function editMetrics(source, output, {maxDistanceCells = 25_000_000} = {}) {
  requireText(source, 'source'); requireText(output, 'output');
  if (!Number.isSafeInteger(maxDistanceCells) || maxDistanceCells < 0) throw new RangeError('maxDistanceCells must be a nonnegative safe integer');
  const a = editTokens(source), b = editTokens(output);
  const {distance, reason} = tokenDistance(a, b, maxDistanceCells);
  return {
    scope: SCOPE,
    exact_match: source === output,
    whitespace_only_change: source !== output && source.replace(/\s+/gu, ' ').trim() === output.replace(/\s+/gu, ' ').trim(),
    source_tokens: a.length,
    output_tokens: b.length,
    token_levenshtein_distance: distance,
    normalized_token_distance: distance === null ? null : distance / Math.max(a.length, b.length, 1),
    distance_not_computed_reason: reason,
    source_words: words(source).length,
    output_words: words(output).length,
    editorial_success: 'not_assessed',
    semantic_fidelity: 'not_assessed',
  };
}

function stats(values) {
  if (!values.length) return {mean: null, standard_deviation: null, coefficient_of_variation: null};
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const deviation = Math.sqrt(values.reduce((sum, x) => sum + (x - mean) ** 2, 0) / values.length);
  return {mean, standard_deviation: deviation, coefficient_of_variation: mean ? deviation / mean : null};
}

function repetition(values) {
  const counts = [...frequency(values).values()];
  const excess = counts.reduce((sum, n) => sum + Math.max(0, n - 1), 0);
  return {items: values.length, repeated_types: counts.filter(n => n > 1).length, excess_occurrences: excess, excess_fraction: values.length ? excess / values.length : null};
}

export function descriptiveMetrics(text) {
  requireText(text, 'text');
  const prose = codeAndProse(text).prose;
  const tokens = words(prose), lower = tokens.map(x => x.toLocaleLowerCase('tr'));
  const paragraphs = prose.split(/\n\s*\n/gu).map(x => x.trim()).filter(x => words(x).length);
  const hasSegmenter = typeof Intl.Segmenter === 'function';
  const sentences = (hasSegmenter
    ? [...new Intl.Segmenter('tr', {granularity: 'sentence'}).segment(prose)].map(x => x.segment)
    : prose.split(/(?<=[.!?])\s+|\n\s*\n/gu)).map(x => x.trim()).filter(x => words(x).length);
  const normalize = x => x.toLocaleLowerCase('tr').replace(/\s+/gu, ' ').trim();
  const trigrams = [];
  for (let i = 0; i + 2 < lower.length; i++) trigrams.push(lower.slice(i, i + 3).join(' '));
  return {
    scope: SCOPE,
    method: 'Unicode word tokens; fenced code excluded; sentence boundaries are approximate',
    sentence_segmenter: hasSegmenter ? 'Intl.Segmenter(tr)' : 'punctuation_fallback',
    words: tokens.length,
    characters: Array.from(text).length,
    paragraphs: paragraphs.length,
    sentences: sentences.length,
    words_per_sentence: stats(sentences.map(x => words(x).length)),
    words_per_paragraph: stats(paragraphs.map(x => words(x).length)),
    characters_per_word: stats(tokens.map(x => Array.from(x).length)),
    type_token_ratio: lower.length ? new Set(lower).size / lower.length : null,
    repeated_trigrams: repetition(trigrams),
    repeated_sentences: repetition(sentences.map(normalize)),
    repeated_paragraphs: repetition(paragraphs.map(normalize)),
    interpretation: 'Length- and genre-sensitive descriptions; no preferred range, readability grade, quality score, or authorship probability',
  };
}

export function stabilityMetrics(source, outputs, options = {}) {
  requireText(source, 'source');
  if (!Array.isArray(outputs) || outputs.length < 1 || outputs.length > 3) throw new RangeError('outputs must contain one to three successive passes');
  outputs.forEach((x, i) => requireText(x, `pass ${i + 1}`));
  const sequence = [source, ...outputs];
  const transitions = outputs.map((output, i) => ({
    pass: i + 1,
    edit: editMetrics(sequence[i], output, options),
    protected_values: protectedValueRisks(sequence[i], output, options),
  }));
  let stableAfter = null;
  for (let i = 0; i < outputs.length - 1; i++) {
    if (outputs.slice(i + 1).every(value => value === outputs[i])) { stableAfter = i + 1; break; }
  }
  const cycles = [];
  for (let i = 0; i < sequence.length; i++) for (let j = i + 2; j < sequence.length; j++) {
    if (sequence[i] === sequence[j] && sequence.slice(i + 1, j).some(value => value !== sequence[i])) cycles.push({from_pass: i, to_pass: j});
  }
  return {
    scope: SCOPE,
    passes: outputs.length,
    transitions,
    source_to_final: editMetrics(source, outputs.at(-1), options),
    exact_stability_observed_after_pass: stableAfter,
    exact_cycles: cycles,
    editorial_success: 'not_assessed',
    semantic_fidelity: 'not_assessed',
    interpretation: 'Stability can preserve a bad edit; unchanged output can miss a real defect. Neither is an editorial pass.',
  };
}

function normalizeChoice(value) {
  if (typeof value !== 'string') return null;
  const result = value.trim().toUpperCase().replaceAll('İ', 'I').replaceAll('Ş', 'S');
  return ['A', 'B', 'ESIT'].includes(result) ? result : null;
}

function duplicateJsonKeys(text) {
  // JSON.parse validates syntax first. Scan string tokens to retain duplicate key
  // evidence that JSON.parse would otherwise erase. Only a flat object is accepted.
  const keys = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '"') continue;
    const start = i++;
    while (i < text.length) {
      if (text[i] === '\\') { i += 2; continue; }
      if (text[i] === '"') break;
      i++;
    }
    let after = i + 1;
    while (/\s/u.test(text[after] || '') && after < text.length) after++;
    if (text[after] === ':') keys.push(JSON.parse(text.slice(start, i + 1)));
  }
  return keys.length !== new Set(keys).size;
}

export function parseJudgeOutput(raw, {atLimit = false, finishReason = null} = {}) {
  const invalid = reason => ({valid: false, choice: null, reason, format: null, explanation: null});
  if (atLimit || ['length', 'max_tokens', 'max_output_tokens'].includes(finishReason)) return invalid('truncated');
  if (typeof raw !== 'string' || !raw.trim()) return invalid('empty_or_nontext');
  let content = raw.trim();
  const plain = normalizeChoice(content);
  if (plain) return {valid: true, choice: plain, reason: null, format: 'plain_label', explanation: null};
  let format = 'json';
  if (content.startsWith('```')) {
    const fenced = content.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/u);
    if (!fenced) return invalid('invalid_fence');
    content = fenced[1].trim();
    format = 'fenced_json';
  }
  let data;
  try { data = JSON.parse(content); } catch { return invalid('invalid_json_or_label'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return invalid('invalid_schema');
  if (duplicateJsonKeys(content)) return invalid('duplicate_json_keys');
  const keys = Object.keys(data), choiceKeys = keys.filter(x => ['choice', 'secim'].includes(x));
  const reasonKeys = keys.filter(x => ['reason', 'gerekce'].includes(x));
  if (choiceKeys.length !== 1 || reasonKeys.length > 1 || keys.some(x => !['choice', 'secim', 'reason', 'gerekce'].includes(x))) return invalid('invalid_schema');
  const choice = normalizeChoice(data[choiceKeys[0]]);
  if (!choice) return invalid('invalid_choice');
  const explanation = reasonKeys.length ? data[reasonKeys[0]] : null;
  if (explanation !== null && (typeof explanation !== 'string' || !explanation.trim())) return invalid('invalid_explanation');
  return {valid: true, choice, reason: null, format, explanation};
}

export function validateSemanticFixtures(fixtures) {
  if (!Array.isArray(fixtures) || !fixtures.length) throw new TypeError('nonempty fixture array required');
  const ids = new Set();
  for (const fixture of fixtures) {
    const valid = fixture && typeof fixture.id === 'string' && fixture.id && !ids.has(fixture.id)
      && fixture.split === 'development' && fixture.provenance === 'project_generated' && fixture.human_reviewed === false
      && ['short', 'paragraph'].includes(fixture.context)
      && ['contrast', 'paraphrase_control'].includes(fixture.test_kind)
      && typeof fixture.category === 'string' && fixture.category
      && typeof fixture.source === 'string' && fixture.source.trim()
      && fixture.candidates && typeof fixture.candidates.A === 'string' && fixture.candidates.A.trim()
      && typeof fixture.candidates.B === 'string' && fixture.candidates.B.trim() && fixture.candidates.A !== fixture.candidates.B
      && fixture.gold && ['A', 'B', 'ESIT'].includes(fixture.gold.choice)
      && typeof fixture.gold.explanation === 'string' && fixture.gold.explanation.trim()
      && typeof fixture.gold.defect === 'string'
      && (fixture.test_kind === 'paraphrase_control') === (fixture.gold.choice === 'ESIT');
    if (!valid) throw new Error(`Invalid semantic fixture: ${fixture?.id || '(missing id)'}`);
    ids.add(fixture.id);
  }
  return {total: fixtures.length, scope: 'project_generated_development_not_human_gold', human_reviewed: false};
}

export function buildJudgePayload(fixture, {swap = false} = {}) {
  if (typeof swap !== 'boolean') throw new TypeError('swap must be boolean');
  requireText(fixture?.source, 'fixture.source');
  requireText(fixture?.candidates?.A, 'fixture.candidates.A');
  requireText(fixture?.candidates?.B, 'fixture.candidates.B');
  // Whitelist source and candidates. Never spread fixture objects into model input.
  return {kaynak: fixture.source, A: fixture.candidates[swap ? 'B' : 'A'], B: fixture.candidates[swap ? 'A' : 'B']};
}

export function expectedJudgeChoice(fixture, {swap = false} = {}) {
  if (typeof swap !== 'boolean') throw new TypeError('swap must be boolean');
  const choice = fixture?.gold?.choice;
  if (!['A', 'B', 'ESIT'].includes(choice)) throw new Error('Invalid fixture gold choice');
  return swap && choice !== 'ESIT' ? (choice === 'A' ? 'B' : 'A') : choice;
}
