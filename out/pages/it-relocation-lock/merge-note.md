# Merge note — IT Relocation & Setup lock package (PROPOSAL ONLY — do not apply without the merge agent's review)

Staged: 2026-10-29. Author: Phase C IT-relocation lock package (staged). This note proposes exact `data/` and graph additions. **Nothing in this note has been applied.** Another agent owns `data/`, `scripts/`, and `verify.js` right now; the merge agent applies these, recomputes counts, and re-runs verify.js. Do NOT hand-edit counts anywhere — totals are recomputed from pages.json / services.json at merge time.

This is a LOCK package for an EXISTING page. There is NO new slug, NO new page div, and NO sitemap count change from this package alone.

## 1. data/services.json — new entry (append to `services` array; mirror the existing entry shape)

```json
{
  "id": "service-it-relocation",
  "name": "IT Relocation & Setup",
  "description": "IT equipment and data center logistics from The Flat Rate Movers: servers, racks, workstations, and network equipment moved in a planned, labelled sequence so systems come back up in order, as part of commercial and office relocations across the Shenandoah Valley and Eastern Panhandle. Flat rate quoted in writing before move day.",
  "pageCount": 1,
  "source": "Phase C IT-relocation lock package 2026-10-29 (SERP #1 'IT equipment moving setup Winchester VA'; datasets doc §4 IT formulation; live page fetched 2026-10-29)",
  "attested": "2026-10-29"
}
```

Notes: `pageCount` must be recomputed from pages.json at merge (expected 1 — the existing IT page below). Service count becomes 19 (18 + 1) for this package alone; if the merge batch includes the senior package, recompute across the batch (18 + senior + IT). If services.json entries carry additional fields (check the file's existing entry shape at merge), mirror them — do not invent new fields.

## 2. data/pages.json — NO new entry; amend the EXISTING entry (verify shape at merge)

- Existing entry slug: `it-equipment-moving-data-center-logistics-services-virginia`, URL https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia/, title "IT Equipment Moving & Data Center Logistics — Virginia" (must match live pageMeta `name` exactly).
- Amendment: add `service-it-relocation` to that entry's services list (mirror the packing entry's services-array convention). Do NOT change its slug, URL, title, or status (already live). Pages count stays 150 for this package alone.
- If the entry has no services field, add one with `["service-it-relocation"]` and note the convention change in the merge report.

## 3. data/descriptions.json — NO new entry (page description already exists)

- Live pageMeta desc (verified 2026-10-29): "IT equipment moving and data center logistics services in Virginia — servers, racks and office technology moved as a planned sequence, with careful handling, protected transport and verified placement."
- Verify at merge that descriptions.json carries this desc for the IT slug (as an editorial description, not generic). If it is missing, add it verbatim — do not rewrite it.

## 4. Live pageMeta — svc pointer flip (the core of the lock; merge-time live edit)

- Current live value (verified 2026-10-29): `svc:'https://theflatratemovers.com/#service-commercial'`.
- Proposed new value: `svc:'https://theflatratemovers.com/#service-it-relocation'`.
- Do NOT change name, canonical, or desc. Do NOT touch the #service-commercial node itself — commercial pages still use it. After the flip, re-run the meta builder check (titles exact, generic 0) and node --check on both inline scripts before any deploy.

## 5. Rubric DB rows (~/workspace/theflatratemovers/rubric.db — proposal; verify table shapes at merge)

- **service row:** one row for `service-it-relocation` ("IT Relocation & Setup"), with the description from §1 and attested 2026-10-29. (Phase A syncs services 9 → 18 separately; this row is additional — do not double-count.)
- **attestation rows (one per fact group):** (a) branch facts Winchester (address/geo/hours/rating 5.0/1) — source: Places 2026-10-27 + GBP check 2026-10-28; (b) branch facts Martinsburg (address/geo/hours/rating 4.7/6) — same sources; (c) GBP areas Winchester 16 + Martinsburg 14 — source: GBP screenshots 2026-10-27, confirmed 2026-10-28; (d) SERP #1 "IT equipment moving setup Winchester VA" — source: SERP check 2026-10-29; (e) existing page content (407 words, sequence/handling/SIR-conditional) — source: live page div extracted 2026-10-29; (f) IT buyer logic (downtime, disconnection risk, day-one planning) — source: datasets doc §4, 2026-10-29; (g) SIR conditional scope (1,500–3,500 lbs, L/360) — source: company thesis 2026-10-27, applied conditionally only.
- **edge rows:** service-it-relocation → provider → #organization; #organization → location → #winchester; #organization → location → #martinsburg; service-it-relocation → areaServed → #winchester; service-it-relocation → areaServed → #martinsburg. Do NOT add opening_hours or service_area rows for the GBP lists if the existing rows already cover them — verify at merge, do not duplicate. If the merge expands Place areaServed to the full footprint (see rubric.md gap 5), add the corresponding rows with the footprint.json/GeoJSON source, never the GBP source.
- **rubric_check row:** one row for the IT page with R1 = 3, R2 = 3, R3 = 3, R4 = 3, R5 = 3, R6 = 3, R7 = 2, verdict READY (pending deploy-time R7 re-check), dated 2026-10-29, referencing rubric.md in this package dir.

