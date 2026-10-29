# PATCH INDEX — Area C, full-site redo 2026-10-29 (STAGED ONLY)

Nothing in this directory has been applied to any live file, deployed, or pushed.
Sources read (read-only): `the-flat-rate-movers-pages/public/{ai-sitemap.json, llms.txt,
the-flat-rate-movers-data.txt, robots.txt, sitemap.xml, service-area.geojson, index.html}`.
Live `public/` was NOT touched. No wrangler deploy, no GitHub push, no quote test.
The gun-safe attestation staging directory was NOT touched.

## Files shipped in this directory

| File | Change |
|---|---|
| `ai-sitemap.json` | One-sentence in-place refresh of `description` only (see below). JSON parses. All keys, URLs, and entries unchanged; no entry duplicated. |
| `llms.txt` | Original + one new dated changelog entry at the end. All earlier entries verbatim. |
| `the-flat-rate-movers-data.txt` | 4 current-section fixes (see below) + one new dated changelog entry at the end. All earlier entries verbatim. |
| `developer-card-patch.md` | Readable old/new record for the Developer card (`page-developer`); apply-ready version is `patches/page-developer.md`. |
| `research-appendix-visibility.md` | Internal research note only (L/360, ISPM 15, FMCSA valuation vocabulary, per-branch ratings). Not published copy. |
| `patches/*.md` (42 files) | One file per changed page div, each with exact anchor snippet + old snippet + new snippet. Every old snippet was verified to occur exactly once inside its div (re-verified against the current `index.html` after a concurrent change to `public/` was noticed — see "Drift note"). |
| `PATCH-INDEX.md` (this file) | This index. |

NOT shipped (audited-clean, no rewrite): `robots.txt`, `sitemap.xml`, `service-area.geojson`
(see "Audited-clean files").

## Counts recomputed (staged ai-sitemap.json, verified against current sources)

- Pages: 153. `hasPart` = 153 URLs, 0 duplicates, and the set equals `sitemap.xml`
  `<loc>` set exactly (153 locs, 0 duplicates, 0 hash URLs).
- Services: 22 (`services` and `about` both 22, same names/order as source).
- Keywords: 36 in the current source file, unchanged by this rewrite. NOTE: the task
  brief said 32; the file as read during this task already contained 36, so the staged
  file preserves 36 rather than deleting 4 keywords on the basis of a stale count.
- Footprint: Winchester 31, Martinsburg 35, shared 14 (ai-sitemap `areaServedByBranch`).
- GeoJSON: 52 features — winchester-only 17, martinsburg-only 21, both 14
  (17 + 14 = 31; 21 + 14 = 35). Consistent with the footprint above.

## ai-sitemap.json change (only change)

OLD description ending: `…founded June 2010. No USDOT/MC number is listed (unconfirmed).`
NEW description ending: `…founded June 2010. Branches publish separately: Winchester Google 5.0 with 1 review; Martinsburg Google 4.7 with 6 reviews — never blended.`
Reason: the old sentence put an interstate-authorisation negation in a published
machine file; the new sentence states the published branch facts instead. No other
field changed (dateModified/version left as in source, 2026-10-29).

## data txt current-section fixes (4)

1. Source status line rewrote a self-contradiction ("No ratings … are published") and
   removed the interstate-authorisation token from a current claim: now "This file lists
   published facts only — founding, branches, hours, services, service areas, and
   per-branch Google ratings. License details are private and are not published here.
   No prices, testimonials, or move counts are invented."
2. City-license note: "A city business license is a city license only; it is not an
   interstate license, and interstate authorization is not listed here."
3. Heading "NOT INCLUDED — DELIBERATELY, UNTIL VERIFIED" → "PUBLISHED SCOPE — WHAT THIS
   FILE STATES" (the heading itself was hedging framing; the scope lines under it are
   kept, as scope statements).
4. "Interstate authorization: not listed here." (token removed from the current claim).

## New changelog entries (both txt files, 2026-10-29)

