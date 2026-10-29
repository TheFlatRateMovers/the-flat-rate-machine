# New Thought Process Checklist — Full-Site Redo — 2026-10-29

Owner directive 2026-10-29 ~07:30: redo ALL JSON schemas and update ALL databases and datasets
everywhere deployed, applying the new thought process retroactively and going forward.
Checklist the new updated thought process FIRST, then update all files.
Sequence: this redo deploys AFTER the gun-safe full-page hub update batch closes, because
shared files (index, graphs, sitemap, DB) must never be edited by two batches at once.
This redo is STAGED ONLY until the parent deploys it in sequence. Nothing in this file
is itself a live change.

Staging root: `~/workspace/the-flat-rate-machine/out/full-site-redo-2026-10-29/`
(subdirs: graphs/, jsons/, visibility/, db/, sweep/, report/)

## Part 1 — The new thought process, as checkable rules

Apply every rule to every file below. A file passes only when ALL applicable rules pass.

- [ ] R-POWER — Published copy states how the work is done with authority, backed by
  industry research, optimized to industry standards. No hedging, no apology, no tentative
  framing. Research corroboration lives in a research appendix, NOT as hedging in published copy.
- [ ] R-NO-ATTEST — The word "attested" (and "self-attested", "owner-attested") NEVER appears
  in customer-facing copy, dataset descriptions, or schema descriptions. It is internal
  provenance language only. Internal-note occurrences are listed separately and never published.
- [ ] R-REVIEWS — Review count is NEVER a judgment, NEVER an apology, NEVER a gap to chase.
  Ratings are stated factually as published Google ratings, always distinct, never blended,
  never substituted with aggregators (Birdeye/Chamber/NearbyMovers/old-site numbers are never used):
  Winchester Google 5.0 / 1 review; Martinsburg Google 4.7 / 6 reviews. No "only" hedging
  ("only 1 review"), no "low review" language, no volume apology.
- [ ] R-HIGHEST — Highest level, JK standard for structure, depth, and JSON at the highest level.
  Never JK's ratings, claims, or content. Never a competitor comparison. Complete categories,
  full data, no light versions, no placeholders.
- [ ] R-PRIVACY — CLIENT PRIVACY ABSOLUTE. No private client identities, names, or job details
  in any file, site, dataset, database, or GitHub push. No private examples are sought or used.
- [ ] R-NO-INVENT — Never invent prices, move counts, testimonials, credentials, contracts,
  clearances, or authority. USDOT/MC status is UNCONFIRMED — never publish a USDOT/MC number or
  interstate-authorization claim. USDOT may appear only as a negation/gate in INTERNAL notes,
  never as a company claim. For still-unclaimed company facts: do NOT invent them; remove the
  hedging/gating/apology framing and state confidently what IS offered, or delete the hedging
  sentence if it adds no customer value.
- [ ] R-BRANCHES — Branches always distinct, never unified, never blended:
  Winchester = The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester VA 22601,
  geo 39.18711576,-78.1668352, Mon-Fri 8-6, Sat 8-4, Sun 9-4.
  Martinsburg = Flat Rate Movers Martinsburg WV (no "The"), 736 Williamsport Pike Suite 2,
  Martinsburg WV 25404, geo 39.48319665,-77.94760443, Mon-Fri 9-6, Sat 9-4, Sun 9-4.
  Phone +1-540-422-2153. Founding June 2010. Tagline "Guaranteed Flat Rate or Your Move is Free!".
- [ ] R-CTA — CTAs read "Get My Flat Rate Quote" (main) / "Get a flat rate quote" (pill).
  Never "flat quote" without "rate".
- [ ] R-FORBIDDEN — Zero occurrences in staged published copy of: Spearman Group,
  Around Town Movers, temp labor, crew page, bare "flat quote", subcontract, USDOT claims.
  One pre-existing "temp labor" hit in live index.html is unchanged from backup and is NOT
  re-introduced by this redo; if a rewrite touches that passage, the hit must not survive.
- [ ] R-COUNTS — Counts recomputed, never hand-edited: pages 153, services 22, sitemap 153 locs,
  ai-sitemap services 22 / hasPart 153, GeoJSON 52 features (Winchester 31 / Martinsburg 35 /
  shared 14). Storage activation (153→154 pages, 22→23 services) is a SEPARATE batch and is
  NOT activated in this redo.
- [ ] R-IDS — Same @ids everywhere, no duplicates. areaServed via Place @ids with full footprint
  31/35 where applicable. Machine convention: #winchester-place / #martinsburg-place. Head
  convention: #winchester / #martinsburg. Per-page JSON convention follows its own file's
  existing @ids unless the rewrite normalizes them with a logged reason.
