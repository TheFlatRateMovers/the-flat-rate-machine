# Merge note — Transloading Services — Winchester VA (PROPOSAL ONLY — do not apply without the merge agent's review)

Staged: 2026-10-29. Author: Phase C transloading-winchester-va package (staged). This note proposes exact `data/` additions. **Nothing in this note has been applied.** Another agent owns `data/`, `scripts/`, and `verify.js` right now; the merge agent applies these, recomputes counts, and re-runs verify.js. Do NOT hand-edit counts anywhere — pageCounts and totals are recomputed from pages.json at merge time.

## 1. data/services.json — NO new entry (existing service gains a page)

The transloading service already exists (verified 2026-10-29):

```json
{
  "id": "service-transloading",
  "name": "Loading, Transloading and Container Services",
  "description": "Container loading and unloading, and transloading between truck, container and warehouse.",
  "pageCount": 16,
  "source": "head JSON-LD graph in live site source (index.html)",
  "attested": "2026-10-28"
}
```

Do NOT create a duplicate service entry for this page. At merge, `pageCount` for `service-transloading` is recomputed from pages.json (expected 16 → 17 for this package alone; recompute across the full batch at merge — the senior package does not touch this service). Service count stays 18 for this package alone. The new schema @id `#service-transloading-winchester-va` is a page-level Service node, not a services.json entry — do not confuse the two.

## 2. data/pages.json — new entry (append to `pages` array; mirror the Martinsburg transloading entry shape)

```json
{
  "slug": "transloading-winchester-va",
  "url": "https://theflatratemovers.com/transloading-winchester-va/",
  "title": "Transloading Services — Winchester VA",
  "type": "service",
  "services": [
    "service-transloading"
  ],
  "lastmod": "2026-10-29",
  "status": "staged",
  "source": "Phase C transloading-winchester-va package 2026-10-29 (staged; not live)",
  "attested": "2026-10-29"
}
```

