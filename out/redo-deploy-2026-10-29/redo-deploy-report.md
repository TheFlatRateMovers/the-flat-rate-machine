# Full-Site Redo — Deploy Report — 2026-10-29

Order: Henry 2026-10-29 ~07:58 — take the entire redo report message, work on it one by
one to get all updated and corrected, tested and verified, then deploy. All open decisions
were delegated to Mira; Mira's 14 decisions were applied exactly as given. No decision was
re-taken, no question was sent back.

Deploy URL: https://3c2178e5.the-flat-rate-movers.pages.dev (custom domain serving the
same build — live verification below ran against https://theflatratemovers.com).

## Step 1 — Re-baseline (live, before any edit)

- Sitemap 153 locs; services 22; pages 153.
- ai-sitemap: services 22 / hasPart 153 / keywords 36 (keyword list read in full).
- Live entity graph 39 nodes (32 unique @ids), best 76, head 24.
- datasets-gun-safe.json live: 18 nodes. gun-safe-movers.json: 200 application/json.
- Live rubric DB (~/workspace/theflatratemovers/rubric.db): attestation 63, service 31,
  edge 40, opening_hours 14, service_area 66, rubric_check 7, integrity ok.
- Baseline index check: the live-fetched index.html (1,244,611 bytes) differs from the
  deploy source (1,214,860 bytes) ONLY by Cloudflare Email Address Obfuscation. After
  reversing all 226 obfuscation replacements (119 anchor+span, 103 JSON-string anchors,
  2 standalone spans, 2 plain-text anchors) plus the injected decode script and the one
  mailto subject parameter Cloudflare strips, the normalized live file is BYTE-IDENTICAL
  to the deploy source. Confirmed again post-deploy (see Step 9).
- Backups (dated, never pushed): out/redo-deploy-2026-10-29/backup-2026-10-29/ —
  public-src/ (index.html, graphs, geojson, 3 dataset files, ai-sitemap, llms, data txt,
  ai-catalog, all-json/), machine-data/, mirror/, db/rubric.db.live-63rows.

## Decisions applied, one by one

1. **Place scheme canonical = #winchester / #martinsburg everywhere.** Swept the staged
   deploy set: entity-graph.json 66 replacements, best-json-entity-graph.json 58,
   service-area.geojson 2 (rubric R2 chain strings) = 126. All other deploy-set files
   (head graph, services, locations, descriptions, all 34 jsons, ai-sitemap, llms, data
   txt, developer patch, 42 patch files) already used the canonical scheme (0 found).
   Post-sweep: zero "#winchester-place"/"#martinsburg-place" references in deployed
   current content; no history line contained one, so no exception was needed.
2. **Dataset retype.** All 34 nodes across the three files classified (full mapping in
   retype-mapping.md). Result: Dataset 11 (residential 3, commercial 3, gun-safe 5),
   Service 15 (3/3/9), Article 8 (2/2/4), FAQPage 0 — no node carries discrete
   question/answer pairs (gun-safe service-detail nodes list likely-search questions
   inside prose without paired answers), so none qualified; the hub FAQPage block is
   unchanged. Reference data stayed Dataset with CC BY 4.0: taxonomies, weight/size
   classes (SIR band + labeled domain classes), safe-class spectrum definitions, branch
   and service-area data. Service-description nodes became Service with
   provider = #organization (publisher = #organization added). Guide/audience prose
   became Article with headline = name, author = #organization, publisher =
   #organization. Every @id, name, and description preserved verbatim.
   Page markup: the dataset script blocks inside the gun-safe hub, residential-moving,
   and commercial-moving divs were replaced with the retyped content — post-deploy,
   each live page block parses EQUAL to its live machine file. Developer cards reworded:
   headings now "Residential data / Gun Safe data / Commercial data", and the text lists
   Dataset nodes (CC BY 4.0) separately from Service data and Articles with exact counts.
3. **Entity count 32.** verify.js was read in full first: it contains NO hardcoded
   entity-39 expectation — Phase A already replaced count literals with registry-relative
   coverage assertions (verify.js §5 comment). The authorized check change was therefore
   a no-op; the gate ran green against the 32-node graph (71/71). Recorded here per the
   decision (a check review, no check weakened, none edited).
4. **Keywords recomputed from current live: 36.** Staged ai-sitemap already carried the
   live 36 (services/hasPart/keywords/about all diffed EQUAL to live); none dropped.
5. **ai-catalog.json attest hits fixed (2).** "rubric scores and attestations" →
   "rubric scores and published source data" in public/ai-catalog.json AND its two
   byte-identical serving copies (.well-known/ai-catalog.json, .well-known/ard.json).
   The ai-repo's tracked ai-catalog.json is a DIFFERENT, larger document (3,415 bytes)
   carrying the same two sentences; its own copy was fixed with the same replacement
   and pushed — it was not overwritten with the site file.
