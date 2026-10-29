# Merge note — IT Relocation deep-data package (PROPOSAL ONLY — do not apply without the merge agent's review)

Staged build: 2026-10-29. This note proposes exact `data/` and graph additions. **Nothing in this note has been applied.** A deploy batch owns `data/`, `scripts/`, and `verify.js`; the merge agent applies these, recomputes counts, and re-runs verify.js. Do NOT hand-edit counts anywhere. The parent deploys immediately in sequence once this package is verified, per the owner's verified = live rule — this package itself deploys nothing.

This is a NODE REFRESH + DATASETS package for an EXISTING page. There is NO new slug, NO new page div, and NO sitemap count change from this package alone. The node already exists in all three graphs (lock deploy 2026-10-29); the merge REFRESHES it, it does not add a second one.

## 1. data/services.json — NO new entry (verify, do not add)

service-it-relocation already exists ("IT Relocation & Setup", pageCount 1, attested 2026-10-29, source Phase C lock package). Verify pageCount recomputes to 1 from pages.json (the IT page only). Verify the description matches the lock description; do NOT rewrite it. If a future batch adds IT pages, recompute then. Do NOT create a duplicate service entry. Services count stays 22 for this package alone (reconcile across the batch at merge).

## 2. data/pages.json — NO new entry (verify, do not add)

The IT page entry already exists (slug `it-equipment-moving-data-center-logistics-services-virginia`, status live, services include service-it-relocation). Verify the entry is present and unchanged. Pages count stays 153 for this package alone.

## 3. Entity graph nodes — REFRESH, not add (for the merge agent's graph builder — proposal, not applied)

