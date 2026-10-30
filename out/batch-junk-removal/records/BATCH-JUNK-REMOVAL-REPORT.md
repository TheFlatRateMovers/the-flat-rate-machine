# BATCH JUNK REMOVAL — DEPLOY REPORT (new service + page; estate 156 → 157 pages, 23 → 24 services, 25 → 26 datasets, 202 → 204 sealed distributions)

Deployed 2026-10-30. Henry's ruling 2026-10-30: "JUNK REMOVAL: FULL PAGE with the
full package treatment (HTML, per-page JSON, dataset, rubric, AI surfaces)" + the
certificate tool + the Flat Rate Machine treatment.
Pages deploy: https://c8b49c3d.the-flat-rate-movers.pages.dev — 11 files uploaded,
exactly the intended set (index.html, sitemap.xml, ai-sitemap.json, llms.txt,
the-flat-rate-movers-data.txt, entity-graph.json, best-json-entity-graph.json,
junk-removal.json, datasets-junk-removal.json, ai-master-index.json,
ai-master-index.jws).
Baselines read first: verify.js 83/83 against live; ai HEAD dd730cc6e37a; machine
HEAD 89014e0761d5. Backups in `backup/` (every touched file, unique per-path names).
Research: `records/research.md` (accepted / not-accepted item guides — The
Junkluggers, Full House, Clutter Ninjas; EPA Section 608 refrigerant rules, 40 CFR
Part 82 Subpart F; post-pickup sorting practice; 2026 pricing guides — Housecall
Pro, MyQuoteIQ — domain education only).

## What shipped

- **NEW page** `/junk-removal/` (slug `junk-removal`, collision-checked free against
  the 156-URL sitemap and 156 registry slugs): full page in the moving-and-storage
  pattern — hero + tagline + "Get My Flat Rate Quote" CTA, stated-terms section
  (scope + flat-rate model + hazardous/regulated boundary + SIR/piano routing),
  who-it-is-for, what-it-includes, 6-step how-it-works, the labeled
  industry-background section ("Junk removal, explained — industry background, not
  our terms": pricing models with sourced guide ranges, take/leave lists, the
  federal refrigerant rule, after-pickup sorting practice, dense-debris weight,
  mattresses/bulky items), per-branch cards (Winchester GBP 17 incl. Bristow /
  Martinsburg GBP 14, hours and ratings distinct), where-we-serve, related-pages
  chips (all targets verified pageMeta keys), 12 search-phrased Q&As, closing
  service-area card, sources card, and the datasets JSON-LD embed as the div's
  last element (byte-equal to the served datasets file). Logo brand figure only —
  no photo added (forward image rule). Div inserted before `<footer>`, once.
