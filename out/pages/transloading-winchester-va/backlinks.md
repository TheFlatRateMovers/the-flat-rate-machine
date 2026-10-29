# Backlinks — Transloading Services — Winchester VA (staged, Phase C)

Audit date: 2026-10-29. Method: every URL below was checked against the live sitemap fetched 2026-10-29 (150 URLs, /tmp/tfr-sitemap.xml read-back via curl with a browser user-agent). Result: **17/17 existing links resolve; 0 dead refs.** The transloading-winchester-va page itself is correctly absent from the sitemap (it is staged, not live) and is added at merge time.

## Inbound links (pages that will link TO transloading-winchester-va)

| From | URL | Status | Rule / note |
|---|---|---|---|
| Browse all pages (all-pages index) | https://theflatratemovers.com/all-pages/ | OK (in sitemap) | Home rule (2026-10-28, option 3): home carries icons only on the 9 core-service cards; everything else lives on #/all-pages. Transloading Winchester is NOT a home core card — it is listed on all-pages, not on home. |
| Areas served | https://theflatratemovers.com/areas-served/ | OK (in sitemap) | Service-area hub; Winchester page links back to it. |
| Industrial & Commercial Services | https://theflatratemovers.com/industrial-commercial-services/ | OK (in sitemap) | Parent B2B hub; carries Ocean Container Handling / Transloading / Restacking as serviceTypes. |
| Commercial Freight Handling, White-Glove & Final-Mile Services | https://theflatratemovers.com/commercial-freight-handling-white-glove-final-mile-services/ | OK (in sitemap) | Final-mile leg of the transload chain. |
| Container Loading & Unloading Services, Port Transload Virginia | https://theflatratemovers.com/container-loading-unloading-services-port-transload-virginia/ | OK (in sitemap) | Existing container page; Winchester page is its new-format branch companion. |
| Port of Virginia Container Loading & Unloading Logistics Services | https://theflatratemovers.com/port-of-virginia-container-loading-unloading-logistics-services/ | OK (in sitemap) | Port-chain page. |
| Virginia Inland Port Freight Transloading Operations | https://theflatratemovers.com/virginia-inland-port-freight-transloading-operations/ | OK (in sitemap) | Inland-port chain page. |
| Emergency Port Container Recovery — Virginia | https://theflatratemovers.com/emergency-port-container-recovery-twic-labor-virginia/ | OK (in sitemap) | Emergency leg; linked by URL only with neutral link text — no credential claim is made on the Winchester page. |
| Container Deconsolidation, Cross-Docking & Transloading Services — Virginia | https://theflatratemovers.com/container-deconsolidation-cross-docking-transloading-services-virginia/ | OK (in sitemap) | Decon + cross-dock companion page. |
| Container Deconsolidation Services — Virginia & Mid-Atlantic | https://theflatratemovers.com/container-deconsolidation-services-virginia-mid-atlantic/ | OK (in sitemap) | Decon companion page. |
| Container Deconsolidation Reference | https://theflatratemovers.com/docs/container-deconsolidation/ | OK (in sitemap) | Docs asset defining receive → unload → count → sort → stage → build outbound. |
| Transloading Movers — Martinsburg WV | https://theflatratemovers.com/transloading-movers-martinsburg-wv/ | OK (in sitemap) | Sister branch page; kept distinct, never merged with the Winchester page. |
| Winchester branch page | https://theflatratemovers.com/moving-company-winchester-va/ | OK (in sitemap) | Branch hub for the Winchester section. |
| Martinsburg branch page | https://theflatratemovers.com/moving-company-martinsburg-wv/ | OK (in sitemap) | Branch hub for the Martinsburg cross-reference. |
| Get a Quote | https://theflatratemovers.com/quote/ | OK (in sitemap) | Quote path (R7). |
| Online Estimate | https://theflatratemovers.com/online-estimate/ | OK (in sitemap) | Quote path (R7). |
| Home | https://theflatratemovers.com/ | OK (in sitemap) | Via the "Browse everything" card → all-pages only. No direct home card (home rule above). |

## Outbound links (from transloading-winchester-va content.md, Related pages section)

Same 17 URLs as above, all verified OK against the live sitemap. No other outbound links are in the content.

## Slug-collision check

No sitemap URL contains "transloading-winchester" (checked 2026-10-29). Slugs `transloading-winchester-va`, `transloading-movers-winchester-va`, and `winchester-transloading` are all free; the package uses `transloading-winchester-va` (matching the staged output directory). The Martinsburg slug `transloading-movers-martinsburg-wv` is NOT reused. No collision.

## Merge-time link work (for the merge agent, not done here)

- Add transloading-winchester-va div BEFORE `<footer>` in public/index.html (never before `<script>`).
- Add pageMeta entry (name/svc/canonical/desc from meta.json).
- Add sitemap.xml entry + sitemap-page row + all-pages index entry → sitemap becomes 151 URLs for this package alone (150 + 1); recompute across the full batch at merge (senior package also adds 1 — a combined batch is 152). Reconcile counts (canonical + redirects + unmapped + footer) at merge.
- Add breadcrumb (Home › Transloading Services — Winchester VA) — visible trail + BreadcrumbList schema (already in schema.json).
- Re-run this audit after merge: 18/18 must resolve (17 above + transloading-winchester-va itself).
