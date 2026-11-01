# BATCH — PARSEABILITY SWEEP + EXPANSION

Henry's directive, 2026-11-01: make sure the estate's data and
infrastructure are fully parseable by search engines and AI
assistants, across the website, GitHub, and the Machine project;
fix every gap at source in the same batch; deliver the results as a
SEPARATE checklist ("The Flat Rate Machine Parseability Checklist",
artifact, goal goal_79b71a3dfb7b). Executed 2026-11-01, immediately
after E6-B2 closed (140/140, 492 distributions, seal 783fb17b…).

**Outcome: the full estate was swept with no sampling — all 492
signed distributions fetched live, all 210 route documents parsed,
all 346 JSON files in the two primary repos fetched raw from
GitHub and parsed, every API endpoint and all 6 MCP tools
exercised. Five gaps found; three fixed and sealed in-batch (G1,
G3, G4), one prepared and flagged for the parent's write route
(G2, wiki — no git credentials exist in this environment), one
recorded as an owner step with its designed solution (G5, repo
topics — no connector tool exists). verify.js 140 → 144 checks
(new §24 PS-1..PS-4); final seal f5c3e8e6…; suite green at
144/144 in the batch's own full run pre-push, with P-6 the
established parent-closable item (it reads the served seal vs
GitHub bytes; it closes when the flagged shell upload lands).**

## State at start (re-verified, none assumed)

- Baseline verify.js: **140/140 VERIFY OK** (own run at batch open).
- Live signed index == local sealed copy, byte-identical
  (dcfb566d… for the fetched index file at sweep start; the E6-B2
  final seal 783fb17b…, 492 distributions).

## The sweep (all counts full, none sampled)

### Scope 1 — Website
- **492/492 distributions fetched live: HTTP 200, every JSON body
  parses, every digest matches the signed index (DEPLOYED), every
  HTML document carries ≥1 ld+json block.** Sitemap: 247 locs, all
  inside the distribution set; every loc fetched 200.
- **210/210 route documents**: canonical present and self-matching
  on all; no noindex anywhere; titles on all; 709 ld+json blocks,
  all parse — with ONE exception class found (G1, in the shell
  source, never in a served page; below).
- **Per-page JSON linkage: 210/210** pages declare their
  `data-page-json` file; every declared file is a live, valid,
  digest-sealed distribution whose @id set overlaps its page's
  baked #page-jsonld graph. (An earlier heuristic pass using
  filename flattening produced 5 false "missing" flags — the
  estate's declared mapping is the contract, and it is complete.)
- **Datasets**: 37 files; DC-1..DC-5 discipline green inside
  verify.js; API byte parity 37/37 (below).
- **llms.txt**: 423 URLs mentioned; **all 210 sitemap pages
  represented; 0 unresolved mentions.** **llms-full.txt**: the
  curated full-text corpus — all 28 services named, both branch
  addresses + the distinct Martinsburg name present, all 37 dataset
  files named, book ASIN B0GRBKR5DS + EAN 2940185300718 present,
  concept DOI present; 0 unresolved mentions. (llms-full is a
  corpus, not a page index, by its approved design; page-level
  completeness is llms.txt's contract, verified in full.)
- **robots.txt: served == source, NO DRIFT**; content unchanged
  (standing rule). Sitemap.xml parses; every loc 200.
- **API** (api.theflatratemovers.com): 20 endpoint probes — all
  JSON endpoints 200 + valid JSON (the bare /v1/verify correctly
  400s without ?file=; with ?file= it returns match data);
  **dataset byte parity 37/37 identical** to the site files;
  ?table= views verified incl. all 9 crawl-presence tables;
  **MCP: initialize OK, tools/list = exactly the 6 designed tools,
  one call each — all 6 succeed** (first-pass "failures" of
  get_service/get_dataset were the probe's wrong argument names —
  the tools' own schemas name `service_id` / `name`; re-called
  correctly, both return data).

### Scope 2 — GitHub
- **346 JSON files** across theflatratemovers-ai (166) and
  the-flat-rate-machine (180) fetched RAW (cache-busted) —
  **346/346 parse.** (GitHub raw serves them as text/plain; that is
  the platform's content-type for all raw files, not an estate
  defect — the site serves the same data as application/json.)
- **Repo metadata, all six repos**: description + homepage +
  license MIT present on all six; topics present on five —
  **SIR-Global-Standards-Registry carries zero topics (G5).**
  The SIR authority repo's true name was re-established from the
  org listing: The-Flat-Rate-Movers-SIR-Category-Technical-
  Authority-Repository (metadata complete).
- **Wiki** (theflatratemovers-ai): 7 content pages + _Footer +
  _Sidebar, all reachable (200) and parseable; the legacy page is
  the standing "# Retired" notice (its file deletion remains a
  human click, as recorded since publication). Content accuracy
  findings = G2.
- **Gist-based ai-repo data/entity-graph.json (blob cda897e6…):
  not in any push set; re-confirmed untouched** (its fetched bytes
  in sweep 4 parse and its size stands at 2,486 B, as recorded).

### Scope 3 — The Machine project
- **node --check clean on the full executable JS set** (scripts/ +
  repo-dir/); **py_compile clean** on all Python tools.
- **paths.json: 10/10 keys resolve to existing paths.**
- **Shell mirror currency**: proven by digest — the GitHub-served
  shell matched the E6-B2 seal at sweep start; after this batch's
  G1 reseal it is the one flagged parent upload (below).
- **WebMCP (static verification against the served documents)**:
  home document carries all 7 imperative tool names +
  `start_flat_rate_quote` + `request_flat_rate_quote` +
  modelContext detection; quote document carries the 7 +
  `request_flat_rate_quote`; **`toolautosubmit` occurs 0 times**
  (the hard line holds). The origin-trial proof (PageSpeed Agentic
  Browsing 6/6) stands, not re-litigated.
- **Hugging Face**: both dataset repos' API records parse;
  license cc-by-4.0 on both; files present (intent-coverage 4,
  ai-authority-estate 45); spot-parsed data files valid (the
  mirrored index is the 482-distribution release snapshot —
  presence + parseability confirmed; re-sync rides the release
  cadence, out of this batch by its terms).
- **Zenodo**: concept DOI 10.5281/zenodo.23818766 resolves (200)
  to the v1.2.0 record; the record's API JSON parses (1 deposit
  file, DOI 10.5281/zenodo.23844324).

