# Flat Rate Machine — Publish plan (PLAN ONLY, nothing applied)

Staged set: 24 pages (7 revised + 17 new). Previous content approval for
the 7 staged pages does NOT carry over — those pages changed (full
footprint, logo image, backlinks, BreadcrumbList) and need re-approval.
No page publishes without that re-approval plus a final publish
confirmation. No quote test posts at any point (owner rule 2026-10-28).

## Live-site changes publish would require (public/index.html)

1. 24 new page divs, inserted BEFORE <footer> — never before <script>
   (the 2026-10-28 incident: a div before <script> broke rendering).
2. 24 pageMeta entries, each with a trailing comma on the previous entry
   and quoted hyphenated keys (the 2026-10-28 incident: a missing comma
   + unquoted hyphenated keys broke ALL pages).
3. 24 router pages-array additions (same slugs).
4. After EVERY index.html edit, run node --check on BOTH inline scripts
   before deploying. No exceptions.
5. Visible breadcrumb (Home › page) already live; new pages follow it.
6. Per-page JSON-LD files following the industrial-commercial-services.json
   precedent: 24 files at /<slug>.json, each matching its page's
   content.md + schema.json exactly.
7. sitemap.xml: 126 → 150 clean URLs (24 new), lastmod = publish date,
   0 hash URLs. robots.txt Sitemap pointer unchanged.
8. llms.txt + the-flat-rate-movers-data.txt: add the 24 pages, the full
   footprint (Winchester 31, Martinsburg 35, shared noted), and the
   corrected attribution (extended areas from GeoJSON/location pages,
   NOT GBP screenshots).
9. ai-sitemap.json: areaServed expanded from GBP-only to the full
   footprint per branch (never a merged list).
10. Entity graph files: add the 24 Service/page nodes + footprint City
    nodes with @id chains + attestations.
11. All-pages index (#/all-pages): add the 24 pages (icons only on the
    9 core-service home cards — home rule unchanged).
12. GeoJSON source-label fix (live service-area.geojson + data copy via
    the approved footprint amendment): correct the source strings on the
    7 non-GBP towns and the county gbp_service_area flags (Clarke,
    Warren, Shenandoah, Hardy, Jefferson, Morgan) so they no longer claim
    GBP-screenshot origin. Do NOT change branch properties or geometry.
13. Deploy ONLY from the project root:
    CLOUDFLARE_API_TOKEN=... npx wrangler pages deploy public
    --project-name=the-flat-rate-movers
    (deploying public/ from anywhere else breaks Functions with 405).

## Verification after deploy (no quote test posts)

- All 24 clean canonical URLs load their page (not home) with full
  content; visible breadcrumb shows Home › page.
- Regression: home, industrial-commercial-services, and the quote form
  unchanged and rendering; GeoJSON deferral still loads only on the
  industrial page.
- Sitemap fetches with 150 URLs; llms.txt + ai-sitemap + data txt match.
- Logo image loads on all 24 pages (assets/img-01-9c77693ba66b.png).

## Approvals still needed before any publish

1. Re-approval of all 24 staged pages as content (this build).
2. Footprint amendment approval (out/footprint.json → data/).
3. GeoJSON source-label fix approval (live file edit).
4. Final publish confirmation (deploy step itself).