- **NEW canonical service node** `#service-junk-removal` ("Junk Removal", hub url
  https://theflatratemovers.com/junk-removal/, one canonical description, Place
  chain #winchester/#martinsburg) added to all three graphs — head block 25 → 26
  nodes, site entity 33 → 34, site best 92 → 93 — plus the machine registry
  graphs (entity 33 → 34, best 89 → 90) and the ai-repo `-full` mirrors
  (34 / 93, appended in each file's own format; the best-full mirror's
  pre-existing org-node areaServed lag was left untouched, out of scope).
- **NEW per-page JSON** `junk-removal.json` (5 nodes: Service + Organization with
  foundingDate 2010-06 + both Places at the full 32/35 footprint with per-branch
  hours/ratings + BreadcrumbList).
- **NEW datasets file** `datasets-junk-removal.json` (8 nodes, dateModified
  2026-10-30; retype mapping D1 Service operations / D2 Dataset scope / D3
  Dataset taxonomy / D4 Dataset dispatch-routing-disposal / D5 Article terms /
  D6 Article personas / D7 Service protection-compliance / D8 Dataset
  areas-quote = 4 Dataset CC BY 4.0 / 2 Service / 2 Article; creator stubs are
  full Organization nodes carrying foundingDate 2010-06, per the founding
  batch's standard) + matching in-page markup + Developer-page "Junk Removal
  data" card with truthful type counts.
- **Registries:** services.json 23 → 24, pages.json 156 → 157 (pageCount 1).
  **Sitemap** 156 → 157 (junk URL once, lastmod 2026-10-30, appended at the
  tail). **ai-sitemap** (public + phase-a): services 24, hasPart 157; public
  keywords +3 (junk removal, junk hauling, estate cleanout — none dropped),
  staged keywords +"Junk Removal" (verbatim service-name form the S-check
  requires); description counts 157/24. **llms.txt** public: Junk Removal
  service line + sitemap clause 157 + registry line (24 names) + dated
  `## Update — 2026-10-30 (junk removal…)` section; phase-a llms: service line
  + clause 157. **Data txt:** both current-count lines 157, registry (24,
  +Junk Removal), page-index header 157, new "Junk Removal:" page-index group,
  dated 2026-10-30 entry appended (history untouched). **Sitemap page:** junk
  row + counts (intro, h3, route line, totals card 266 → 267, kick line).
  **All-pages:** junk chip. **Services page:** junk paragraph after Moving and
  Storage. **Estate-in-numbers blocks (×13):** 157 pages / 157/157 coverage,
  24 services, 26 dataset files, entity 34 nodes, best 93 nodes.
  **Developer seal statement:** 157 per-page JSON files, 204 distributions.
- **head-data.js regenerated** with the estate's own generator (pageMeta +
  setPageLD executed against the registry): diff vs the deployed file = exactly
  the one new `/junk-removal` entry (title, description, canonical, WebPage
  JSON-LD, jf junk-removal.json); installed to functions/head-data.js.
- **Rubric DB** (backed up first): canonical service row +1 (23 → 24 canonical,
  32 → 33 total); +8 attestation rows (239 → 247): services.json anchor,
  publication, scope, boundary (hazmat out-list + EPA 608 routing, no
  certification claimed), routing (sorting/donation/recycling/lawful disposal,
  no percentages, no named partners), datasets, R8 crawlability gate row, R9
  provenance gate row; integrity ok.

## Claims discipline (hard limits held)

No company rate, range, or per-item price anywhere (all figures are the
industry guides', inside labeled domain-education passages only — audited per
occurrence). No donation/diversion percentages. No named donation partners,
recyclers, landfill accounts, or certifications; no refrigerant-recovery
certification claimed (appliances routed so Section 608-certified technicians
recover refrigerant — the federal rule, stated as such). No "haul anything"
overreach: the hazardous/regulated out-list is published plainly. No attested
wording in any published copy. Heavy assets route to SIR; pianos to the piano
service. Branches distinct everywhere.

## Seal (widened P2 rule)

Machine code files pushed FIRST (shell copy, head-data.js, verify.js —
read-backs byte-identical at the new HEAD), repo-dir assembled from the 16
sealed repo files fetched at the new HEADs, digest-index re-run: 204
distributions, 0 gaps. **Set-diff asserted:** exactly 2 entries added
(datasets-junk-removal.json, junk-removal.json); exactly 7 digests changed
(ai-sitemap.json, entity-graph.json, best-json-entity-graph.json, llms.txt,
site shell, head-data.js, verify.js); zero non-digest field changes; index
top level otherwise identical. Re-signed from the custody key only (kid
theflatratemovers-2026-10-29-1; canonical 88,063 B); pre-push key-material
grep over all push paths = 0.
**Public-only provenance over live-fetched bytes: JWS signature VERIFIED;
payload == canonical(index), 88,063 B; 204 match / 0 mismatch / 0 unresolved —
PROVENANCE OK.**

## Gates

- verify.js: baseline 83/83 → post-build/pre-deploy 78/83 with exactly the 5
  live-state failures (live sitemap ×2, P-5, P-6, S-4 — all cured by the
  deploy) → post-deploy **83/83 PASS** (run twice, incl. a final run after
  all pushes). No check was waived. One check was EXTENDED in the same
  motion per the stale-check rule: P-5's exact totals 156 → 157 page files
  and 202 → 204 distributions (record:
  out/verify-fix-2026-10-30-junk-removal.md); the suite stays at 83 checks.
  One build-time fault of mine, fixed before deploy: the staged ai-sitemap
  keyword was first appended in lowercase phrase form; the S-check requires
  the verbatim service name — corrected to "Junk Removal" (the public
  copy's lowercase topical phrases follow its own convention and have no
  such check).
- node --check on both executable inline scripts OK; all 38 ld+json blocks
  parse; router gate (estate Node-eval method): router 157 == pageMeta 157,
  sets exactly equal, locally AND on the live-served HTML; div present once,
  before `<footer>`; quote-form markers intact (heroQuote/quoteForm/hqWalk/
  qWalk) and the index.html diff vs the pre-batch shell is confined to 26
  hunks in the intended zones (head graph, pageMeta, router, the new div,
  services/all-pages/sitemap/developer/numbers surfaces) — quote form
  untouched. No quote test posts.
- Live: /junk-removal/ → 200 with its own title ("The Flat Rate Movers —
  Junk Removal — Winchester VA & Martinsburg WV"); junk-removal.json and
  datasets-junk-removal.json → 200 + application/json; live sitemap 157
  locs with the junk URL + real lastmod; spot routes /, /moving-and-storage/,
  /specialized-workforce-labor/ serve their own titles.
- Forbidden scans on all new material: zero (bare "flat quote", USDOT/MC,
  Spearman, Around Town, Design 6, "attest" wording); every currency figure
  audited to a labeled industry passage.

## GitHub (same motion, read-backs matched)

- **the-flat-rate-machine:** 89014e0761d5 → `17448333535a` (code/site-shell/
  index.html, code/pages-functions/head-data.js, verify.js) → `e6fb845b2b87`
  (data/services.json, data/pages.json, data/entity-graph.json,
  data/best-json-entity-graph.json, out/phase-a/ai-sitemap.json,
  out/phase-a/llms.txt). Records push follows this file (batch records +
  out/verify-fix-2026-10-30-junk-removal.md).
- **theflatratemovers-ai:** dd730cc6e37a → `8ef035c2a37e` (llms.txt,
  ai-sitemap.json, the-flat-rate-movers-data.txt) → `5645945e7020`
  (data/datasets-junk-removal.json, data/entity-graph-full.json,
  data/best-json-entity-graph-full.json, schemas/junk-removal.json) →
  `65cd2da08305` (data/ai-master-index.json + .jws, pushed last).
- **Gist-based ai-repo `data/entity-graph.json`:** blob SHA
  cda897e61319a0f52172ef1365402e4d7179cddf before AND after (2,486 bytes) —
  never in any push path.

## Counts after deploy

Pages **157** / services **24** / sitemap **157** / datasets **26** / rubric
attestation **247** (canonical services 24) / head graph **26** service-era
nodes / site entity **34** / site best **93** / signed distributions **204** /
verify.js **83/83** / provenance **204/204**.

## Observation (not changed, out of scope)

The signed index's entry #4 is named "Entity Graph — Full (92 nodes)" while
its contentUrl is the site entity graph (34 nodes after this batch; 33
before). The label predates this batch and does not describe either graph's
current count; left untouched here and flagged for a future micro-fix.

## Indexing target (recorded only — no GSC quota spent by this batch)

- https://theflatratemovers.com/junk-removal/ — for the next booked
  indexing pass.