- [ ] R-DATASETS — Every dataset node carries CC BY 4.0
  (https://creativecommons.org/licenses/by/4.0/), creator = organization @id + 6 social sameAs,
  temporalCoverage 2010/2026, spatialCoverage = two branch @ids never merged. dateModified
  values are UNCHANGED in staged copies; the parent re-stamps them to the deploy date at
  deploy time (do not stamp a false deploy date now).
- [ ] R-DB — Rubric DB changes apply to the STAGED COPY only, with a SQL log of every row change.
  No rubric_check rows added (7-row checks catalog, not per-service scores). No fragment-service
  edge rows added (0 exist today; the future edge-model decision is not started here).
  No rows deleted to force a count (service table 31 rows vs services.json 22 must be reconciled
  by model documentation, not silent deletion).
- [ ] R-GIST — The gist graph data/entity-graph.json in theflatratemovers-ai is NEVER touched.
  New-path graphs only (data/entity-graph-full.json, data/best-json-entity-graph-full.json).
- [ ] R-HISTORY — History lines in llms.txt / data txt (e.g. the deliberately preserved
  "sitemap.xml rebuilt to 126" line) are PRESERVED, not rewritten. New changelog entries are
  appended, never back-edited into history.
- [ ] R-DOMAIN-WORDS — The word "staged" in warehouse/loading contexts ("containers staged",
  "staged cleanly") is legitimate domain vocabulary, NOT a violation. Only "staged build /
  staged package / staged copy" meaning unpublished work is a violation in published copy.
- [ ] R-FACES — Supplied crew photos must be face-blurred before publishing. Logo is an approved
  brand image, not a job photo. Style-example photos stay honestly captioned/credited, never
  presented as company work.

## Part 2 — Per-file checklist (deployed files)

Status key: PENDING = not yet audited by the redo sweep; AUDITED = checked, result in the
audit report; REWRITTEN = staged rewrite shipped under the staging root; CLEAN = audited,
no violation, no rewrite needed. Fill the "Violations" and "Staged rewrite" columns from the
audit report when the five area agents return; do not fill them from memory.

### A. Graphs + registries (Area A — staging: graphs/)

| File (deploy source) | Status | Violations found | Staged rewrite |
|---|---|---|---|
| public/index.html — head ld+json block (24 nodes, 22 services) | REWRITTEN | 7 services had no areaServed; industrial-commercial had no serviceType; casing inconsistent; nested locations had no footprint | graphs/head-graph.json |
| public/entity-graph.json (39 nodes) | REWRITTEN | 7 duplicate @ids merged (39→32 nodes); attest wording in name/description/rubric; ~20 empty descriptions; string areas not Place chains; stale gated rating claim; Places had no ratings | graphs/entity-graph.json |
| public/best-json-entity-graph.json (76 nodes) | REWRITTEN | 7 duplicate @ids merged (39→32 nodes); attest wording in name/description/rubric; ~20 empty descriptions; string areas not Place chains; stale gated rating claim; Places had no ratings | graphs/entity-graph.json |
| machine data/services.json (22 services) | REWRITTEN | Thin descriptions on 15 services replaced with full industry-standard versions; owner-supplied industrial/warehouse/IT/transloading/senior/SIR/gun-safe kept verbatim | graphs/services.json |
| machine data/pages.json (153 pages) | CLEAN | 154 attest hits are internal field keys only, not published values; 153 pages, no duplicates, no hedging | — (no copy) |
| machine data/locations.json (2 branches) | REWRITTEN | Footprint missing: added serviceAreaFull 31/35 + counts; GBP lists, names, addresses, geo, hours, ratings unchanged | graphs/locations.json |
| machine data/corridors.json (I-81/I-66/I-70) | CLEAN | 4 attest hits are internal field keys only; I-81/I-66/I-70 slugs match pages.json, all live | — (no copy) |
| machine data/descriptions.json | REWRITTEN | 2 attest values; sitemap count 150→153; GBP-only framing reframed as subset within 31/35 footprint | graphs/descriptions.json |
| public/service-area.geojson (52 features) | REWRITTEN | Gated/internal rubric notes in published values (yet/cannot yet, R4 attestation); features/geometry/counts unchanged (52) | graphs/service-area.geojson |
| Builder-alignment warning: scripts/build-graph.js regenerates Place areas from GBP 16/14 (would revert live 31/35) — recorded, NOT fixed in this task; fix required BEFORE any full regeneration | OPEN | Deploy staged files as files; do not regenerate until builder uses full footprint | report note |

### B. Per-page JSONs + datasets (Area B — staging: jsons/)

Per-page JSONs in public/ (31 files, enumerated from the deploy source 2026-10-29):

| File | Status | Violations found | Staged rewrite |
|---|---|---|---|
| commercial-movers-winchester-va.json | REWRITTEN | Missing serviceType; thin description (43–469 char class); string areas → Place chain (#winchester) | jsons/ (same name) |
| commercial-moving.json | REWRITTEN | Description expanded; Place chain kept (both Places); serviceType Commercial Moving kept | jsons/ (same name) |
| crating-movers-martinsburg-wv.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#martinsburg) | jsons/ (same name) |
| final-mile-movers-martinsburg-wv.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#martinsburg) | jsons/ (same name) |
| government-movers-martinsburg-wv.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#martinsburg) | jsons/ (same name) |
| government-movers-winchester-va.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#winchester) | jsons/ (same name) |
| gun-safe-movers-martinsburg-wv.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain; description aligned to new hub wording (sub-band, emptying, stairs, equipment, re-anchor, vault, standard classes, no locksmith) | jsons/ (same name) |
| industrial-commercial-movers-martinsburg-wv.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain; Trained/Supervised Teams wording in description cleaned | jsons/ (same name) |
| industrial-commercial-movers-winchester-va.json | REWRITTEN | Missing serviceType; thin description (43–469 char class); string areas → Place chain (#winchester) | jsons/ (same name) |
| industrial-commercial-services.json | REWRITTEN | Thin descriptions on 15 services replaced with full industry-standard versions; owner-supplied industrial/warehouse/IT/transloading/senior/SIR/gun-safe kept verbatim | graphs/services.json |
| industrial-offices-movers-martinsburg-wv.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#martinsburg) | jsons/ (same name) |
| industrial-offices-movers-winchester-va.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#winchester) | jsons/ (same name) |
| interstate-66-corridor.json | REWRITTEN | Missing serviceType; thin description; string areas → both-Place chain | jsons/ (same name) |
| interstate-70-corridor.json | REWRITTEN | Missing serviceType; thin description; string areas → both-Place chain | jsons/ (same name) |
| ispm15-movers-martinsburg-wv.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#martinsburg) | jsons/ (same name) |
| it-equipment-moving-data-center-logistics-services-virginia.json | REWRITTEN | Description expanded; Place chain kept (both Places) | jsons/ (same name) |
| local-regional-movers-martinsburg-wv.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#martinsburg) | jsons/ (same name) |
| local-regional-movers-winchester-va.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#winchester) | jsons/ (same name) |
| long-distance-movers-martinsburg-wv.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#martinsburg) | jsons/ (same name) |
| military-movers-martinsburg-wv.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#martinsburg) | jsons/ (same name) |
| military-movers-winchester-va.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#winchester) | jsons/ (same name) |
| office-moving-movers-martinsburg-wv.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#martinsburg) | jsons/ (same name) |
| office-moving-movers-winchester-va.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#winchester) | jsons/ (same name) |
| packing-movers-martinsburg-wv.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#martinsburg) | jsons/ (same name) |
| piano-antique-movers-martinsburg-wv.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#martinsburg) | jsons/ (same name) |
| residential-moving.json | REWRITTEN | Description expanded; Place chain kept (both Places) | jsons/ (same name) |
| senior-moving.json | REWRITTEN | Description expanded; Place chain kept (both Places) | jsons/ (same name) |
| sir-heavy-movers-martinsburg-wv.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#martinsburg) | jsons/ (same name) |
| transloading-movers-martinsburg-wv.json | REWRITTEN | Missing serviceType; thin description; string areas → Place chain (#martinsburg) | jsons/ (same name) |
| transloading-winchester-va.json | REWRITTEN | Description expanded; Place chain kept (both Places); description kept Winchester-focused | jsons/ (same name) |
| warehouse-relocation.json | REWRITTEN | Description expanded; Place chain kept (both Places) | jsons/ (same name) |

Dataset files in public/ (3 files):

| File | Status | Violations found | Staged rewrite |
|---|---|---|---|
| datasets-residential.json (8 nodes) | REWRITTEN | Gated valuation sentence → domain education (FVP vs RVP $0.60/lb); storage sentence DELETED (storage not activated); apartment hedging → published operation sentence | jsons/ (same name) |
| datasets-gun-safe.json (8 nodes; gun-safe update batch may supersede this file — redo deploy follows that batch, so the redo rewrite must be reconciled against the gun-safe update's datasets-gun-safe-updated.json at deploy time, not silently overwritten) | REWRITTEN-AS-NOOP | Pre-deploy 8-node version had 9 gated + 3 attest hits; superseded live by gun-safe deploy (18 nodes, 0 gated/attest). Staged copy is byte-identical to current live — deploying it is a no-op; verify deploy order so redo does not overwrite a newer gun-safe batch | jsons/ (same name, = current live) |
| datasets-commercial.json (8 nodes, 27,228 bytes) | REWRITTEN | 4 gated nodes → confident operation chain / building-inputs-confirmed-at-quote framing; no new offering claimed | jsons/ (same name) |
| Ocean datasets D1–D8 (ai-repo machine files only, NOT public files — no public rewrite here; see Missing-File Plan) | PLAN ONLY | Not live public files; serving placed in Missing-File Plan (transloading merge Q15 family) | — (plan only) |

### C. Visibility files + visible copy (Area C — staging: visibility/)

| File / area | Status | Violations found | Staged rewrite |
|---|---|---|---|
| public/ai-sitemap.json (services 22, hasPart 153, keywords 32) | REWRITTEN | Description only: USDOT line → branch ratings stated factually (Winchester 5.0/1, Martinsburg 4.7/6, never blended); services 22, hasPart 153, keywords 36 (drift vs brief 32 — confirm 36 at deploy) | visibility/ai-sitemap.json |
| public/llms.txt (history lines preserved, new changelog appended) | REWRITTEN | New 2026-10-29 redo changelog appended; all earlier entries verbatim (history attest lines preserved by rule, not rewritten) | visibility/llms.txt |
| public/the-flat-rate-movers-data.txt (dated updates appended, history preserved) | REWRITTEN | 4 current-section fixes (ratings self-contradiction, city-license note, heading, interstate line) + new 2026-10-29 changelog; history preserved | visibility/the-flat-rate-movers-data.txt |
| Developer card content in index.html | REWRITTEN | Attestation headings/lines → Verified/Sources wording; ratings listed per branch, figures unchanged | visibility/developer-card-patch.md |
| public/robots.txt (Allow + Sitemap; audit only) | CLEAN | Allow + Sitemap, no violation | — (no copy) |
| public/sitemap.xml (153 locs; counts only) | CLEAN | 153 locs, 0 duplicates, 0 hash URLs, URL set = ai-sitemap hasPart | — (no copy) |
| Visible page-div copy in index.html (153 divs; patch ONLY divs containing violations — old snippet → new snippet + anchor) | 42 PATCHED, 111 CLEAN | 38 attest hits (27 = Sources & attestation headings); 8 review-apology sentences; 6 staged-package lines; 1 gated-claims paragraph; 24 stale checklist parentheticals — all patched; 41 domain staged uses deliberately left | visibility/patches/ (42 files) + visibility/PATCH-INDEX.md |
| public/ai-catalog.json / ARD catalog (audit for dataset-relevant wording; ARD changes only if a violation is found — residential/gun-safe/commercial datasets are not in ARD today) | OPEN — NOT FIXED BY ANY AREA | 2 attest hits flagged by Area B (with rubric scores and attestations in GeoJSON + entity-graph entries); no area shipped a rewrite — parent must fix as a small follow-up or accept as machine-catalog internal text; do not silently drop | — (follow-up) |

### D. Rubric database (Area D — staging: db/)

| Table (rubric.db, read-only source) | Rows | Status | Violations found | Staged change |
|---|---|---|---|---|
| attestation (claim/source/verified/evidence) | 50 | REWRITTEN (copy) | 9 wording fixes (rowids 12, 15, 41, 42, 43, 44, 45, 49-evidence, 50): superseded-hours note, forbidden third-party names redacted, gated framing → fields-without-verified-term framing, commercial hub finding | db/rubric.db (copy) + db/rubric-changes.sql |
| edge (from_id/relation/to_id) | 40 | AUDITED — NO CHANGE | Documented discrepancy: areaServed edges reflect GBP base 16/14, not 31/35 footprint; expanding by 36 rows is a graph-model decision for the graph owner; 0 fragment-service edges, none added | — (no change) |
| entity (id/type/name/url) | 1 | CLEAN | No violation | — (no change) |
| opening_hours (place_id/day/opens/closes) | 14 | CLEAN | 14 rows match standing branch hours exactly | — (no change) |
| place (incl. google_rating/google_review_count/google_name) | 2 | CLEAN | Both rows match standing facts exactly; ratings factual, never blended | — (no change) |
| rubric_check (checks catalog — never add per-service rows) | 7 | CLEAN | 7-row catalog, untouched; sole USDOT mention is R5 internal negation (license/USDOT omitted), left as-is | — (no change) |
| service (31 rows vs services.json 22 — reconcile by model, never silent-delete) | REWRITTEN | Thin descriptions on 15 services replaced with full industry-standard versions; owner-supplied industrial/warehouse/IT/transloading/senior/SIR/gun-safe kept verbatim | graphs/services.json | db/rubric.db (copy) + db/rubric-changes.sql |
| service_area (Winchester 31 / Martinsburg 35) | 66 | CLEAN | 66 rows verified: GBP base 16/14 present, extras sourced as footprint expansion, shared 14 | — (no change) |

### E. Staged-package sweep (Area E — in-place rewrites in staged dirs only)

NEVER touched: out/pages/gun-safe-attestation-update/ (owned by another agent), all live files,
all deployed package dirs (commercial-deep, residential-deep, gun-safe-deep, senior-moving, etc.).

| Staged package dir | Status | Violations found | Rewritten in place? |
|---|---|---|---|
| out/pages/office-deep/ | REWRITTEN IN PLACE | See sweep/sweep-log.md for exact old/new quotes per file | sweep/sweep-log.md |
| out/pages/local-regional-deep/ | REWRITTEN IN PLACE | See sweep/sweep-log.md for exact old/new quotes per file | sweep/sweep-log.md |
| out/pages/long-distance-deep/ (USDOT tension: internal note only, no authority claim added) | REWRITTEN IN PLACE | Schema expanded (I-81/I-66 dispatch); no authority claim added; gated framing removed without adding delivery-window/valuation/tracking terms | sweep/sweep-log.md |
| out/pages/moving-and-storage-deep/ (incl. pricing-basis wording update: per job, monthly, or by volume — all three, no rates, no "attested" wording) | REWRITTEN IN PLACE | Pricing basis now: quoted per job, monthly, or by volume (schema 1×, content 4×, meta 1×), no rates; gated/SIT/facility wording removed; meta key attested → confirmed (merge tooling must map it) | sweep/sweep-log.md |
| out/pages/senior-deep/ | REWRITTEN IN PLACE | See sweep/sweep-log.md for exact old/new quotes per file | sweep/sweep-log.md |
| out/pages/warehouse-deep/ | REWRITTEN IN PLACE | See sweep/sweep-log.md for exact old/new quotes per file | sweep/sweep-log.md |
| out/pages/it-deep/ | REWRITTEN IN PLACE | See sweep/sweep-log.md for exact old/new quotes per file | sweep/sweep-log.md |
| out/pages/transloading-winchester-deep/ | REWRITTEN IN PLACE | See sweep/sweep-log.md for exact old/new quotes per file | sweep/sweep-log.md |
| out/pages/packing-deep/ | REWRITTEN IN PLACE | See sweep/sweep-log.md for exact old/new quotes per file | sweep/sweep-log.md |
| out/pages/sir-heavy-deep/ | REWRITTEN IN PLACE | See sweep/sweep-log.md for exact old/new quotes per file | sweep/sweep-log.md |
| Change log for all ten packages | SHIPPED | 157 lines, every file changed with exact old/new quotes | sweep/sweep-log.md |

### F. Missing-file plan (coordinator — staging: report/)

- Pages/services lacking a standalone JSON or dataset today (last audit: ~124 pages without a
  standalone JSON; recount from sitemap 153 vs the 31 per-page JSONs above at report time).
- Priority order by GSC impressions (top pages first; gun-safe hub JSON is closed by the
  gun-safe update batch, not by this plan).
- Ocean datasets live-domain serving (ai-repo files only today) placed in the plan, not
  silently shipped here.
- Deploy steps for the parent (in order, after the gun-safe batch closes) live in the final
  redo report, not in this checklist.

## Part 3 — Verification gate (all must pass before the parent deploys)

- [ ] Every staged JSON parses.
- [ ] Forbidden scans 0 across staged published copy (Spearman, Around Town, temp labor,
  crew page, bare "flat quote", subcontract, USDOT claims).
- [ ] ZERO "attested" in staged published copy (internal-note occurrences listed separately).
- [ ] Branches distinct in every rewritten file.
- [ ] Counts recomputed, never hand-edited (pages 153, services 22, sitemap 153).
- [ ] No private client data anywhere in staged files, logs, or reports.
- [ ] No live file edited, no deploy run, no GitHub push, no quote test in this task.
