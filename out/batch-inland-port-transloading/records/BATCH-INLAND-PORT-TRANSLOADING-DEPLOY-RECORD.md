# Batch Inland Port Transloading — Deploy Record (2026-10-30)

Takeover category #3 of five (Henry's order 2026-10-30: "work on those 5"):
the Virginia Inland Port transloading hub, deployed from the staged package
at out/batch-inland-port-transloading/ per its propagation-manifest, with all
deltas rebaselined onto the live estate (the manifest's staged totals were
superseded by the racking-wording, logo/favicon and FF&E batches). The hub
attaches to the EXISTING Loading, Transloading and Container Services
service — no new service, no new graph node.

## Before -> after (all Mira-verified)

| Measure | Before | After |
|---|---|---|
| Pages / sitemap locs | 164 | 165 |
| Canonical services | 26 | 26 (unchanged) |
| Transloading service pageCount | 16 | 17 |
| Dataset files | 28 | 29 |
| Signed distributions (PROVENANCE) | 214 | 216 (OK 216/216 over live bytes via verify.js P-2/P-3/P-5) |
| STATIC_FILES | 266 | 268 |
| Site entity graph / best graph | 36 / 95 nodes | 36 / 95 (unchanged — manifest item 16 resolves byte-identical: the transloading hub's page list lives in the registries and datasets, the graph Service node carries the single hub url) |
| Rubric attestations | 275 | 285 (+10) |
| Rubric entities | org only | +1 WebPage entity (the hub, long-form name as staged) |
| Intent rows | 1,176 | 1,176 (count unchanged; all 75 transloading rows now backed by datasets-transloading-inland-port.json as well — rows digest c8f0a6b95241358fc3f12382d3741b112da7cb1a3de3c27102e4f43ea0c3887d) |
| Router == pageMeta | 164 == 164 | 165 == 165 |
| verify.js | 88 checks | 88 checks (P-5 totals extended, see below) |
| Quote-form segment md5 | 4d8d49f05b22b129eac623a41370d9cb | unchanged |

## What shipped

- **Page** https://theflatratemovers.com/virginia-inland-port-transloading/
  (div before <footer>; 4,151 words of page copy; hero with the supplied
  warehouse photo assets/img-12-c5167cca7047.webp; the port's published
  facts table — 161 acres, 78,000 TEU design capacity, 7685 Winchester
  Road, Front Royal VA 22630, gate Mon–Fri 0700–1600, Norfolk Southern
  rail, FTZ #185 and U.S. Customs port of entry — labeled as the PORT's
  facts; nine-step process table; rework/tarping section with the ATS
  carrier figures ($50–$150 / $200–$300 / up to $750+) labeled market
  data in the same paragraph ("not our prices"); 7 FAQs; boundary card;
  service-area card; the D1–D8 dataset embedded byte-equal as the div's
  last element).
- **virginia-inland-port-transloading.json** (6 nodes: Service on the
  existing #service-transloading with the canonical description, the
  canonical Organization node in logo-ImageObject form swapped in at
  deploy — the staged JSON predated the logo fix — both branch Places
  byte-equal to canonical, BreadcrumbList, FAQPage). FAQ answers synced
  byte-equal to the visible FAQ after the materials enrichment (7/7).
- **datasets-transloading-inland-port.json** (8 nodes: 4 Datasets CC
  BY 4.0 — process chain, taxonomy, facility & network, areas & quote;
  2 Service — operations, compliance boundaries; 2 Articles — commercial
  terms, buyer personas).
- **The manifest's one existing-estate content edit:** datasets-
  transloading.json D1 — "sixteen" -> "seventeen" pages + the hub URL
  appended to its sameAs (16 -> 17). Byte-scope verified: the text diff
  is confined to the D1 node span; every other node deep-equal.
- **Registries/surfaces:** pages.json +1 (165), services.json pageCount
  16 -> 17 (single-line diff), sitemap.xml +1 loc (lastmod 2026-10-30),
  ai-sitemap (public + phase-a) hasPart +1 and the 164 -> 165 URL clause,
  llms.txt hub line under the Winchester transloading service entry +
  page-index entry + count clause + dated update section, phase-a
  llms.txt count clause, data txt (3 count lines, transloading-group
  page entry, dated entry), all-pages.json CollectionPage hasPart +1,
  sitemap page (hub row + 6 count strings), Developer page (Virginia
  Inland Port Transloading data card; seal counts 165 / 216),
  estate-in-numbers blocks (pages 164 -> 165 and datasets 28 -> 29,
  13 blocks each; services/graph lines untouched).
- **Code:** router + pageMeta entries; middleware STATIC_FILES +2;
  head-data.js regenerated (165 entries; sole added entry = the new
  page; all 164 prior entries deep-equal); build-intent-rubric.js
  v1.2.1 (service-transloading rows gain the new dataset file).

## Materials & supplies enrichment (Henry's ruling, applied pre-insert)

Page div (5 anchored edits) and dataset file (3 anchored edits) now name
the actual materials at the steps that use them: repalletizing onto
sound pallets, rewrapping in stretch wrap, bracing and banding,
relabeling; tarps and tie-downs on the tarping line; plus the framing
sentence in the page's rework section and the dataset's process-chain
node: the materials the work consumes (tarps and tie-downs, stretch
wrap, pallets, banding, labels and markers) are purchased for each
project and scoped inside the job's one flat rate. Every hard flag held:
never the port, never a broker; no bonded / FTZ-operation / cold-chain /
hazmat claim (FTZ #185 + Customs = the port's published facts, labeled);
ATS figures labeled market data; corridor employers (UPS, Family
Dollar, Ferguson, Sysco) named as geography with the "not as our
clients" sentence; container work quoted per job — the industrial CWT
schedule is NOT extended (the sentence-level gate scan confirms every
CWT/price-schedule mention sits in a non-extension passage).

## Seal (two passes)

- Pass 1 set-diff asserted before signing: added = exactly
  {datasets-transloading-inland-port.json,
  virginia-inland-port-transloading.json}; removed = 0; changed =
  exactly 9 (ai-sitemap.json, llms.txt, datasets-transloading.json,
  all-pages.json + repo copies of the shell, _middleware.js,
  head-data.js, verify.js, gen-head-data.js). Total 214 -> 216.
  (Note: the-flat-rate-movers-data.txt is edited and pushed but is not
  a signed distribution — it has no index entry; no digest change.)
- Intent regeneration (v1.2.1), dataset installed, pass 2: only
  datasets-intent-coverage.json's digest changed; total stays 216.
- Key read only from ~/workspace/theflatratemovers/keys/ by
  sign-index.py; pre-push key-content grep across push paths = 0.

## verify.js changes (same motion, never waived)

P-5 totals extended 164 -> 165 per-page JSONs and 214 -> 216
distributions with the dated comment chain continued in the source.
Record: out/verify-fix-2026-10-30-inland-port-transloading.md.
Runs: pre-deploy 82/88 (6 failures, all the not-yet-live class:
sitemap membership/count, P-5 served totals, S-4 live lastmod count,
I-3 served index membership, I-5 live intent digest); post-deploy
87/88 (only P-6 repo digests, resolved by the pushes below).

## Gates

- Local gates: router == pageMeta == 165; div present once + before
  <footer>; dataset embed byte-equal; quote md5 unchanged; all ld+json
  blocks parse; both executable inline scripts node --check OK;
  STATIC_FILES == 268.
- Page gates: hard-flag sentence scans clean (port/broker non-claims,
  bonded/FTZ/cold/hazmat non-claim contexts only, CWT non-extension
  only, ATS market labeling at paragraph level, not-clients fence,
  materials present in page + dataset, no "attested" wording, no
  "kerb"); FAQ schema == visible FAQ 7/7.
- Middleware unit suite: 33/33 (29 estate cases + new-page title,
  bare-path title, page-JSON passthrough, dataset passthrough).
- Live: page 200 + own title; both new JSONs 200 + application/json +
  byte-identical to local; intent dataset byte-identical; live sitemap
  165 locs with the hub once (lastmod 2026-10-30); llms.txt carries the
  hub; live datasets-transloading.json shows D1 seventeen + 17 sameAs.
- Deploy: https://c307c8e8.the-flat-rate-movers.pages.dev (12 files
  uploaded).

## Deviations / interpretations (recorded, per standing practice)

(a) Manifest item 14's staged all-pages count (223 -> 224) did not
match the live file: the CollectionPage hasPart carries 118 curated
entries (the FF&E and racking batches did not extend it). The +1 delta
was applied onto the current state: 118 -> 119, entry shape identical
to siblings.
(b) Manifest item 12's "+1 dataset entry" for ai-sitemap.json: the
file's distribution array does not enumerate datasets (6 entries); the
dataset's index presence is satisfied by the signed-index distribution
+ the ai-repo data/ mirror, exactly as for FF&E. Page-row, counts and
keywords updated as specified.
(c) The staged per-page JSON predated the logo fix: its Organization
node was swapped for the current canonical logo-ImageObject node
(task instruction); its Place nodes verified byte-equal to canonical
before install.
(d) The staged div file carried a "NOT LIVE" staging comment header;
stripped at insert (staging metadata, not page content). Its FAQ #3
answer was enriched with the materials naming; the per-page JSON's
FAQPage answer was synced to match byte-equal.
(e) Intent rows: the hub introduces no new query patterns (its strings
resolve through the existing transloading branch/footprint patterns),
so the row count stays 1,176; the regeneration's effect is the new
dataset backing on all 75 transloading rows + the coverage node, with
a new rows digest — recorded above rather than reported as growth.

## Out-of-batch follow-ons (record only)

- GBP: add the Virginia Inland Port / transloading depth to the two
  profiles' service entries under the traffic program (no GBP change
  in this batch).
- GSC Request Indexing for the hub URL on the next indexing pass
  (the booked 2026-10-31 pass queue is fixed; the hub joins the
  following pass with the other takeover pages).

## GitHub

(Pushes follow in the same motion — one per repo, back-to-back;
post-push verification appended below.)
