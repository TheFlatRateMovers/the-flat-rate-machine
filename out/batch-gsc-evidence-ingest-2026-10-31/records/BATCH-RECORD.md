# Batch record — GSC outcome-evidence ingest, first real input (2026-10-31)

Batch dir: `out/batch-gsc-evidence-ingest-2026-10-31/` (backup/, records/, work/).
Order: standing deploy-after-check authorization; the ingest tool's own runbook
(`scripts/ingest-outcome-evidence.py`, sealed) names this exact motion as the
first real input: the 2026-10-31 09:40 EDT Search Console indexing pass.

## Source of verdicts

`~/workspace/goals/the-flat-rate-movers-website-migration/hidden_files/gsc-indexing-pass-2026-10-31.md`
— 11 URLs inspected in sc-domain:theflatratemovers.com: 1 already indexed
(/data-center-relocation/), 9 not-indexed with indexing request succeeded,
1 not-indexed with request ATTEMPTED and FAILED on Google's daily quota
(/videos/ — recorded as inspected/not-indexed, never as requested).
Transcribed verbatim into the tool's input shape at
`work/verdicts-gsc-indexing-pass-2026-10-31.json` (kind=indexing,
source=gsc-indexing-pass, observed_at=2026-10-31). No booleans were asserted
beyond the coverage strings, so "Discovered - currently not indexed" and
"URL is unknown to Google" verdicts recorded as observations only, per the
tool's honesty contract; only /data-center-relocation/ ("URL is on Google")
claimed gate states.

## Ingest result (tool output, live DB)

- verdicts 11 · urls_matched 11 · urls_unmatched [] · rows_updated 138 ·
  evidence_appended 161 · gate_changes 46.
- Dry-run on a scratch copy of the DB (--no-chain) produced identical stats
  before the live run; no double-ingest (see Deviation).
- Evidence log: 0 → **161 rows** (crawled/passed 23 · indexed/passed 23 ·
  indexed/observed 115), all source `gsc-indexing-pass 2026-10-31`.
- Outcome state before → after (2,738 rows): unknown 1,119 → 1,234 ·
  awaiting-observation 1,619 → 1,481 · **partial 0 → 23** · blocked 0 ·
  complete 0. Highest gate passed: none 2,738 → 2,715 · **indexed 23**
  (every row targeting /data-center-relocation/: crawled+indexed passed,
  checked_at 2026-10-31). No passed gate downgraded (none existed).
- Generator regenerated in the same motion: rowsDigest
  `671f2549176e3e4656facf37aa583b3bfb3af8b1af16ae83983a5e3345ca2d58`
  (unchanged — row set identical; outcome roll-ups moved).
  Dataset republished to public/: 163,716 B, SHA-256
  `8175284586d46601d9cbdbba799ed13f43748d1af888e314e00c60ab48409be0`
  (was `c665ee5056c42dec666e811eba0855a55ac48f327bf283890b4365539b117162`).

## Deviation — stale default repo-dir in the sealed tool (fixed forward, tool untouched)

The tool's chain stopped at the reseal assertion on its first live run:
digest-index reported 4 gaps, all "unresolvable contentUrl" — the four
Solution A code distributions (scripts/build-routes.js,
scripts/build-llms-full.js, scripts/route-assets/main.js,
scripts/route-assets/webmcp.js). Cause: the tool's DEFAULT_REPO_DIR points at
`out/batch-intent-rubric-v2-live/repo-dir`, the pre-Solution-A mirror, which
predates those files. The tool exited BEFORE signing or touching the public
index (verified: public index hash unchanged at that point); DB writes and
the dataset republication had completed exactly as designed.

Resolution (no re-ingest — the append-only log must never take the same
verdicts twice): the remaining chain steps were completed with the tool's own
commands and assertions, using `--repo-dir out/batch-per-route-shell-live/work/repo-dir`
— the mirror the current 470-distribution seal was built with. Pre-check
before completing: a test digest with that repo-dir resolved 470/470 with
gaps [] and reproduced every sealed digest EXCEPT the intent dataset (the one
file this batch legitimately changes); the repo-dir's code copies are
byte-identical to the live machine-repo sources (cmp-verified). Reseal:
distributions 470 · gaps 0 · signed kid `theflatratemovers-2026-10-29-1` ·
**PROVENANCE OK (470 match, 0 mismatch, 0 unresolved)**.
FOLLOW-UP for a future batch: repoint the tool's DEFAULT_REPO_DIR (the tool is
itself a sealed distribution, so the edit needs its own reseal motion).

## Gates run

- verify.js full suite: **105/105 VERIFY OK** pre-deploy (run output in the
  batch transcript) and post-deploy (records/verify-postdeploy.log).
- Pre-push key-content grep across push paths: 0 hits.

## Deploy + API cadence

- Pages deploy (the-flat-rate-movers-pages): uploaded exactly **3 files**
  (datasets-intent-coverage.json, ai-master-index.json, ai-master-index.jws);
  deployment https://f5007bf4.the-flat-rate-movers.pages.dev.
  Live byte check: served dataset SHA-256 `8175284586…` and served index
  SHA-256 `264ff7d2b73e62aebee25af39d3cc610126d72e766ba22bde177a3e98363ccf2`
  both == the sealed local copies.
- API worker: refresh-bundle → signed-index digest matches **37/37 compared**
  (gate passed); tests **34 passed, 0 failed**; redeployed, Current Version ID
  `acba5f9a-282c-4ef9-826d-6ee5df6e5743`. Live: /v1/index = 470 distributions;
  /v1/verify?file=datasets-intent-coverage.json → match:true, source live;
  /v1/intent serves the data-center rows as partial / highest_gate_passed
  indexed with both gates passed, evidence `gsc-indexing-pass 2026-10-31`.

## Pushes (one per repo, back-to-back)

- theflatratemovers-ai: data/datasets-intent-coverage.json,
  data/ai-master-index.json, data/ai-master-index.jws.
- the-flat-rate-machine: this batch's out/ record
  (records/BATCH-RECORD.md, records/ingest-run.log,
  work/verdicts-gsc-indexing-pass-2026-10-31.json).
- HEADs + byte-identical read-backs are verified immediately after the pushes
  and carried in the batch's completion report to the parent agent.

## Not touched

No site content, no pages, no quote form (segment md5 asserted canonical by
W-2 inside verify.js), no llms/data-txt surfaces (the ingest regenerates only
the intent dataset + seal), no GSC requests in this batch (the 2026-11-01
pass carries /videos/ forward under its own booking).
