# BATCH E6-B2 — ARCHIVE RE-SNAPSHOT WAVE

Retrieval Machine, Element 6 (Archives), second build batch.
Executed 2026-11-01. Small-batch rule: one narrow change-set — the
post-Solution-A re-snapshot wave designed in Dossier 06 (A1 scope,
A2 execution order), fed into the archive registry as its second
generation, with a fresh signed verification report. Nothing else.

**Outcome: the current (per-route) byte era of the estate is
archived. 103 of 103 wave URLs hold CDX-confirmed current-era
captures — 99 confirmed against their wave saves, 4 confirmed on
verify-first re-check after throttled save responses — with zero
submitted-unverified and zero failed. The Zenodo v1.2.0 retry also
landed. The registry now tracks 260 targets and 141 captures;
signed distributions 491 → 492; verify.js 139 → 140 checks, 139/140
at batch close with P-6 open on exactly the five repo files the
closing pushes and parent uploads settle (the established pattern).**

## State at start (all re-verified by this batch, none assumed)

- Baseline verify.js: 139/139 VERIFY OK (one earlier attempt showed
  a single S-3 error; the immediate full re-run passed 139/139 —
  the error did not reproduce and is consistent with the egress
  transport truncation documented below).
- Live signed index: SHA-256 3fb30cd7c02debbdc3eaf5d949b44a1e1730
  d38c74e0296062b5d851c7fafc4e, 491 distributions (the E6-B1 final).
- Enumeration (A2 step 1, CDX sweep of the full sitemap + tracked
  non-sitemap surfaces, two-round fingerprint discipline): 260
  targets — pre-wave states: current-era 0, old-era 43,
  never-captured 215, preservation-by-doi 2. E6-B1 finding (c)
  confirmed from data: no current-era capture existed anywhere.
  The no-longer-served set was exactly E6-B1's five — no new
  disappearances.

## The wave (103 URLs, dossier priority order)

T0 (8): the intent dataset file, the four missing landings
(ffe-logistics, government, gun-safe, local-regional), llms-full.txt,
the gun-safe hub, the Moorefield job-story post. T1 (10): homepage,
both entity graphs, llms.txt, ai-master-index.json + .jws, the JWKS,
ai-sitemap.json, service-area.geojson, sitemap.xml. T2 (36): the
remaining dataset files. T3 (34): the datasets hub + remaining
landings. T4 (5): the takeover category pages. T5 (9): the blog hub
+ posts. T6 (1): the API root. Plus exactly one Zenodo v1.2.0 retry.

**Runner incidents and their fixes (all absorbed inside the batch):**

1. First launch (09:41Z): the first three items failed their live
   checks within ~1 s each (http=-1). Root cause found by standalone
   reproduction: `IncompleteRead` — the egress path truncates large
   response bodies mid-read, and the runner's full-body read turned
   a received 200 into a transport failure. Fix: the live check (and
   every read whose status is what matters) no longer fails on a
   truncated body read; exceptions are logged into the item's event
   trail. The three items were reset and re-run.