6. **Edge areaServed rows stay GBP 16/14 BY DESIGN** (edges record GBP-published areas;
   footprint lives in Place nodes + service_area 66 rows). No edge row changed. Resolved.
7. **Fragment hub URLs.** Best graph: commercial, gun-safe, residential fragments
   already carried hub urls — verified, unchanged. Entity graph: the redo dedupe had
   dropped fragment urls entirely; commercial (hub), gun-safe (hub) were restored from
   the live state in the Step-3 carry-forward, and residential was set to
   https://theflatratemovers.com/residential-moving/ per this decision. All six
   fragment/url pairs verified live post-deploy.
8. **Industrial name.** industrial-commercial-services.json Service name set to the
   registry name "Industrial & Commercial Services".
   Verified aligned everywhere else: registry (services.json), head graph, entity graph,
   best graph (page-slug nodes), both branch per-page JSONs, pageMeta, and the live page
   listing all already use the registry name. serviceType: the file's list already
   contains "Flexible Project Support Deployment" (Area B's project-support fix) — the
   list was kept intact rather than collapsed to a single string, which would have
   deleted eight published serviceTypes (Warehouse & Distribution, Ocean Container
   Handling, PODS Handling, Transloading, Restacking, Packing, and others). Crew/temp
   wording stays zero.
9. **Database — applied as UPDATEs to the CURRENT live DB, file never replaced.**
   Backup: backup-2026-10-29/db/rubric.db.live-63rows. Pre-apply diff (staged copy vs
   live): attestation diffs in rows 1–50 were EXACTLY the 9 SQL-targeted rowids (12, 15,
   41, 42, 43, 44, 45, 49-evidence, 50); service diffs were exactly commercial URL,
   senior description, and gun-safe description. All other tables byte-identical.
   The gun-safe case: the staged copy's service-gun-safe description is OLDER than live
   (live carries the gun-safe deploy's refreshed text, "…plus safes under 1,500 lbs
   handled the same careful way…"). NO SQL UPDATE targets that row, so nothing was
   skipped and nothing reverted — the live text is preserved verbatim (verified before
   and after). Applied: all 11 UPDATEs. Post-apply: integrity ok; attestation 63,
   service 31, edge 40, opening_hours 14, service_area 66, rubric_check 7; verify.js DB
   checks 22 canonical / 22 attestations pass.
10. **Graph-count prose → node counts.** Developer card: "37 chained @ids" → "32 nodes",
    "89 chained @ids" → "76 nodes" (the card's attestations wording was fixed by the
    Area C patch). llms.txt + data txt standing reference line: "(89 @ids, rubric +
    attestations)" → "(32 nodes, rubric + published source data)" and "(141 @ids)" →
    "(76 nodes)" in both files. Classification note: Area C had listed that line as
    preserved history; it is the files' standing, undated entity-graph reference (the
    only graph-figure statement outside dated entries) and decision 10 names llms.txt
    and data txt explicitly — it was updated as current content. Dated entries keep
    their historical figures verbatim (llms 2026-10-28 entry still reads 89/141, as
    history). No occurrence counts were kept, so none needed recomputation.
11. **Duplicate SPA DB row left in place.** Verified present, not deleted.
12. **Date stamps.** Every node in the three dataset files (Dataset, Service, and
    Article nodes alike) carries dateModified 2026-10-29, the actual deploy date
    (asserted in the retype build and re-verified live). ai-sitemap dateModified was
    already 2026-10-29.
13. **Missing-file plan (121 URLs) NOT in this deploy.** No new JSONs created.
14. **Storage meta key mapping recorded, storage files untouched.** Counts stayed
    153 pages / 22 services throughout; no storage activation.

## Step 2 — Place sweep
126 replacements (entity 66, best 58, geojson 2); zero remaining in the deploy set;
every swept JSON re-parsed clean.

## Step 3 — Diff-and-carry-forward (reconciled cleanly, no stop)
- Entity graph: gun-safe description restored to the live 630-char powerful text
  (staged had the 292-char pre-refresh version); commercial + gun-safe hub urls
  restored from live; residential hub url set (decision 7). No other field differences
  on the three fragments. Remaining staged-vs-live differences are the audited redo
  rewrites themselves (dedupe 39→32, filled descriptions, Place chains, per-branch
  ratings on Place nodes). The other merged fragments carry no url in the staged design
  — their branch-page urls remain in the best graph's page-slug nodes and pages.json,
  as the redo report specifies; that is the audited merge design, not drift.
- Best graph: the three hub fragments were already identical to live (url + 630-char
  gun-safe description included) — nothing to carry.