Notes: `status` is "staged" until the deploy batch lands, then the merge agent flips it to "live" (matching the Martinsburg entry's "live" convention). Pages count becomes 151 (150 + 1) for this package alone; recompute across the batch at merge (senior package also adds 1 — a combined batch is 152). Title must match meta.json `title`/`name` exactly. This is a Winchester branch page, NOT a second generic transloading page — do not pre-create further transloading slugs.

## 3. data/descriptions.json — new entry (key = page slug, mirroring existing entries)

Key: `transloading-winchester-va`

Value: "Transloading Services — Winchester VA — Container unloading, transloading, cross-docking, and deconsolidation from The Flat Rate Movers (Winchester), with final-mile delivery and warehouse staging, through the Virginia Inland Port and Port of Virginia chain. Quoted per job. Guaranteed Flat Rate or Your Move is Free!"

This is the meta.json description, verbatim. (The build-meta.js editorial branch should pick it up as an editorial description, not a generic template — verify generic count stays 0 after merge.)

## 4. Rubric DB rows (~/workspace/theflatratemovers/rubric.db — proposal; verify table shapes at merge)

- **service row:** NONE new — `service-transloading` already exists in the DB (Phase A syncs the DB to the full service set; verify the row exists at merge, do not duplicate it).
- **attestation rows (one per fact group):** (a) branch facts Winchester (address/geo/hours/rating 5.0/1) — source: Places 2026-10-27 + GBP check 2026-10-28; (b) branch facts Martinsburg (address/geo/hours/rating 4.7/6) — same sources; (c) GBP areas Winchester 16 + Martinsburg 14 — source: GBP screenshots 2026-10-27, confirmed 2026-10-28; (d) SERP #3 "transloading services Virginia port container" (first mover) — source: live SERP check 2026-10-29; (e) container page inventory (six dedicated pages + docs pages + Martinsburg page; no Winchester page) — source: ocean container datasets doc §5, verified live 2026-10-29; (f) process chain + commercial terms as domain facts — source: ocean container datasets doc §§1, 3, 6, researched 2026-10-29, labeled domain facts, not company claims; (g) container jobs quoted per job — source: company pricing pattern (ocean doc D5, D8).
- **edge rows:** service-transloading → areaServed → #winchester (new branch-page link; the generic node already serves the Martinsburg page); #service-transloading-winchester-va → provider → #organization; new node → areaServed → #winchester; new node → areaServed → #martinsburg (cross-reference); #organization → location → #winchester; #organization → location → #martinsburg (verify, do not duplicate).
- **opening_hours rows:** NONE new — both branches' hours rows already exist in the DB. Verify at merge that Winchester (Mon-Fri 8-6, Sat 8-4, Sun 9-4) and Martinsburg (Mon-Fri 9-6, Sat 9-4, Sun 9-4) rows are present and distinct; do not add a merged/company-level hours row.
- **service_area rows:** NONE new for the GBP lists if the 30 existing rows already cover Winchester 16 + Martinsburg 14 — verify at merge. If the merge agent adds the extended footprint to this page (see rubric.md gap 11), add the corresponding rows with the footprint.json/GeoJSON source, never the GBP source.
- **rubric_check row:** one row for transloading-winchester-va with R1 = 3, R2 = 3, R3 = 3, R4 = 3, R5 = 3, R6 = 3, R7 = 2, verdict READY (pending deploy-time R7 re-check), dated 2026-10-29, referencing rubric.md in this package dir.

## 5. Entity graph nodes (for the merge agent's graph builder — proposal, not applied)

- Add one Service node to entity-graph.json AND best-json-entity-graph.json: @id https://theflatratemovers.com/#service-transloading-winchester-va, serviceType "Transloading", provider #organization, areaServed [#winchester, #martinsburg], url https://theflatratemovers.com/transloading-winchester-va/. The full node is staged as schema.json in this package dir (Service node is the first @graph entry; the Organization/Place/BreadcrumbList entries mirror the existing graph conventions).
- Do NOT modify, rename, or remove the existing generic #service-transloading node. Do NOT modify the Organization node, the Place nodes, or any rating. Do NOT touch the remote gist graph (data/entity-graph.json) — new path only (data/entity-graph-full.json convention).
- Open decision for the merge agent (rubric.md gap 10): whether the new Winchester node stands alone (recommended) or is cross-referenced from the generic node. Either way, both @ids survive.

## 6. Machine-readable files (merge-time, proposal)

- **llms.txt:** add a Transloading Services — Winchester VA section (content.md intro + process chain + commercial terms, condensed; branch facts distinct) + dated changelog entry. Keep history lines intact.
- **data txt:** same Transloading section + count 150 → 151 (or the batch total at merge).
- **ai-sitemap.json:** NO new service entry — transloading is already listed (verify at merge). Add hasPart entry for https://theflatratemovers.com/transloading-winchester-va/ + keyword "transloading winchester va" only if the keyword set supports branch-qualified keywords; otherwise keep the existing transloading keywords. hasPart 150 → 151 (this package alone) — recompute across the full batch at merge.
- **ARD catalog:** add an entry for the transloading Dataset node (identifier urn:air:theflatratemovers.com:data:transloading-winchester-va, type application/ld+json, url the transloading-winchester-va page) if the ARD builder supports per-category entries; otherwise leave ARD unchanged and note it.
- **Dataset JSON-LD:** dataset-node.json in this package dir is the staged transloading Dataset node (CC BY 4.0). At merge it ships as page-level Dataset markup for the Winchester transloading page AND as an entry in the Developer-page Dataset collection, per the datasets research doc §5. Gated fields (terminals, drayage performer, chassis, reefer, bonded/FTZ, customs, equipment, OOG, handled types, container rates) are omitted — see rubric.md gaps 1–9.

## 7. Live-site deploy artifacts (merge-time, proposal — NOT done here)

- Page div (from content.md) BEFORE `<footer>` in public/index.html; pageMeta entry (name/svc/canonical/desc from meta.json); node --check on both inline scripts before any deploy.
- Per-page JSON: deploy schema.json to the path matching the 24 new pages' convention — the merge agent must verify the serving path against a live new-page JSON before deploying; old-page .json URLs return SPA fallback HTML and do not count (verified trap, ocean doc §Correction).
- Sitemap: sitemap.xml + sitemap-page row + all-pages index entry → 151 URLs for this package alone; recompute across the batch at merge; reconcile (canonical + redirects + unmapped + footer) at merge.
- Breadcrumb: visible trail Home › Transloading Services — Winchester VA.
- GitHub (same batch, after the test/check gate): theflatratemovers-ai (schema JSON, llms.txt, data txt, ai-sitemap.json, graphs) + the-flat-rate-machine (this package dir + data/ + scripts/ + verify.js changes). NEVER overwrite remote data/entity-graph.json (gist graph).
- GBP: NO edit in this package (Phase G batch, owner-approved).

## 8. Explicitly NOT in this package (left for their own batches)

- Phase A repairs (ai-sitemap 6→18, serviceType backfill, FAQ schema, rubric DB 9→18, verify.js extensions) — another agent owns them.
- Other Phase C packages: warehouse relocation, IT relocation & setup.
- Phase D container pages: drayage, container types/sizes reference, demurrage/detention/free-time cost-avoidance, reefer (if attested), flat-rack/OOG (if attested), real per-page JSON files for the six existing container pages.
- Any live-site edit, deploy, GitHub push, quote test post, GBP edit, DNS change, or license wording change.
- Every attestation-gated claim in rubric.md gaps 1–9 (terminals, drayage performer/chassis, container rate basis, reefer, bonded/FTZ/customs, equipment, OOG scope, handled types, credential wording).
