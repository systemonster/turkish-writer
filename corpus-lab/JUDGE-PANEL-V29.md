# V29 — AI editorial judge panel (development only)

Date: 2026-11-26 (Türkiye). User approved a Hugging Face-only AI judge pilot; no new API key or service is required. The existing human-editor release gate in HOLDOUT.md remains unchanged. This is not a claim of human-independent validation.

## Why

V27 (72 attempts, 70 finished texts) used two producers: openai/gpt-oss-120b and Qwen/Qwen3-32B. To avoid grading one's own outputs, V29 candidates use three different base-model families. They are candidates, not certified editors. Google/gemma-3-27b-it was inaccessible (HF_FS_ACCESS_DENIED), and Cohere Aya is gated; do not circumvent access restrictions. Smaller Phi is a deliberately inexpensive multilingual comparison, not an assumed expert.

## Frozen diagnostic pilot

Implementation and project-authored fictional fixtures: [3bba86f](https://github.com/systemonster/turkish-writer/commit/3bba86ffc9385607be5248e204092c885604011a), corpus-lab/judge-panel-v29.py (git blob 7836e18e894676fa998b7e7f82cb1a63d1553db6).

17 cases (15 target faults, 2 identical controls), both A/B orders, 34 decisions per model, 102 planned in total. No model sees answer keys or other judges' decisions. Each decision must give a preference, per-side issues, category, criticality, literal evidence and justification. A quote must occur in the corresponding candidate. The target anchor must be contained in an identified quote; this deliberately stringent matcher can underestimate correct diagnoses and requires qualitative inspection. Generation and JSON failures are retained. The 34 orientations are not 34 independent documents; report pair-level consistency separately. The set is short and synthetic, and was built after observing V26/V27 faults. It is not a blind independent holdout, a human gold standard, or a general accuracy estimate.

Admission to a subsequent **development-only** panel: all 34 valid, >=32 correct preferences, all 24 critical target orientations detected with matching category and evidence, zero false critical alarms on acceptable candidates, >=16/17 order-consistent pairs, all four identical controls equal, >=28/30 target detections overall. Do not relax these thresholds retroactively. Distinguish machine evidence checks from actual linguistic judgement. If no three distinct eligible families remain, do not fabricate consensus or relabel weaker judges as qualified. Review actual errors before considering new candidates. If three qualify, evaluate frozen V27 output pairs with blinded model/arm identities, both presentation orders, and independent votes. No judge grades outputs by its own model family. Critical evidence and disagreements are inspected individually; an averaged preference cannot erase critical faults. Subsequent longer, source-separated and independently reviewed material is required to establish transfer.

## Sources and model permissions

- Mistral AI, [Mistral Small 3.2 24B Instruct 2506](https://huggingface.co/mistralai/Mistral-Small-3.2-24B-Instruct-2506), Apache-2.0, Mistral tokenizer/load/config format as documented in its card.
- Yıldız Technical University COSMOS AI Research Group, [Turkish-Gemma-9b-T1](https://huggingface.co/ytu-ce-cosmos/Turkish-Gemma-9b-T1), Gemma license/terms, derived from Turkish-Gemma-9b-v0.1 and Gemma 2. Public repository, reasoning model; card recommends sampling rather than greedy decoding. Use for research only, no weights redistributed.
- Microsoft, [Phi-4-mini-instruct](https://huggingface.co/microsoft/Phi-4-mini-instruct), MIT, multilingual including Turkish per model card.
- [vLLM](https://github.com/vllm-project/vllm) 0.11.0, Apache-2.0, developer experiment only. Model revisions and tokenizer hashes must be recorded in the preflight receipt before inference.
- All diagnostic sentences are original project-authored examples, not copied from external corpora. No third-party prose or model weights committed.
- [HF Jobs pricing](https://huggingface.co/docs/hub/en/jobs-pricing), checked 26 Nov 2026. Billed starting/running time may differ from wall-clock estimate.

## Run ledger

| job ID | role | hardware | bounded duration | nominal max tariff estimate | status at submission |
|---|---|---|---|---|---|
| 6b0760f6d91f621b9309192b | pinned code + real tokenizer preflight | CPU Upgrade | 5 min | USD 0.0025 | SCHEDULING |

No new GPU was launched yet. Prior V27 GPU and monitor terminated; exact IDs in README V28. Before any GPU launch recheck active Turkish Writer jobs, terminal preflight logs, private receipt hash, exact model revisions and hardware. Intended single RTX PRO 6000 (96 GB, USD 2.75/h), one model per sequential process, bounded <=50 minutes if justified, nominal maximum USD 2.2917; each subprocess <=15 minutes. Start only with verified source/preflight and adequate credential lifetime; monitor exact ID only, 15-second poll and finite timeout. Never touch other projects. Private outputs: lovefengis/turkish-writer-historical-review-v10/v29-judge-calibration/. No finished performance or costs claimed yet; close ledger with actual terminal timestamps, failures, and cost bounds; record cumulative cost without inventing previous missing billing. No master/release changes.

### Execution update — 26 November 2026, Türkiye

Preflight 6b0760f6d91f621b9309192b: COMPLETED, terminal 2026-11-25 22:29:34.960 UTC; 17 cases/34 decisions; three model tokenizers verified. Wall-clock elapsed from creation 88.204 s; at USD 0.03/h this is a USD 0.000735 wall-rate estimate, not actual billing. Receipt SHA-256 4aa8d05113d9ac1036c48dcb751fdd325789674b73457495b142e3612b70e97f; source SHA-256 c00c6df041465494f7f71c9c9f309e7cc69eac63aee9e1eede43a2ea0bf6d99f; fixture SHA-256 a37ddcc214ab880ca15458648f87f965d2b99e0c9b3247b3902080a874809b6a.

Frozen model revisions: Mistral 95a6d26c4bfb886c58daf9d3f7332c857cb27b43; YTÜ Gemma bc2e3064994eefab3c9043ff58c5b3c7cbfc6c40; Phi cfbefacb99257ffa30c83adab238a50856ac3083.

| job ID | role | hardware | bounded duration | nominal max tariff estimate | last verified status |
|---|---|---|---|---|---|
| 6b0761a7d91f621b93091b21 | sequential three-model calibration | RTX PRO 6000 | 50 min | USD 2.2917 | SCHEDULING (container image pull) |
| 6b0761c1b6a90bbe997e96ab | exact-ID polling monitor, no new GPU launch | CPU basic | 55 min | USD 0.009167 | RUNNING, monitoring target SCHEDULING |

GPU bootstrap verifies the frozen Git blob and SHA-256, self-test, private manifest identity, and remaining token lifetime before starting calibration. Monitor polls every 15 s, validates job labels, checks terminal markers and private model checkpoints, and saves a private receipt. Combined nominal maximum of these two newly submitted jobs: USD 2.300867; actual billing not yet known. No result is claimed before verifying terminal artifacts. Continue this exact experiment rather than launching a duplicate; do not modify other projects.

### Terminal result — 26 November 2026 (Türkiye)

[GPU 6b0761a7d91f621b93091b21](https://huggingface.co/jobs/lovefengis/6b0761a7d91f621b93091b21) and [monitor 6b0761c1b6a90bbe997e96ab](https://huggingface.co/jobs/lovefengis/6b0761c1b6a90bbe997e96ab) COMPLETED. All 102 planned records exist, all model artifact hashes were checked by the monitor, and all terminal model files were independently read for ID coverage and summary. Receipt SHA-256 344bf7d6998c505b88f58adce1992f5f1d317a1da93dac90bab5623df609c4b2. Full model/revision/case/order/decision/status/hash and separate cost ledger: [judge-panel-v29-terminal.json](results/judge-panel-v29-terminal.json), commit 45e2747961a69d5d397137876bdc6f67c1d3d10a.

| Model | Valid /34 | Correct preference /34 | Critical targets /24 | False critical alarms on acceptable text | Order-consistent /17 | Admitted |
|---|---:|---:|---:|---:|---:|---|
| Mistral Small 3.2 24B | 31 | 20 | 5 | 3 | 8 | No |
| Turkish Gemma 9B T1 | 12 | 9 | 1 | 0 | 2 | No |
| Phi-4 Mini | 17 | 8 | 2 | 11 | 0 | No |

Technical completion is not judge qualification. No three-judge panel exists. 42/102 responses were invalid despite normal stop; among the valid decisions there are substantive false preferences and false critical alarms. The strict anchor/category check undercounts some meaningful diagnoses: Gemma j29-04-1 identified the reversed actors correctly under source/brief instead of actor; Phi j29-07-1 identified the changed technical number under number instead of technical. But this does not explain the failure: Mistral j29-01-1 explicitly preferred the reversed negation, j29-03-1 treated the original uncertainty as an unwanted weakening, and j29-05-0 claimed both distinct numeric orders were the same. Phi j29-05-0 preferred the reversed counts, while Gemma j29-13-1 called an actual spelling error a valid informal abbreviation. Gemma j29-06-1 explained a fabricated source in free-text reasoning but omitted its required issue entry. These diagnoses are project AI review, not independent human votes. Do not admit models retroactively or use V29 to adjudicate V27.

Cost from three job lifecycles at the official rates: approximately USD 0.546061228 wall-rate estimate, nominal combined maximum USD 2.303333333; actual bill unknown. GPU wall duration 711.331 s, monitor 701.405 s. The known V28 corpus-ledger estimate plus V29 is USD 12.126418175; this excludes separate V26/V27 costs and earlier unknown costs and is not the entire invoice. No other project resources changed.

**Next diagnostic approach:** Do not repeat the same A/B prompt with these rejected models. The observed A/B identity swaps, category mismatch and contradictory summaries justify a simpler source-first single-candidate fault assessment, with literal evidence, a separate semantic correctness decision and deterministic comparison derived by the evaluator. Constrained structured output may isolate format from reasoning, but does not make judgments true. Keep V29's frozen result intact. A subsequent comparison needs stronger eligible families, new source-separated longer cases, independent human labels for release, and actual errors reviewed rather than merely changing threshold or counting votes. Prioritize actual skill improvements over a new expensive judge loop.