Both files end with a "full-site redo, visibility files" entry stating: published copy
states the work directly to industry standards, branches distinct, counts unchanged at
153 pages / 22 services, current-claim wording no longer uses internal provenance terms,
ratings stated factually per branch never blended, and earlier dated entries preserved
verbatim as history. The new entries contain none of the retired tokens.

## Violations found and patched (42 divs)

Violation types: A = internal-provenance word ("attest*" / "Sources & attestation");
R = review-volume apology; S = unpublished-work framing ("staged package");
G = hedging/gated sentence; X = stale internal checklist note.

| Div id | Page URL | Replacements | Types |
|---|---|---|---|
| page-developer | https://theflatratemovers.com/developer/ | 1 | A |
| page-recursive-indexing-layer | https://theflatratemovers.com/recursive-indexing-layer/ | 1 | A |
| page-entity-authority-layer | https://theflatratemovers.com/entity-authority-layer/ | 2 | A |
| page-logistics-data-engineering-center | https://theflatratemovers.com/logistics-data-engineering-center/ | 1 | A |
| page-entities | https://theflatratemovers.com/entities/ | 1 | A |
| page-knowledge-entities | https://theflatratemovers.com/knowledge-entities/ | 2 | A |
| page-author-ratemoversgmail-com | https://theflatratemovers.com/author/ratemoversgmail-com/ | 1 | A |
| page-gunsafe | https://theflatratemovers.com/gun-safe-movers/ | 1 | R |
| page-service-areas-moving-company | https://theflatratemovers.com/service-areas-moving-company/ | 1 | R |
| page-faq | https://theflatratemovers.com/faq/ | 1 | R |
| page-looking-for-the-best-movers-near-me-your-guide-to-stress-free-moving-in-winchester-and-martinsburg | https://theflatratemovers.com/looking-for-the-best-movers-near-me-your-guide-to-stress-free-moving-in-winchester-and-martinsburg/ | 1 | R |
| page-reliable-movers-in-martinsburg-wv | https://theflatratemovers.com/reliable-movers-in-martinsburg-wv/ | 1 | R |
| page-martinsburg-wv-movers-full-service-guide | https://theflatratemovers.com/martinsburg-wv-movers-full-service-guide/ | 1 | R |
| page-top-rated-movers-mid-atlantic | https://theflatratemovers.com/top-rated-movers-mid-atlantic/ | 1 | R |
| page-gun-safe-movers-winchester-va | https://theflatratemovers.com/gun-safe-movers-winchester-va/ | 1 | R |
| page-commercial-movers-winchester-va | https://theflatratemovers.com/commercial-movers-winchester-va/ | 2 | A, X |
| page-crating-movers-martinsburg-wv | https://theflatratemovers.com/crating-movers-martinsburg-wv/ | 2 | A, X |
| page-final-mile-movers-martinsburg-wv | https://theflatratemovers.com/final-mile-movers-martinsburg-wv/ | 2 | A, X |
| page-government-movers-martinsburg-wv | https://theflatratemovers.com/government-movers-martinsburg-wv/ | 2 | A, X |
| page-government-movers-winchester-va | https://theflatratemovers.com/government-movers-winchester-va/ | 2 | A, X |
| page-gun-safe-movers-martinsburg-wv | https://theflatratemovers.com/gun-safe-movers-martinsburg-wv/ | 2 | A, X |
| page-industrial-commercial-movers-martinsburg-wv | https://theflatratemovers.com/industrial-commercial-movers-martinsburg-wv/ | 2 | A, X |
| page-industrial-commercial-movers-winchester-va | https://theflatratemovers.com/industrial-commercial-movers-winchester-va/ | 2 | A, X |
| page-industrial-offices-movers-martinsburg-wv | https://theflatratemovers.com/industrial-offices-movers-martinsburg-wv/ | 2 | A, X |
| page-industrial-offices-movers-winchester-va | https://theflatratemovers.com/industrial-offices-movers-winchester-va/ | 2 | A, X |
| page-interstate-66-corridor | https://theflatratemovers.com/interstate-66-corridor/ | 2 | A, X |
| page-interstate-70-corridor | https://theflatratemovers.com/interstate-70-corridor/ | 2 | A, X |
| page-ispm15-movers-martinsburg-wv | https://theflatratemovers.com/ispm15-movers-martinsburg-wv/ | 2 | A, X |
| page-local-regional-movers-martinsburg-wv | https://theflatratemovers.com/local-regional-movers-martinsburg-wv/ | 2 | A, X |
| page-local-regional-movers-winchester-va | https://theflatratemovers.com/local-regional-movers-winchester-va/ | 2 | A, X |
| page-long-distance-movers-martinsburg-wv | https://theflatratemovers.com/long-distance-movers-martinsburg-wv/ | 2 | A, X |
| page-military-movers-martinsburg-wv | https://theflatratemovers.com/military-movers-martinsburg-wv/ | 2 | A, X |
| page-military-movers-winchester-va | https://theflatratemovers.com/military-movers-winchester-va/ | 2 | A, X |
| page-office-moving-movers-martinsburg-wv | https://theflatratemovers.com/office-moving-movers-martinsburg-wv/ | 2 | A, X |
| page-office-moving-movers-winchester-va | https://theflatratemovers.com/office-moving-movers-winchester-va/ | 2 | A, X |
| page-packing-movers-martinsburg-wv | https://theflatratemovers.com/packing-movers-martinsburg-wv/ | 2 | A, X |
| page-piano-antique-movers-martinsburg-wv | https://theflatratemovers.com/piano-antique-movers-martinsburg-wv/ | 2 | A, X |
| page-sir-heavy-movers-martinsburg-wv | https://theflatratemovers.com/sir-heavy-movers-martinsburg-wv/ | 2 | A, X |
| page-transloading-movers-martinsburg-wv | https://theflatratemovers.com/transloading-movers-martinsburg-wv/ | 2 | A, X |
| page-senior-moving | https://theflatratemovers.com/senior-moving/ | 3 | A, S |
| page-warehouse-relocation | https://theflatratemovers.com/warehouse-relocation/ | 3 | A, S |
| page-transloading-winchester-va | https://theflatratemovers.com/transloading-winchester-va/ | 5 | A, S, G |