- Head graph: staged == live on commercial/gun-safe (hub urls, identical descriptions);
  all other diffs are the redo's staged expansions (serviceType added for
  industrial-commercial, areaServed added for 7 services, fuller descriptions).
  Observed, left per scope: head #service-residential carries no url in either live or
  staged (decision 7 covers the two machine graphs; the redo head rewrite kept urls
  unchanged by design).
- Visibility: ai-sitemap differs from live by exactly the one intended description
  sentence (services/hasPart/keywords-36/about all equal); llms = live + redo entry;
  data txt = 4 intended fixes + redo entry. No live-only content existed to carry.

## Step 4 — Retype build
build-retype.py applied the mapping (34 nodes), the industrial name fix, and the
decision-10 llms/data edits, writing finals into the staging tree so staging == deploy
set. Mapping table: retype-mapping.md (also in this repo push).

## Step 6 — Apply
- Head block replaced with staged head-graph.json (still 24 nodes).
- Three dataset script blocks in index.html replaced with the retyped file contents;
  the gun-safe FAQPage block verified byte-unchanged.
- 42 patch files applied: 76 replacements, each OLD snippet asserted to occur EXACTLY
  ONCE inside its target div before replacement (build-index.py aborts otherwise; no
  abort occurred). Matches the PATCH-INDEX per-div counts (13×1 + 26×2 + 3 + 3 + 5 = 76).
- Developer div: Area C patch + decision-10 counts + decision-2 card rewording.
- Files installed: graphs → public/ + machine data/ + workspace mirror (byte-identical
  in all three, hash-verified); services/locations/descriptions → machine data/;
  34 jsons → public/ (gun-safe-movers.json NOT overwritten — already live, no staged
  copy exists); ai-sitemap/llms/data → public/; ai-catalog fixed in place (3 copies).
- Gate-time fix (recorded in the deviations): two pageMeta router descriptions still
  carried the retired word — the exact Area C referrals. Fixed with the batch's own
  replacement pattern; index.html now scans 0.

## Step 7 — Gate (all passed, no stop)
- node --check on BOTH inline scripts of the final index (885 and 122,899 chars —
  identical sizes to the gun-safe batch's, scripts untouched): OK, re-run after the
  gate-time pageMeta fix: OK.
- verify.js: **71/71 PASS** (run against the final tree; includes live-sitemap set
  equality, geojson name/count parity, byte-identity data↔mirror, branch distinctness
  with exact names/hours/ratings, serviceType on every graph Service node, DB 22/22).
- Counts: pages 153 / services 22 / sitemap 153 / ai-sitemap 22/153/36. Public JSON
  files: 39. Entity 32 nodes / 32 unique @ids; best 76 / 76.
- Forbidden scans over published VALUES of every deployed JSON (public + well-known +
  machine data): attest 0, gated 0, Spearman 0, Around Town 0, temp labor 0, crew page
  0, subcontract 0, USDOT 0 — except the single permitted GeoJSON R5 negation
  "USDOT omitted". Index.html: attest 0 (after gate fix), gated 0, Spearman 0,
  Around Town 0, crew page 0, subcontract 0, USDOT 0, bare "flat quote" 0.
  Documented exceptions, all pre-existing and untouched by this batch: (a) ONE
  "temp labor" negation in the industrial page's visible copy ("Self-managed teams —
  not individual temp labor", owner-supplied distinction; checklist R-FORBIDDEN carves
  it out; its div was audited-clean and unpatched); (b) attest/gated wording inside
  DATED changelog entries in llms.txt/data txt (preserved history per R-HISTORY —
  llms lines 89, 112–121; data lines 172–180 — every remaining hit was classified and
  sits inside a dated Update section); (c) the geojson "attestations" top-level KEY
  (internal field key, not a published value; its values scan clean).
- Zero placeholders, zero private client data, zero named federal/private clients in
  the deploy set. No quote test sent. build-graph.js never run.

## Step 8 — Deploy
`npx wrangler pages deploy public --project-name=the-flat-rate-movers` from the project
root ~/workspace/the-flat-rate-movers-pages: 44 files uploaded, 53 unchanged.
Deploy URL: https://3c2178e5.the-flat-rate-movers.pages.dev

## Step 9 — Live verification (every changed file, no sampling; all PASS)
- Sitemap 153. ai-sitemap 22/153/36 and parses EQUAL to the deployed file.
- Entity graph live: 32 nodes, 32 unique @ids, zero -place refs; best: 76/76, zero
  -place refs. Exactly one fragment each for commercial/gun-safe/residential in both
  graphs, all with hub urls. Entity gun-safe description = 630 chars (carried forward).
