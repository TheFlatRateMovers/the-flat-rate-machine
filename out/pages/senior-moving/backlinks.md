# Backlinks — Senior Moving (staged, Phase B)

Audit date: 2026-10-29. Method: every URL below was checked against the live sitemap fetched 2026-10-29 (150 URLs, /tmp/sitemap.xml read-back). Result: **8/8 existing links resolve; 0 dead refs.** The senior page itself is correctly absent from the sitemap (it is staged, not live) and is added at merge time.

## Inbound links (pages that will link TO senior-moving)

| From | URL | Status | Rule / note |
|---|---|---|---|
| Browse all pages (all-pages index) | https://theflatratemovers.com/all-pages/ | OK (in sitemap) | Home rule (2026-10-28, option 3): home carries icons only on the 9 core-service cards; everything else lives on #/all-pages. Senior Moving is NOT a home core card — it is listed on all-pages, not on home. |
| Areas served | https://theflatratemovers.com/areas-served/ | OK (in sitemap) | Service-area hub; senior page links back to it. |
| Residential Moving | https://theflatratemovers.com/residential-moving/ | OK (in sitemap) | Adjacent service (senior moves are residential moves with a distinct audience). |
| Winchester branch page | https://theflatratemovers.com/moving-company-winchester-va/ | OK (in sitemap) | Branch hub for the Winchester section. |
| Martinsburg branch page | https://theflatratemovers.com/moving-company-martinsburg-wv/ | OK (in sitemap) | Branch hub for the Martinsburg section. |
| Get a Quote | https://theflatratemovers.com/quote/ | OK (in sitemap) | Quote path (R7). |
| Online Estimate | https://theflatratemovers.com/online-estimate/ | OK (in sitemap) | Quote path (R7). |
| Home | https://theflatratemovers.com/ | OK (in sitemap) | Via the "Browse everything" card → all-pages only. No direct home card (home rule above). |

## Outbound links (from senior-moving content.md, Related pages section)

Same 8 URLs as above, all verified OK against the live sitemap. No other outbound links are in the content.

## Survey-room connection (not a sitemap link — handled explicitly)

The survey room lives on a separate Pages project (flat-rate-survey-room.pages.dev) and is NOT in the 150-URL sitemap, so no direct survey-room URL is listed as a backlink (it would fail a sitemap audit). The connection is through the quote form: the live form carries the "Add a free video walkthrough" checkbox (hero card + quote form), and the senior page's survey-room references point readers to Get My Flat Rate Quote (https://theflatratemovers.com/quote/, verified OK). At merge time, do NOT add a survey-room URL to the sitemap; the room link is issued per-quote via the Worker.

## Merge-time link work (for the merge agent, not done here)

- Add senior-moving div BEFORE `<footer>` in public/index.html (never before `<script>`).
- Add pageMeta entry (name/svc/canonical/desc from meta.json).
- Add sitemap.xml entry + sitemap-page row + all-pages index entry → sitemap becomes 151 URLs (150 + 1); reconcile counts (canonical + redirects + unmapped + footer) at merge.
- Add breadcrumb (Home › Senior Moving) — visible trail + BreadcrumbList schema (already in schema.json).
- Re-run this audit after merge: 9/9 must resolve (8 above + senior-moving itself).

## Slug-collision check

No sitemap URL contains "senior" (checked 2026-10-29). Slug `senior-moving` is free. No collision.
