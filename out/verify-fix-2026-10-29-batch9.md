# verify.js changes — Batch 9 structural, 2026-10-29

Batch 9 (per-URL head build, rubric R8/R9 gates, real sitemap lastmod,
robots AI-crawler groups, txt consolidation + P1 re-sign) extended
verify.js in the same motion as the features shipped. No existing check
was edited, weakened, or removed. Suite 75 -> 81.

## NEW section — "12. Structural — Batch 9" (checks S-1..S-6)

- S-1  Head-data coverage: the deployed functions/head-data.js parses
  and covers every registry URL (156/156), each entry carrying title,
  description, canonical, per-page JSON filename, and a page JSON-LD
  whose WebPage @id is the page URL + #webpage. WHY: the per-URL head
  layer is only as complete as its data module; a future page added to
  the registry without head data fails here instead of silently
  serving the generic head.
- S-2  Middleware presence: functions/_middleware.js exists and is
  driven by head-data.js (imports it, exports onRequest). WHY: guards
  against accidental removal of the resolver while its data remains.
- S-3  Live per-URL heads on a defined route set (home, a branch
  service page, an article, the workforce page, a category page, FAQ,
  services index, developer): each live response's <title> and
  canonical equal the head-data values, its #page-jsonld parses and
  equals the client-computed graph byte-for-byte (JSON-compared), and
  its per-page JSON block is present. WHY: proves the SERVED state,
  not just the deployed files.
- S-4  Sitemap lastmod sanity (live sitemap): every value matches
  YYYY-MM-DD, parses as a real date, lies between the estate build
  date 2026-10-28 and today (America/New_York), and the set is not a
  single blanket date (>= 2 distinct values). WHY: lastmod became
  per-URL evidence-derived data in this batch; a regression to blanket
  or future dates fails loudly.
- S-5  Robots AI-crawler groups (live robots.txt): all 16 documented
  AI crawler user-agents carry explicit groups, the wildcard group,
  Allow: /, the sitemap line, and the llms.txt reference are present.
  WHY: the open-to-AI policy is now stated per agent; dropping a group
  in a future edit fails here.
- S-6  Rubric gates recorded: rubric_check holds R8 + R9, and the
  attestation table holds 23 crawlability + 23 provenance gate rows
  (one per registry service). WHY: the gates framework is only real if
  its scored rows exist; the counts are registry-relative like the
  other rubric checks.

Final suite after the batch: 81/81 PASS against live.
