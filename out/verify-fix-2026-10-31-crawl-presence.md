# Verify-fix record — Batch E5-B1 crawl-presence registry (2026-10-31)

No check was weakened, deleted, or waived in this batch. The suite
grows 127 → 132 checks (§22 CP-1..CP-5 added). Existing pins whose
premises this approved batch changed were re-expressed STRICTER in
the same motion:

1. **P-5 (certificate coverage)** — `pageFiles.length === 208` →
   `=== 209`; `(servedIndex.distribution || []).length === 482` →
   `=== 486`; label updated to "all 209 per-page JSONs + all 209
   route documents + llms-full.txt + the site shell + the deployed
   code sets (486 distributions)". Reason: this batch adds exactly
   one page (the crawl-presence landing) and exactly four
   distributions (dataset file, per-page JSON, route document,
   generator script).
2. **D-2 (Dataset-node discipline)** — `shellCountD === 332` →
   `=== 343`; `routeDocsD.length === 208` → `=== 209`; label
   updated. The +11 is the crawl-presence dataset's own Dataset-typed
   nodes (scope + ten table nodes) now embedded in its landing's
   route document — independently counted from the dataset file
   before the pin moved (332 + 11 = 343).
3. **P2 code-distribution list** — appended
   `scripts/build-crawl-presence.js` (the batch's sealed generator)
   to the enumerated code URLs, so the certificate-coverage set
   includes it.
4. **§21 header comment** — corpus counts "the 35 dataset files,
   the 35 per-page dataset JSONs" → 36/36 (comment accuracy; no
   assertion changed).

## §22 — Crawl-presence registry checks (CP-1..CP-5)

- CP-1: dataset totals reconcile (collections == collection-node
  rows; capture rows == totals; era and URL-class sums close;
  query-state counts close).
- CP-2: the robots_policy posture equals the recorded owner decision
  (state decided, option 1, open training, decided_by owner,
  decided_on 2026-10-31); the recorded served digest equals the
  recorded source digest equals the LIVE robots.txt digest
  (the drift gate); agent table length equals the live file's
  User-agent group count; Content Signals unset; the
  `__usage_ai-training` group absent.
- CP-3: the signal-observation log's genesis entry carries exactly
  the 22 designed fields plus `timestamp_token` present-and-null,
  prev_entry_digest null, body digest == live robots digest, and its
  Ed25519 signature verifies against the published JWKS key under
  kid theflatratemovers-2026-10-29-1.
- CP-4: honesty gates — query-state vocabulary only; an
  unverifiable-index-error row requires an error note and zero
  captures; per-collection capture counts equal the actual rows;
  era/URL-class vocabularies only; filter_inspection table empty;
  corpus_release_check table empty with releaseCheckState
  'not-checked'.
- CP-5: gap records P1–P6 complete, each with a designed solution
  and status (P3 resolved by the owner decision); mechanism pins
  ≥ 4 with sources; the generator regenerates the dataset
  byte-identically (`build-crawl-presence.js --check`).
