# Flat Rate Machine — Phase 1 Report (generators, deterministic v1)

**Gate first:** `node verify.js` still passes 43/43 after all Phase 1 work.
`data/` and `verify.js` were not modified. Nothing was deployed, published,
or pushed. All output is staged in `out/` only.

**Rule applied throughout:** a diff must be empty or every difference
explained. No fact was invented to force an empty diff. Where the live
files contain hand-written editorial prose, the generator reproduces the
fact-grounded core and the delta is recorded as a dataset gap.

## 1. Graph Builder — `scripts/build-graph.js`

Output: `out/entity-graph.generated.json` (52 nodes: 1 Organization,
2 LocalBusiness branches, 30 City, 18 Service, 1 OfferCatalog) +
`out/graph.diff.json` (12 recorded gaps).

- **vs `data/entity-graph.json` (10 nodes):** generated-only 50,
  reference-only 8, shared-with-diffs 2 (`#organization`,
  `#service-catalog`). The old copy carries 4 services; the generated
  graph carries all 18.
- **vs `data/best-json-entity-graph.json` (45 nodes):** generated-only
  20, reference-only 13, shared-with-diffs 2 (`#organization`,
  `#service-catalog`). All 30 City nodes reproduce **exactly** (name,
  slug, state) once state is resolved from explicit entry tokens, the
  GeoJSON dataset, then branch state — including Moorefield → WV and
  Hagerstown / Clear Spring → MD.
- **Explained differences (not failures):** branches modeled as
  LocalBusiness per the Phase 1 spec (old copies used Place, so old
  `#winchester-place` / `#martinsburg-place` @ids are reference-only);
  services use head-graph `#service-*` fragment @ids (old copies used
  page-slug @ids); old catalog item lists are partial (7 and 8 items)
  vs the full 18; WebSite / WebPage / BreadcrumbList are page-structure
  nodes for the Phase 3 page builder, not entity data; standalone
  PostalAddress nodes were replaced by inline addresses on the branch
  nodes (one copy of each address, not two).
- **Dataset gaps (fields in old copies, absent from Phase 0 datasets):**
  company email, sameAs social URLs, priceRange, org description prose,
  knowsAbout, logo / image filenames (old paths do not match live asset
  names; media dataset is schema-only), contact-point detail.

## 2. Sitemap Builder — `scripts/build-sitemap.js`

Output: `out/sitemap.generated.xml` + `out/sitemap.diff.json`.

- **BYTE-IDENTICAL to the live sitemap.** 126 URLs, 0 missing, 0 extra,
  0 lastmod mismatches, order matches, bytes match. This is the proof
  that the registry is complete and the builder is trustworthy: a pure
  data artifact regenerates exactly.

## 3. AI Visibility Builder — `scripts/build-ai.js`

Outputs: `out/llms.generated.txt` (38 non-blank lines),
`out/ai-sitemap.generated.json`, `out/ard.generated.json` +
`out/ai.diff.json` (13 recorded gaps).

- **llms.txt:** 8 of 38 generated lines appear verbatim in the live
  66-line file. The rest differ in presentation wording while carrying
  identical facts (services listed with dataset descriptions, no page
  links; locations with `hoursDisplay` instead of HH:MM ranges).
  Live-only content is editorial: dated update narratives, GSC
  statistics, page character counts.
- **ai-sitemap:** keys `$schema`, `@context`, `@id`, `@type`, `name`,
  `dateModified` reproduce exactly. `url` differs by convention (live
  points at the site root; generated points at the file itself).
  `version` differs by one day (live 2026-10-27; generated stamps the
  dataset version 2026-10-28). `creator`, `about`, `services`,
  `distribution` differ in completeness (generated: full 18 services,
  5 artifact distributions, per-branch addresses; live: curated 6
  services, 11 distributions, inline Place locations, merged areaServed
  list, email, sameAs). Live-only keys: `description` prose, `hasPart`,
  `keywords`, `mainEntity`.
- **ARD:** all 3 entries match live on identifier, URL, and type.
  Host differs on 2 fields: `displayName` (generated uses the dataset
  company name with LLC; live uses the brand without it) and `logoUrl`
  (omitted — media dataset gap). Entry descriptions differ (generated:
  mechanical factual descriptions; live: prose) and live tags /
  representativeQueries have no dataset source.
- **Deliberately not reproduced:** live ai-sitemap `mainEntity` points
  to `sitemap_index.xml`, a stale WordPress-era artifact, not the
  current `sitemap.xml`. Live ai-sitemap `creator.openingHours` equals
  Winchester hours only — reproducing it would bake in a branch blend,
  so the generator omits company-level hours (branches differ).

## 4. Title/Meta Builder — `scripts/build-meta.js`

Output: `out/meta.generated.json` (126 entries) + `out/meta.diff.json`.

- **Titles: 126/126 exact** against live pageMeta names (expected —
  the registry was built from pageMeta; the check proves no drift).
- **Descriptions: 0/126 exact** against live pageMeta descriptions —
  expected and not a failure. Live descriptions are hand-written
  editorial copy; generated descriptions are deterministic templates
  from verified facts only (service descriptions, branch records,
  company facts). Lengths 133–605 chars.
- Templates used: home 1, service 77, service-multi 11, location 2,
  corridor 1, generic 34.
- **34 pages got the generic company template** (no service signal, not
  a location/corridor/home page — e.g. ai-license, all-pages, blog,
  category pages). These are the pages the task asks to have reported
  rather than silently "fitted": they are listed in full in
  `out/meta.diff.json` under `genericTemplatePages`. They need editorial
  descriptions through the Phase 3 rubric gate.
- **Failures: none.** No page referenced an unknown service; both
  location slugs resolved to exactly one branch each.

## Consolidated dataset gaps (Phase 0 amendments Phase 2 should propose)

1. Company contact block: email, sameAs social URLs, priceRange.
2. Service → canonical page mapping (needed for llms/ai-sitemap links).
3. Questions bank (GSC queries, quote inquiries, GBP queries) — blocks
   ARD representativeQueries and llms FAQ content.
4. Media inventory (logo + image filenames, captions, credits,
   face-blur flags) — blocks ARD logoUrl and graph logo/image.
5. Changelog / statistics dataset — blocks llms update narratives and
   GSC stats (or a decision to drop dated narratives from llms.txt).
6. Company-level hours policy: live ai-sitemap uses Winchester hours
   for the company; recommend omitting company-level hours (branches
   differ) rather than reproducing the blend.

## What Phase 2 (Planner + Gap Finder) should take first

1. **I-66 and I-70 corridor gaps** (already in `corridors.json`): plan
   dedicated corridor pages from verified facts, through the rubric
   gate, with owner approval per batch.
2. **The 34 generic-template pages:** plan editorial descriptions (and
   any missing page content) for them; the templates hold the line
   until then.
3. **The dataset amendments above** (contact block, canonical page
   mapping, questions bank, media inventory): propose them as a single
   Phase 0 amendment batch for owner approval — do not silently edit
   `data/`.
4. **@id migration decision:** if the generated graph ever replaces
   `entity-graph.json`, the branch @ids change (`#winchester-place` →
   `#winchester`) and service @ids change (page-slug → `#service-*`
   fragments). Decide whether legacy @ids are kept as aliases or cut
   over, before anything publishes.
5. **Sitemap is proven:** the Sitemap Builder can be trusted as the
   reference implementation for the remaining builders' discipline
   (byte-equivalence where the artifact is pure data).
