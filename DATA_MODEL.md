# Flat Rate Machine — Data Model (Phase 0, deterministic v1)

The Machine runs on datasets, not on hand-written pages. Every dataset entry
carries `source` (where the fact came from) and `attested` (the date it was
verified). An entry without both is rejected by the build: the Machine never
guesses, never fills a gap with a plausible value, and never publishes
anything its data cannot prove.

## Global rules (apply to every dataset)

1. **No placeholders, ever.** No invented ratings, prices, testimonials,
   licenses, USDOT/MC numbers, move counts, clearances, or founding dates.
   A missing fact is recorded as a gap, not papered over.
2. **Branches are never blended.** Winchester and Martinsburg are separate
   records everywhere. Names, hours, service areas, and Google ratings are
   never merged, averaged, or copied from one branch to the other.
3. **Reviews live with their branch.** There is no standalone reviews file
   and no company-wide rating, because a blended rating would violate rule 2.
   Each branch record carries its own verified Google rating.
4. **Attestation format.** `source` names the origin (live sitemap, head
   graph, GBP check, owner confirmation, Places record). `attested` is a
   `YYYY-MM-DD` date. Changing a fact means updating the fact, the source,
   and the date together.
5. **The gate.** `node verify.js` must pass 43/43 before any Phase 1
   generator runs. A failing check blocks generation; fix the data, never
   weaken the check.

## Datasets

### locations — `data/locations.json` (POPULATED, Phase 0)

One company record + one record per branch.

| Field | Meaning |
|---|---|
| `company.name` / `tagline` / `foundingDate` / `phone` | Company facts. `foundingDate` is `2010-06` — month only, no day invented. |
| `branches[].id` | `winchester` or `martinsburg`. |
| `branches[].name` | Exact branch name. Winchester: `The Flat Rate Movers`. Martinsburg: `Flat Rate Movers Martinsburg WV` (no "The"). |
| `branches[].street/city/state/zip` | Postal address. |
| `branches[].geo` | `{lat, lng}` from Places verification. |
| `branches[].hours[]` | `{days, opens, closes}` (24h times) + `hoursDisplay` string. Winchester and Martinsburg hours differ and must stay different. |
| `branches[].googleRating` | `{ratingValue, reviewCount}` — verified per-branch Google rating only. Never an aggregator rating, never blended. |
| `branches[].serviceArea[]` | GBP service-area list for that branch only. Winchester: 16 entries. Martinsburg: 14 entries. Moorefield 26836 appears in both — that is correct, it is served by both branches. |

### services — `data/services.json` (POPULATED, Phase 0)

One entry per Service node in the live head graph: 18 services.

| Field | Meaning |
|---|---|
| `id` | The graph fragment, e.g. `service-residential`, `service-industrial-commercial`. |
| `name` / `description` | Copied from the live head graph, not rewritten. |
| `pageCount` | Counted from pageMeta `svc` references in `pages.json`. Recomputed by `verify.js`; a mismatch fails the build. |
| `source` / `attested` | Head graph + pageMeta, dated. |

Service detail files (e.g. the industrial-commercial pricing schema) are
NOT duplicated here. Phase 1 attaches detail files by service id instead of
copying their contents into a second source of truth.

### pages — `data/pages.json` (POPULATED, Phase 0)

The page registry. Built by `scripts/build-data.js` from the **live**
sitemap joined to `pageMeta` in the live site source. No URL is hand-typed.

| Field | Meaning |
|---|---|
| `slug` | URL path segment, or `home` for the site root. |
| `url` | Full clean canonical URL. Never a hash URL. |
| `title` | `pageMeta` name for the page. |
| `type` | Registry classification (not a published claim): `home` = site root; `location` = the two branch pages; `corridor` = `route81`; `service` = pageMeta `svc` non-empty; otherwise `page`. |
| `services[]` | Service fragments from pageMeta `svc` (`#organization` excluded — it is not a service). |
| `lastmod` | From the live sitemap. |
| `status` | `live` (present in the sitemap). |
| `source` / `attested` | Sitemap + pageMeta, dated. |

Phase 0 count: 126 pages (1 home, 2 location, 1 corridor, 88 service,
34 page).

### corridors — `data/corridors.json` (POPULATED, Phase 0)

| Field | Meaning |
|---|---|
| `id` / `name` | `i-81` / Interstate 81, `i-66`, `i-70`. |
| `page` | Registry slug of the dedicated page, or `null`. |
| `status` | `live` (page exists) or `gap` (mentioned, no page). |

