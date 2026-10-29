# Merge note — Gun Safe Moving deep-data package (PROPOSAL ONLY — do not apply without the merge agent's review)

Staged: 2026-10-29. This note proposes exact `data/` and graph additions. **Nothing in this note has been applied.** A deploy batch owns `data/`, `scripts/`, and `verify.js` right now; the merge agent applies these, recomputes counts, and re-runs verify.js. Do NOT hand-edit counts anywhere.

## 1. data/services.json — NO new entry (verify, do not add)

service-gun-safe already exists ("Gun Safe Moving", pageCount 9, attested 2026-10-28). Verify pageCount recomputes to 9 from pages.json (hub + 2 branch + protocol + 2 cases + long-distance + vault category + technical-rigging). If a future batch adds gun-safe pages, recompute then. Do NOT create a duplicate service entry.

## 2. data/pages.json — NO new entry (verify, do not add)

The hub and all 9 service pages already exist (status "live"). No new slug is staged by this package (see content-note.md for the evidence). Verify the 9 service-gun-safe page entries are present and unchanged.

## 3. Entity graph nodes (for the merge agent's graph builder — proposal, not applied)

- UPGRADE the existing Service node in entity-graph.json IN PLACE: @id https://theflatratemovers.com/#service-gun-safe, serviceType "Gun Safe Moving", provider #organization, areaServed [#winchester, #martinsburg], url https://theflatratemovers.com/gun-safe-movers/. The staged schema.json in this package dir is the full node (Service node is the first @graph entry; the Organization/Place/BreadcrumbList entries mirror the existing graph conventions and the residential package's schema shape). The current node is Martinsburg-skewed (url = Martinsburg page; areaServed = Martinsburg 14 areas) — replace its url and areaServed with the two-branch chain. Do NOT create a second #service-gun-safe node anywhere. Do NOT remove any @id.
- ADD the missing Service node to best-json-entity-graph.json with the same @id, serviceType, provider, areaServed, and url (currently 0 "#service-gun-safe" occurrences there; only page-scoped #service nodes exist — leave those untouched).
- UPGRADE the thin head-graph node (same @id, currently name + serviceType + provider + 6 broad areaServed strings + description, no Place chain) to the same full chain at merge.
- AreaServed on the Place nodes: EXPAND to the full footprint at merge (Winchester 31, Martinsburg 35, shared 14) per the full-build authorization, branches kept distinct. The staged schema.json carries GBP lists only (16/14) as the draft baseline.
- Do NOT modify the Organization node, the Place names/addresses/hours/ratings, or any other Service node. Do NOT touch the remote gist graph (data/entity-graph.json) — new path only (data/entity-graph-full.json convention).

## 4. Rubric DB rows (~/workspace/theflatratemovers/rubric.db — proposal; verify table shapes at merge)

- **service row:** VERIFY the service-gun-safe canonical row exists (Phase A synced canonical rows; gun-safe should be among them). If missing, add one row ("Gun Safe Moving", description from services.json, attested 2026-10-29). Do not duplicate an existing row.
- **attestation rows (one per fact group, only if not already covered by Phase A rows):** (a) branch facts Winchester (address/geo/hours/rating 5.0/1); (b) branch facts Martinsburg (address/geo/hours/rating 4.7/6); (c) GBP areas 16 + 14 + full footprint 31/35; (d) GSC gun-safe demand ("gun safe movers" 140 @ 18.4; branch page 73 @ 5.0, 4 clicks; hub-family AI 72; Winchester AI 6); (e) gun-safe page scope (hub 795 words + FAQ; Winchester 442 words; Martinsburg 1,083 words + attestation; protocol 390 words; cases 462/492 words; long-distance 472 words); (f) graph defects (entity node Martinsburg-skewed; best graph 0 occurrences; head node thin) + fix (this refresh).
- **edge rows:** service-gun-safe → provider → #organization; #organization → location → #winchester; #organization → location → #martinsburg; service-gun-safe → areaServed → #winchester; service-gun-safe → areaServed → #martinsburg. Verify against existing edges; do not duplicate.
- **opening_hours rows:** NONE new — both branches' hours rows already exist. Verify distinctness; do not add a merged/company-level hours row.
- **service_area rows:** NONE new for the GBP lists if existing rows cover them; ADD rows for the extended-footprint areas only if the merge expands Place areaServed to the full footprint (source: footprint.json/GeoJSON, never the GBP source).
- **rubric_check row:** one row for gun-safe-movers with R1 = 3, R2 = 3, R3 = 3, R4 = 3, R5 = 3, R6 = 3, R7 = 2, verdict READY (pending deploy-time R7 re-check), dated 2026-10-29, referencing rubric.md in this package dir.

## 5. Machine-readable files (merge-time, proposal)

- **llms.txt:** refresh the Gun Safe Moving section from D1–D8 (SIR band + method, weight-band context labeled domain, trust/privacy buying logic, areas, quote path); keep history lines intact; dated changelog entry.
- **data txt:** same Gun Safe Moving section refresh.
- **ai-sitemap.json:** REFRESH the existing gun-safe service entry from D1–D8 (it already exists — refresh, don't duplicate) + keyword additions from real GSC queries ("gun safe movers", "gun safe movers winchester va", "gun safe movers martinsburg wv"). No new hasPart entry (no new page). Counts recomputed across the batch at merge.
- **ARD catalog:** refresh the gun-safe Dataset entry from D1–D8 if the ARD builder supports per-category entries; otherwise leave ARD unchanged and note it.
- **Dataset JSON-LD:** convert research doc §6 D1–D8 to Dataset JSON-LD at merge: page-level markup on gun-safe-movers + Developer-page collection entry, CC BY 4.0, creator organization @id, dateModified = deploy date. Gated fields (§8) stay OMITTED. No light node file is created at any point.

## 6. Live-site deploy artifacts (merge-time, proposal — NOT done here)

- NO new page div. NO new pageMeta entry (hub entry already exists; verify its svc already points at #service-gun-safe — it does, confirmed live 2026-10-29).
- UPGRADE the head-graph #service-gun-safe node to the full chain (same @id). node --check on both inline scripts before any deploy.
- Per-page JSON: deploy the gun-safe Dataset JSON-LD + schema to the verified new-page JSON serving path (verify against a live new-page JSON first; old .json URLs return SPA fallback HTML and do not count).
- Sitemap: NO count change for this package alone (no new page). Reconcile at merge across the full batch.
- Breadcrumb: existing trail Home › Gun Safe Moving — verify, do not duplicate.
- GitHub (same batch, after the test/check gate): theflatratemovers-ai (schema JSON, datasets JSON-LD, llms.txt, data txt, ai-sitemap.json, graphs) + the-flat-rate-machine (this package dir + research doc + data/ + scripts/ + verify.js changes). NEVER overwrite remote data/entity-graph.json (gist graph).
- GBP: NO edit in this package (Phase G batch, owner-approved).

## 7. Explicitly NOT in this package (left for their own batches)

- Any live-site edit, deploy, GitHub push, quote test post, GBP edit, DNS change, or license wording change.
- A new gun-safe hub page (rejected with evidence — see content-note.md).
- Sub-band handling page/section (gated on research doc §8 Q1).
- Stairs-policy section (gated on §8 Q3).
- Emptying guidance section (gated on §8 Q2).
- Phase E depth sections for the existing pages (staged as content-note.md guidance only; live page copy does not change in this package).
- Any gated field from research doc §8 (sub-band handling, stairs policy, emptying instruction, equipment deployment, re-anchoring, vault installation scope, calibration classes, long-distance safe scope, locksmith services, crew size/truck claims).
- Any private-job detail from any private thread or email (never published, never in this package).
