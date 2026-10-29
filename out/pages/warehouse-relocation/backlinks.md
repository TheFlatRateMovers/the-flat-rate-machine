# Backlinks — Warehouse Relocation (staged, Phase C)

Audit date: 2026-10-29. Method: every URL below was checked against the live sitemap fetched 2026-10-29 (150 URLs, /tmp/tfrm-sitemap-urls.txt read-back). Result: **8/8 existing links resolve; 0 dead refs.** The warehouse-relocation page itself is correctly absent from the sitemap (it is staged, not live) and is added at merge time.

## Inbound links (pages that will link TO warehouse-relocation)

| From | URL | Status | Rule / note |
|---|---|---|---|
| Browse all pages (all-pages index) | https://theflatratemovers.com/all-pages/ | OK (in sitemap) | Home rule (2026-10-28, option 3): home carries icons only on the 9 core-service cards; everything else lives on #/all-pages. Warehouse Relocation is NOT a home core card — it is listed on all-pages, not on home. |
| Areas served | https://theflatratemovers.com/areas-served/ | OK (in sitemap) | Service-area hub; warehouse page links back to it. |
| Industrial & Commercial Services (parent page) | https://theflatratemovers.com/industrial-commercial-services/ | OK (in sitemap) | The page whose content currently carries the SERP #1; it links to the dedicated warehouse page at merge, and the warehouse page links back. |
| Industrial & Commercial Movers — Winchester VA | https://theflatratemovers.com/industrial-commercial-movers-winchester-va/ | OK (in sitemap) | Branch industrial hub for the Winchester section. |
| Industrial & Commercial Movers — Martinsburg WV | https://theflatratemovers.com/industrial-commercial-movers-martinsburg-wv/ | OK (in sitemap) | Branch industrial hub for the Martinsburg section. |
| Get a Quote | https://theflatratemovers.com/quote/ | OK (in sitemap) | Quote path (R7). |
| Online Estimate | https://theflatratemovers.com/online-estimate/ | OK (in sitemap) | Quote path (R7). |
| Home | https://theflatratemovers.com/ | OK (in sitemap) | Via the "Browse everything" card → all-pages only. No direct home card (home rule above). |

## Outbound links (from warehouse-relocation content.md, Related pages section)

Same 8 URLs as above, all verified OK against the live sitemap. No other outbound links are in the content.

## Merge-time link work (for the merge agent, not done here)

- Add warehouse-relocation div BEFORE `<footer>` in public/index.html (never before `<script>`).
- Add pageMeta entry (name/svc/canonical/desc from meta.json).
- Add sitemap.xml entry + sitemap-page row + all-pages index entry → sitemap becomes 151 URLs for this package alone (150 + 1); recompute across the full batch at merge (senior + Phase A + warehouse).
- Add breadcrumb (Home › Warehouse Relocation) — visible trail + BreadcrumbList schema (already in schema.json).
- Add the link from industrial-commercial-services to warehouse-relocation (parent → dedicated page), so the borrowed #1 has a real node behind it.
- Re-run this audit after merge: 9/9 must resolve (8 above + warehouse-relocation itself).

## Slug-collision check

No sitemap URL contains "warehouse-relocation" (checked 2026-10-29). Slug `warehouse-relocation` is free. No collision. Existing warehouse-adjacent URLs (industrial-commercial-services, industrial-commercial-movers-winchester-va, industrial-commercial-movers-martinsburg-wv, container pages) are distinct pages and stay live.