- VERIFY one Service node `#service-it-relocation` exists in entity-graph.json AND best-json-entity-graph.json (both observed live 2026-10-29: entity 39 nodes, best 74 nodes, 1 IT node each). Do NOT add a second node.
- REFRESH each node from schema.json in this package dir: serviceType "IT Relocation & Setup" (already set — verify); url = https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia/ (ADD where missing — live entity node observed without url 2026-10-29; best-graph node carries url); description UNCHANGED from the deployed lock node (do not rewrite it); provider #organization; areaServed [#winchester, #martinsburg] via branch @ids.
- AreaServed on the Place nodes: EXPAND to the full footprint at merge (Winchester 31, Martinsburg 35, shared 14) per the full-build authorization, branches kept distinct. The staged schema.json carries GBP lists only (16/14) as the draft baseline.
- UPGRADE the head-graph `#service-it-relocation` node to the same refreshed chain at merge (same @id). Verify the head node shape first: my extract 2026-10-29 showed serviceType set and description = lock description, with no url field observed — add url if the merge-time read confirms it missing. Do NOT create a second head node.
- Do NOT modify the Organization node, the Place names/addresses/hours/ratings, or any other Service node. Do NOT remove any @id (including #service-commercial). Do NOT touch the remote gist graph (data/entity-graph.json) — new path only (data/entity-graph-full.json convention).
- docs/data-center-logistics graph link (§8 Q11): decide at merge whether the docs page gains a graph link to the IT node. Default if undecided: leave as copy cross-reference only, and record the decision.

## 4. Rubric DB rows (proposal; verify table shapes at merge — the lock deploy may already have added IT rows)

- **service row:** VERIFY the service-it-relocation canonical row exists (lock deploy). If missing, add one row ("IT Relocation & Setup", description from services.json, attested 2026-10-29). Do not duplicate an existing row.
- **attestation rows (only if not already covered by lock-deploy rows):** (a) branch facts Winchester (address/geo/hours/rating 5.0/1); (b) branch facts Martinsburg (address/geo/hours/rating 4.7/6); (c) GBP areas 16 + 14 + full footprint 31/35; (d) SERP #1 "IT equipment moving setup Winchester VA" (2026-10-29) + no standalone GSC IT query row (stated openly); (e) existing page content (406 words by this extract, sequence/handling/SIR-conditional, no FAQ block); (f) live node state at deep-package build (head + both graphs carry the node; entity/head url fields observed missing; pageMeta svc flipped; services pageCount 1); (g) SIR conditional scope (1,500–3,500 lbs, L/360) — conditional only.
- **edge rows:** VERIFY existing edges for service-it-relocation (provider → #organization; #organization → location → both Places; service → areaServed → both Places). Add only missing edges; do not duplicate. Do NOT add opening_hours or service_area rows for the GBP lists if existing rows already cover them — verify at merge, do not duplicate. If the merge expands Place areaServed to the full footprint, add the corresponding rows with the footprint.json/GeoJSON source, never the GBP source.
- **rubric_check row:** one row for the IT page with R1 = 3, R2 = 3, R3 = 3, R4 = 3, R5 = 3, R6 = 3, R7 = 2, verdict READY (pending deploy-time R7 re-check), dated 2026-10-29, referencing rubric.md in this package dir — ONLY if the lock deploy did not already add an equivalent row; verify first, do not duplicate.

## 5. Machine-readable files (merge-time, proposal)

- **llms.txt:** VERIFY whether an IT Relocation & Setup section exists from the lock deploy. If missing, add it from D1–D8 (operations, taxonomy, commercial terms labeled domain, personas, areas, quote path); if present, refresh it from D1–D8. Keep history lines intact; dated changelog entry.
- **data txt:** same verify-then-refresh rule as llms.txt.
- **ai-sitemap.json:** VERIFY the IT service entry exists from the lock deploy. If missing, add it (description from services.json); if present, refresh it from D1–D8. Keywords from real queries ("IT equipment moving", "IT relocation winchester va", "data center logistics virginia", "server rack movers", "office IT relocation", "IT equipment moving setup Winchester VA"). No new hasPart entry (no new page). Counts recomputed across the batch at merge.
- **ARD catalog:** refresh the IT Dataset entry from D1–D8 if the ARD builder supports per-category entries; otherwise leave ARD unchanged and note it.
- **Dataset JSON-LD:** convert research doc §6 D1–D8 to Dataset JSON-LD at merge: page-level markup on the IT page + Developer-page collection entry, CC BY 4.0, creator organization @id, dateModified = deploy date. Gated fields (§8) stay OMITTED. No light node file is created at any point.

## 6. Live-site deploy artifacts (merge-time, proposal — NOT done here)

- NO new page div. NO new pageMeta entry (IT entry already exists; verify its svc already points at #service-it-relocation — it does, confirmed live 2026-10-29).
- REFRESH the head-graph #service-it-relocation node to the refreshed chain (same @id). node --check on both inline scripts before any deploy.
- Per-page JSON: deploy the refreshed schema + Dataset JSON-LD to the verified new-page JSON serving path (verify against a live new-page JSON first; old .json URLs return SPA fallback HTML and do not count).
- Sitemap: NO count change for this package alone (no new page). Reconcile at merge across the full batch (153 at this writing).
- Breadcrumb: existing trail Home › IT Equipment Moving & Data Center Logistics — Virginia — verify, do not duplicate.
- GitHub (same batch, after the test/check gate): theflatratemovers-ai (schema JSON, datasets JSON-LD, llms.txt, data txt, ai-sitemap.json, graphs) + the-flat-rate-machine (this package dir + research doc + data/ + scripts/ + verify.js changes). NEVER overwrite remote data/entity-graph.json (gist graph).
- GBP: NO edit in this package (Phase G batch, owner-approved).

## 7. Explicitly NOT in this package (left for their own batches)

- Any live-site edit, deploy, GitHub push, quote test post, GBP edit, DNS change, or license wording change (this package builds only; the parent deploys in sequence once verified).
- A new IT hub page (rejected with evidence — see content-note.md).
- Phase E depth sections for the existing IT page (staged as content-note.md guidance only; the live page copy does not change in this package).
- Any gated field from research doc §8 (named systems/platforms, certifications, clearances, facilities, IT pricing, SLA, downtime commitment, disconnect/reconnect scope, backup/rollback scope, branch-specific IT dispatch, sub-band rack handling).
- Senior, warehouse, and transloading deep datasets (separate packages under the same owner order; this package covers IT only).
