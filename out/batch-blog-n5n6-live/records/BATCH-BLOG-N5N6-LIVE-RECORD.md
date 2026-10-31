# Batch Blog N5N6 Live — Record (2026-10-31)

Blog posts #5 and #6 published under Henry's standing rule of 2026-10-31
(Mira-created posts pre-approved, no per-post sign-off; QA gates G1–G8
already passed for both drafts). Run on the exact pattern of the
N3/N4 publish batch. Sealed, deployed, verified live, pushed.
Ledger updated (rows 5 and 6).

## What shipped

- **#5 "Transloading vs cross-docking vs deconsolidation in plain
  terms"** — https://theflatratemovers.com/transloading-vs-cross-docking-vs-deconsolidation/
  (2,385 words, about #service-transloading, THE GUIDE SERIES —
  TRANSLOADING). Slots 2026-12-01; published early 2026-10-31.
- **#6 "Moving an office inside a plant or warehouse: access,
  staging, sequence"** —
  https://theflatratemovers.com/moving-an-office-inside-a-plant-or-warehouse/
  (2,543 words, about #service-industrial-offices, THE GUIDE SERIES —
  INDUSTRIAL OFFICES). Slots 2026-12-03; published early 2026-10-31.
- Both posts carry the full page pattern: hero "Get My Flat Rate
  Quote" CTA, byline Henry Pitts Jr., the drafts' own mid-article
  bridge CTA and closing "Get your flat rate" block, Start-here card,
  and per-page JSON whose FAQPage answers are byte-equal to the page
  body (verified in staging for both posts).
- Blog hub: 31 unique post cards (link set == blog.json
  CollectionPage hasPart 31), both new cards present, verified live.
- Intent rubric regenerated with generator v2.0.0: 2,732 → 2,736 rows
  (transloading 157 → 159, industrial-offices 123 → 125; R13
  page-derived 275 → 279), rows digest e5d9e8ee… → 45ee15c7…,
  target coverage 204/204, exclusions 105 (all duplicates).
  Preservation verified against the pre-regeneration DB state:
  outcome states unknown 1,119 unchanged, awaiting-observation
  1,613 → 1,617 (exactly the 4 new rows), partial/blocked/complete 0;
  era-tagged GSC evidence preserved (98 row-evidence links,
  generatedEnrichedByGsc 98, published gscObservedRows 0); the
  append-only evidence log untouched (0 records). Generator --check
  PASS after regeneration. Landing page re-synced from the new
  dataset file (hero, node table, presentation sections regenerated —
  the v2-era sections were removed first, not duplicated; embed is
  the file's exact bytes; certificate SHA updated 5176e371… →
  9780b531…); pageMeta description and both llms.txt files moved to
  2,736 rows / 204 pages in the same motion.

## Counts, before → after

- Pages 202 → **204**; sitemap.xml 234 → **236** locs.
- Per-page JSONs 202 → **204**; STATIC_FILES 307 → **309**;
  signed distributions 257 → **259**; PROVENANCE OK **259/259**.
- services.json pageCounts: service-transloading 17 → 18,
  service-industrial-offices 3 → 4.
- verify.js: P-5 extended 202/257 → 204/259 (dated extension comment
  appended to the P-5 chain; record
  `out/verify-fix-2026-10-31-blog-n5n6.md`); suite stays 100 checks.
- Developer card string caught stale by this batch: "255
  distributions in all" (left over from before the v2 batch) →
  corrected to 259 in the same motion as the 202 → 204 page string.

## Seal

- Pass 1 (7 expected digest changes, matched exactly): ai-sitemap,
  llms.txt, blog.json, shell, _middleware.js (repo copy re-synced to
  the deployed file), head-data.js, verify.js; the 2 new post JSON
  distributions added. Non-digest field changes: none.
- Pass 2 (4 expected digest changes, matched exactly):
  datasets-intent-coverage.json, llms.txt, shell, head-data.js
  (head-data regenerated after the pageMeta description move; its
  diff is confined to the intent-coverage entry).
- Standalone verify-provenance over the sealed tree BEFORE deploy:
  JWS verified, payload canonical, **259 match / 0 mismatch /
  0 unresolved — PROVENANCE OK**.
- Signed-index label "Entity Graph — Site (38 nodes)" intact.

## Gates

- verify.js pre-deploy: only live-lag failures (7, all against the
  still-old live estate: live sitemap 234, live index 257, live
  intent digest, the two new URLs/JSONs not yet live). Post-deploy
  full run: see the delivery report (records/verify-postdeploy.log).
- Middleware suite 57/57 (4 cases added for the two new routes and
  their JSON passthroughs), run before deploy and re-run after the
  landing re-sync.
- All 3 executable inline scripts pass node --check; script 0
  (helpers) and script 2 (the WebMCP registration layer)
  byte-identical to the pre-batch shell — §15 W-1..W-3 stay green.
- Quote-form segment md5 4d8d49f05b22b129eac623a41370d9cb —
  byte-identical before and after every shell edit.
- Router pages == pageMeta == 204; both new routes verified live
  (200, own titles, full CTA set in the served divs); both new JSONs
  live at 200 with content-type application/json.
- All 9 changed files byte-identical live vs the deploy tree
  (sitemap.xml, ai-sitemap.json, llms.txt, blog.json,
  datasets-intent-coverage.json, ai-master-index.json/.jws, both
  post JSONs).
- Pre-push key-content grep across both push trees: 0 hits. The
  Ed25519 private key never left its custody path.
- Gist-based ai-repo data/entity-graph.json blob
  cda897e61319a0f52172ef1365402e4d7179cddf: not in either push;
  re-confirmed at read-back.

## Coordinates

- Pages deployment: https://9b8414a7.the-flat-rate-movers.pages.dev
  (11 files uploaded, 298 unchanged).
- GitHub: ai b1f2ce4856733c98c623e22229b18d3c0e65d848 (ONE push,
  8 paths); machine — this record rides the batch's single machine
  push (10 paths); the resulting HEAD is confirmed by read-back in
  the delivery report.
- API worker: refreshed in this batch's cadence (bundle rebuilt from
  the live estate, test counts extended 257 → 259 distributions and
  2,732 → 2,736 intent rows); version and live confirmations in the
  delivery report.
- No quote test posts were sent. No GSC cron was edited.

## Deviations

- None in the shipped content. Three notes: (1) both posts run over
  the 1,700–2,000-word drafting band (2,385 / 2,543) — flagged, not
  trimmed, per the N1/N3 precedent. (2) One seal attempt before
  pass 1 reported 10 digest gaps because the repo-dir seal folder
  lacked the unchanged canonical copies of other repo distributions;
  the missing copies were restored from the prior batch's seal folder
  and the machine repo's scripts, and pass 1 then sealed with 0 gaps.
  (3) The staged page pattern drops the drafts' preamble "Quick
  answer" block beyond the hero lead — the same pattern-faithful
  behavior as the pilots and N1–N4; the lead and the six FAQs carry
  the substance, and body/schema FAQ byte-equality holds.

## Indexing queue (next GSC pass)

Request indexing for the two new post URLs at the next Search
Console pass (today's 09:40 pass and its queue were not edited):

- https://theflatratemovers.com/transloading-vs-cross-docking-vs-deconsolidation/
- https://theflatratemovers.com/moving-an-office-inside-a-plant-or-warehouse/
