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
