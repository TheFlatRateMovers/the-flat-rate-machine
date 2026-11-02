# Batch record — GSC outcome-evidence ingest, third input (2026-11-02)

Batch dir: `out/batch-gsc-evidence-ingest-2026-11-02/` (backup/, records/, work/).
Order: the ingest guard in the booking for gsc-indexing-pass-2026-11-02 — confirm the corrected tooling/folder first, then ingest that pass's verdicts through the tool's own runbook.

## Ingest guard — PASSED

- `paths.json` registry resolves repo_dir and tools_dir to the canonical standing folder `~/workspace/the-flat-rate-machine/repo-dir`. No compiled-in stale pointer: the tool resolves every path through the registry (CLI > env > registry > hard error).
- `scripts/ingest-outcome-evidence.py` is byte-identical to the canonical mirror copy (`repo-dir/ingest-outcome-evidence.py`, diff clean).
- Provenance proof run twice (at pass start and again immediately before the ingest): verify-provenance against the public signed index with `--repo-dir` = canonical folder → **530 match, 0 mismatch, 0 unresolved — PROVENANCE OK** (kid theflatratemovers-2026-10-29-1). The folder reproduces the current signed index (530 distributions, grown from 492 at the 2026-11-01 ingest by later batches, as required).

## Source of verdicts

The 2026-11-02 09:40 EST Search Console indexing pass (property sc-domain:theflatratemovers.com, ratemovers@gmail.com; browser run 09:42–11:07 EST): 101 URLs inspected — 41 already indexed, 11 not-indexed with indexing request succeeded, 2 not-indexed with request failed on Google's 'Oops! Something went wrong' error, 1 not-indexed with request failed on Google's daily request quota, 3 not-indexed never requested because the quota was already hit, plus inspect-only verdicts for the 32 dataset pages and 32 older-sitemap pages. The pass stopped at D33 on Google's daily URL-inspection quota. Transcribed into `work/verdicts-gsc-indexing-pass-2026-11-02.json` (kind=indexing, source=gsc-indexing-pass, observed_at=2026-11-02). Failed requests are recorded in the detail text as attempted-and-failed, never as requested; 'URL is unknown to Google', 'Discovered - currently not indexed', 'Alternate page with proper canonical tag' and 'Excluded by noindex tag' verdicts record as observations only per the tool's honesty contract; indexed verdicts and 'Crawled - currently not indexed' verdicts claim gate states.

## Ingest result (tool output, live DB)

- Dry-run on a scratch copy of the DB (--no-chain) produced identical stats before the live run.
- Live run: verdicts 101 · urls_matched 101 · urls_unmatched [] · rows_updated 1595 · evidence_appended 2557 · evidence_skipped_duplicates 0 · gate_changes 1818.
- Evidence log: 646 → **3203 rows**, all new rows source `gsc-indexing-pass 2026-11-02` (verify.js I-8 confirms 3203).
- Generator regenerated in the same motion: rowsDigest `0af61533b290ef51d3233990ba494c2b12bb2df5b70563628b4e7d91ca9d9754`; dataset republished to public/: 237,484 B, SHA-256 `1cac6a7142b08116ca3e2a6e93fc861f9040bc0e3887f1d6430ac14837c50595`.
- Reseal: distributions 530 · gaps 0 · signed kid `theflatratemovers-2026-10-29-1` · **PROVENANCE OK (530 match, 0 mismatch, 0 unresolved)** · run ledger chain_completed_at set (run 87abebc92fd7…).

## Gates run

- verify.js full suite after the reseal, before deploy: **182/183** — the single failure was P-6 (repo-served distribution digests vs live served bytes), expected mid-motion because the resealed files were not yet deployed.
- verify.js re-run after deploy: **182/183** — P-6 again the sole failure: 14/28 matched and all 14 non-matches are 'socket hang up' fetch failures to raw.githubusercontent.com — transport failures, not digest mismatches; no fetched file mismatched. I-5 passes: live datasets-intent-coverage.json serves the rubric.db row digest.

## Deploy + API cadence

- Pages deploy (the-flat-rate-movers-pages, wrangler 4.156.2, token via the custom.cloudflare connector surrogate): **exactly 3 files uploaded** (datasets-intent-coverage.json, ai-master-index.json, ai-master-index.jws); deployment https://1e587e77.the-flat-rate-movers.pages.dev.
- API worker: refresh-bundle → **signed-index digest matches 44/44 compared** (46 files fetched); tests **51 passed, 0 failed**; redeployed, Current Version ID `2e6f7b75-9acf-461c-b9fe-ae35361855bd`.
- Live check: the live dataset file itself carries the new rowsDigest `0af61533…` (read directly). The API /v1/verify reader response was a stale cached crawl (crawl timestamp 16:16 UTC) showing the pre-ingest digest with match:true; the settling checks are refresh-bundle 44/44 and verify.js I-5, both passing against live bytes.

## Pushes

Recorded in the pass report after completion (ai: dataset + index + jws; machine: this batch's record files).

## Not touched

No site content, no pages, no quote form, no other datasets; no GSC requests in this batch (the pass itself made them; the 2026-11-03 pass carries the 26 undone URLs forward under its own booking).
