# Merge note — Senior Moving package (PROPOSAL ONLY — do not apply without the merge agent's review)

Staged: 2026-10-29. Author: Phase B senior-moving package (staged). This note proposes exact `data/` additions. **Nothing in this note has been applied.** Another agent owns `data/`, `scripts/`, and `verify.js` right now; the merge agent applies these, recomputes counts, and re-runs verify.js. Do NOT hand-edit counts anywhere — pageCounts and totals are recomputed from pages.json at merge time.

## 1. data/services.json — new entry (append to `services` array)

```json
{
  "id": "service-senior-moving",
  "name": "Senior Moving",
  "description": "Flat-rate senior moves quoted in writing for seniors downsizing, transitioning to assisted or independent living, or relocating closer to family, with packing support and a free film-only video-walkthrough survey room with a human-made estimate.",
  "pageCount": 1,
  "source": "Phase B senior-moving package 2026-10-29 (GSC 'senior moving' 75 impressions, position 1.0; 'senior movers near me' position 1.0, 3-month pull to 2026-10-27)",
  "attested": "2026-10-29"
}
```

Notes: `pageCount` must be recomputed from pages.json at merge (expected 1 after the pages.json entry below is added; if the merge batch includes other pages, recompute across the batch). Service count becomes 19 (18 + 1). The `name`/`description` wording above is the staged draft; if services.json entries carry additional fields (check the file's existing entry shape at merge), mirror them — do not invent new fields.

## 2. data/pages.json — new entry (append to `pages` array; mirror the packing entry shape)

```json
{
  "slug": "senior-moving",
  "url": "https://theflatratemovers.com/senior-moving/",
  "title": "Senior Moving — Winchester VA & Martinsburg WV",
  "type": "service",
  "services": [
    "service-senior-moving"
  ],
  "lastmod": "2026-10-29",
  "status": "staged",
  "source": "Phase B senior-moving package 2026-10-29 (staged; not live)",
  "attested": "2026-10-29"
}
```

Notes: `status` is "staged" until the deploy batch lands, then the merge agent flips it to "live" (matching the packing entry's "live" convention). Pages count becomes 151 (150 + 1). Title must match meta.json `title`/`name` exactly. **Open decision for the merge agent:** this is ONE two-branch page (not two branch pages) because the GSC query is generic "senior moving". If a future batch splits it into branch pages, this entry splits with it — do not pre-create branch slugs.

## 3. data/descriptions.json — new entry (key = page slug, mirroring existing entries)

Key: `senior-moving`

Value: "Senior Moving — Winchester VA & Martinsburg WV — Flat-rate senior moves quoted in writing for seniors downsizing, transitioning to assisted or independent living, or relocating closer to family, from The Flat Rate Movers (Winchester) and Flat Rate Movers Martinsburg WV. Guaranteed Flat Rate or Your Move is Free!"

This is the meta.json description, verbatim. (The build-meta.js editorial branch should pick it up as an editorial description, not a generic template — verify generic count stays 0 after merge.)

## 4. Rubric DB rows (~/workspace/theflatratemovers/rubric.db — proposal; verify table shapes at merge)

- **service row:** one row for `service-senior-moving` ("Senior Moving"), with the description from §1 and attested 2026-10-29. Services table goes 9 → 10 for this package alone (Phase A syncs the other 9 separately; do not double-count).
- **attestation rows (one per fact group):** (a) branch facts Winchester (address/geo/hours/rating 5.0/1) — source: Places 2026-10-27 + GBP check 2026-10-28; (b) branch facts Martinsburg (address/geo/hours/rating 4.7/6) — same sources; (c) GBP areas Winchester 16 + Martinsburg 14 — source: GBP screenshots 2026-10-27, confirmed 2026-10-28; (d) GSC senior queries (75 imp, 1.0; "senior movers near me" 1.0) — source: GSC 3-month pull to 2026-10-27, read 2026-10-29; (e) survey-room Senior category + film-only rule + human-made estimate — source: survey room build/live verification 2026-10-28; (f) SIR conditional scope (1,500–3,500 lbs, L/360) — source: company thesis 2026-10-27, applied conditionally only.
- **edge rows:** service-senior-moving → provider → #organization; #organization → location → #winchester; #organization → location → #martinsburg; service-senior-moving → areaServed → #winchester; service-senior-moving → areaServed → #martinsburg; #winchester → areaServed → each of its 16 GBP areas (only if the DB models areas as edges; otherwise the existing service_area rows cover them — verify at merge, do not duplicate); same for Martinsburg 14.
- **opening_hours rows:** NONE new — both branches' hours rows already exist in the DB. Verify at merge that Winchester (Mon-Fri 8-6, Sat 8-4, Sun 9-4) and Martinsburg (Mon-Fri 9-6, Sat 9-4, Sun 9-4) rows are present and distinct; do not add a merged/company-level hours row.
- **service_area rows:** NONE new for the GBP lists if the 30 existing rows already cover Winchester 16 + Martinsburg 14 — verify at merge. If the merge agent adds the extended footprint to this page (see rubric.md gap 6), add the corresponding rows with the footprint.json/GeoJSON source, never the GBP source.
- **rubric_check row:** one row for senior-moving with R1 = 3, R2 = 3, R3 = 3, R4 = 3, R5 = 3, R6 = 3, R7 = 2, verdict READY (pending deploy-time R7 re-check), dated 2026-10-29, referencing rubric.md in this package dir.

## 5. Entity graph nodes (for the merge agent's graph builder — proposal, not applied)

- Add one Service node to entity-graph.json AND best-json-entity-graph.json: @id https://theflatratemovers.com/#service-senior-moving, serviceType "Senior Moving", provider #organization, areaServed [#winchester, #martinsburg], url https://theflatratemovers.com/senior-moving/. The full node is staged as schema.json in this package dir (Service node is the first @graph entry; the Organization/Place/BreadcrumbList entries mirror the existing graph conventions).
- Do NOT modify the Organization node, the Place nodes, or any rating. Do NOT remove any @id. Do NOT touch the remote gist graph (data/entity-graph.json) — new path only (data/entity-graph-full.json convention).

## 6. Machine-readable files (merge-time, proposal)

- **llms.txt:** add a Senior Moving section (content.md intro + branch sections, condensed; branch facts distinct) + dated changelog entry. Keep history lines intact.
- **data txt:** same Senior Moving section + count 150 → 151 (or the batch total at merge).
- **ai-sitemap.json:** add service entry (Senior Moving, description from §1) + hasPart entry for https://theflatratemovers.com/senior-moving/ + keyword "senior moving". Services count 18 → 19 (this package alone); hasPart 150 → 151 (this package alone) — recompute across the full batch at merge.
- **ARD catalog:** add an entry for the senior Dataset node (identifier urn:air:theflatratemovers.com:data:senior-moving, type application/ld+json, url the senior-moving page) if the ARD builder supports per-category entries; otherwise leave ARD unchanged and note it.
- **Dataset JSON-LD:** dataset-node.json in this package dir is the staged senior Dataset node (CC BY 4.0). At merge it ships as page-level Dataset markup for the senior page AND as an entry in the Developer-page Dataset collection, per the datasets research doc §5. Gated fields (single-provider sentence) are omitted — see rubric.md gap 1.

## 7. Live-site deploy artifacts (merge-time, proposal — NOT done here)

- Page div (from content.md) BEFORE `<footer>` in public/index.html; pageMeta entry (name/svc/canonical/desc from meta.json); node --check on both inline scripts before any deploy.
- Per-page JSON: deploy schema.json to the path matching the 24 new pages' convention (plan inventory says public/schemas/*.json — the merge agent must verify the serving path against a live new-page JSON before deploying; old-page .json URLs return SPA fallback HTML and do not count).
- Sitemap: sitemap.xml + sitemap-page row + all-pages index entry → 151 URLs for this package alone; reconcile (canonical + redirects + unmapped + footer) at merge.
- Breadcrumb: visible trail Home › Senior Moving.
- GitHub (same batch, after the test/check gate): theflatratemovers-ai (schema JSON, llms.txt, data txt, ai-sitemap.json, graphs) + the-flat-rate-machine (this package dir + data/ + scripts/ + verify.js changes). NEVER overwrite remote data/entity-graph.json (gist graph).
- GBP: NO edit in this package (Phase G batch, owner-approved).

## 8. Explicitly NOT in this package (left for their own batches)

- Phase A repairs (ai-sitemap 6→18, serviceType backfill, FAQ schema, rubric DB 9→18, verify.js extensions) — another agent owns them.
- Moving-and-storage depth, crating Winchester page, junk-removal light package, local/small-job depth (rest of Phase B).
- Any live-site edit, deploy, GitHub push, quote test post, GBP edit, DNS change, or license wording change.
- The single-provider attestation sentence (pending Henry), senior pricing (none verified), extended-footprint decision (rubric.md gap 6).
