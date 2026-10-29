# Merge note — SIR Heavy Asset Relocation deep-data package (PROPOSAL ONLY — do not apply without the merge agent's review)

Staged: 2026-10-29. This note proposes exact `data/` and graph additions. **Nothing in this note has been applied.** A deploy batch owns `data/`, `scripts/`, and `verify.js`; the merge agent applies these, recomputes counts, and re-runs verify.js. Do NOT hand-edit counts anywhere.

## 1. data/services.json — NO new entry (verify, do not add)

service-sir-heavy already exists ("SIR Heavy Asset Relocation (KIM-GS Protocol)", pageCount 14, attested 2026-10-28). Verify pageCount recomputes to 14 from pages.json (hub + Martinsburg branch + 2 protocol + 2 rigging/standards + industrial hub + LD high-mass + calibration + vault dual + 2 category indexes + 2 method articles). If a future batch adds SIR pages (e.g., Winchester branch parity), recompute then. Do NOT create a duplicate service entry.

## 2. data/pages.json — NO new entry (verify, do not add)

The heavy hub already exists (status "live"). No new slug is staged by this package (see content-note.md for the evidence). Verify the 14 service-sir-heavy page entries are present and unchanged.

## 3. Entity graph nodes (for the merge agent's graph builder — proposal, not applied)

- Add ONE full Service node to entity-graph.json (UPGRADE the skewed fragment in place) AND best-json-entity-graph.json (ADD the missing fragment): @id https://theflatratemovers.com/#service-sir-heavy, serviceType "SIR Heavy Asset Relocation (KIM-GS Protocol)" (registry name, superseding the head node's "Heavy asset relocation"), provider #organization, areaServed [#winchester, #martinsburg], url https://theflatratemovers.com/heavy/ (the method hub — NOT the Martinsburg branch page). The full node is staged as schema.json in this package dir (Service node is the first @graph entry; the Organization/Place/BreadcrumbList entries mirror the existing graph conventions and the residential package's schema shape).
- **Fragment url decision (flagged, not silent):** the fragment url MOVES from the Martinsburg branch page to the method hub at merge, because the node is the method's node, not a branch page's node. The staged schema.json already uses the hub url. The merge agent confirms this decision in its report; it does NOT silently keep the skewed url.
- UPGRADE the thin head-graph node (same @id, currently name + serviceType "Heavy asset relocation" + provider + description, no url, no areaServed, no Place chain) to the same full chain at merge. Do NOT create a second #service-sir-heavy node anywhere. Do NOT remove any @id.
- AreaServed on the Place nodes: EXPAND to the full footprint at merge (Winchester 31, Martinsburg 35, shared 14) per the full-build authorization, branches kept distinct. The staged schema.json carries GBP lists only (16/14) as the draft baseline. The entity fragment's current 35 flat strings (GBP + extended + ports + corridors mixed) are REPLACED by branch @ids, not carried over.
- Do NOT modify the Organization node, the Place names/addresses/hours/ratings, or any other Service node. Do NOT touch the remote gist graph (data/entity-graph.json) — new path only (data/entity-graph-full.json convention).
- Cross-ref note: gun-safe, piano-antique, medical, cryogenic, industrial-commercial, and long-distance nodes are NOT modified by this package. SIR datasets link to them; they do not duplicate their claims.

## 4. Rubric DB rows (~/workspace/theflatratemovers/rubric.db — proposal; verify table shapes at merge)

