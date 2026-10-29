# Merge note — Local and Regional Moving deep-data package (PROPOSAL ONLY — do not apply without the merge agent's review)

Staged: 2026-10-29. This note proposes exact `data/` and graph additions. **Nothing in this note has been applied.** A deploy batch owns `data/`, `scripts/`, and `verify.js` right now; the merge agent applies these, recomputes counts, and re-runs verify.js. Do NOT hand-edit counts anywhere.

## 1. data/services.json — NO new entry (verify, do not add)

service-local-regional already exists ("Local and Regional Moving", "Local and regional moves along the I-81, I-66 and I-70 corridors.", pageCount 3, attested 2026-10-28). Verify pageCount recomputes to 3 from pages.json (hub + 2 branch pages). If a future batch adds local pages, recompute then. Do NOT create a duplicate service entry.

## 2. data/pages.json — NO new entry (verify, do not add)

The 3 local pages already exist (status "live"): local-regional-moving, local-regional-movers-winchester-va, local-regional-movers-martinsburg-wv. No new slug is staged by this package (see content-note.md for the evidence). Verify the 3 service-local-regional page entries are present and unchanged.

## 3. Entity graph nodes (for the merge agent's graph builder — proposal, not applied)

- DELETE both existing Service nodes with @id https://theflatratemovers.com/#service-local-regional in entity-graph.json (one url = Martinsburg branch page + Martinsburg areas; one url = Winchester branch page + Winchester areas; neither with a Place chain) and REPLACE them with ONE canonical node: @id https://theflatratemovers.com/#service-local-regional, serviceType "Local and Regional Moving" (registry name, superseding the head node's "Local moving"), provider #organization, areaServed [#winchester, #martinsburg], url https://theflatratemovers.com/local-regional-moving/. The full node is staged as schema.json in this package dir (Service node is the first @graph entry; the Organization/Place/BreadcrumbList entries mirror the existing graph conventions and the residential/commercial/gun-safe/office package schema shapes).
- ADD the same canonical node to best-json-entity-graph.json (currently 0 "#service-local-regional" fragment occurrences; page-slug nodes local-regional-movers-winchester-va/#service and local-regional-movers-martinsburg-wv/#service are LEFT UNTOUCHED — consolidation is a merge decision per research doc §8 Q9c, recommendation: leave alone).
- UPGRADE the thin head-graph node (same @id, currently name + serviceType "Local moving" + provider + 6 broad areaServed strings + description, no url, no Place chain) to the same full chain at merge. Do NOT create a second #service-local-regional node anywhere. Do NOT remove any other @id.
- AreaServed on the Place nodes: EXPAND to the full footprint at merge (Winchester 31, Martinsburg 35, shared 14) per the full-build authorization, branches kept distinct. The staged schema.json carries GBP lists only (16/14) as the draft baseline.
- Do NOT modify the Organization node, the Place names/addresses/hours/ratings, or any other Service node. Do NOT touch the remote gist graph (data/entity-graph.json) — new path only (data/entity-graph-full.json convention).
- Services ItemList entry (["Local and Regional Moving","#service-local-regional"]) is kept as-is — it already points at the fragment @id and needs no change once the fragment is canonical.
- Bristow: NO area, page, or dataset entry is added for Bristow in this merge (research doc §8 Q10 unanswered — branch assignment is never guessed).

## 4. Rubric DB rows (~/workspace/theflatratemovers/rubric.db — proposal; verify table shapes at merge)

- **service row:** VERIFY the service-local-regional canonical row exists (Phase A synced canonical rows; local-regional should be among them). If missing, add one row ("Local and Regional Moving", description from services.json, attested 2026-10-29). Do not duplicate an existing row.
- **attestation rows (one per fact group, only if not already covered by Phase A rows):** (a) branch facts Winchester (address/geo/hours/rating 5.0/1); (b) branch facts Martinsburg (address/geo/hours/rating 4.7/6); (c) GBP areas 16 + 14 + full footprint 31/35; (d) GSC local demand ("movers near me" 246 @ 5.0, 11 clicks; Winchester cluster; "winchester local moving company" 181 @ 20.0; thin #1s; Bristow 283 @ 15.9 unassigned); (e) local page scope (hub 586 words + FAQ; branch pages 918/990 words + FAQ + attestation sections; corridor scope; flat-rate-in-writing; base-assignment rule); (f) graph defect (entity-graph duplicate fragments; best-graph 0 fragment occurrences; head node thin) + fix (this canonical node).
- **edge rows:** service-local-regional → provider → #organization; #organization → location → #winchester; #organization → location → #martinsburg; service-local-regional → areaServed → #winchester; service-local-regional → areaServed → #martinsburg. Verify against existing edges; do not duplicate.
- **opening_hours rows:** NONE new — both branches' hours rows already exist. Verify distinctness; do not add a merged/company-level hours row.
- **service_area rows:** NONE new for the GBP lists if existing rows cover them; ADD rows for the extended-footprint areas only if the merge expands Place areaServed to the full footprint (source: footprint.json/GeoJSON, never the GBP source).
- **rubric_check row:** one row for local-regional-moving with R1 = 3, R2 = 3, R3 = 3, R4 = 3, R5 = 3, R6 = 3, R7 = 2, verdict READY (pending deploy-time R7 re-check), dated 2026-10-29, referencing rubric.md in this package dir.

## 5. Machine-readable files (merge-time, proposal)

- **llms.txt:** refresh the Local and Regional Moving section from D1–D8 (operations, sizes/access, taxonomy, commercial terms labeled domain, personas, areas, quote path); keep history lines intact; dated changelog entry.
- **data txt:** same Local and Regional Moving section refresh.
- **ai-sitemap.json:** REFRESH the existing local-regional service entry from D1–D8 (it already exists — refresh, don't duplicate) + keyword additions from real GSC queries ("movers near me", "winchester local moving company", "movers winchester va", "winchester movers", "movers martinsburg wv"). No new hasPart entry (no new page). Counts recomputed across the batch at merge.
- **ARD catalog:** refresh the local-regional Dataset entry from D1–D8 if the ARD builder supports per-category entries; otherwise leave ARD unchanged and note it.
- **Dataset JSON-LD:** convert research doc §6 D1–D8 to Dataset JSON-LD at merge: page-level markup on local-regional-moving + Developer-page collection entry, CC BY 4.0, creator organization @id, dateModified = deploy date. Gated fields (§8) stay OMITTED. No light node file is created at any point.

## 6. Live-site deploy artifacts (merge-time, proposal — NOT done here)

- NO new page div. NO new pageMeta entry (the 3 local entries already exist; verify their svc already points at #service-local-regional — it does, confirmed live 2026-10-29).
- UPGRADE the head-graph #service-local-regional node to the full chain (same @id; canonical serviceType "Local and Regional Moving"). node --check on both inline scripts before any deploy.
- Per-page JSONs: deploy the local Dataset JSON-LD + schema to the verified new-page JSON serving path (verify against a live new-page JSON first; old .json URLs return SPA fallback HTML and do not count). Hub + branch per-page JSONs are merge-time items, not staged here.
- Sitemap: NO count change for this package alone (no new page). Reconcile at merge across the full batch.
- Breadcrumb: existing trail Home › Local & Regional Moving — verify, do not duplicate.
- GitHub (same batch, after the test/check gate): theflatratemovers-ai (schema JSON, datasets JSON-LD, llms.txt, data txt, ai-sitemap.json, graphs) + the-flat-rate-machine (this package dir + research doc + data/ + scripts/ + verify.js changes). NEVER overwrite remote data/entity-graph.json (gist graph).
- GBP: NO edit in this package (Phase G batch, owner-approved).

## 7. Explicitly NOT in this package (left for their own batches)

- Any live-site edit, deploy, GitHub push, quote test post, GBP edit, DNS change, or license wording change.
- A new local hub page (rejected with evidence — see content-note.md).
- Same-day availability page/section (follow-up package; needs research doc §8 Q1 before claiming any availability).
- Bristow page (follow-up package; needs research doc §8 Q10 branch assignment).
- Small-job dedicated page (follow-up package; needs research doc §8 Q3 before claiming a distinct small-job product — otherwise the Phase E FAQ depth stands).
- Phase E depth sections for the existing hub + branch pages (staged as content-note.md guidance only; the live page copy does not change in this package).
- Any gated field from research doc §8 (same-day availability, mileage boundary, small-job minimums/product, valuation offering, debris scope, prohibited-items list, apartment-specific capability, local pricing beyond flat-rate-in-writing, Bristow assignment).
- Any storage claim (storage belongs to the moving-and-storage package, separate batch).
