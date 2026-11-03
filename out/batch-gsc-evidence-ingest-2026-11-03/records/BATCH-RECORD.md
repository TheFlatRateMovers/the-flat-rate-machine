# Batch record — GSC outcome-evidence ingest, fourth input (2026-11-03)

Batch dir: `out/batch-gsc-evidence-ingest-2026-11-03/` (backup/, records/, work/).
Order: the ingest guard in the booking for gsc-indexing-pass-2026-11-03 — confirm the corrected tooling/folder first, then ingest that pass's verdicts through the tool's own runbook.

## Ingest guard — PASSED

- `paths.json` registry resolves repo_dir and tools_dir to the canonical standing folder `~/workspace/the-flat-rate-machine/repo-dir`. No compiled-in stale pointer: the tool resolves every path through the registry (CLI > env > registry > hard error).
- `scripts/ingest-outcome-evidence.py` is byte-identical to the canonical mirror copy (`repo-dir/ingest-outcome-evidence.py`, diff clean).
- Provenance proof run at pass start (09:40 ET): **544 match, 0 mismatch, 0 unresolved — PROVENANCE OK** (kid theflatratemovers-2026-10-29-1).
- SEAL-LANE WAIT: at ingest time (~10:30 ET) other estate batches held the shared seal lane back-to-back (FB-series seal.py + verify.js, then the launch-announcement batch's post-deploy verify). The ingest chain was held until the lane was fully clear (no seal/verify/build processes, no public/ changes for 90+ seconds) rather than resealing concurrently — sequential-batch discipline on the shared signed index.
- Provenance proof re-run immediately before the ingest, after the lane cleared: **546 match, 0 mismatch, 0 unresolved — PROVENANCE OK** (grown 544 → 546 by the batches that sealed during the wait, as required). The folder reproduces the current signed index.
- Backups taken before the live run: rubric.db.pre-ingest, ai-master-index.json/.jws, datasets-intent-coverage.json, pre-hashes.txt (in backup/).

## Source of verdicts

The 2026-11-03 09:40 EST Search Console indexing pass (property sc-domain:theflatratemovers.com, ratemovers@gmail.com; browser run 09:42–10:25 EST): 34 URLs inspected — both Launch Protocol pages already indexed (time-to-index ~16.75h and ~15.9h, console step closed for both), 2 sweep pages already indexed, Queue A: 4 indexing requests succeeded and the same 2 dataset pages failed AGAIN with Google's 'Oops! Something went wrong' error (third consecutive pass), Queue B: 20 inspect-only verdicts (13 indexed / 7 not indexed), Census C: first 4 sitemap URLs inspected. NO quota message appeared; the census stopped on session throughput. Transcribed into `work/verdicts-gsc-indexing-pass-2026-11-03.json` (kind=indexing, source=gsc-indexing-pass, observed_at=2026-11-03). Failed requests are recorded in the detail text as attempted-and-failed, never as requested; 'URL is unknown to Google', 'Discovered - currently not indexed' and 'Alternate page with proper canonical tag' verdicts record as observations only per the tool's honesty contract; indexed verdicts and 'Crawled - currently not indexed' verdicts claim gate states.

## Ingest result (tool output, live DB)

- Dry-run on a scratch copy of the DB (--no-chain) produced identical stats before the live run.
- Live run: verdicts 34 · urls_matched 34 · urls_unmatched [] · rows_updated 501 · evidence_appended 753 · evidence_skipped_duplicates 0 · gate_changes 504.
- Generator regenerated in the same motion: rowsDigest `d174290737bf455c19049a69e4ba295fd55e70905f9b5688cf1b0a9b95bd5e86`; dataset republished to public/: 238,328 B, SHA-256 `80f214497e6373a076c137e57edfdc1ec6dad1ca68718614e76f9ebe8685be59`.
- Reseal: distributions 546 · gaps 0 · signed kid `theflatratemovers-2026-10-29-1` · **PROVENANCE OK (546 match, 0 mismatch, 0 unresolved)** · run ledger chain_completed_at set (run f23b4ae144d7…).

## Gates run

- verify.js full suite after deploy: **201/203** — failures: (1) P-6 repo-served digests vs live bytes, 11/29 matched: most non-matches are 'socket hang up' fetch failures to raw.githubusercontent.com (transport, same pattern as 2026-11-02); the 4 fetched byte-size differences are code files belonging to other batches' push lanes (verify.js, build-intent-rubric.js, _middleware.js, route-assets/main.js — GitHub mirror mid-catch-up after the day's Q3/FB seals), NOT this batch's files — the intent dataset, signed index and JWS all match (I-1/I-4/I-5 pass; I-5 confirms the live dataset serves the new rowsDigest). (2) S-4 sitemap lastmod ledger: mismatch=0, uncovered=0, anchor=STALE — the seal anchor advanced past the deployed sitemap because estate batches kept sealing during the verify run (mid-motion artifact of the day's batch cadence, not an ingest defect).
- No pre-deploy verify.js was run: the reseal-to-deploy window was kept tight because the seal lane had just cleared after a ~75-minute wait; the post-deploy suite above is the closing gate and its two failures are accounted for as estate-motion artifacts.

## Deploy + API cadence

- Pages deploy (the-flat-rate-movers-pages, wrangler via the custom.cloudflare connector surrogate): **exactly 3 files uploaded** (datasets-intent-coverage.json, ai-master-index.json, ai-master-index.jws); deployment https://86049570.the-flat-rate-movers.pages.dev.
- API worker: refresh-bundle → **signed-index digest matches 46/46 compared** (48 files fetched); tests **61 passed, 0 failed**; redeployed, Current Version ID `6e619101-b2b3-4674-a880-113669d1c64b`.

## Pushes

- ai repo (TheFlatRateMovers/theflatratemovers-ai, main): dataset + index + jws pushed at `d51264f58859c13053f4978998e38b7e5165b6a7` (sync record: work/push-ai.muse-github-snapshot-sync.json). Remote head before the push was the Q3 mirror sync (seal 1bbe6815, 14:51Z) — behind the live estate; the pushed files are the current provenance-verified signed state, per the runbook.
- machine repo (TheFlatRateMovers/the-flat-rate-machine, main): this batch's record files (BATCH-RECORD.md, ingest-run.log, verdicts JSON) — SHA recorded in the pass report after completion.

## Not touched

No site content, no pages, no quote form, no other datasets; no GSC requests in this batch (the pass itself made them; the 2026-11-04 pass carries the undone URLs forward under its own booking).