- Head graph live: 24 nodes, 22 Service nodes, ALL with serviceType and areaServed
  (the redo's head fixes are live), zero -place refs.
- All 31 deployed per-page JSONs: 200 + application/json (full loop, no sampling).
  gun-safe-movers.json (not part of this deploy): still 200 + application/json.
- All 3 dataset files: 200 + application/json; node types match the retype mapping
  exactly (residential Service 3 / Dataset 3 / Article 2; commercial 3/3/2; gun-safe
  Service 9 / Dataset 5 / Article 4); every node dateModified = 2026-10-29.
- Page markup == machine files: all three live dataset script blocks parse EQUAL to
  their live dataset files.
- All 42 patched divs live: 76/76 replacements verified (NEW snippet present and OLD
  snippet absent inside each div) against the live-fetched index after Cloudflare
  de-obfuscation; the de-obfuscated live index is BYTE-IDENTICAL to the deployed
  source index.html.
- Developer page live: "32 nodes" / "76 nodes" present; "37 chained @ids",
  "89 chained @ids", "attestations" absent; three reworded data cards present.
- Tagline and "Get My Flat Rate Quote" present; "DESIGN 6" = 0; quote markers
  heroQuote/quoteForm/hqWalk/qWalk intact; attest in live index = 0.
- Branches distinct spot checks: Winchester gun-safe div (The Flat Rate Movers, 5.0)
  vs Martinsburg gun-safe div (Flat Rate Movers Martinsburg WV, 4.7, no Winchester
  rating text); commercial-movers-winchester-va.json (LocalBusiness #winchester,
  ratingValue 5, reviewCount 1) vs government-movers-martinsburg-wv.json (#martinsburg,
  4.7 / 6); branch JSON Service areaServed chains are branch-only and canonical.
- GeoJSON live: 52 features. llms.txt + data txt live: node-count line and the deploy
  entry present; the old "(89 @ids" current line gone. ai-catalog.json live parses with
  zero attest hits; both .well-known copies live with zero attest hits.

## Step 10 — GitHub (same motion as the deploy)
- theflatratemovers-ai: 40 files — llms.txt, the-flat-rate-movers-data.txt,
  ai-sitemap.json, ai-catalog.json (repo copy fixed in place), data/entity-graph-full.json,
  data/best-json-entity-graph-full.json, data/datasets-residential.json,
  data/datasets-commercial.json, data/datasets-gun-safe.json, schemas/ × 31 per-page
  JSONs. Commit hash + read-back result are recorded in the delivery report to Mira
  (a commit cannot contain its own hash). Gist graph data/entity-graph.json verified
  2,486 bytes before the pushes; verified again after (see delivery report).
- the-flat-rate-machine: data/ finals (6 files) + the full redo staging tree under
  out/full-site-redo-2026-10-29/ (graphs, jsons, visibility incl. 42 patches, db SQL log
  + audit — NOT the rubric.db binary, sweep log, reports, checklist, builder) +
  out/redo-deploy-2026-10-29/ (build scripts, retype mapping, this report).
  No backups pushed anywhere.

## Deviations and incidents (complete list)
1. Gate-time fix: 2 pageMeta router descriptions carried the retired word (Area C had
   referred them, no area owned them). Fixed in the deploy source with the batch's own
   replacement pattern (OLD→NEW quoted in the working notes above), re-ran node --check,
   gate then passed with index attest = 0. Reason: shipping them would have failed this
   batch's own published-copy rule; the replacements are the same pattern Area C used
   for the matching page divs.
2. A dated deploy entry was appended to llms.txt and the data txt recording this
   deploy (Place scheme, node counts, retype, counts unchanged), following the files'
   own per-batch changelog convention; the staged redo entry predated the retype
   decision and the deploy itself. New entry contains none of the retired tokens.
3. verify.js entity expectation (decision 3): no literal existed to update (Phase A
   had replaced literals with coverage assertions); recorded as a reviewed no-op.
4. Dataset descriptions preserved verbatim per decision 2 — including two internal
   working-note sentences that remain visible in public data and are flagged for a
   future copy decision (NOT silently edited here): gun-safe dispatch node ("This node
   refresh fixes the prior Martinsburg skew…") and the Winchester service-detail node
   (its name reads "…Winchester Page Parity Approved" and its description quotes page
   word counts, "Winchester page today is 442 words; Martinsburg page is 1,083 words").
5. Industrial serviceType kept as the published 9-item list (contains the required
   "Flexible Project Support Deployment") instead of collapsing to one string — see
   decision 8 note.
6. Build incident: the first live-vs-source index comparison showed a 29,751-byte
   difference; root-caused to Cloudflare Email Address Obfuscation and PROVEN
   byte-identical after de-obfuscation (226 replacements enumerated) — no content
   drift existed. No failed gate, no failed deploy, no partial state at any point.
7. A long-running character-level diff of live-vs-source index (background) confirmed
   the same conclusion independently: its only residual hunks were the normalizer's
   mailto-subject artifacts, a subset of the obfuscation class.