## 6. Entity graph nodes (for the merge agent's graph builder — proposal, not applied)

- Add one Service node to entity-graph.json AND best-json-entity-graph.json: @id https://theflatratemovers.com/#service-it-relocation, serviceType "IT Relocation & Setup", provider #organization, areaServed [#winchester, #martinsburg], url https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia/. The full node is staged as schema.json in this package dir (Service node is the first @graph entry; the Organization/Place/BreadcrumbList entries mirror the existing graph conventions).
- Do NOT modify the Organization node, the Place nodes, or any rating. Do NOT remove any @id (including #service-commercial). Do NOT touch the remote gist graph (data/entity-graph.json) — new path only (data/entity-graph-full.json convention).

## 7. Machine-readable files (merge-time, proposal)

- **llms.txt:** add an IT Relocation & Setup section (datasets-doc formulation + existing page method summary; branch facts distinct) + dated changelog entry. Keep history lines intact. This closes the plan's "no llms category" gap for IT.
- **data txt:** same IT section.
- **ai-sitemap.json:** add service entry (IT Relocation & Setup, description from §1) + keywords "IT equipment moving", "IT relocation winchester va", "data center logistics virginia", "server rack movers", "office IT relocation". Services count 18 → 19 (this package alone); hasPart UNCHANGED at 150 (no new page) — recompute across the full batch at merge.
- **ARD catalog:** add an entry for the IT Dataset node (identifier urn:air:theflatratemovers.com:data:it-relocation, type application/ld+json, url the IT page) if the ARD builder supports per-category entries; otherwise leave ARD unchanged and note it.
- **Dataset JSON-LD:** dataset-node.json in this package dir is the staged IT Dataset node (CC BY 4.0). At merge it ships as page-level Dataset markup for the IT page AND as an entry in the Developer-page Dataset collection, per the datasets research doc §5. Gated fields (named systems, certifications, clearances, facilities) are omitted — see rubric.md gaps 1–2.

## 8. Live-site deploy artifacts (merge-time, proposal — NOT done here)

- Per-page JSON: deploy schema.json to the path matching the 24 new pages' convention — the merge agent MUST verify the serving path against a live new-page JSON before deploying; old-page `.json` URLs return SPA fallback HTML and do not count.
- Page div: NO new div (page already exists). The only live index.html change from this package is the pageMeta svc pointer flip (§4) — plus node --check on both inline scripts before any deploy.
- Breadcrumb: visible trail Home › IT Equipment Moving & Data Center Logistics — Virginia (already the page's breadcrumb pattern; verify visible at deploy).
- Sitemap: NO change (page already listed; count stays 150 for this package alone; reconcile across the batch at merge).
- GitHub (same batch, after the test/check gate): theflatratemovers-ai (schema JSON, llms.txt, data txt, ai-sitemap.json, graphs) + the-flat-rate-machine (this package dir + data/ + scripts/ + verify.js changes). NEVER overwrite remote data/entity-graph.json (gist graph).
- GBP: NO edit in this package (Phase G batch, owner-approved).

## 9. Explicitly NOT in this package (left for their own batches)

- Phase A repairs (ai-sitemap 6→18, serviceType backfill, FAQ schema, rubric DB 9→18, verify.js extensions) — another agent owns them.
- Any visible page-copy change, FAQ block, or new page (this package changes no visible copy; FAQs are Phase E depth).
- Warehouse relocation lock, Winchester transloading package (rest of Phase C).
- Any live-site edit, deploy, GitHub push, quote test post, GBP edit, DNS change, or license wording change.
- Named systems/platforms, certifications, clearances, data-center facility names, IT pricing, or SLAs (none verified).