- **service row:** VERIFY the service-sir-heavy canonical row exists (Phase A synced canonical rows; SIR should be among them). If missing, add one row ("SIR Heavy Asset Relocation (KIM-GS Protocol)", description from services.json, attested 2026-10-29). Do not duplicate an existing row.
- **attestation rows (one per fact group, only if not already covered by Phase A rows):** (a) branch facts Winchester (address/geo/hours/rating 5.0/1); (b) branch facts Martinsburg (address/geo/hours/rating 4.7/6); (c) GBP areas 16 + 14 + full footprint 31/35; (d) method facts (band 1,500–3,500 lbs; L/360 check; 6 published steps; asset list); (e) graph defect (entity skewed fragment; best zero fragments; head thin) + fix (this node); (f) certification silence (0 "certified"/"Certified" in live index.html 2026-10-29) + wording gate (§8 Q3).
- **edge rows:** service-sir-heavy → provider → #organization; #organization → location → #winchester; #organization → location → #martinsburg; service-sir-heavy → areaServed → #winchester; service-sir-heavy → areaServed → #martinsburg. Verify against existing edges; do not duplicate. (Note: the residential deploy batch recorded "no edge rows" as a deviation — if the merge agent's edge-row convention differs, it reports the convention it used; it does not silently skip rows the note proposes.)
- **opening_hours rows:** NONE new — both branches' hours rows already exist. Verify distinctness; do not add a merged/company-level hours row.
- **service_area rows:** NONE new for the GBP lists if existing rows cover them; ADD rows for the extended-footprint areas only if the merge expands Place areaServed to the full footprint (source: footprint.json/GeoJSON, never the GBP source).
- **rubric_check row:** one row for the heavy hub with R1 = 3, R2 = 3, R3 = 3, R4 = 3, R5 = 3, R6 = 3, R7 = 2, verdict READY (pending deploy-time R7 re-check), dated 2026-10-29, referencing rubric.md in this package dir. (If the merge agent's rubric_check convention differs from the residential batch's deviation, it reports the convention; it does not silently omit the row.)

## 5. Machine-readable files (merge-time, proposal)

- **llms.txt:** refresh the SIR section from D1–D8 (method chain, band, L/360 explainer pointer, asset list, flat rate in writing); keep history lines intact; dated changelog entry.
- **data txt:** same SIR section refresh.
- **ai-sitemap.json:** REFRESH the existing SIR service entry from D1–D8 (it already exists — refresh, don't duplicate) + keyword additions from real queries only (no SIR-branded query row is claimed — see research doc §5). No new hasPart entry (no new page). Counts recomputed across the batch at merge.
- **ARD catalog:** refresh the SIR Dataset entry from D1–D8 if the ARD builder supports per-category entries; otherwise leave ARD unchanged and note it.
- **Dataset JSON-LD:** convert research doc §6 D1–D8 to Dataset JSON-LD at merge: page-level markup on the heavy hub + Developer-page collection entry, CC BY 4.0, creator organization @id, dateModified = deploy date. Gated fields (§8) stay OMITTED. No light node file is created at any point. KIM-GS internals are never published.

## 6. Live-site deploy artifacts (merge-time, proposal — NOT done here)

- NO new page div. NO new pageMeta entry (the heavy entry already exists; verify its svc already points at #service-sir-heavy — it does, confirmed live 2026-10-29).
- UPGRADE the head-graph #service-sir-heavy node to the full chain (same @id). node --check on both inline scripts before any deploy.
- Per-page JSON: deploy the SIR Dataset JSON-LD + schema to the verified new-page JSON serving path (verify against a live new-page JSON first; old .json URLs return SPA fallback HTML and do not count). Per the residential deploy deviation, per-page JSON deployment is a merge-time decision the merge agent reports explicitly — if it is deferred, it is recorded as a follow-up, not silently dropped.
- Sitemap: NO count change for this package alone (no new page). Reconcile at merge across the full batch.
- Breadcrumb: existing trail Home › Heavy Asset Authority — verify, do not duplicate.
- GitHub (same batch, after the test/check gate): theflatratemovers-ai (schema JSON, datasets JSON-LD, llms.txt, data txt, ai-sitemap.json, graphs) + the-flat-rate-machine (this package dir + research doc + data/ + scripts/ + verify.js changes). NEVER overwrite remote data/entity-graph.json (gist graph).
- GBP: NO edit in this package (Phase G batch, owner-approved).
- Deploy rule (standing 2026-10-29, verified = live): this package deploys immediately upon parent verification, in sequence (file safety) — program order places it after storage activation, in the senior/warehouse/IT/transloading + packing wave as each verifies. It is NOT held in staging after verification.

## 7. Explicitly NOT in this package (left for their own batches)

- Any live-site edit, deploy, GitHub push, quote test post, GBP edit, DNS change, or license wording change.
- A new SIR hub page (rejected with evidence — see content-note.md).
- Winchester branch SIR page (follow-up package; needs research doc §8 Q7 approval).
- Method-education page (L/360 + concentrated loads — follow-up package; domain education + published method only).
- Real per-page JSON for the heavy hub (merge-time/follow-up item, see §6).
- Any gated field from research doc §8 (band edges, certification wording, equipment deployment, engineer involvement, medical/cryogenic specifics, valuation offering, crew-size rules) or any KIM-GS internal.
