# Batch P2 — Certificate Extension — record (2026-10-30)

Owner directive 2026-10-30 ~04:49 EDT: "each page, each signal that we
send, each set of codes or scripts, html, jsons, should carry the powerful
certificate tool." Deliverable: full report + checklist after the 156
per-page JSONs are refreshed under the certificate tool, live & deployed
(~/workspace/theflatratemovers/P2-CERTIFICATE-CHECKLIST-2026-10-30.md).
Scope addendum folded in BEFORE digesting: the Bristow GBP flip (Google
published the Winchester service-area edit 2026-10-30; verified in GBP
Manager ~05:07 EDT — 17 published areas, Bristow, VA, USA first).

## Result

- Signed ai-master-index: 35 → **202 distributions** (35 data + 156
  per-page JSONs + site shell build artifact + 10 code files). Every entry
  complete (name/contentUrl/encodingFormat/license/dateModified/SHA-256
  digest/byteSize); digest-index audit: 202/202 fields, 0 gaps.
- Public-only recomputation over live HTTPS bytes: **202/202 digests
  match** (final run after the verify.js push; see checklist).
- verify.js: extended with P-5/P-6 + the rewritten Winchester GBP check —
  final post-deploy run **83/83**. Record:
  out/verify-fix-2026-10-30-p2.md.
- Pages deploys: afbaf51c (main batch) and 32a0e71f (name-correction
  re-issue of index + JWS; 90 of 156 entry names had joined the wrong
  registry title via a loose first-match join — rebuilt on the canonical
  Batch 9 slug→file map; no digest changed).
- Repos: machine code push c0777549 (code/ copies + tools/gen-head-data.js)
  before the seal; records pushes after (see checklist for HEADs).

## Bristow GBP flip (addendum) — what changed

- service-area.geojson (3 byte-identical copies): place-bristow-va
  gbp_service_area false→true; source + rubric_note rewritten; new dated
  attestation appended (attestations[0] screenshot claim and the
  corrections array left as dated history). md5 acc07ea3578bd6e6ffe3a10af5884c1e.
- datasets-route81.json: Bristow source marker → GBP wording; its 3
  index.html embeds re-synced byte-for-byte (parse-equality re-proven).
- best-json-entity-graph.json (4 copies): Organization areaServed (GBP
  union) 30→31 with "Bristow, VA" inserted.
- Phase-A entity-graph.generated.json: Winchester GBP @id list 16→17.
- data/locations.json: Winchester serviceArea 16→17 (Bristow at head) +
  source note.
- ai-repo footprint.json: gbpWinchester 16→17, extendedWinchester 16→15,
  Bristow record flipped (pushed with the ai batch).
- rubric.db: backup at backup/rubric.db.before-p2; Bristow service_area
  source flipped; attestation row 181 corrected (16→17) + one new
  attestation row appended → attestation 239 rows; integrity ok.
- Phrase sweeps (grep-driven, 4 rounds; flip-log.json holds the full
  ledger): every current-state Winchester split now reads GBP 17 +
  extended 15 (index.html incl. 12 enumerated GBP lists and pageMeta/
  head-data, 23+ datasets, llms/data-txt appends, descriptions.json).
  The sweeps also corrected stale totals the Bristow batch had left:
  "(31 published areas)" → 32 across index.html branch lists; three
  datasets' "31 published service areas" → 32; "52 published areas" → 53
  (13 dataset nodes + embeds); "52 published GeoJSON features" → 53.
- Left as dated history (deliberately): dated llms.txt entries stating
  Oct 28/29 states; index.html "REVISED 2026-10-28" notes; phase-a staged
  datasets-ocean-container.json snapshot (not a live surface).
- Quote-form segment md5 unchanged through every edit:
  4d8d49f05b22b129eac623a41370d9cb. Router pages array untouched (156).
  head-data.js regenerated from the flipped shell = byte-identical to the
  swept copy (md5 bba824a8cee775cdb496ec7ca6c29f7a).

## Shell disposition (honest route)

Direct /index.html fetch = empty body (308); served root HTML is
middleware-rewritten (2,968,163 B ≠ build 2,928,157 B). The shell is
sealed as a build-artifact distribution: contentUrl = the machine-repo
canonical copy (code/site-shell/index.html), digest over the exact
deployed build bytes (post Developer-card edit), entry description states
the arrangement. The middleware + head-data that generate per-URL HTML
from the shell are themselves sealed distributions. Stated in the
checklist LIMITS.

## Surface notes

- Developer card (index.html): extended-coverage statement with the 202
  count (surgical edit; node --check clean).
- llms.txt + the-flat-rate-movers-data.txt: dated 2026-10-30 appends —
  certificate coverage (202, enumerated) + the Bristow GBP correction
  explicitly superseding the same-day Bristow sections' extended-only
  framing. Originals remain prefixes.

## Method notes

- Page-JSON fetch phase: 156/156 live (200 + application/json + parses)
  with retry logic — the egress path drops connections under load;
  single-attempt bulk fetches under-report (a no-retry recomputation
  showed 94/202 with 107 transport errors and ZERO digest mismatches;
  the retried run is the evidence of record).
- digest-index.py resolved repo files by basename from an assembled
  repo-dir (16 files: 5 ai-repo + 11 machine); the widened stub was fed
  through the estate's own tool — no tool changes were needed.
- 24 of the original 35 digests changed (exactly the flip-touched files:
  2 graphs, llms.txt, GeoJSON, 20 datasets); 11 unchanged (incl.
  ai-sitemap.json and all 5 repo files).