I-81 is `live` (`route81`). I-66 and I-70 are `gap` — they are mentioned
in service descriptions and the verified service-area list, but no
dedicated page exists in the sitemap. Recording the gap is the honest
state; Phase 2's Gap Finder starts from exactly these rows.

### entities — `data/entity-graph.json`, `data/best-json-entity-graph.json` (POPULATED, Phase 0)

Byte-for-byte copies of the verified graphs in `../theflatratemovers/`
(`verify.js` proves byte identity). They are inputs, not outputs, in
Phase 0: Phase 1's Graph Builder will regenerate graphs from the datasets
above and diff them against these copies before anything is published.

**@id counting, stated plainly** (this confused an earlier count): the
historical figures 37 and 89 are raw-substring counts of `@id` in the file
text — they include 3 prose mentions each (e.g. "stable @ids" in summary
text). The structural counts of real `@id` keys are 34 and 86.
`verify.js` asserts both, so neither number can silently drift.

### questions — SCHEMA ONLY in Phase 0 (populated in Phase 2)

No verified question bank file exists yet, so no `questions.json` is
fabricated here. Schema for when it lands:

| Field | Meaning |
|---|---|
| `id` | Stable slug for the question. |
| `question` | The question exactly as asked or as it appears on a verified page. |
| `answer` | The verified answer, or `null` if unanswered (a gap, not a draft). |
| `intent` | `informational` / `commercial` / `navigational` (from the Planner matrix). |
| `service` / `locations[]` | Service id(s) and branch id(s) the question belongs to. |
| `source` / `attested` | GSC query, quote inquiry, GBP query, or FAQ page — never invented. |

Phase 2 sources, in order: Google Search Console queries, quote-form
inquiries, GBP queries, then the live FAQ / moving-questions-answers pages
(extracted, not rewritten).

### assets — SCHEMA ONLY in Phase 0 (populated in Phase 1)

High-mass and special assets are a dataset, not adjectives in page copy.

| Field | Meaning |
|---|---|
| `id` / `name` | Asset slug and display name (gun safe, piano, medical device, cryogenic unit, antique). |
| `weightClass` | Verified weight range only (e.g. SIR high-mass 1,500–3,500 lbs). Never a per-item weight without a source. |
| `protocol` | `SIR` / `KIM-GS` where the verified protocol applies, else `null`. |
| `service` | Owning service id (usually `service-sir-heavy` or `service-piano-antique`). |
| `source` / `attested` | As everywhere else. |

Phase 1 populates this from service and asset pages (titles + service
links), with specs only where a verified source states them.

### media — SCHEMA ONLY in Phase 0 (populated in Phase 4)

| Field | Meaning |
|---|---|
| `id` / `file` | Stable id and asset filename. |
| `caption` / `credit` | Honest caption and credit. Company work vs. style example must be distinguished, never blurred. |
| `facesBlurred` | `true` where supplied crew photos were face-blurred before publishing (privacy rule), else `false`. |
| `variants[]` | Generated sizes/formats (WebP variants, responsive widths). |
| `usedOn[]` | Page slugs using the asset. |
| `source` / `attested` | As everywhere else. |

The media inventory is Phase 4 work (Media Builder). Nothing in Phase 0
invents a caption or a credit.

### service areas (geography) — `data/service-area.geojson` (POPULATED, Phase 0)

Byte-for-byte copy of the verified 52-feature GeoJSON. `verify.js`
asserts `FeatureCollection` + 52 features + byte identity. Geometry is
never hand-edited in the Machine; it is regenerated from the verified
source when it changes.

## File layout

```
the-flat-rate-machine/
  DATA_MODEL.md          this file
  README.md              what Phase 0 is, how to run it, what Phase 1 does
  verify.js              the gate — 43 checks, must pass before generation
  scripts/
    build-data.js        the deterministic migration (live sitemap + sources)
  data/
    locations.json       company + 2 distinct branches
    services.json        18 services from the head graph
    pages.json           126-page registry from the live sitemap
    corridors.json      I-81 live, I-66/I-70 gaps
    service-area.geojson 52-feature copy
    entity-graph.json    verified graph copy (37 raw / 34 structural @ids)
    best-json-entity-graph.json  verified graph copy (89 raw / 86 structural @ids)
```
