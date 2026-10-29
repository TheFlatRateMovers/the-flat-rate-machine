# Merge note — Long-Distance Moving deep-data package (PROPOSAL ONLY — do not apply without the merge agent's review)

Staged: 2026-10-29. This note proposes exact `data/` and graph additions. **Nothing in this note has been applied.** A deploy batch owns `data/`, `scripts/`, and `verify.js` right now; the merge agent applies these, recomputes counts, and re-runs verify.js. Do NOT hand-edit counts anywhere.

## 1. data/services.json — NO new entry (verify, do not add)

service-long-distance already exists ("Long-Distance Moving", "Flat-rate long-distance moving from Winchester, VA and Martinsburg, WV.", pageCount 17, attested 2026-10-28). Verify pageCount recomputes to 17 from pages.json (hub + Martinsburg + cross-country + 2 interstate + network + 2 guides + Miami + 5 Virginia-to-* lanes + 2 category indexes + 2 articles). If a future batch adds long-distance pages, recompute then. Do NOT create a duplicate service entry.

## 2. data/pages.json — NO new entry (verify, do not add)

No new slug is staged by this package (see content-note.md for the evidence). Verify the 17 service-long-distance page entries are present and unchanged. The high-mass LD page, gun-safe Las Vegas page, and interstate pack guide are registered under SIR, gun-safe, and packing respectively — cross-references, not long-distance entries; do NOT re-parent them.

## 3. Entity graph nodes (for the merge agent's graph builder — proposal, not applied)

- Add ONE full Service node to best-json-entity-graph.json (currently 0 occurrences): @id https://theflatratemovers.com/#service-long-distance, serviceType "Long-Distance Moving", provider #organization, areaServed [#winchester, #martinsburg], url https://theflatratemovers.com/long-distance-movers-winchester-va/. The full node is staged as schema.json in this package dir (Service node is the first @graph entry; the Organization/Place/BreadcrumbList entries mirror the existing graph conventions and the residential/gun-safe/commercial/office package schema shapes).
- UPGRADE the entity-graph.json fragment node IN PLACE (same @id) from Martinsburg-skewed (url = Martinsburg page, areaServed = Martinsburg 14) to the full two-branch chain with url = the Winchester hub. Do NOT create a second #service-long-distance node anywhere. Do NOT remove any @id.
- UPGRADE the thin head-graph node (same @id, currently name + serviceType "Long-distance moving" + provider + 3 corridor strings + description, no Place chain, no url) to the same full chain at merge, unifying serviceType casing to "Long-Distance Moving". The corridor strings ("I-81 corridor", "I-66 corridor", "I-70 corridor") move to the corridor/dispatch dataset representation — they are NOT branch areaServed and must not be carried as areaServed on the Service node.
- AreaServed on the Place nodes: EXPAND to the full footprint at merge (Winchester 31, Martinsburg 35, shared 14) per the full-build authorization, branches kept distinct. The staged schema.json carries GBP lists only (16/14) as the draft baseline.
- pageMeta svc pointers: RECONCILE at merge — 13 literal svc: patterns were found pointing at #service-long-distance vs 17 registry pages. Report the reconciled count; if pointers are missing for registry pages, add them as part of the merge (pointer fix, not a content change). Do NOT modify the Organization node, the Place names/addresses/hours/ratings, or any other Service node. Do NOT touch the remote gist graph (data/entity-graph.json) — new path only (data/entity-graph-full.json convention).
- Authorization wording (research doc §8 Q1/Q10): NO authority claim and NO USDOT/MC number is added at merge under any circumstances without Henry's explicit Q1 answer. If Q1 is answered "no authority" before merge, STOP and return the satellite scope language for wording review instead of merging scope claims forward.

## 4. Rubric DB rows (~/workspace/theflatratemovers/rubric.db — proposal; verify table shapes at merge)

