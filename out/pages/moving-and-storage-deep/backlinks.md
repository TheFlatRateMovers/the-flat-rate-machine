# Backlinks — Moving and Storage (staged, activation package)

Audit date: 2026-10-29. Method: every URL below was checked against the live sitemap fetched 2026-10-29 (153 URLs, /tmp/smap-urls.txt read-back). Result: **14/14 existing links resolve; 0 dead refs.** The moving-and-storage page itself is correctly absent from the sitemap (it is staged, not live) and is added at merge time. The originally guessed packing URL (packing-services/) does NOT exist; the actual packing page used is packing-services-winchester-va/ (verified in the sitemap).

## Inbound links (pages that will link TO moving-and-storage)

| From | URL | Status | Rule / note |
|---|---|---|---|
| Browse all pages (all-pages index) | https://theflatratemovers.com/all-pages/ | OK (in sitemap) | Home rule (2026-10-28, option 3): home carries icons only on the 9 core-service cards; everything else lives on #/all-pages. Moving and Storage is NOT a home core card — it is listed on all-pages, not on home. |
| Areas served | https://theflatratemovers.com/areas-served/ | OK (in sitemap) | Service-area hub; moving-and-storage page links back to it. |
| Residential Moving (move-side parent page) | https://theflatratemovers.com/residential-moving/ | OK (in sitemap) | The page whose scope the storage interval extends; it links to the dedicated storage page at merge, and the storage page links back. |
| Get a Quote | https://theflatratemovers.com/quote/ | OK (in sitemap) | Quote path (R7). |
| Online Estimate | https://theflatratemovers.com/online-estimate/ | OK (in sitemap) | Quote path (R7). |
| Home | https://theflatratemovers.com/ | OK (in sitemap) | Via the "Browse everything" card → all-pages only. No direct home card (home rule above). |

## Outbound links (from moving-and-storage content.md, Related pages section)

All 14 URLs verified OK against the live sitemap. No other outbound links are in the content.

| Target | URL | Status |
|---|---|---|
| Home | https://theflatratemovers.com/ | OK |
| Browse all pages | https://theflatratemovers.com/all-pages/ | OK |
| Areas served | https://theflatratemovers.com/areas-served/ | OK |
| Residential Moving | https://theflatratemovers.com/residential-moving/ | OK |
| Local and Regional Moving | https://theflatratemovers.com/local-regional-moving/ | OK |
| Long-Distance Moving | https://theflatratemovers.com/long-distance-movers-winchester-va/ | OK |
| Packing Services | https://theflatratemovers.com/packing-services-winchester-va/ | OK |
| Senior Moving | https://theflatratemovers.com/senior-moving/ | OK |
| Warehouse Relocation | https://theflatratemovers.com/warehouse-relocation/ | OK |
| Industrial & Commercial Services | https://theflatratemovers.com/industrial-commercial-services/ | OK |
| The Flat Rate Movers branch page | https://theflatratemovers.com/moving-company-winchester-va/ | OK |
| Flat Rate Movers Martinsburg WV branch page | https://theflatratemovers.com/moving-company-martinsburg-wv/ | OK |
| Get a Quote | https://theflatratemovers.com/quote/ | OK |
| Online Estimate | https://theflatratemovers.com/online-estimate/ | OK |

## Merge-time link work (for the merge agent, not done here)

- Add moving-and-storage div BEFORE `<footer>` in public/index.html (never before `<script>`).
- Add pageMeta entry (name/svc/canonical/desc from meta.json).
- Add sitemap.xml entry + sitemap-page row + all-pages index entry → sitemap becomes 154 URLs for this package alone (153 + 1); recompute across the full batch at merge (this package deploys in sequence after the residential/gun-safe/commercial/office batches, so the merge agent must reconcile against the batch's actual running totals, not 153, if earlier batches landed first).
- Add breadcrumb (Home › Moving and Storage) — visible trail + BreadcrumbList schema (already in schema.json).
- Add the link from residential-moving to moving-and-storage (move-side parent → dedicated storage page), so the #1 query has a real page behind it.
- Re-run this audit after merge: 15/15 must resolve (14 above + moving-and-storage itself).

## Slug-collision check

No sitemap URL contains "moving-and-storage" (checked 2026-10-29). Slug `moving-and-storage` is free. No collision. Adjacent URLs (residential-moving, warehouse-relocation, industrial-commercial-services, container pages) are distinct pages and stay live.
