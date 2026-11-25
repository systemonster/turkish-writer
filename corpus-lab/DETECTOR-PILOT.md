# Turkish Writer detector pilot

Authorship detectors are an optional diagnostic alongside editorial review. A detector score is not a writing-quality score, a factuality test, or a release gate. This pilot records what each provider actually returned and keeps missing results visibly incomplete.

## Observed run: 25 November 2026

The input file is `corpus-lab/detector-pilot-v10-inputs.jsonl`. The evidence record is `corpus-lab/results/detector-pilot-v10.json`.

Both texts were authored by the assistant for this development experiment. They describe the same explicitly fictional bookshop scenario. The first deliberately uses repetitive and nominalized prose; the second is an assistant-authored edit intended to read more clearly. They are **not human reference texts, human edits, or Turkish Writer V2 outputs**. Their local whitespace word counts are 264 and 253, a maximum/minimum ratio of 1.0435. The intended style difference has not been independently rated by human editors.

| Provider and visible model | Raw case | Edited case | Evidence available |
| --- | --- | --- | --- |
| Pangram 4.1 | AI Generated; high confidence; AI 100%, AI-assisted 0%, Human 0% | AI Generated; high confidence; AI 100%, AI-assisted 0%, Human 0% | Overview plus Details, one whole-document segment per case |
| Originality Model 5.0, selected in free form | No verified result; score remained `--%` | Not submitted | Input accepted; Scan and one semantic retry produced no visible result |

Pangram observations were recorded at `2026-11-25T09:38:02.462Z` and `2026-11-25T09:41:26.105Z`. Its scanned-word counts were 271 and 260; these are retained separately from the local counts. The dashboard showed 20 free credits initially and 14 after two scans. No account or subscription was created. This observed free access is not a guarantee of future availability.

The Originality outcome was checked at `2026-11-25T09:41:55.340Z`. There was no visible error, sign-in request, or interactive CAPTCHA; the cause of the unchanged form is unknown. A failed attempt to obtain a score must not be treated as zero AI or a passed test.

**Interpretation:** the two known model-authored texts received the same displayed Pangram result. This pair supplies no score-based distinction between the intended styles and no sentence-specific editing diagnosis. It provides no estimate of false positives, detector accuracy, human preference, or V2 improvement. Hidden decimals and API responses were not obtained from the browser. No offsets or sentence scores were invented.