Visible-copy totals behind the table: 38 "attest*" hits in visible div text (27 of them
the "Sources & attestation" heading, one per Sources section on 24 branch pages + senior
+ warehouse + transloading-winchester); 8 review-volume-apology sentences; 6
"staged package" lines (2 each on senior, warehouse, transloading-winchester);
1 real gated-claims paragraph (transloading-winchester, deleted, not replaced with any
claim); 24 stale checklist parentheticals (one per branch Sources block, all deleted).
Visible-copy scans after patching (new snippets only): 0 "attest*", 0 "staged package",
0 "choose not to review", 0 "gated claims". Visible-copy scans on the originals: 0
"pending", 0 "omitted", 0 "not yet", 0 bare "flat quote" (every "flat quote" carries
"rate"), 0 Spearman / Around Town / subcontract in visible copy.

## Audited-clean files (no rewrite shipped)

- `robots.txt` — clean: `User-agent: *`, `Allow: /`, `Sitemap:
  https://theflatratemovers.com/sitemap.xml` (75 bytes as recorded). No wording issue.
- `sitemap.xml` — clean on counts: 153 `<loc>` / 153 `<url>`, 0 duplicates, 0 hash URLs,
  identical URL set to ai-sitemap `hasPart`. Lastmod values left for the deploy area;
  this area makes no sitemap change (storage activation is a separate batch and was not
  touched here).
- `service-area.geojson` — clean on counts (audit scope for this file was counts only):
  52 Point features, branch split winchester 17 / martinsburg 21 / both 14, branches
  block with the correct distinct names, addresses, hours, and Google ratings
  (Winchester 5.0/1, Martinsburg 4.7/6). No rewrite shipped for it.

## History lines preserved verbatim (NOT rewritten, in staged txt files)

