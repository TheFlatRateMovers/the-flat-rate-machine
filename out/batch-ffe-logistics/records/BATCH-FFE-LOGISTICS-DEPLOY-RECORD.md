# Batch FF&E Logistics — Deploy Record — 2026-10-30

Takeover category #2 (FF&E Logistics) deployed LIVE under the standing
deploy-after-checks authorization, applying the staged package's DELTAS
onto the rebaselined estate (never the staged absolutes). ONE push per
repo per Henry's 2026-10-30 push rule, fired back-to-back. Push HEADs and
read-back results are appended to the local copy of this record after the
pushes (the pushed copy carries everything up to the push section).

## Before -> after (verified)

| Surface | Before | After |
|---|---|---|
| pages (registry / sitemap / router / pageMeta) | 163 | 164 |
| services (canonical) | 25 | 26 |
| per-page JSON files | 163 | 164 |
| dataset files | 27 | 28 |
| signed distributions (PROVENANCE) | 212 | 214 — PROVENANCE OK 214/214 over live bytes |
| STATIC_FILES | 264 | 266 |
| site entity graph / site best graph | 35 / 94 | 36 / 95 |
| machine entity graph / machine best graph | 35 / 91 | 36 / 92 |
| rubric canonical services / attestations / edges | 25 / 263 / 41 | 26 / 273 (+10) / 45 (+4 of 4, dedupe applied) |
| intent rubric rows | 1,155 | 1,176 (+21 FF&E rows, 0 excluded; coverage nodes 25 -> 26) |
| quote-form md5 | 4d8d49f05b22b129eac623a41370d9cb | unchanged (byte-identical) |

## What shipped

- Page: /ffe-logistics/ (div before <footer>, pageMeta, router tail,
  head-graph Service node after the warehouse-racking-relocation tail
  node, canonical description taken verbatim from the per-page Service
  node). Per-page JSON /ffe-logistics.json (6 nodes; Organization node in
  the CURRENT canonical form with the logo ImageObject 1024x1024 — the
  staged file predated the logo fix; Place nodes byte-equal to canonical).
- Dataset: /datasets-ffe-logistics.json — 8 nodes (4 Dataset CC BY 4.0 /
  2 Service / 2 Article), byte-equal embed as the page div's last element.
- Internal links: Services page paragraph; All Pages chip; Sitemap page
  row + totals (164 / 274 / 160); dedicated-page link on Industrial &
  Commercial Services; Related-line link on Specialized Workforce Labor;
  chips on Warehouse Relocation and Moving and Storage; related-service
  line on Commercial Freight / Final-Mile. Developer card "FF&E Logistics
  data" (8 nodes — 4 Dataset, 2 Service, 2 Article); seal statement
  212 -> 214 distributions; estate-in-numbers blocks x13 updated.
- Registries + phase-a staged copies updated in the same motion
  (services 25->26, pages 163->164, ai-sitemap, llms.txt, data txt —
  history never rewritten, dated entries appended).
- service-area.geojson unchanged (no new areas; +0 places/areas/hours).

## Materials & supplies enrichment (Henry's 2026-10-30 ruling)

