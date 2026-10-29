# Merge note — Warehouse Relocation package (PROPOSAL ONLY — do not apply without the merge agent's review)

Staged: 2026-10-29. Author: Phase C warehouse-relocation lock package (staged). This note proposes exact `data/` additions. **Nothing in this note has been applied.** Another agent owns `data/`, `scripts/`, and `verify.js` right now; the merge agent applies these, recomputes counts, and re-runs verify.js. Do NOT hand-edit counts anywhere — pageCounts and totals are recomputed from pages.json at merge time.

## 1. data/services.json — new entry (append to `services` array)

```json
{
  "id": "service-warehouse-relocation",
  "name": "Warehouse Relocation",
  "description": "Flat-rate warehouse relocation from The Flat Rate Movers: warehouse and distribution moves, warehouse load-outs and inbound unloads, transload staging, and restacking, carried out by supervised warehouse teams and planned around the site — access, floor space, staging, and equipment handling. Standard Job Pricing: Unload $8.00/CWT, Load $10.00/CWT, APU $12.00/CWT, Residential/Driver Meet $400–$425 per man, quoted per job.",
  "pageCount": 1,
  "source": "Phase C warehouse-relocation lock package 2026-10-29 (SERP #1 'warehouse relocation services Virginia' via industrial page, SERP check 2026-10-29; datasets research doc §4 Warehouse relocation)",
  "attested": "2026-10-29"
}
```

