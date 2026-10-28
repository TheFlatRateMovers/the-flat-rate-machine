# Pre-publish audit — Flat Rate Machine full build (24 pages) — 2026-10-28

**Gate:** `node verify.js` 43/43 clean before and after. `data/` and `verify.js` unmodified.
**Live project untouched:** `~/workspace/the-flat-rate-movers-pages/` was only READ. Live `index.html` mtime unchanged (18:56 UTC = 14:56 EDT, pre-dating this audit).
**Staged bundle:** `out/publish-bundle/` — a full `public/` copy with all publish changes applied. Nothing deployed, nothing pushed.

## Verdict: GO for deploy — conditional on owner approvals only

The bundle is clean. What remains is decisions, not defects: (1) re-approval of all 24 staged pages as content,
(2) footprint amendment approval (`out/footprint.json` → `data/`), (3) GeoJSON source-label fix approval,
(4) final publish confirmation (the deploy step itself). Post-deploy, R7 requires the live-form toggle re-check.

## Audit table — file → status → visibility purpose → gaps found + fixed

| File | Status | Visibility purpose | Gaps found + fixed |
|---|---|---|---|
| 24× `out/pages/<slug>/content.md` | PASS | Visible page copy: what the service is, who it is for, where it serves, Q&A — what searchers and AI answers quote | 1 cosmetic fix: template artifact "the The Flat Rate Movers" in 22 files → fixed to "The Flat Rate Movers" in staged sources AND bundle HTML. No fact changed. |
| 24× `meta.json` | PASS | Title + description for search snippets and AI summaries | None. All valid JSON, titles + descriptions present, 0 template gaps. |
| 24× `schema.json` | PASS | Service + LocalBusiness + Organization + WebPage + BreadcrumbList graphs; @ids resolve; canonicals match slugs; areaServed per branch, never merged | None. 0 unresolved @id refs (checked against page + 50 known site @ids). Corridor pages correctly carry 2 LocalBusiness nodes. |
| Backlinks (Related pages) | PASS | Internal link graph: branch ↔ corridor ↔ service pages pass authority and let crawlers/AI follow the service structure | 489 refs checked: 465 page links resolve to live slugs or the 24 staged slugs; 24 refs are the logo asset URL, which resolves to the live file. 0 dead, 0 hash, 0 placeholder links. |
| Bundle `index.html` | PASS | The SPA itself: 24 page divs, metadata, routing, all-pages index | 24 divs BEFORE `<footer>` (never before `<script>`); 24 pageMeta entries (quoted hyphenated keys, commas); 24 router slugs; 24 all-pages chips. Both inline scripts pass `node --check`. Original 126 divs / 101 pageMeta keys / 126 router slugs all intact, 0 missing. Quote form intact (`heroQuote`, `quoteForm`, `qWalk` present). |
| Bundle `sitemap.xml` | PASS | Crawlable URL list for Google/Bing/Yandex | 126 → 150 clean URLs, valid XML, 0 hash URLs, all 24 new slugs present. |
| 24× bundle `<slug>.json` | PASS | Per-page machine-readable graphs (industrial-commercial-services.json precedent) | None. All valid JSON, copied from staged `schema.json`. |
| Bundle `llms.txt` | PASS (updated) | AI-readable company + page index (the file Henry explicitly called out) | Sitemap count 126 → 150; new section listing all 24 pages; footprint (31/35/shared) + corrected attribution (extended areas NOT from GBP). |
| Bundle `the-flat-rate-movers-data.txt` | PASS (updated) | Complete verified data file for humans + machines | Appended 2026-10-28 update: 24 pages + footprint + GeoJSON correction note. License details still private; no USDOT. |
| Bundle `ai-sitemap.json` | PASS (updated) | AI knowledge sitemap | `areaServed` expanded to the full 52-area footprint + new per-branch breakdown (`areaServedByBranch`: 31/35/14). `hasPart` 17 → 41. Version/date 2026-10-28. FIXED: `mainEntity.sitemap` pointed at dead WordPress-era `sitemap_index.xml` → corrected to `sitemap.xml`. |
| Bundle `entity-graph.json` | PASS (updated) | Chained @id graph for machines | +24 Service nodes (provider → Organization, areaServed → branch Places) + attestation entry. 10 → 34 nodes. |
| Bundle `best-json-entity-graph.json` | PASS (updated) | Full-graph variant (45 nodes) | +24 Service nodes in the existing pattern. 45 → 69 nodes. Summaries annotated. |
| Bundle `service-area.geojson` | PASS (corrected) | Geographic footprint for maps, AI, and the industrial page's deferred load | Geometry + branch properties UNCHANGED, still 52 features, valid JSON. FIXED: 14 source strings that wrongly claimed GBP origin (incl. the 7 towns) → corrected to location-page/GeoJSON-branch attribution. FIXED: 9 county `gbp_service_area` flags flipped true → false (Clarke, Warren, Shenandoah, Hardy, Jefferson, Morgan + Hampshire, Washington, Fauquier found by the same check). Screenshots name only Loudoun, Frederick, Berkeley counties. Dated `corrections` note added. |
| Bundle `robots.txt` | PASS (as-is) | Crawler access + sitemap pointer (the file Henry explicitly called out) | Verified, no change needed: `User-agent: *`, `Allow: /`, `Sitemap: https://theflatratemovers.com/sitemap.xml`. |
| `out/footprint.json` (staged) | PASS | Proposed Phase 0 amendment: every area with name, branch(es), source, date | Counts verified: 52 features, Winchester 31, Martinsburg 35, shared 14, GBP 16/14, extended 15/21. Discrepancies recorded in-file. `data/` stays frozen until the owner approves the amendment. |
| `ai-catalog.json` / ARD | NOT CHANGED | Agent catalog of data resources (not pages) | Not a gap: it lists data resources (ai-sitemap, llms.txt, GeoJSON, entity graph), none of which were added or removed as resources. No change needed. |