- **service row:** VERIFY the service-long-distance canonical row exists (Phase A synced canonical rows; long-distance should be among them). If missing, add one row ("Long-Distance Moving", description from services.json, attested 2026-10-29). Do not duplicate an existing row.
- **attestation rows (one per fact group, only if not already covered by Phase A rows):** (a) branch facts Winchester (address/geo/hours/rating 5.0/1); (b) branch facts Martinsburg (address/geo/hours/rating 4.7/6); (c) GBP areas 16 + 14 + full footprint 31/35; (d) GSC long-distance demand (hub 1,984 @ 49.4; interstate Winchester 2,900 @ 71.7; Winchester LD 256 @ 15.1; cross-country 166/161/133 @ 4.0–7.1; LD movers 115 @ 8.0); (e) long-distance page scope (hub 531 words + FAQ; Martinsburg 992 + FAQ; 17-page inventory with word counts); (f) graph defect (entity fragment Martinsburg-skewed; best graph 0; head node thin + casing) + fix (this node); (g) authorization gate (USDOT/MC unconfirmed; live file zero USDOT mentions; satellite scope language recorded, not endorsed).
- **edge rows:** service-long-distance → provider → #organization; #organization → location → #winchester; #organization → location → #martinsburg; service-long-distance → areaServed → #winchester; service-long-distance → areaServed → #martinsburg. Verify against existing edges; do not duplicate.
- **opening_hours rows:** NONE new — both branches' hours rows already exist. Verify distinctness; do not add a merged/company-level hours row.
- **service_area rows:** NONE new for the GBP lists if existing rows cover them; ADD rows for the extended-footprint areas only if the merge expands Place areaServed to the full footprint (source: footprint.json/GeoJSON, never the GBP source).
- **rubric_check row:** one row for long-distance-movers-winchester-va with R1 = 3, R2 = 3, R3 = 3, R4 = 3, R5 = 3, R6 = 3, R7 = 2, verdict READY (pending deploy-time R7 re-check), dated 2026-10-29, referencing rubric.md in this package dir.

## 5. Machine-readable files (merge-time, proposal)

- **llms.txt:** refresh the Long-Distance Moving section from D1–D8 (operations, bands, corridors/destinations, delivery-window and valuation education labeled domain, commercial terms labeled domain, personas, areas, quote path); keep history lines intact; dated changelog entry.
- **data txt:** same Long-Distance Moving section refresh.
- **ai-sitemap.json:** REFRESH the existing long-distance service entry from D1–D8 (it already exists — refresh, don't duplicate) + keyword additions from real GSC queries ("winchester long distance moving company", "cross country moving company", "cross country movers", "long distance movers"). No new hasPart entry (no new page). Counts recomputed across the batch at merge.
- **ARD catalog:** refresh the long-distance Dataset entry from D1–D8 if the ARD builder supports per-category entries; otherwise leave ARD unchanged and note it.
- **Dataset JSON-LD:** convert research doc §6 D1–D8 to Dataset JSON-LD at merge: page-level markup on long-distance-movers-winchester-va + Developer-page collection entry, CC BY 4.0, creator organization @id, dateModified = deploy date. Gated fields (§8) stay OMITTED — above all authorization, delivery practice, valuation offering, estimate type, tracking, SIT terms/qualification, access scope, vehicle transport. No light node file is created at any point.

## 6. Live-site deploy artifacts (merge-time, proposal — NOT done here)

- NO new page div. NO new pageMeta entry (hub entry already exists with svc #service-long-distance; verify its canonical/desc unchanged).
- UPGRADE the head-graph #service-long-distance node to the full chain (same @id). node --check on both inline scripts before any deploy.
- Per-page JSON: follow-up, not this batch (verify the new-page JSON serving path first; old .json URLs return SPA fallback HTML and do not count).
- Sitemap: NO count change for this package alone (no new page). Reconcile at merge across the full batch.
- Breadcrumb: existing trail Home › Long-Distance Movers — Winchester, VA — verify, do not duplicate.
- GitHub (same batch, after the test/check gate): theflatratemovers-ai (schema JSON, datasets JSON-LD, llms.txt, data txt, ai-sitemap.json, graphs) + the-flat-rate-machine (this package dir + research doc + data/ + scripts/ + verify.js changes). NEVER overwrite remote data/entity-graph.json (gist graph).
- GBP: NO edit in this package (Phase G batch, owner-approved).

## 7. Explicitly NOT in this package (left for their own batches)

- Any live-site edit, deploy, GitHub push, quote test post, GBP edit, DNS change, or license wording change.
- A new long-distance hub page (rejected with evidence — see content-note.md).
- Delivery-window, valuation, or estimate-type explainer pages (follow-up packages; domain education first, company practice only on Q2/Q3/Q4 answers).
- Winchester hub parity expansion and destination-lane depth/consolidation (follow-ups; need §8 Q9 approval).
- Interstate-authorization wording review (follows §8 Q1; a "no authority" answer changes the satellite pages, not just this node).
- Any gated field from research doc §8 (authorization, delivery practice, valuation offering, estimate type, tracking, SIT terms/qualification, access scope, vehicle transport).