## Gaps found and their fixes

### G1 — the estate's one unparseable ld+json block (FIXED, sealed)
The source shell's `<script type="application/ld+json"
id="page-jsonld"></script>` stood EMPTY — a build-time slot the
route generator fills per page. Every served page was always
valid; the unparseable block existed only in the sealed shell
distribution itself (GitHub raw + repo mirror), where a machine
consumer parsing all 81 blocks failed on block 2. Fix, through the
estate's own machinery: the slot now carries a seeded valid
document `{"@context":"https://schema.org","@graph":[]}`;
build-routes.js (scripts/ + repo-dir/ copies, kept byte-identical)
asserts the seeded slot and replaces it per route exactly as
before. Proof: routes regenerated — **210/210 byte-identical** to
the prior deploy tree; shell now parses **81/81**. Regression
pinned by new verify.js §24 **PS-1..PS-4** (dated verify-fix
record: out/verify-fix-2026-11-01-parseability-sweep.md; no check
weakened, deleted, or waived). Cascade absorbed in the same
motion: intent rubric re-run, SI/AE/LG/CP/AR fixpoint converged
(all --check green, llms-full.txt byte-stable at 4b1cef21…),
seal passes 1–3 (pass 3 reproduces pass 2 exactly — **final seal
f5c3e8e63ae481ead8db605a35d2c169e53cd96c61a01925e4bcf6635848543f**,
492 distributions, digest audit gaps 0 on every pass), Pages
deployed (live index SHA == sealed), API cadence re-run (bundle
refreshed on a full signed-index match, tests **51/51**, worker
2ec4a8f2-a57d-4961-bdd2-3832e5603e04, /v1/index = 492).

### G2 — wiki content staleness (PREPARED; parent write route)
The wiki's facts predated the takeover-category and footprint
expansions: "23 services" (×3), a Services page listing only 23
(the 5 missing = the takeover categories + junk removal), a
datasets table of 15 files, graph counts 33/82, "25 tested
distributions", ai-sitemap "155 pages / 77 keywords", footprint
52 / Winchester 31. All corrected from live-verified sources
(28 services from the API registry; 210 pages + 92 keywords from
the live ai-sitemap; 53 features / 32 / 35 / 14 from the live
GeoJSON; 38 / 97 nodes from the live graphs; 492 from the signed
index; the datasets table rebuilt to all 37 files) and the five
missing services added with descriptions propagated from the API
service records. The corrected pages are committed in a local
clone and preserved at `work/wiki-corrected/` (Home.md,
Services.md, Datasets-and-Machine-Data.md,
The-Company-and-Branches.md). **The write cannot land from this
environment: no git credentials exist here (push fails on
authentication), and the connector's toolset has no wiki route.**
Designed solution + owner: the parent lands the four prepared
files via the signed-in browser (wiki Edit UI) or any
authenticated clone — a minutes-long step, contents final.
Services.md post-fix lists exactly 28 service bullets (verified).

### G3 — ai repo README staleness (FIXED; rides the ai push)
Same era drift as G2, corrected from the same verified sources:
repo-structure diagram completed (all 37 data/ datasets, the
signed verification reports + JWS files, LICENSE, signing-keys),
"15 files" → 37, entity graph 33 → 38 nodes, schemas/ "36
per-page JSON files" → 86 (91 files in schemas/, 5 of them
.schema.json), GeoJSON 52/31 → 53/32, datasets-layer list
completed with the 22 additional files. Corrected file staged at
work/ai-README-corrected.md; pushed as README.md in this batch's
single ai push.

### G4 — machine repo README staleness (FIXED; rides the machine push)
The migration-era README described the machinery with 2026-10-28
counts: services 18 → **28**, pages registry 126 → **210**,
GeoJSON 52 → **53** features, the verify gate "43/43" →
**144/144**, and the two graph rows' "byte-for-byte copy" claims
— true for the GeoJSON (verified identical), no longer true for
the two graph working snapshots in data/ (38 and 94 @graph nodes
as counted in the files themselves); the rows now say "working
snapshot" with the counted nodes. The data/ graph copies are
internal working files (not distributions, not served); their
refresh is the migration tool's separate job and is noted here
for the Machine re-evaluation Henry has queued — not silently
dropped, not rebuilt inside this batch's narrow theme.

### G5 — SIR-Global-Standards-Registry topics (OPEN, owner step)
The only one of six repos with **zero topics** — a discoverability
defect on a public authority surface. No route exists from this
environment: the GitHub connector's toolset contains no
repo-metadata operation, and unauthenticated API calls cannot
write. Designed solution + owner: Henry or the parent (signed-in
browser) opens the repo's Settings → About (gear) and adds topics
matching its description — `sir`, `kim-gs`,
`structural-integrity-relocation`, `high-mass-logistics`,
`standards-registry` — a one-minute step. Recorded here and on
the checklist as an open item with its solution; everything else
in Scope 2 verified complete.

## verify.js
140 → **144 checks** (§24 PS-1..PS-4 added stricter; see the
verify-fix record). Batch's own full run after the reseal:
**144/144 VERIFY OK** — PS-2 detail: 210 docs, 709 ld+json blocks,
0 unparseable; PS-3: 258 JSON files, 0 unparseable; PS-4 green.
(Note on ordering: the P-checks evaluate the SERVED seal, so
P-6 — GitHub bytes vs the new seal — stands open on exactly the
three changed machine-repo files until the closing pushes and
the flagged shell upload land; the parent's post-upload run is
the closer, per the established pattern of E5-B1, the intent fix,
E6-B1 and E6-B2. The first of the batch's two full verify runs
also tripped once on a live-fetch transport error and the
immediate full re-run passed 144/144 — the egress truncation
behavior documented in E6-B2's record.)

## Pushes + parent flags

- Exactly one push per repo, back-to-back. Pre-push key-content
  grep across both push sets: 0. The gist-based ai-repo
  data/entity-graph.json is in neither set.
- ai (TheFlatRateMovers/theflatratemovers-ai): data/ai-master-
  index.json, data/ai-master-index.jws, README.md (G3).
- machine (TheFlatRateMovers/the-flat-rate-machine): verify.js,
  scripts/build-routes.js, README.md (G4),
  out/verify-fix-2026-11-01-parseability-sweep.md, this record.
- **Flagged for the parent** (over the connector ceiling; values
  read from the FINAL signed index after the last reseal):
  1. machine `code/site-shell/index.html` — 23,241,161 bytes,
     SHA-256 c5afc6f24c7ec128812dfb9bdab5c9b868ed1497b4f120879f
     76dacc631c1ddd (source: repo-dir/index.html).
  When it lands and reads back byte-identical, P-6 closes and the
  suite reads 144/144 on the parent's run.
- The answer-evidence dataset did NOT change in this batch's
  cascade (byte-identical to its E6-B2 state) — no second flag.

## Deliverable
"The Flat Rate Machine Parseability Checklist" — separate
artifact page (goal goal_79b71a3dfb7b), three sections
(Website / GitHub / Machine), every item verified three ways
(parseable / live / deployed) at the final post-fix state, with
G2 and G5 carried as named open items with their solutions.