Notes: `pageCount` must be recomputed from pages.json at merge (expected 1 after the pages.json entry below is added; if the merge batch includes other pages, recompute across the batch). Service count becomes 19 for this package alone (18 + 1) — recompute across the full batch at merge (senior + Phase A + warehouse). The `name`/`description` wording above is the staged draft; if services.json entries carry additional fields (check the file's existing entry shape at merge), mirror them — do not invent new fields.

## 2. data/pages.json — new entry (append to `pages` array; mirror the senior entry shape)

```json
{
  "slug": "warehouse-relocation",
  "url": "https://theflatratemovers.com/warehouse-relocation/",
  "title": "Warehouse Relocation — Winchester VA & Martinsburg WV",
  "type": "service",
  "services": [
    "service-warehouse-relocation"
  ],
  "lastmod": "2026-10-29",
  "status": "staged",
  "source": "Phase C warehouse-relocation lock package 2026-10-29 (staged; not live)",
  "attested": "2026-10-29"
}
```

Notes: `status` is "staged" until the deploy batch lands, then the merge agent flips it to "live" (matching the packing entry's "live" convention). Pages count becomes 151 for this package alone (150 + 1) — recompute across the full batch at merge. Title must match meta.json `title`/`name` exactly. This is ONE two-branch page (not two branch pages) because the SERP query is Virginia-wide ("warehouse relocation services Virginia"). If a future batch splits it into branch pages, this entry splits with it — do not pre-create branch slugs.

## 3. data/descriptions.json — new entry (key = page slug, mirroring existing entries)

Key: `warehouse-relocation`

Value: "Warehouse Relocation — Winchester VA & Martinsburg WV — Flat-rate warehouse moves, load-outs, inbound unloads, transload staging, and restacking from The Flat Rate Movers (Winchester) and Flat Rate Movers Martinsburg WV, planned around the site and quoted per job. Guaranteed Flat Rate or Your Move is Free!"

This is the meta.json description, verbatim. (The build-meta.js editorial branch should pick it up as an editorial description, not a generic template — verify generic count stays 0 after merge.)

## 4. Rubric DB rows (~/workspace/theflatratemovers/rubric.db — proposal; verify table shapes at merge)

- **service row:** one row for `service-warehouse-relocation` ("Warehouse Relocation"), with the description from §1 and attested 2026-10-29.
- **attestation rows (one per fact group):** (a) branch facts Winchester (address/geo/hours/rating 5.0/1) — source: Places 2026-10-27 + GBP check 2026-10-28; (b) branch facts Martinsburg (address/geo/hours/rating 4.7/6) — same sources; (c) GBP areas Winchester 16 + Martinsburg 14 — source: GBP screenshots 2026-10-27, confirmed 2026-10-28; (d) SERP #1 "warehouse relocation services Virginia" via industrial page — source: SERP check 2026-10-29; (e) Warehouse & Distribution capability + Warehouse Load-Outs & Inbound Unloads GBP products (both branches) — source: industrial page live content + GBP products 2026-10-28; (f) Standard Job Pricing verbatim — source: industrial page live content 2026-10-28/29; (g) SIR conditional scope (1,500–3,500 lbs, L/360) — source: company thesis 2026-10-27, applied conditionally only.
- **edge rows:** service-warehouse-relocation → provider → #organization; #organization → location → #winchester; #organization → location → #martinsburg; service-warehouse-relocation → areaServed → #winchester; service-warehouse-relocation → areaServed → #martinsburg; #winchester → areaServed → each of its 16 GBP areas (only if the DB models areas as edges; otherwise the existing service_area rows cover them — verify at merge, do not duplicate); same for Martinsburg 14.
- **opening_hours rows:** NONE new — both branches' hours rows already exist in the DB. Verify at merge that Winchester (Mon-Fri 8-6, Sat 8-4, Sun 9-4) and Martinsburg (Mon-Fri 9-6, Sat 9-4, Sun 9-4) rows are present and distinct; do not add a merged/company-level hours row.
- **service_area rows:** NONE new for the GBP lists if the 30 existing rows already cover Winchester 16 + Martinsburg 14 — verify at merge. If the merge agent expands to the extended footprint (see rubric.md gap 6), add the corresponding rows with the footprint.json/GeoJSON source, never the GBP source.
- **rubric_check row:** one row for warehouse-relocation with R1 = 3, R2 = 3, R3 = 3, R4 = 3, R5 = 3, R6 = 3, R7 = 2, verdict READY (pending deploy-time R7 re-check), dated 2026-10-29, referencing rubric.md in this package dir.

## 5. Entity graph nodes (for the merge agent's graph builder — proposal, not applied)

- Add one Service node to entity-graph.json AND best-json-entity-graph.json: @id https://theflatratemovers.com/#service-warehouse-relocation, serviceType "Warehouse Relocation", provider #organization, areaServed [#winchester, #martinsburg], url https://theflatratemovers.com/warehouse-relocation/. The full node is staged as schema.json in this package dir (Service node is the first @graph entry; the Organization/Place/BreadcrumbList entries mirror the existing graph conventions).
- Do NOT modify the Organization node, the Place nodes, or any rating. Do NOT remove any @id. Do NOT touch the remote gist graph (data/entity-graph.json) — new path only (data/entity-graph-full.json convention).

## 6. Machine-readable files (merge-time, proposal)

- **llms.txt:** add a Warehouse Relocation section (content.md intro + branch sections, condensed; branch facts distinct) + dated changelog entry. Keep history lines intact.
- **data txt:** same Warehouse Relocation section + count 150 → 151 (or the batch total at merge).
- **ai-sitemap.json:** add service entry (Warehouse Relocation, description from §1) + hasPart entry for https://theflatratemovers.com/warehouse-relocation/ + keyword "warehouse relocation". Services count 18 → 19 (this package alone); hasPart 150 → 151 (this package alone) — recompute across the full batch at merge.
- **ARD catalog:** add an entry for the warehouse Dataset node (identifier urn:air:theflatratemovers.com:data:warehouse-relocation, type application/ld+json, url the warehouse-relocation page) if the ARD builder supports per-category entries; otherwise leave ARD unchanged and note it.
- **Dataset JSON-LD:** dataset-node.json in this package dir is the staged warehouse Dataset node (CC BY 4.0, CWT variableMeasured). At merge it ships as page-level Dataset markup for the warehouse page AND as an entry in the Developer-page Dataset collection, per the datasets research doc §5. Gated fields are omitted — see rubric.md gaps 2–4.

## 7. Live-site deploy artifacts (merge-time, proposal — NOT done here)

- Page div (from content.md) BEFORE `<footer>` in public/index.html; pageMeta entry (name/svc/canonical/desc from meta.json); node --check on both inline scripts before any deploy.
- Per-page JSON: deploy schema.json to the path matching the 24 new pages' convention — the merge agent must verify the serving path against a live new-page JSON before deploying; old-page .json URLs return SPA fallback HTML and do not count.
- Sitemap: sitemap.xml + sitemap-page row + all-pages index entry → 151 URLs for this package alone; reconcile (canonical + redirects + unmapped + footer) at merge.
- Breadcrumb: visible trail Home › Warehouse Relocation.
- Parent link: add the link from industrial-commercial-services to warehouse-relocation (see backlinks.md).
- GitHub (same batch, after the test/check gate): theflatratemovers-ai (schema JSON, llms.txt, data txt, ai-sitemap.json, graphs) + the-flat-rate-machine (this package dir + data/ + scripts/ + verify.js changes). NEVER overwrite remote data/entity-graph.json (gist graph).
- GBP: NO edit in this package (Phase G batch, owner-approved). Warehouse Load-Outs & Inbound Unloads already exist as GBP products on both branches.

## 8. Explicitly NOT in this package (left for their own batches)

- Phase A repairs (ai-sitemap 6→18, serviceType backfill, FAQ schema, rubric DB 9→18, verify.js extensions) — another agent owns them.
- Phase B senior package (separate staged dir) and the rest of Phase C (IT relocation, Winchester transloading).
- Any live-site edit, deploy, GitHub push, quote test post, GBP edit, DNS change, or license wording change.
- Facility size/location/client claims, equipment inventory, drayage/chassis/bonded/FTZ/reefer/customs claims (all gated, see rubric.md gaps 2–4).
