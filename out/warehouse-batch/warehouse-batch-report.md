# Warehouse Relocation deep refresh — deploy batch report (2026-10-29)

**Deploy URL:** https://e40872cc.the-flat-rate-movers.pages.dev (custom domain https://theflatratemovers.com verified serving the same build — every live check below ran against the custom domain)
**Counts unchanged by design:** pages 155 / services 23 / sitemap 155. Public JSON files 50 → 51 (+datasets-warehouse.json).

## Reconciliation (merge-note step → disposition)

| Merge-note step | Disposition |
|---|---|
| §1 services.json — no change (entry exists, pageCount 1) | (b) Already satisfied — verified present (`service-warehouse-relocation`, pageCount 1), unchanged |
| §2 pages.json — no change (entry live) | (b) Already satisfied — verified present (155 entries, status live), unchanged |
| §3 descriptions.json — verify, refresh only if stale | (b) Verified — entry present and consistent with the live page description; unchanged |
| Merge-note count assumptions (153 pages / 22 services) | (c) Stale — written pre-redo and pre-storage/senior. Reconciled to current live state (155 / 23; entity 33, best 80, head 25, ai-sitemap keywords 49 at baseline); this batch moves no count, as intended |
| §5 entity graph: replace node with staged schema node (adds url) | (a) Done — upgraded in place: description → full 661-char package text, url appended (key order matched to the best/per-page convention). Stays 33. Place/Object nodes untouched |
| §5 best graph: replace node (adds Place chain; url already present) | (c) Changed in form, same end state — the redo had already given the live node the Place chain + url; only the description remained. Swapped in place to the full 661-char package text. Stays 80 |
| §5 head graph: upgrade node in place (adds url + Place chain; 7 flat strings → branch @ids) | (c) Changed in form, same end state — the redo had already replaced the flat strings with the Place chain; this batch added url (after provider, per head convention) + the full 661-char description, in place, same @id. Head stays 25 |
| Place footprint expansion to 31/35 at merge | (b) Already satisfied by the redo in all three graphs — verified 31/35, not shrunk. The staged schema's GBP 16/14 Place lists were NOT applied to any graph |
| §6 per-page JSON: refresh live warehouse-relocation.json to the refreshed node | (c) Refreshed surgically — ONLY the Service node was replaced with the canonical node (full 661-char description; url + Place chain already present). The live file's expanded Place nodes (Winchester 31 / Martinsburg 35 — newer than the staged schema's GBP 16/14) were preserved byte-for-byte; Organization + BreadcrumbList untouched. Exactly 1 node changed |
| §6 Dataset JSON-LD: convert D1–D8 + Developer-page collection entry | (a) Done under the brief's RETYPE RULE (the dataset-status proposed all-Dataset conversion; the standing retype rule governs — mapping below). datasets-warehouse.json created (CC BY 4.0 on Dataset nodes, dateModified 2026-10-29); markup block inside the warehouse page div parse-equal to the served file; Developer "Warehouse data" card inserted after the Senior data card |
| §6 llms.txt warehouse section refresh + dated entry | (a) Service line refreshed in place (full package description + D1–D8 summary + dataset/hub links, matching the senior/storage line format) + dated entry appended; history byte-identical |
| §6 data txt warehouse refresh + dated section | (a/c) Dated entry appended. The file's warehouse mention is a page-list line (no hub section exists to refresh); left as-is per the append-only convention |
| §6 ai-sitemap entry refresh + keyword "warehouse relocation" verify | (a) Description → full 661-char package description. Keywords: "Warehouse Relocation" already present (service-name form); appended the 5 package D1/D8 query forms not already present — "warehouse relocation services virginia", "warehouse moving company virginia", "warehouse load-outs", "inbound unloads", "industrial warehouse relocation". Keywords 49 → 54, none dropped |
| §6 ARD catalog entry | (c) Unchanged — ai-catalog.json carries no per-category entries (standing prior-batch precedent) |
| §4 DB canonical service row — verify, do not duplicate | (b) Present exactly once (service_id = the canonical fragment); canonical rows stay 23 = registry count |
| §4 DB attestation rows for new deep facts | (a) +3 rows: canonical-node completion; datasets D1–D8 publication (incl. gated-facts-stay-unpublished + verbatim-pricing-only record); per-page JSON refresh with footprint preservation. Attestation 96 → 99 |
| §4 DB opening_hours / service_area rows — verify | (b) Verified standing and distinct (14 / 66); none added |
| §4 DB rubric_check row | (c) NOT added, per the brief's standing rules (rubric_check is a 7-row checks catalog, not per-service scores — the merge-note's own §4 anticipated this outcome; the rubric record stays rubric.md in the package dir) |
| §4 DB edge rows | (c) NOT added, per the brief's standing rules (edge table holds zero fragment-service edges by model) |
| §7 pageMeta — verify only; svc already points at the canonical node | (b) Verified — pageMeta `warehouse-relocation` svc = #service-warehouse-relocation; unchanged. Sitemap + all-pages: no change (already live) |
| Router gate (brief's standing addition) | Clean — audited pre-build, post-build, and on the live payload: pageMeta evaluates to 155 keys (130 JS-style + 25 JSON-style entries), router pages array holds 155 entries, sets exactly equal, NO repairs needed. Route ingredients (div + pageMeta key + array entry) verified live for /warehouse-relocation/, /senior-moving/, /videos/, /moving-and-storage/ |
| §8 gated items Q1–Q10 (equipment, drayage, bonded/FTZ, reefer, customs, racking install, phasing offering, WMS, permits, debris) | Honored — no visible page copy changed; gated items appear in the datasets only as explicit non-claims. Phasing vocabulary is published ONLY as labeled domain education (D3 domain move-type list; D4 Article, which opens by stating no phasing offering is claimed); the word is never used as a company service or process claim anywhere published |

## Datasets retype mapping (datasets-warehouse.json, 8 nodes, all dateModified 2026-10-29)

- D1 Warehouse Relocation Operations → **Service**
- D2 Facility & Access Operations → **Dataset**
- D3 Warehouse & Load Taxonomy → **Dataset**
- D4 Phasing Models & Continuity Operations → **Article** (domain models only, attributed; opens with the explicit non-claim that no phasing offering is made)
- D5 Commercial Terms & Cost Drivers → **Article** (the verbatim CWT schedule is the only company pricing; 3PL storage rates, racking costs, and downtime framing labeled domain education from named sources)
- D6 Buyer Personas & Trigger Events → **Article**
- D7 Inventory, Protection & Building Compliance → **Service**
- D8 Service Areas, Dispatch & Quote Path → **Dataset**

Totals: **Dataset 3 (CC BY 4.0) / Service 2 / Article 3**, no FAQPage (the datasets source carries no discrete Q&A pairs; the page's own FAQ is unchanged). @ids `#dataset-warehouse-*`; about → #service-warehouse-relocation; spatialCoverage → both Place @ids; sameAs → the warehouse page.

## Canonical node end state

Exactly one #service-warehouse-relocation per graph, core fields identical in head (25) + entity (33) + best (80) and in the per-page JSON: name "Warehouse Relocation", serviceType "Warehouse Relocation", provider #organization, url https://theflatratemovers.com/warehouse-relocation/, areaServed → #winchester / #martinsburg (Place nodes carry the 31/35 footprint), full 661-char description including the verbatim CWT schedule ($8.00/CWT unload, $10.00/CWT load, $12.00/CWT APU, $400–$425 Residential/Driver Meet). Graphs byte-identical across machine data/, workspace mirror, public/.

## Gate (all passed pre-deploy)

Backups first (out/warehouse-batch/backup-2026-10-29/, unpushed, unique per-file names); all merge preconditions asserted against current live state (graph counts + footprints, per-page JSON state, DB baseline 32/96/40/14/66/7 + integrity ok, canonical rows 23, router audit); build ran clean on first execution. node --check BOTH inline scripts OK (885 + 124,113 chars — identical sizes to the senior batch, pageMeta untouched); all 12 ld+json blocks in index.html parse; router audit 155/155 clean pre- and post-build; **verify.js 71/71 PASS**; forbidden scans zero in every new published block (bare "flat quote", USDOT, MC patterns, Spearman, Around Town, DESIGN 6, "attest" in new prose, subcontract, "crew page", "temp labor") and index-wide deltas vs backup all 0→0 for attest/USDOT/Spearman/Around Town/DESIGN 6/Bristow/subcontract; in-div JSON-LD parse-equal to the datasets file; branches distinct everywhere; R7 re-checked by pattern only on the live payload (heroQuote/quoteForm/hqWalk/qWalk + CTA present) — no quote test post.

## Live verification (no sampling)

- datasets-warehouse.json → 200 + application/json; 8 nodes; 3 Dataset / 2 Service / 3 Article; all dateModified 2026-10-29; CC BY 4.0 on all Dataset nodes.
- Live head graph 25 nodes with exactly one warehouse node (hub url, 661-char description); live entity 33 / best 80, same node state.
- Live warehouse div carries the datasets block parse-equal to the live datasets file; Developer "Warehouse data" card present.
- Live per-page warehouse-relocation.json → 200 + application/json; Service node canonical (661-char description, hub url); Places 31/35 preserved.
- ai-sitemap live 23/155/54 with the refreshed warehouse description (661 chars) and all 5 new keywords; sitemap live 155 locs.
- llms.txt + data txt live with the dated warehouse entries.
- Route proofs: live payload carries div + pageMeta key + router array entry for /warehouse-relocation/, /senior-moving/, /videos/, /moving-and-storage/; live pageMeta 155 keys == live array 155, sets equal.
- Regression sweep: ALL 51 public JSON files → 200 + application/json, zero exceptions (incl. datasets-residential/commercial/gun-safe/office/local-regional/long-distance/moving-and-storage/videos/senior, videos.json, senior-moving.json, warehouse-relocation.json, all per-page JSONs).
- Index: tagline present, CTA present (×388), 0 "DESIGN 6", quote markers intact, USDOT/Spearman/Around Town/Bristow all 0. DB: service 32 / attestation 99 / integrity ok.

## GitHub (same motion, read-back verified)

- **theflatratemovers-ai:** llms.txt, ai-sitemap.json, the-flat-rate-movers-data.txt; data/entity-graph-full.json, data/best-json-entity-graph-full.json, data/datasets-warehouse.json; schemas/warehouse-relocation.json. (Commit hash + read-back in the batch handoff.)
- **the-flat-rate-machine:** data/entity-graph.json, data/best-json-entity-graph.json; the warehouse-deep package (5 files); out/warehouse-batch/ (build script, research-doc copy, this report). Rubric DB binary and backups NOT pushed.
- **Gist graph (ai repo data/entity-graph.json): SHA cda897e61319a0f52172ef1365402e4d7179cddf before the pushes; re-verified after (see handoff). Untouched by design.**

## Deviations / incidents

Only the (c) items above. No failed runs, no partial state, no other package touched.

## Indexing target (record only — today's quota is exhausted; tomorrow's pass queue is already set)

- https://theflatratemovers.com/warehouse-relocation/
