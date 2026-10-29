# Merge note — Residential Moving deep-data package (PROPOSAL ONLY — do not apply without the merge agent's review)

Staged: 2026-10-29. This note proposes exact `data/` and graph additions. **Nothing in this note has been applied.** A deploy batch owns `data/`, `scripts/`, and `verify.js` right now; the merge agent applies these, recomputes counts, and re-runs verify.js. Do NOT hand-edit counts anywhere.

## 1. data/services.json — NO new entry (verify, do not add)

service-residential already exists ("Residential Moving", "Flat-rate house and apartment moving, local, regional and long-distance.", pageCount 11, attested 2026-10-28). Verify pageCount recomputes to 11 from pages.json (hub + 4 category pages + 6 guide pages). If a future batch adds residential pages, recompute then. Do NOT create a duplicate service entry.

## 2. data/pages.json — NO new entry (verify, do not add)

The residential-moving page already exists (status "live"). No new slug is staged by this package (see content-note.md for the evidence). Verify the 11 service-residential page entries are present and unchanged.

## 3. Entity graph nodes (for the merge agent's graph builder — proposal, not applied)

- Add ONE Service node to entity-graph.json AND best-json-entity-graph.json: @id https://theflatratemovers.com/#service-residential, serviceType "Residential Moving", provider #organization, areaServed [#winchester, #martinsburg], url https://theflatratemovers.com/residential-moving/. The full node is staged as schema.json in this package dir (Service node is the first @graph entry; the Organization/Place/BreadcrumbList entries mirror the existing graph conventions and the senior package's schema shape).
- UPGRADE the thin head-graph node (same @id, currently name + serviceType + provider + 6 broad areaServed strings + description, no Place chain) to the same full chain at merge. Do NOT create a second #service-residential node anywhere. Do NOT remove any @id.
- AreaServed on the Place nodes: EXPAND to the full footprint at merge (Winchester 31, Martinsburg 35, shared 14) per the full-build authorization, branches kept distinct. The staged schema.json carries GBP lists only (16/14) as the draft baseline.
- Do NOT modify the Organization node, the Place names/addresses/hours/ratings, or any other Service node. Do NOT touch the remote gist graph (data/entity-graph.json) — new path only (data/entity-graph-full.json convention).
- Estate cross-link decision (research doc §8 Q6): if Henry approves, add a cross-reference edge from the residential node to the estate-relocation page. Do NOT re-parent the estate page from the packing service without his explicit answer.

## 4. Rubric DB rows (~/workspace/theflatratemovers/rubric.db — proposal; verify table shapes at merge)

- **service row:** VERIFY the service-residential canonical row exists (Phase A synced 18 canonical rows; residential should be among them). If missing, add one row ("Residential Moving", description from services.json, attested 2026-10-29). Do not duplicate an existing row.
- **attestation rows (one per fact group, only if not already covered by Phase A rows):** (a) branch facts Winchester (address/geo/hours/rating 5.0/1); (b) branch facts Martinsburg (address/geo/hours/rating 4.7/6); (c) GBP areas 16 + 14 + full footprint 31/35; (d) GSC residential demand (residential-moving 1,997 @ 78.5; "movers near me" 246 @ 5.0, 11 clicks; Winchester cluster; thin #1s); (e) residential page scope (620 words, FAQ section, packing options, conditional SIR); (f) graph defect (machine graphs 0 occurrences; head node thin) + fix (this node).
- **edge rows:** service-residential → provider → #organization; #organization → location → #winchester; #organization → location → #martinsburg; service-residential → areaServed → #winchester; service-residential → areaServed → #martinsburg. Verify against existing edges; do not duplicate.
- **opening_hours rows:** NONE new — both branches' hours rows already exist. Verify distinctness; do not add a merged/company-level hours row.
- **service_area rows:** NONE new for the GBP lists if existing rows cover them; ADD rows for the extended-footprint areas only if the merge expands Place areaServed to the full footprint (source: footprint.json/GeoJSON, never the GBP source).
- **rubric_check row:** one row for residential-moving with R1 = 3, R2 = 3, R3 = 3, R4 = 3, R5 = 3, R6 = 3, R7 = 2, verdict READY (pending deploy-time R7 re-check), dated 2026-10-29, referencing rubric.md in this package dir.

## 5. Machine-readable files (merge-time, proposal)

- **llms.txt:** refresh the Residential Moving section from D1–D8 (operations, taxonomy, commercial terms labeled domain, personas, areas, quote path); keep history lines intact; dated changelog entry.
- **data txt:** same Residential Moving section refresh.
- **ai-sitemap.json:** REFRESH the existing residential service entry from D1–D8 (it already exists — refresh, don't duplicate) + keyword additions from real GSC queries ("movers near me", "moving companies winchester va", "winchester movers", "movers martinsburg wv"). No new hasPart entry (no new page). Counts recomputed across the batch at merge.
- **ARD catalog:** refresh the residential Dataset entry from D1–D8 if the ARD builder supports per-category entries; otherwise leave ARD unchanged and note it.
- **Dataset JSON-LD:** convert research doc §6 D1–D8 to Dataset JSON-LD at merge: page-level markup on residential-moving + Developer-page collection entry, CC BY 4.0, creator organization @id, dateModified = deploy date. Gated fields (§8) stay OMITTED. No light node file is created at any point.

## 6. Live-site deploy artifacts (merge-time, proposal — NOT done here)

- NO new page div. NO new pageMeta entry (residential entry already exists; verify its svc already points at #service-residential — it does, confirmed live 2026-10-29).
- UPGRADE the head-graph #service-residential node to the full chain (same @id). node --check on both inline scripts before any deploy.
- Per-page JSON: deploy the residential Dataset JSON-LD + schema to the verified new-page JSON serving path (verify against a live new-page JSON first; old .json URLs return SPA fallback HTML and do not count).
- Sitemap: NO count change for this package alone (no new page). Reconcile at merge across the full batch.
- Breadcrumb: existing trail Home › Residential Moving — verify, do not duplicate.
- GitHub (same batch, after the test/check gate): theflatratemovers-ai (schema JSON, datasets JSON-LD, llms.txt, data txt, ai-sitemap.json, graphs) + the-flat-rate-machine (this package dir + research doc + data/ + scripts/ + verify.js changes). NEVER overwrite remote data/entity-graph.json (gist graph).
- GBP: NO edit in this package (Phase G batch, owner-approved).

## 7. Explicitly NOT in this package (left for their own batches)

- Any live-site edit, deploy, GitHub push, quote test post, GBP edit, DNS change, or license wording change.
- A new residential hub page (rejected with evidence — see content-note.md).
- Apartment dedicated page (follow-up package; needs research doc §8 Q3 before claiming apartment-specific capability).
- Storage page (gated on §8 Q1 — no storage service published).
- Phase E depth sections for the existing residential page (staged as content-note.md guidance only; the live page copy does not change in this package).
- Any gated field from research doc §8 (storage, valuation offering, same-day availability, debris scope, prohibited-items list, residential pricing beyond flat-rate-in-writing).