The live result was left on the [official Pangram dashboard](https://www.pangram.com/dashboard). That URL is not a persistent public result link; the complete local evidence record is the reproducible record of this observation. The Originality attempt used its [official free form](https://originality.ai/).

## Dependency-free API runner

`corpus-lab/detector-pilot.mjs` uses Node.js 18 or later and built-in modules. Default mode validates inputs and writes a plan; it makes no external requests.

```sh
node corpus-lab/detector-pilot.mjs \
  --input corpus-lab/detector-pilot-v10-inputs.jsonl \
  --out /tmp/turkish-writer-detector-plan \
  --providers pangram,originality
```

Use a fresh output directory. Execution is explicit:

```sh
node corpus-lab/detector-pilot.mjs \
  --input corpus-lab/detector-pilot-v10-inputs.jsonl \
  --out /tmp/turkish-writer-detector-api \
  --providers pangram \
  --max-words 1000 \
  --execute
```

The runner reads only `PANGRAM_API_KEY`, `ORIGINALITY_API_KEY`, or `GPTZERO_API_KEY` for the selected provider. Provide credentials through the execution environment; do not put them in JSONL, reports, source files, or command arguments. `--max-words` is a cap on input words **per provider**, not a currency budget or a total across providers. Check the relevant account's authorized credit budget before execution.

No matching callable detector plugin and no provider API credential were available in this session. **The API adapters have fixture-based tests, but have not been validated against live authenticated responses.** The two completed scans above used the website UI and are recorded separately. GPTZero has an optional adapter and was not scanned in this run.

Originality execution also requires `--originality-autotopup-disabled`. This is an operator assertion that automatic credit purchase is disabled for the relevant account; the flag does not inspect or change account settings. The guard exists because [Originality's official API guidance](https://docs.originality.ai/llms.txt) describes automatic credit top-up. Without both the key and this explicit assertion, that branch emits a blocked status without a network request.

## Input contract

Each JSONL row contains:

| Field | Contract |
| --- | --- |
| `id`, `pair_id`, `arm` | Stable, safe identifiers; unique case IDs and distinct arms within each pair |
| `language` | `tr` |
| `genre` | Same genre for all members of a pair |
| `ownership` | `project-owned`; third-party passages are rejected |
| `declared_source_type` | `synthetic_ai_original`, `synthetic_ai_edited`, or `project_human_original` |
| `author_type` | `model` for synthetic inputs, `human` for a declared human control |
| `source_evidence` | Explicit provenance, with the source and any transformation recorded |
| `text` | Exact submitted plain text, at least 100 whitespace words and at most 50,000 characters |

At least two arms are required per pair. The plan reports word counts and length ratios; it flags ratios above 1.25 rather than silently hiding the mismatch. The development pair above follows the stricter requested 10% matching limit. Prefer a single genre, similar lengths, fixed factual content, and the same provider version when comparing results.

A declared human source type is not proof of provenance. The reviewer must verify authorship before using it as a human control. Generated passages must retain their generated label even when heavily edited. The present pilot contains no human controls.

## Normalized result contract

Each completed API record retains the provider, input hash, pair and arm, declared source type, requested selector, reported model version, timestamp, classification, native scores, score semantics, spans, and a hash and file path for the raw response. `editorial_quality_verdict` remains `null`.

Provider-native scores stay separate:

- Pangram: fractions of text classified as AI, AI-assisted, and human. Window confidence and available class probabilities remain attached to each window. The requested `pangram-4` selector can serve a changing minor version, so the response version is saved.
- Originality 5.x: estimated AI-involvement percentage, not the former model's confidence score. The adapter does not reinterpret older-model scores as 5.x scores.
- GPTZero: document class probabilities for human, AI, and mixed, not percentages of text. Available sentence scores and highlighting are retained separately.

Pangram may normalize the input. Its offsets refer to its returned text, so the adapter verifies each span by exact slicing against that text. Offsets are mapped onto the submitted original only when the entire returned text is identical. If character indexing cannot be verified as UTF-16, offsets remain unverified and the record is incomplete; the runner does not guess a conversion. GPTZero sentences are bound by sequential exact matches to the submitted text. UI-only records have no fabricated API fields.

Missing model versions, missing classifications, invalid document probabilities, and missing or invalid span bindings produce `incomplete` records. Empty responses never become a zero-AI result. Completed response bodies are cached locally. Pangram task IDs are saved so polling can resume without submitting a second task. An uncertain POST outcome is not retried automatically. The summary is complete only when every requested provider/case record meets the recorded-data contract.

## Verification and sources

Run the focused test suite:

```sh
node --test corpus-lab/tests/detector-pilot.test.mjs
```

The tests cover declared provenance, genre and length checks, missing data, probability semantics, normalized-text offsets, no-network blockers, credential redaction, uncertain submission outcomes, async resumption, response caching, and model availability. Test fixtures are synthetic and do not count as live provider scans.

Primary documentation checked on 25 November 2026:

- [Pangram AI Detection API](https://docs.pangram.com/api-reference/ai-detection): async tasks, score fields, returned-text offsets, model version and window confidence.
- [Pangram Models API](https://docs.pangram.com/api-reference/models): available selectors depend on the API key; minor versions can change.
- [Originality API documentation](https://docs.originality.ai/): `/api/v3/scan`, model selectors, request flags and response fields.
- [Originality documentation index](https://docs.originality.ai/llms.txt): API access and automatic top-up behavior.
- [GPTZero Quickstart](https://docs.gptzero.me/quickstart/): authentication, prediction endpoint and class probability semantics.
- [GPTZero API reference](https://docs.gptzero.me/api-reference/): automatic language selection, version selection and the separate, access-controlled AI Patterns endpoint. The adapter does not call AI Patterns.

Vendor documentation establishes interface contracts, not independently verified accuracy on Turkish editorial work. Retain the blind editorial review, semantic checks, and any verified human controls as separate evidence.