## Counts

- Pages: 24 (7 revised + 17 new), all READY, R1–R5 = 3, R6 = 3 (logo), R7 = 2 (toggle re-check at publish)
- Per-page JSON files: 24
- Sitemap URLs: 150 (126 + 24), 0 hash
- Backlinks checked: 489 refs (465 page links + 24 asset refs), dead links found: 0
- GeoJSON features: 52 (unchanged count)
- Banned-content scan on bundle: clean (no USDOT, no Spearman Group, no Around Town Movers, no placeholders, no bare "flat quote")

## Spot-checks (6 pages read in full)

interstate-66-corridor, interstate-70-corridor (revised, full 31/35 footprint, shared list, disclaimer, no exits/stops/path claims),
commercial-movers-winchester-va, office-moving-movers-winchester-va (Winchester-only hours/rating, full 31-area list),
piano-antique-movers-martinsburg-wv, gun-safe-movers-martinsburg-wv (Martinsburg-only hours/rating, full 35-area list, VA destination list still correctly omitted from Martinsburg long-distance).

## Failed / left out

- NOTHING failed the audit. No page, file, or link was left out of the bundle for a defect.
- Deliberately not done (task boundaries, not failures): no deploy, no GitHub push, no quote test posts anywhere.
- R7 = 2 on all pages is expected and does not block GO: it is the post-deploy live-form toggle re-check.

## GitHub deployment list — repo TheFlatRateMovers/theflatratemovers-ai (DO NOT PUSH — parent's step)

| Bundle / staged file | Proposed repo path | Action |
|---|---|---|
| `llms.txt` | `llms.txt` (root) | Update-or-create |
| `the-flat-rate-movers-data.txt` | `data/the-flat-rate-movers-data.txt` | Update-or-create |
| `ai-sitemap.json` | `data/ai-sitemap.json` | Update-or-create |
| `service-area.geojson` (corrected) | `geo/service-area.json` | UPDATE existing file (commit 6bd3a2ca) |
| `out/footprint.json` | `data/footprint.json` | New (proposed Phase 0 amendment) |
| `entity-graph.json` (updated) | `data/entity-graph-full.json` | NEW PATH ONLY — NEVER overwrite remote `data/entity-graph.json` (different small gist-based graph) |
| `best-json-entity-graph.json` (updated) | `data/best-json-entity-graph.json` | Update-or-create |
| 24× `<slug>.json` | `schemas/<slug>.json` | New directory |

## Deploy sequence for the parent (after owner approvals)

1. Copy `out/publish-bundle/` over `public/` (or deploy the bundle directory as the project root — same rule: deploy from project root, never `public/` alone, or Functions break with 405).
2. `CLOUDFLARE_API_TOKEN=... npx wrangler pages deploy public --project-name=the-flat-rate-movers` (token via the custom connector; never ask Henry for another token).
3. Verify: 24 clean URLs load their page (not home), breadcrumb Home › page, logo loads, sitemap fetches 150 URLs, quote form unchanged, GeoJSON still deferred to the industrial page only, no quote test posts.
4. Then the GitHub list above (no push until the deploy verifies).
