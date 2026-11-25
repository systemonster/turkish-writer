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

## Historical revision context review and cross-genre guides

- `results/wiki-context-review-v2.json`: Wikipedia contributors, 50 historical Turkish revision pairs recovered with stable revision URLs, attribution links and dates; CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/). Rights evidence: https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use. Private source excerpts are not distributed. Local AI review is not independent human verification.
- `../skills/turkish-writer/references/turkce-kullanim-atlasi.md`: contextual usage guide drawing on the attributed BOUN, Daron, SUDO and Wikipedia evidence above; derived observations under CC BY-SA 4.0. Illustrative sentences are independently authored, not verbatim historical revision pairs.
- `../skills/turkish-writer/references/uzun-anlati.md`: independently authored project guide and fictional examples, repository MIT license. The historical development corpora do not establish literary or book-length editing quality. No external literary source or author imitation is included.

## Full-pass licensed corpus research (25 November 2026)

- `results/full-pass-licensed-v2-summary.json` and the new full-pass section in `../skills/turkish-writer/references/baglamli-turkce.md`: aggregate observations from Daron Yöndem's pinned 2007–2018 archive, UD Turkish BOUN train, the already licensed 20 SUDO development excerpts and 50 recovered Wikipedia revision pairs. Attribution and exact source revisions appear in the summary and earlier entries above. Derived observations are distributed under CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/. No source text, personal data or human-quality claim is published.
- `full-corpus-pass-v2.py` and `full-fineweb-metadata-v2.py`: independent MIT project code. The FineWeb metadata census uses the pinned database only to locate potential source candidates. Furkan Yılmaz, Aleyna Taşdemir, Faruk Gözay and Bekir Top, [TurkishFineweb2-Cleaned](https://huggingface.co/datasets/moganai/turkishfineweb2-cleaned), revision `7c5bd76fa456f1748ceb603d8e57acf24a173339`, ODC-By. Database license does not establish the right to redistribute individual underlying documents. No document text or full URL is retained in the census. Source permissions, attribution and privacy must be reviewed before text is used in a derived skill guide; no authorship or editorial-quality guarantee follows from metadata scores.

## Full SUDO and FineWeb text research (25 November 2026)

- [SUDO full-text aggregate](results/sudo-full-text-v3-summary.json): 103 pinned Markdown posts, 32 author metadata groups, SUDO Portal contributors, archive revision `18cd8b55645f92578d120e9fb105487f236fed79`. Article attribution remains at the original archive; rights evidence is linked in the summary. Source-specific third-party material is not redistributed. Derived contextual observations in the CC BY-SA 4.0 contextual guide have source attribution; independent examples are not copied passages.
- [FineWeb shard-zero text aggregate](results/fineweb-text-shard0-v3-summary.json): pinned TurkishFineweb2-Cleaned database named above, ODC-By attribution retained. The scanner reads eligible texts in memory and exports fixed aggregate categories only, not raw documents, quotations, URLs, names, or extractive n-grams. The pilot processed 240,872 texts within 305,560 rows; neither authorship nor publication rights or editorial quality was verified by the scan. Independent examples in the contextual guide are not adapted source text. The metadata scan and text scan have different scopes.
- `broad-text-research-v3.py` and `fineweb-text-range-v3.py` are independent MIT research code. HF Jobs, huggingface_hub and Apache Arrow/PyArrow are development compute and data-processing tools, not installed skill requirements. [PyArrow project and Apache-2.0 license](https://github.com/apache/arrow). Exact job/runtime and source revisions remain in compute records.
- `references/anlam-incelikleri.md` now includes independently authored reporting examples informed by the BOUN train development context IDs listed in that guide. Source attribution: TABILAB and UD Turkish BOUN contributors, CC BY-SA 4.0, pinned train revision above. Derived observations are attributed under that license; no actual source sentences are distributed. This is not human gold.