2. The Archive throttled every save response with HTTP 429 — on the
   response's content leg, while the saves themselves landed
   server-side: all four saves made before the pattern was proven
   appeared in CDX within a minute, the exact behaviour the
   2026-10-30 program record documents ("the throttling hit content
   serving/verification, not the saves themselves"). An early
   cooldown design (15 min per 429) was replaced once the pattern
   was proven: a 429/5xx response is recorded as
   submitted-unverified and CDX decides, with a true-stop watcher
   (two consecutive batches with saves but zero confirmations →
   900 s back-off; never triggered). Polite discipline held
   throughout: batches of ≤5, ≥30 s between saves, ≥3 min between
   batches. Runner process generations: v1–v3 stopped by the
   operator for the fixes above; v4 died silently with its exec
   session's process group and was relaunched detached (setsid);
   state is atomic per item, so every restart was a clean resume.
3. Final tallies (wave-state.json, preserved as batch evidence):
   saves attempted for all 103; **confirmed 99,
   preexisting-current-era 4, submitted-unverified 0, failed 0.**
   The independent post-wave enumeration (a second full CDX sweep)
   agrees: all 103 wave URLs hold post-boundary captures.

**Zenodo retry (A3):** the single retry's save response was HTTP
429 and the immediate CDX check found nothing, so the runner marked
it failed; the post-wave sweep found the capture standing at
20261101100900 (digest EKCJYETZ5E5ZVUYBC6A2ZGRAHFWDAOA4) — the
throttled-response pattern again. It is recorded as a confirmed
capture in the registry, with its confirmation method stating the
trail. The v1.1.0 record page remains preservation-by-DOI by
design (it was not in this batch's retry scope).

## Runbook leg (E6-3, Internet Archive legs re-executed)

Sample of 20 wave captures fetched in id_ identity form:
**SHA-1 base32 re-hash == CDX digest on 20/20** (integrity), and
on the currency leg **17 match / 0 differ / 3 not-compared** — every
comparable capture's decoded payload hashes exactly to the signed
index digest (data files) or the public route document (pages).
The 3 not-compared are principled: the API root (dynamic worker
response, no sealed bytes) and the index + JWKS (self-reference).
Two sample-tool findings, fixed in the tool and recorded here: the
WARC records store the gzip transfer form Cloudflare served the
Archive's fetcher, so the currency leg must decode before hashing
(the first pass read raw stored bytes and produced false
"differs" verdicts on pages); and the seal lookup read a wrong
digest key (`digest.sha256` for `digest.value`), which had silently
marked every data file not-compared.

**Signed report:** `ai-verification-report-2026-11-01-e6b2.json`
(4,333 bytes, SHA-256 1b951fc3bf9b4cb284a8821502d83a402e802d2b089
b6e280ab86f17aa1e0538), signed with the estate Ed25519 key
(kid theflatratemovers-2026-10-29-1), detached JWS alongside,
standing beside the index on the site and in the ai repo. Legs:
the wave, the id_ sample, the pre/post registry CDX sweeps, the
Zenodo retry. **Exceptions: 0.** The index under verification is
the seal that stood during the wave (3fb30cd7…, 491) — its
provenance was re-proven by verify-provenance.py at signing time.
The E6-B1 report is untouched.

## Registry generation 2 (via the sealed generator)

- Seed v2 keeps E6-B1's frozen sections byte-identical
  (missingCaptures with their re-check trail, deposits, the local
  archive record, verification, indexSha256 289d461a…,
  expectedDistributions 486) — verify.js AR-2/AR-3/AR-4/AR-5 pin
  them; the registry is append-only across generations.
- Targets: 260 (post-wave states: **current-era 104** — the 103
  wave URLs + the Zenodo v1.2.0 record page; **old-era 3**;
  **never-captured 152** — the non-wave sitemap pages, the standing
  scope for the cadence sweep E6-B4; **preservation-by-DOI 1** —
  the v1.1.0 record). The five recorded-unverifiable targets now
  read current-era; their missing records stand permanently.
- Captures: 141 (37 recorded-era + 104 new). New rows carry the A5
  fields, byte-era per-route (pages) / data-version-2026-11-01
  (data files), the manifest version naming the seal the captures
  were taken under (3fb30cd7…), and per-row confirmation methods —
  including, for the four throttled saves, the 429 trail.
- Runs: a fourth run record (run-2026-11-01-e6b2-resnapshot) with
  attempted 103, confirmed 103, failed 0, submittedUnverified 0,
  and the new report's URL + SHA-256.
- Gaps: A1 and A2 now read resolved (executed by this batch); A3's
  status records the retry outcome; A4 (release cadence) and the
  designed non-actions are unchanged.
- Generator: generation-2 text edits applied to the preserved
  E6-B1 template (asserted single-occurrence replacements), seed
  injected at its placeholder, written byte-identical to scripts/
  and repo-dir/; `node --check` clean; the generator regenerates
  the published dataset byte-identical (--check).

**Wording correction caught inside the batch:** the computed
description strings initially rendered "0 recorded but no longer
served by the Archive, all re-captured in the wave" — the
target-state count is 0 precisely because the five targets now read
current-era, while the standing missing RECORDS number 5. The
descriptions (pageMeta, per-page JSON, llms bullet) were corrected
to the record count ("5 recorded captures no longer served by the
Archive, all re-captured in the wave") and the builder formulas
fixed, before sealing.

## Cascade absorbed (same motion, per the standing rules)

- Intent rubric: the reseal moved row digests (rows embed
  distribution digests); the generator was re-run in write mode
  per its own method text — DB digest 6e98064c… → a3238842…, row
  count unchanged at 3,018; the regenerated dataset file differs
  from its predecessor in exactly one scalar (the rows digest) and
  was published the same way.
- Fixpoint loop run twice to convergence (SI/AE/LG/CP/AR --check
  all pass; llms-full.txt byte-stable at 492 distributions).
- Routes regenerated: 211 documents on the first pass (the shared
  main.js/head-data changed), exactly 2 on the second (the SI/AE
  landings after their regen). Middleware STATIC_FILES regenerated
  (540 entries; the tree gained the two report files).
- Seal passes 1–3 (the pass count the fixed-point required, as in
  E6-B1): index 37dfd8db… → 5c2d8fa1… → **ec8ee6114abd2edd19eebf
  690863cbb6e93a35f7a5c7830457214af69911f576** (final), 492
  distributions, digest audit gaps 0 on every pass.
- verify.js: §23 gains AR-7 (the second signed report pinned by
  the run record, tallies reconciled, wave rows' fixity +
  manifest version pinned); P-5 re-expressed 491 → 492 with the
  new report in the non-page exclusion set. Record:
  out/verify-fix-2026-11-01-archive-resnapshot.md. No check
  weakened, deleted, or waived.

## Deploy + live verification

- Pages deploys: c4e1fdf0… then f35ac71d… (the pass-3 reseal).
  Live index SHA-256 == sealed ec8ee611…; /datasets-archive-
  registry.json serves 200 application/json; the B2 report serves
  200; the landing serves the generation-2 counts.
- API cadence: bundle refreshed (full signed-index match gate),
  tests 51/51 after the suite's three era-pinned expectations were
  updated to the generation-2 state (captures 37 → 141, targets
  44 → 260, distributions 491 → 492); worker deployed, version
  dc98aa55-02a7-4c51-8ba7-68ac64378f49. Live: GET /v1/archives
  byte-identical to the site file (SHA-256 256befc2b331b966…),
  /v1/index = 492, /v1/verify match:true for both
  datasets-archive-registry.json and the new report.
- verify.js at close: **139/140** — the sole open check is P-6,
  on exactly the five repo-served files the closing pushes and
  parent uploads settle (below). Every other check passes,
  including AR-1..AR-7.

## Top-up wave (post-deploy)

The files this batch's own reseal changed were captured under the
same discipline after the final deploy — 10 targets (the four
changed dataset files, llms.txt, llms-full.txt, the signed index +
JWS, the archive landing, the new report). Results: all 10 saves
were accepted (HTTP 200); **4 confirmed in CDX** (the B2 report,
the archive landing, llms.txt, llms-full.txt) and **6
submitted-unverified** at the close of the confirmation window
and still unconfirmed on a spaced re-check at record time
(ai-master-index.json + .jws and the four changed dataset files)
— the Archive's save pipeline accepted them without yet serving
them, the same acceptance-vs-serving lag the main wave met in its
throttled form. Their pre-reseal bytes are already archived by the
wave; the final bytes join the standing re-check list for the
E6-B3 cadence (which re-verifies before it re-saves). These
captures are recorded here only; they
enter the registry at the next generation (E6-B3), because the
registry generation is necessarily sealed before the top-up runs —
the same self-reference E6-B1 carried.

## Pushes + parent flags

- Exactly one push per repo, back-to-back. Pre-push key-content
  grep across both push sets: 0. The gist-based ai-repo
  data/entity-graph.json (blob cda897e6…) is in neither set and
  was re-confirmed untouched.
- ai (TheFlatRateMovers/theflatratemovers-ai): data/ai-master-
  index.json + .jws, data/ai-verification-report-2026-11-01-
  e6b2.json + .jws, data/datasets-archive-registry.json,
  data/datasets-intent-coverage.json, data/datasets-search-
  index.json, llms.txt, the-flat-rate-movers-data.txt.
- machine (TheFlatRateMovers/the-flat-rate-machine):
  scripts/build-archive-registry.js, scripts/route-assets/main.js,
  code/pages-functions/_middleware.js, code/pages-functions/
  head-data.js, verify.js, out/verify-fix-2026-11-01-archive-
  resnapshot.md, this record.
- **Flagged for the parent** (over the connector ceiling; values
  read from the FINAL signed index after the last reseal, per the
  E6-B1 lesson):
  1. machine `code/site-shell/index.html` — 23,241,104 bytes,
     SHA-256 6937ddbd3c8488ceb9e2f4e275eaf1c960f8a242035d61762d9
     b2b824e6d7861 (source: repo-dir/index.html).
  2. ai `data/datasets-answer-evidence.json` — 7,347,654 bytes,
     SHA-256 36eeced91157571310daf80d274809dcb4285c48e8c85b826954
     c9403e604575 (source: public/datasets-answer-evidence.json).
  When both land and read back byte-identical, P-6 closes and the
  suite reads 140/140 (the parent's own run is the closer, as in
  E5-B1 / the intent fix / E6-B1).

## Element 6 remainder (updated)

- **E6-B3 — release-cadence wiring:** the per-release snapshot set
  (trigger + scoping written into the batch/release procedure),
  first exercised on the next real release; the A3 Zenodo cadence
  retry rides it (the v1.1.0 record page is the standing retry
  candidate; v1.2.0 now holds a capture); the E6-B2 top-up captures
  recorded above enter the registry in that generation; X2
  outlet-record captures join only on the owner's word.
- **E6-B4 — standing sweep cycle:** the full-sitemap CDX sweep +
  gap-fill folded into the measurement cadence — its standing
  scope is the 152 never-captured targets this registry now names,
  plus re-verification of the whole target table each cycle.
- Gap A4 stays open by design until E6-B3 executes on a real
  release. The local BagIt archive's next regeneration also rides
  E6-B3 (AR-4 continues to pin the E6-B1 bag, unchanged).
