# Merge note — Warehouse Relocation deep-data package (PROPOSAL ONLY — parent deploy agent applies)

Staged: 2026-10-29. This note proposes exact merge actions against CURRENT live state (153 pages, 22 services). **Nothing in this note has been applied.** The Phase C merge-note is SUPERSEDED for counts: it proposed pages 150 → 151 and services 18 → 19, but the warehouse page + node are already live. Do NOT hand-edit counts anywhere — recompute from pages.json / services.json at merge.

## 1. data/services.json — NO CHANGE

`service-warehouse-relocation` ("Warehouse Relocation") already exists, pageCount 1. Verify at merge; recompute across the batch. Services stay 22 for this package.

## 2. data/pages.json — NO CHANGE

`warehouse-relocation` already exists with status live. Verify at merge. Pages stay 153 for this package.

## 3. data/descriptions.json — VERIFY, refresh only if stale

Verify the `warehouse-relocation` entry exists and matches the live page description. Refresh only if the entry is stale; do not invent new wording. (The build-meta.js editorial branch should keep generic count at 0 — verify after merge.)

## 4. Rubric DB rows — VERIFY first, then add only what is missing

- **Canonical service row:** verify the `service-warehouse-relocation` row exists (the deploy batch brought canonical services to 22); do NOT duplicate it.
- **Attestation rows:** add rows for the new deep facts (node refresh incl. `url` addition; D1–D8 dataset conversion; full-footprint area expansion at merge), each with source + date. Do NOT add rows whose facts already exist.
- **opening_hours / service_area rows:** verify Winchester (Mon-Fri 8-6, Sat 8-4, Sun 9-4) and Martinsburg (Mon-Fri 9-6, Sat 9-4, Sun 9-4) hours rows and the full-footprint area rows exist and are distinct; add ONLY rows that are genuinely missing, with the footprint.json/GeoJSON source (never the GBP source for extended areas).
- **rubric_check row:** VERIFY TABLE SHAPE FIRST. The residential batch (2026-10-29) found the rubric_check table is a checks catalog (check_id, check_text, passes_when — 7 rows), not per-service scores, and its proposed row shape did not fit. Do NOT force a per-service rubric_check row that doesn't fit; the rubric record is rubric.md in this package dir. If the table genuinely supports a per-service row, add one (R1 = 3, R2 = 3, R3 = 3, R4 = 3, R5 = 3, R6 = 3, R7 = 2, verdict READY pending deploy-time R7 re-check, dated 2026-10-29).
- **Edge rows:** the edge table holds ZERO fragment-service edges (senior/warehouse/IT/transloading/residential pattern — only page-slug edges exist). Do NOT add warehouse-only fragment edges; left for a future edge-model decision.

## 5. Entity graph nodes — REFRESH (same @id, no duplicate, no new @id)

- **entity-graph.json:** replace the existing `#service-warehouse-relocation` node with the staged schema.json Service node (adds `url`; Service areaServed stays via branch @ids). Do NOT modify the Organization node, the Place nodes, or any rating. Do NOT remove any @id.
- **best-json-entity-graph.json:** replace the existing `#service-warehouse-relocation` node with the same staged Service node (adds the Place chain; `url` already present).
- **Head graph (live index.html):** upgrade the existing `#service-warehouse-relocation` node in place to the same chain (adds `url` + Place chain via branch @ids; areaServed 7 flat strings → branch @ids). Same @id, no duplicate.
- Do NOT touch the remote gist graph (data/entity-graph.json) — new path only (data/entity-graph-full.json convention).

## 6. Machine-readable files (merge-time, proposal)

- **llms.txt:** refresh the Warehouse Relocation section with the D1–D8 summary (not duplicated); dated changelog entry appended; history lines intact.
- **data txt:** same warehouse section refresh + dated update section appended (do not duplicate the section if it already exists — refresh in place).
- **ai-sitemap.json:** refresh the warehouse service entry with the staged description + D1–D8 summary (NOT duplicated); keywords: verify "warehouse relocation" present, add only if missing. Services stay 22; hasPart stays 153 for this package.
- **ARD catalog:** add an entry for the warehouse Dataset node (identifier urn:air:theflatratemovers.com:data:warehouse-relocation, type application/ld+json, url the warehouse-relocation page) ONLY if the ARD builder supports per-category entries; otherwise leave ARD unchanged and note it.
- **Dataset JSON-LD:** convert D1–D8 (research doc §6) to page-level Dataset markup on warehouse-relocation + Developer-page collection entry, dateModified = deploy date, CC BY 4.0. Gated fields omitted (see rubric.md gaps 1–10).
- **Per-page JSON:** refresh the live `warehouse-relocation.json` to the refreshed node. Serving path already verified application/json — this is a content refresh, not a path fix.

## 7. Live-site deploy artifacts (merge-time, proposal — NOT done here)

- No new page div (page already live). No pageMeta change except verifying the existing entry (name/svc/canonical/desc) still matches; svc already points at #service-warehouse-relocation.
- Head-graph upgrade (see §5) inside public/index.html; node --check on both inline scripts before any deploy.
- Sitemap: NO change (stays 153). All-pages index: NO change (entry already exists).
- Breadcrumb: already live (Home › Warehouse Relocation).
- GitHub (same batch, after the test/check gate, by the parent deploy agent): theflatratemovers-ai (schema JSON, llms.txt, data txt, ai-sitemap.json, graphs, datasets-warehouse.json) + the-flat-rate-machine (this package dir + data/ changes). NEVER overwrite remote data/entity-graph.json (gist graph).
- GBP: NO edit in this package (Phase G batch, owner-approved).

## 8. Explicitly NOT in this package (left for their own batches)

- Any new warehouse page or branch warehouse page; any services.json/pages.json count change; any facility/equipment/drayage/chassis/bonded/FTZ/reefer/customs/racking-install/phasing-promise/WMS/permit/debris claim; any price beyond the verbatim CWT schedule; any household-storage claim (moving-and-storage activation package); any live-site edit, deploy, GitHub push, quote test post, GBP edit, or DNS change by THIS package (the parent deploys in sequence once verified, per the owner's verified = live rule).
