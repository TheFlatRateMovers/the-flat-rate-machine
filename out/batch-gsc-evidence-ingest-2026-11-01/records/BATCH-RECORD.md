# Batch record — GSC outcome-evidence ingest, second input (2026-11-01)

Batch dir: `out/batch-gsc-evidence-ingest-2026-11-01/` (backup/, records/, work/).
Order: the ingest guard in the booking for gsc-indexing-pass-2026-11-01 — confirm the corrected tooling/folder first, then ingest that pass's verdicts through the tool's own runbook.

## Ingest guard — PASSED

- `paths.json` registry resolves repo_dir and tools_dir to the canonical standing folder `~/workspace/the-flat-rate-machine/repo-dir` (the folder-fix batch of 2026-10-31). No compiled-in stale pointer: the tool resolves every path through the registry (CLI > env > registry > hard error).
- `scripts/ingest-outcome-evidence.py` is byte-identical to the canonical mirror copy (`repo-dir/ingest-outcome-evidence.py`, diff clean).
- Provenance proof run twice (before the pass and again immediately before the ingest): verify-provenance against the public signed index with `--repo-dir` = canonical folder → **492 match, 0 mismatch, 0 unresolved — PROVENANCE OK** (kid theflatratemovers-2026-10-29-1). The folder reproduces the current signed index (492 distributions, grown from 470 at the folder fix; later batches updated the mirror in the same motion, as required).

## Source of verdicts

The 2026-11-01 09:40 EST Search Console indexing pass (property sc-domain:theflatratemovers.com, ratemovers@gmail.com): 17 URLs inspected — 4 already indexed, 9 not-indexed with indexing request succeeded, 2 not-indexed with request failed on Google's 'Oops! Something went wrong' error, 2 not-indexed with request failed on Google's daily quota. Transcribed into `work/verdicts-gsc-indexing-pass-2026-11-01.json` (kind=indexing, source=gsc-indexing-pass, observed_at=2026-11-01). Failed requests are recorded in the detail text as attempted-and-failed, never as requested; 'URL is unknown to Google' and 'Discovered - currently not indexed' verdicts record as observations only per the tool's honesty contract; the 4 indexed verdicts and the 2 'Crawled - currently not indexed' verdicts claim gate states.

## Ingest result (tool output, live DB)

- Dry-run on a scratch copy of the DB (--no-chain) produced identical stats before the live run.
- Live run: verdicts 17 · urls_matched 17 · urls_unmatched [] · rows_updated 405 · evidence_appended 485 · evidence_skipped_duplicates 0 · gate_changes 160.
- Evidence log: 161 → **646 rows**, all new rows source `gsc-indexing-pass 2026-11-01`.
- Generator regenerated in the same motion: rowsDigest `a3238842a4254f61782b1cd3b88e81c80836882437afed14ef2da622bf3f5a37`; dataset republished to public/: 190,349 B, SHA-256 `9f52199b35de9c6424392e59f62760c9e9756c956f9992bde5b52ee36b77a491`.
- Reseal: distributions 492 · gaps 0 · signed kid `theflatratemovers-2026-10-29-1` · **PROVENANCE OK (492 match, 0 mismatch, 0 unresolved)** · run ledger chain_completed_at set.

## Gates run

- verify.js full suite after the reseal, before deploy: **139/140** — the single failure was P-6 (repo-served distribution digests vs live served bytes), expected mid-motion because the resealed files were not yet deployed; re-run after deploy is recorded below/in the pass report.

## Deploy + API cadence

- Pages deploy (the-flat-rate-movers-pages, wrangler 4.156.0, token via the custom.cloudflare connector surrogate): **exactly 3 files uploaded** (datasets-intent-coverage.json, ai-master-index.json, ai-master-index.jws); deployment https://312d46b9.the-flat-rate-movers.pages.dev.
- API worker: refresh-bundle → **signed-index digest matches 42/42 compared** (44 files fetched); tests **51 passed, 0 failed**; redeployed, Current Version ID `46bd72ac-d83c-480a-aed3-dbd9711a7bb1`.
- Live check: /v1/verify?file=datasets-intent-coverage.json → match:true, source live, digest `9f52199b…` == sealed digest; /v1/index serves the resealed index (intent dataset byteSize 190349).

## Pushes

Recorded in the pass report after completion (ai: dataset + index + jws; machine: this batch's record files).

## Not touched

No site content, no pages, no quote form, no other datasets; no GSC requests in this batch (the pass itself made them; the 2026-11-02 pass carries the undone queue forward under its own booking).