Actual materials named at the process steps that use them, framed as
purchased per project for the reviewed scope, in page + dataset: dock
labels and inventory tags at receiving; furniture pads, shrink wrap, and
corner and edge protectors in warehousing; furniture pads and corner
protectors in installation support; furniture pads, mattress and
furniture bags, and cartons at pack-out; and the full standard set named
in the cost section (furniture pads, shrink and stretch wrap, corner and
edge protectors, mattress and furniture bags, cartons, labels, inventory
tags). Work record: work/enrich.py (5 anchored page edits, 4 dataset
description edits). All staged boundaries held: no procurement/design
claims; installation SUPPORT only (licensed trades excluded); storage is
leased space (30-day minimum, customer access, per job / monthly / by
volume, no rates); no client claims (named projects = market geography
only, with the page's not-our-clients sentence); the industrial CWT
schedule appears ONLY inside its explicit non-extension passage (audited:
exactly 1 mention, inside that passage); Bailey's 6-25% figures labeled
market context; company price = quoted per job at one flat rate in
writing; equipment varies by project (no equipment list).

## Seal (digest -> sign, same batch, two passes)

- Pass 1: added == exactly the 2 new distributions (ffe-logistics.json,
  datasets-ffe-logistics.json); removed == 0; digest-only changes ==
  exactly 9 (ai-sitemap.json, llms.txt, site entity-graph.json, site
  best-json-entity-graph.json, shell, _middleware.js, head-data.js,
  verify.js, gen-head-data.js); 0 gaps. The 11 unchanged repo code files
  were assembled from the racking batch's repo-dir copies — the exact
  set-diff proves them byte-current at HEAD.
- Intent generator v1.2.0 (FF&E config added: HUB / PHRASE / DATASETS /
  BASE_ONLY 'both' / BRANCH [null,null]; GEO_MAP 'ffe-installation' NOT
  remapped — it belongs to Industrial & Commercial) -> 1,176 rows;
  regenerated dataset installed to public/.
- Pass 2: ONLY datasets-intent-coverage.json's digest changed. Final 214.
- Key read ONLY from ~/workspace/theflatratemovers/keys/ by sign-index.py
  itself (kid theflatratemovers-2026-10-29-1); pre-push key-content grep
  across all push trees = 0 hits.

## verify.js changes (same motion, stale-check rule)

P-5 exact totals 163 -> 164 per-page JSONs and 212 -> 214 distributions
(+ dated comment); section 13 I-4 check NAME 25 -> 26 coverage nodes
(assertion already dynamic). No check removed, loosened, or waived; suite
stays 88. Record: out/verify-fix-2026-10-30-ffe-logistics.md.

## Gates

- Local: router == pageMeta 164 == 164; div once + before <footer>;
  dataset embed byte-equal; quote md5 unchanged; all 41 ld+json blocks
  parse (1 pre-existing empty #page-jsonld placeholder); both executable
  inline scripts node --check OK; STATIC_FILES 266.
- Middleware unit suite: 29/29 (24 prior + FF&E own-title, page-JSON and
  dataset passthrough, bare-path case — see deviations).
- Manifest section 7 dataset/page audits: 21/21 (8 nodes, mix, CC BY,
  descriptions >= 50 chars, CWT non-extension confinement, no
  procurement/design claim, leased storage stated, CTA x3 exact,
  forbidden strings absent incl. USDOT/MC and "kerb").
- verify.js pre-deploy: 81/88 — failures all live-state (live sitemap /
  index / intent dataset) except S-6, fixed in data (see deviations).
- Deploy: wrangler Pages, 266 files, deployment
  https://32723859.the-flat-rate-movers.pages.dev.
- Live: /ffe-logistics/ 200 + own title + content; /ffe-logistics.json
  and /datasets-ffe-logistics.json 200 + application/json + byte-identical
  to final local bytes; live sitemap 164 locs with the FF&E URL once,
  lastmod 2026-10-30; live llms.txt carries FF&E; route titles verified
  for /warehouse-racking-relocation/, /moving-a-piano/, /junk-removal/;
  live intent dataset byte-identical (1,176 rows); PROVENANCE OK over
  live bytes at 214/214, JWS verified against the published key.

## Deviations

(a) Staged rubric insert R9 claim read "Provenance and integrity gate —"
    while every prior service row and verify.js S-6 use the canonical
    "Provenance & integrity gate —" prefix. Fixed in the DATA (one claim
    string updated in rubric.db after backup; gate rows 26/26) — the
    check was not touched.
(b) Middleware bare-path expectation: /ffe-logistics without the trailing
    slash is served 200 with its own injected head (no 301) — proven
    identical behavior for the previous batch's page (case 25b), i.e.
    uniform pre-existing middleware behavior, not a regression.
(c) The intent generator writes its dataset to its own work dir; the
    batch installs it to public/ before seal pass 2 (same as prior
    batches' flow).

## GitHub (one push per repo, back-to-back)

- HEADs at start: machine c6b714d0, ai 6eecccd0.
- ai (9 paths): llms.txt, ai-sitemap.json, the-flat-rate-movers-data.txt,
  data/datasets-ffe-logistics.json, schemas/ffe-logistics.json,
  data/entity-graph-full.json (+1 node, 35 -> 36, appended in its own
  indent-2 format), data/best-json-entity-graph-full.json (+1 node,
  94 -> 95, indent-1 format; append-only per the standing note that its
  node 0 areaServed lags Bristow), data/ai-master-index.json,
  data/ai-master-index.jws (last).
- machine (14 paths): code/site-shell/index.html,
  code/pages-functions/_middleware.js, code/pages-functions/head-data.js,
  verify.js, tools/gen-head-data.js, scripts/build-intent-rubric.js,
  data/services.json, data/pages.json, data/entity-graph.json,
  data/best-json-entity-graph.json, out/phase-a/ai-sitemap.json,
  out/phase-a/llms.txt, out/verify-fix-2026-10-30-ffe-logistics.md, and
  this record (out/batch-ffe-logistics/records/).
- NEVER pushed: ai-repo data/entity-graph.json (Gist) — blob SHA
  cda897e61319a0f52172ef1365402e4d7179cddf confirmed before the pushes and
  re-confirmed after (appended below with the post-push HEADs and
  byte-identical read-backs).