llms.txt:
- "Rubric/GeoJSON synced 2026-10-28: rubric.db 17 attestations, 9 services; service-area.geojson 52 features with top-level R1–R7 breakdown and rubric_note on the 7 score-2 expansion features."
- "Entity graphs (machine-readable, chained by @id to the same Organization node): https://theflatratemovers.com/entity-graph.json (89 @ids, rubric + attestations) and https://theflatratemovers.com/best-json-entity-graph.json (141 @ids), linked from the Developer page."
- "Carried follow-ups shipped in this batch: hub per-page JSONs https://theflatratemovers.com/commercial-moving.json and https://theflatratemovers.com/residential-moving.json (Place areas expanded to the full footprint, branches distinct), and the gun-safe head node upgraded to carry url + Place chain under the same @id (url and Place chain only; gun-safe datasets, page copy, and attestations untouched)."
- "Ocean container D1–D8 datasets staged for the machine-readable repository (full treatment); no Dataset nodes ship on live pages in this batch, and no senior, warehouse, IT, or transloading dataset node ships — those categories receive full deep-database treatment before any dataset node publishes."
- "Gated fields omitted, not guessed: …" (three lines: residential, gun-safe, commercial dataset entries, 2026-10-29 batches).
- "sitemap.xml rebuilt to 126 clean URLs, 0 hash URLs" (2026-10-28 search-visibility history) and the "queued, not yet indexed" / "in progress" stale-sitemap-removal lines in the same dated block — all preserved as history.

the-flat-rate-movers-data.txt: the same entity-graphs line, the same ocean-container
staged line, the same three "Gated fields omitted, not guessed" lines, and
"Sitemap now 153 clean canonical URLs. License details remain private and are not
published here. No USDOT/MC number is listed (unconfirmed)." — this last sentence sits
inside the dated 2026-10-28 update block, so it is preserved as history even though the
token was removed from current claims elsewhere in the same file. Rule applied:
history is quoted history; current claims carry no such token. Staged txt
current-claim portions (everything before the first "## Update 2026-10-28" heading)
scan 0 for "attest*", 0 for the interstate-authorisation token, 0 for "gated",
0 for "staged package".

## Domain "staged" uses deliberately left (41 contexts, legitimate vocabulary)

"Staged" meaning goods/furniture/freight placed or held in sequence — NOT unpublished
work — was left untouched in every case. Examples (full list verified by scan):

