# Data and provenance

BOUN-derived files:
- results/boun-train-v1.json
- ../skills/turkish-writer/references/derlem-bulgulari.md

Source: UD Turkish BOUN, TABILAB, Boğaziçi University and named contributors. https://github.com/UniversalDependencies/UD_Turkish-BOUN/tree/09521f40c90904df85524b8e0b43afba6e4c7823
Source license: https://creativecommons.org/licenses/by-sa/4.0/
Derived aggregate outputs are made available under CC BY-SA 4.0. No source sentences are redistributed. The scripts and independently authored synthetic examples retain the repository MIT license.

Historical blog-derived files:
- results/historical-blog-profile-v1.json
- ../skills/turkish-writer/references/tarihsel-blog-bulgulari.md

Source: Daron Yöndem, Turkish blog archive, https://github.com/daronyondem/daron-turkce-blog/tree/e5a5885a9f70d2f30519560a80c6de622aeac945 . Source and derived profile/notes: CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/). No full source posts are redistributed. The profiler code and synthetic cases remain MIT.

Fineweb metadata pilot: https://huggingface.co/datasets/moganai/turkishfineweb2-cleaned (ODC-By database; underlying document rights separate). Aggregate counts only, no source articles distributed. Historical Wikipedia pilot stores links/IDs and aggregate triage, not raw revision excerpts. No human-approved pairs are published.

## Model research attribution (V4)

Models used only in development evaluation, not bundled or required by the skill. Hub model-card license metadata checked 2026-11-25; see exact revisions in the result JSONs. Model weights are not distributed here.

- Qwen team, [Qwen3-8B](https://huggingface.co/Qwen/Qwen3-8B/tree/b968826d9c46dd6066d109eabc6255188de91218), Apache-2.0.
- Qwen team, [Qwen3-32B](https://huggingface.co/Qwen/Qwen3-32B/tree/9216db5781bf21249d130ec9da846c4624c16137), Apache-2.0.
- YTU CE COSMOS, [Turkish-Gemma-9b-v0.1](https://huggingface.co/ytu-ce-cosmos/Turkish-Gemma-9b-v0.1/tree/1bbe9f19a26a70dc4d0c709e1a816e6a9378a7f5), Gemma terms (not MIT); underlying Gemma model by Google. See the model card for contributors and terms.
- [PyTorch](https://github.com/pytorch/pytorch) 2.8.0+cu128 and [Hugging Face Transformers](https://github.com/huggingface/transformers) 4.57.3; development inference libraries, not packaged skill dependencies. Full dependency notice inventory remains a release prerequisite.

The candidate sources listed in [HOLDOUT.md](HOLDOUT.md) are screened but not yet used in experiments; no contribution claim is made.

## Contextual editorial evidence (25 November 2026)

- Source revisions: Daron Yöndem, Turkish blog archive `e5a5885a9f70d2f30519560a80c6de622aeac945`; UD Turkish BOUN, TABILAB / Boğaziçi University and contributors, train only, `09521f40c90904df85524b8e0b43afba6e4c7823`; SUDO Portal authors, [historical archive](https://github.com/ubuntu-tr/ubuntu-tr.github.io/tree/18cd8b55645f92578d120e9fb105487f236fed79), frozen development sample `0b1b8308559a935e6f3be060fe42bc00ed556f02`. Original article author credits and rights evidence are retained in the private source manifest; no source excerpts or additional personal data are distributed here.
- The contextual aggregate and derived guide, `results/context-evidence-v1-summary.json` and `../skills/turkish-writer/references/baglamli-turkce.md`, are CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/), with attribution and source links. The extraction script is independent MIT project code. The guide's illustrative before/after sentences are independently authored, not historical revisions or human-certified gold.
- Private research context windows retain source locator, revision, author or attribution record, license, focus hash and stable evidence ID. They are not included in the skill package. Retrieval is heuristic; no blanket authorship, correctness, or editorial-quality claim follows.

## Historical revision context review (V18, 25 November 2026)

- Source: Turkish Wikipedia contributors, historical article revisions, CC BY-SA 4.0; [Wikimedia Terms of Use](https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use). Exact source links and previous/revised revision IDs are in [the prior candidate inventory](results/wiki-historical-pilot-v1.json); article histories identify the contributors. The new [derived review](results/wiki-context-review-v18.json) and its added section in `../skills/turkish-writer/references/baglamli-turkce.md` are CC BY-SA 4.0, with attribution and independent illustrative examples. The source texts and personal data are not distributed in this repository or the installed skill.
- The read-only recovery script `recover-wiki-revision-pairs.py` is MIT project code. Private contextual excerpts are development candidates only; neither the original revision nor the newer one is assumed to be a verified editorial answer. Later reverts, factual correctness and independent human approval remain unverified. No model weights, external-service dependency or detection optimization was added.