- Containers/freight staged at the warehouse: page-services ("containers are staged",
  "a grey shipping container staged inside the warehouse"), page-export (same),
  page-industrial-rigging-high-mass-logistics-hub-winchester-va, page-high-mass-logistics-
  long-distance-moving-winchester-va ("Staged through our own floor", "staged at our
  warehouse and transload operation"), page-container-loading-unloading-services-port-
  transload-virginia, page-port-of-virginia-container-loading-unloading-logistics-services,
  page-virginia-inland-port-freight-transloading-operations, page-container-deconsolidation-
  cross-docking-transloading-services-virginia, page-container-deconsolidation-services-
  virginia-mid-atlantic ("Staged for the region", "held staged for timed release"),
  page-category-port-logistics, page-commercial-freight-handling-solutions
  ("Freight is staged on our warehouse floor"), page-blog ("staged through our warehouse
  floor"), page-how-container-loading-unloading-services-improve-port-logistics
  ("freight is staged, sorted and reloaded"), page-how-container-deconsolidation-cross-
  docking-transloading-supports-virginia-freight-networks ("staged for its own onward leg").
- Furniture staged in the room before loading: page-residential ("Sofas wrapped & staged
  in the room"), page-packing-unpacking-services-2, page-how-to-pack-for-interstate-move,
  page-top-10-moving-tips-for-a-stress-free-move-in-2026, page-full-service-packing-
  unpacking-systematic-asset-encapsulation, page-moving-tips-winchester-va,
  page-interstate-moving-guide-winchester-va, page-packing-services-winchester-va,
  page-professional-packing-services-moving-cost-estimator, page-commercial-freight-
  handling-white-glove-final-mile-services ("staged cleanly for delivery") — all
  "staged cleanly in the room/living room before loading" variants.
- Sequence wording: page-office ("Planned, staged, placed"), page-the-data-science-of-
  displacement-… ("Runs are timed and staged around those roads"),
  page-knowledge-events ("counted → deconsolidated or cross-docked → staged →
  transloaded → final-mile delivery → verified").
- Transloading-winchester process step (kept, inside the published chain):
  "or staged for storage" (pallet-position sentence) — a process step, not a build status.

## Deliberately NOT patched, with reasons

- `page-industrial-commercial-services` ("Self-managed teams — not individual temp
  labor"): kept and counted clean. The phrase is a negation that distinguishes the
  published model (trained, supervised, self-managed teams) from individual temp labor;
  it is not a temp-labor offering and not a "crew page" label. Changing it would weaken
  a deliberate, owner-supplied distinction.
- "Heavy-asset handling in progress" photo captions (case-study, technical-rigging,
  invisible-risk pages): kept. "In progress" there describes the photographed handling,
  not unpublished work.
- "flagged" (items flagged at survey / fragile pieces flagged early): kept. Domain
  vocabulary, not a gating flag.
- Ratings sentences that state figures factually ("Google rating: 5.0 with 1 review",
  "5.0 from 1 review", "4.7 from 6 reviews", "per branch, never blended", "never
  averaged", "never merged"): kept everywhere. Only the volume-apology sentences around
  them were removed.

## Out of scope for Area C — referred, not patched here

These hits exist in `index.html` but are NOT visible page-div copy, so they belong to
other areas and were not changed by this area:

- Head/dataset JSON-LD `<script>` descriptions containing "gated" / "attested"
  (e.g. gun-safe weight-band description "Handling for safes below 1,500 lbs …
  is a survey question, gated, not a published claim"; residential description
  "Storage bridge: gated — no storage page … storage terms are attested separately
  and ship in their own later batch"; commercial description "(company issuance
  gated, not stated)"). Dataset/JSON area to resolve; Area C patches do not touch
  `<script>` content.
- Router meta descriptions after `<footer>` (global routes table, not inside any page
  div): entity-authority-layer desc "…chained by stable @id and attested to named
  sources." and knowledge-entities desc "…contact and attestation for each published
  fact." Same referral.
- GeoJSON internal provenance notes (counts-only audit scope for this file):
  top-level "attestations" array, per-feature "rubric_note" lines ("R4 GBP attestation
  cannot yet be 3"), and rubric text ("fully attested", "R4_attestation"). These are
  machine-file provenance, not customer-facing copy; no GeoJSON rewrite is shipped.
  If the parent wants them renamed, that is a GeoJSON-area decision, not a silent
  Area C edit.

## Open flags for the parent / deploy agent (not resolved by Area C)

1. Graph-count statements conflict across visibility files: Developer card says
   entity-graph 37 / best 89; llms.txt and data txt say entity-graph 89 / best 141.
   Area C changed no number. The graph area must reconcile these before deploy.
2. Keywords drift: current ai-sitemap.json has 36 keywords; the brief said 32.
   Staged file preserves 36 unchanged. Confirm 36 is the intended current set.
3. Drift note: during this task `public/` changed underfoot (index.html
   1,146,259 → 1,214,860 bytes; ai-sitemap.json 39,189 → 39,724 bytes, same-day
   mtimes). All 42 patch anchors were re-verified against the CURRENT index.html
   after the change (every old snippet still occurs exactly once in its div), and the
   staged ai-sitemap differs from the CURRENT source by the description sentence
   only. The deploy agent must still re-verify anchors at apply time, because
   `public/` is evidently being written by another batch in parallel.
4. No live verification was done or is claimed: nothing deployed, nothing pushed,
   nothing posted, no quote test. The deploy batch must run its own verify pass
   after applying patches.

## Audited-clean page divs (111) — no patch shipped

page-home, page-route81, page-heavy, page-services, page-export, page-residential,
page-commercial, page-office, page-longdistance, page-winchester, page-martinsburg,
page-exportpacking, page-militarygov,
page-case-study-3500lb-safe-moving-winchester-va,
page-sir-2026-structural-integrity-relocation-protocol, page-technical-rigging-standards,
page-find-us, page-flat-rate-moving-quote-winchester,
page-industrial-rigging-high-mass-logistics-hub-winchester-va,
page-packing-unpacking-services-2, page-safe-moving-protocol,
page-relocation-engineering-framework, page-calibration-safe-moving,
page-long-distance-cross-country-moving, page-virginia-to-florida-movers,
page-virginia-to-texas-movers, page-virginia-to-new-york-movers,
page-virginia-to-california-movers, page-virginia-to-nevada-movers,
page-interstate-moving-network, page-interstate-moving-winchester-va,
page-online-estimate, page-packing-cost-winchester-va,
page-how-to-pack-for-interstate-move,
page-top-10-moving-tips-for-a-stress-free-move-in-2026,
page-the-strategic-roadmap-for-long-distance-residential-relocation,
page-technical-rigging-high-security-gun-safe-vault-relocation,
page-elite-asset-transition-white-glove-discreet-logistics,
page-full-service-packing-unpacking-systematic-asset-encapsulation,
page-the-data-science-of-displacement-how-predictive-analytics-is-redefining-the-mid-atlantic-relocation-path,
page-the-invisible-risk-of-high-mass-relocation, page-long-distance-movers-miami,
page-high-mass-logistics-long-distance-moving-winchester-va,
page-military-government-hhg-moving-requirements-contractors,
page-long-distance-movers-winchester-va-guide, page-white-glove-delivery-winchester-va,
page-moving-tips-winchester-va, page-1600-lb-gun-safe-moving-winchester-va-to-las-vegas-nv,
page-long-distance-gun-safe-moving-winchester-va-to-las-vegas-nv,
page-how-international-export-packing-crating-protects-global-shipments,
page-how-container-loading-unloading-services-improve-port-logistics,
page-how-port-of-virginia-logistics-supports-east-coast-freight-movement,
page-how-container-deconsolidation-cross-docking-transloading-supports-virginia-freight-networks,
page-commercial-freight-handling-solutions, page-blog, page-category-freight-services,
page-privacy-policy, page-relocation-engineering-standards-portal, page-sir-2026-protocol,
page-ai-license, page-interstate-moving-guide-winchester-va,
page-packing-services-winchester-va, page-moving-questions-answers,
page-moving-cost-guide-winchester-va, page-the-flat-rate-logistics-data-hub,
page-container-loading-unloading-services-port-transload-virginia,
page-port-of-virginia-container-loading-unloading-logistics-services,
page-virginia-inland-port-freight-transloading-operations,
page-professional-packing-services-moving-cost-estimator,
page-emergency-port-container-recovery-twic-labor-virginia,
page-container-deconsolidation-cross-docking-transloading-services-virginia,
page-container-deconsolidation-services-virginia-mid-atlantic,
page-it-equipment-moving-data-center-logistics-services-virginia, page-docs,
page-docs-logistics-ontology, page-docs-logistics-event-protocol,
page-docs-data-center-logistics, page-docs-container-deconsolidation,
page-knowledge-services, page-knowledge-equipment, page-knowledge-locations,
page-knowledge-events, page-areas-served,
page-commercial-freight-handling-white-glove-final-mile-services,
page-category-eastern-panhandle-moving, page-category-estate-relocation,
page-category-high-value-rigging, page-category-logistics,
page-category-logistics-transportation, page-category-long-distance-nested,
page-category-long-distance-moving, page-category-maritime-shipping,
page-category-military-government-moving-cat, page-category-moving,
page-category-museum-logistics, page-category-office-commercial-moving,
page-category-paper-padding, page-category-port-logistics,
page-category-relocation-services, page-category-residential-logistics,
page-category-rigging-sir-2026, page-category-shenandoah-valley-logistics,
page-category-top-rated-movers-winchester-va, page-category-vault-moving,
page-category-winchester-va, page-quote, page-sitemap,
page-industrial-commercial-services, page-all-pages, page-local-regional-moving,
page-industrial-offices-moving.

Clean-div test: visible text (scripts stripped) contains none of: "attest*",
"staged package/build/copy", "choose not to review" (or equivalent volume apology),
"pending", "omitted". (The word "gated" matched only as part of "segregated" in the
already-violating transloading-winchester div; no clean div contains it.)
