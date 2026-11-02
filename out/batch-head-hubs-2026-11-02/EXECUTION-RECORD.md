# EXECUTION RECORD — Head-Hubs + hasPart + White-Glove batch, 2026-11-02

Coordinator execution of ws1/READY.md §7 + ws2/READY.md (10 steps), merged
into ONE seal window, plus Amendment #1 (white-glove first-class service)
and Amendment #2 (Winchester 16→17 + FTZ correction, verdict REFUTED).

## ERRORS FIRST — every failure hit, and its fix

1. **Seal run 1 failed its proof round at the intent --check**
   (regenerated digest 074660cc… ≠ DB digest ff353910…, both 3,192 rows).
   Cause: a standalone generator run had written rubric.db from
   pre-ai-sitemap-patch inputs; the WS2 hasPart→pages rename changed the
   generator's input set afterwards. Fix: one fresh generator write from
   the final inputs; --check then passed. Recurred once more after the
   DC-4 builder fix changed dataset-local-graph-registry.json (a cert
   input); same fix. Final DB digest df71e7d7…, 3,194 rows, --check PASS.
2. **White-glove landing pageMeta entry was first inserted into a wrong
   JSON script region** by a flawed regex (the freight entry ends
   `certificate.'},` — brace+comma — so the pattern matched a later
   `}\n`). Detected when pageMeta failed to parse; the misplaced entry
   was removed under a count assertion and re-inserted after the freight
   landing entry; pageMeta then parsed 224/224.
3. **DC-4 regression (this batch's re-run, pre-existing builder defect):**
   the B3 per-page builder emits creator/publisher as bare `{"@id": …}`
   refs; the live landing JSON carried the typed Organization form, so
   re-running the WS2-fixed builder for the hasPart fix silently
   regressed DC-4. Fix at the source: the builder now emits the full
   typed Organization (estate pattern) for creator + publisher in both
   its copies; regenerated file carries hasPart = 9 typed Dataset
   objects AND typed creator/publisher. Verified live by fetch.
4. **First local verify: 107/117 — 10 failures, all fixed in-window:**
   - Staged (phase-a) llms.txt lacked the White-Glove service name and
     the "224 clean canonical URLs" total → both applied to the staged
     copy the checks read.
   - rubric.db ancillary rows (canonical service row, attestation, R8
     crawlability gate row, R9 provenance gate row) are added per
     service in-batch, not by the generator → the four rows for
     service-white-glove were inserted on the freight pattern (counts
     now 30/30/30/30).
   - I-6 coverage 223/224: /military-government-moving/ lost every
     targeting row when both hubs repointed to their own pages. Fix:
     two EXTRA_PATTERNS rows in the generator ('military and government
     moving' → service-government; 'government and military moving
     services' → service-military, both targeting the shared page).
     Coverage is 224/224; 6 rows now target the page.
   - I-7 dangling links = 2: evidence attachments id 16 ('government
     movers', obs 217) and id 70 ('piano movers near me', obs 678) were
     attached 2026-10-31 to row identities whose targets the head-hub
     repoints retired. The era rule forbids attaching pre-rebuild
     evidence to the new hub pages (they did not exist in the
     2026-07-29→2026-10-28 window), so the two stale attachment rows
     were deleted from intent_row_gsc_evidence; the underlying
     observations remain in gsc_observed_queries, and meta + table agree
     at 13 attached queries / 102 evidence rows.
   - I-9 outcome/D8 reconcile: resolved by regenerating the intent
     dataset from the repaired DB and re-sealing.
   - PS-4: the office service-line retarget had also rewritten a
     per-page-JSON inventory line; restored that line's link to
     /commercial-office-moving-2/ (the page stays live as depth; only
     its canonical role moved) and added depth references for the
     shared pages on the government/military/final-mile llms lines.
5. **First full live verify: 148/149.** Two transient/external failures:
   the DataCite Commons search check (the dataset concept DOI
   10.5281/zenodo.23879048 was registered 2026-11-02T07:58Z; the
   canonical DataCite API record read directly at 09:44 UTC shows state
   "findable", resourceTypeGeneral "Dataset", HasVersion → …23879049;
   the Commons search endpoint returned HTTP 429 at probe time) and a
   PS-4 llms representation failure that did not reproduce. **Second
   full run on the unchanged estate: 149/149 GREEN** (log:
   /tmp/verify-full-2.log at run time; DataCite + PS-4 both PASS).
6. **Push error (coordinator's own, fixed in-window):** the ai-repo push
   set wrongly included `data/entity-graph.json` from the public tree,
   overwriting the gist-maintained file (protected blob
   cda897e61319a0f52172ef1365402e4d7179cddf) with the live graph
   (39f85117…). Caught on the read-back. Restored byte-exact from a
   blob-verified local archive copy (out/batch-founding/ai-fetch/) in
   commit adb16725…; read-back confirms the file is again at
   cda897e6…. `data/best-json-entity-graph.json` did not exist in the
   ai repo before this batch; the push created it as a new mirror
   (addition, not an overwrite) and it stays.

## RESULTS

- **FINAL SEAL: `80ef360262115da5668b978d4e5f405d892c03f1e63e7aff12b1b02bacaf1d38`
  — 523 distributions, gaps 0.** (Supersedes intermediate seals
  ab85e443…, 3bd80c12…, 3cab8d74… from the fixpoint loop.)
- **Closing gate: `node verify.js` FULL LIVE = 149/149 GREEN**
  (145 prior + §25 HH-1..HH-4; HH-4 live included). Local pre-gate was
  117/117.
- Step 0 provenance proof PASSED before any edit (staged shell =
  23,898,637 B; current shell = blog final 23,653,885 B /
  9768d137a…; head diff = exactly the 9 canonical repoints; page divs
  213 → 223 with only the 10 hubs added; the 4 existing-div diffs are
  the staged F6 fixes). Wholesale shell replacement was authorized and
  used; no re-base was needed.
- Counts (all reconciled from the registries, none hand-set): pages
  213 → **224**; services 29 → **30**; dataset files 38 → **39**;
  sitemap 251 → **263** locs (224 pages + 39 dataset files); signed
  distributions 500 → **523** (+23 = 10 hubs ×2, WG landing ×2, WG
  dataset file ×1); graphs 39/98 → **40/99** public nodes (machine best
  copy 95 → 96; the pre-existing 3-fragment lag — #service-final-mile,
  #service-piano-antique, #service-route81 — persists, not this batch's
  to fix); STATIC_FILES **571 measured** (counts audit derived 570; the
  manifest is generated from the tree itself, correct by construction).
- D-2 Dataset instances 362 → **367** (+4 WG landing embed, +1 intent
  coverage node embed; hub divs carry zero Dataset nodes).
- Intent rubric: 3,098 → **3,194 rows** (service-white-glove = 83);
  rows digest df71e7d7…; intent dataset 38 nodes.
- Deploy: Cloudflare Pages, 283 files uploaded, deployment
  https://64f1a845.the-flat-rate-movers.pages.dev, exit 0.
- Live verification: HH-4 passed inside the full suite (all 10 hub URLs
  200 + own-slug content); the 9 repointed canonicals resolve to the
  hubs; F6 re-fetched — /moving-company-martinsburg-wv/ carries
  Martinsburg's own name/hours/4.7-with-6-reviews and "Loading,
  Transloading & Container Services — Martinsburg WV" (no Winchester
  mislabel); /transloading-winchester-va/ renders full footprint 32 =
  GBP 17 (Bristow first) + extended 15.
- **hasPart validation (fetch-based):** served ai-sitemap.json contains
  NO `hasPart` key and carries `pages` (224 WebPage entries); served
  dataset-local-graph-registry.json Dataset node hasPart = exactly 9
  typed Dataset objects (scope, branches, records, coverage, reviews,
  collisions, gaps, owner-steps, totals) — zero bare strings, zero
  WebPage objects. Both GSC "Invalid object type for field 'hasPart'"
  findings are fixed on the served estate.
- API cadence: bundle refresh **46 files fetched, 44/44 digests
  matched** (services 30, datasets 39, intent rows 3,194); prose +
  test pins re-expressed (30/39/523/224); tests **51/51**; worker
  redeployed gated on the signed-index match — version
  **1eb4bf3c-e8ef-4cb4-9fc2-7f880c139dfd**. Live probes: /v1/services
  count = 30 including service-white-glove (graphId
  https://theflatratemovers.com/#service-white-glove); /v1/verify?file=
  white-glove-delivery.json → match: true.
- IndexNow: **HTTP 200** — 11 URLs submitted (the 10 hubs +
  /datasets/white-glove/).

## WHITE-GLOVE (Amendment #1)

**White-glove made a first-class service (30th) + full-footprint areas — owner decision 2026-11-02.**

- service-white-glove registered (services.json, head-graph node,
  canonical /white-glove-delivery/); the staged hub pack rebound from
  service-final-mile (final-mile pageCount back to 6; WG pageCount 4).
- Own dataset datasets-white-glove.json (8 nodes) + landing
  /datasets/white-glove/ at full treatment.
- areaServed = the FULL 53-place footprint in the estate's existing
  shapes: the 53 GeoJSON feature ids enumerated verbatim as
  `{"@id": "https://theflatratemovers.com/#<feature id>"}` (34 place-*,
  12 county-*, 7 landmark-* — the GeoJSON mints no place-* ids for
  county/landmark features; none invented), applied identically in the
  head-graph node, the hub per-page JSON and the dataset areas node.
- **Generator constraint flagged (not silently narrowed):** the rubric
  config uses BASE_ONLY 'both' (freight precedent) and NO GeoJSON
  capability token was added for white-glove, because
  service-area.geojson's SHA-256 is embedded in per-page JSONs and
  dataset distributions estate-wide — editing it would invalidate them
  all for a rubric-side effect. The full-53 claim lives in the schema
  shapes above. ai-sitemap carries no per-service areaServed
  (areaServedByBranch is estate-level); WG is implemented there as the
  services-list entry.
- **Sitting item (GBP not in this window): white-glove GBP service +
  product, both profiles.**
- Hugging Face cards for the WG dataset ride the NEXT release sync
  (noted, not done — per amendment).

## AMENDMENT #2.1 — Winchester 16 → 17 sweep

WG16 sweep found exactly 7 distinct wrong statements (S1–S7; S7 = the
S2/S3/S4/S6 content as rendered in llms-full + answer-evidence, both
regenerated). Fixed at source: S1 datasets-transloading-winchester.json
@graph[7] + its two shell embeds (resynced from the corrected file);
S2 route81 coverage-table parenthetical (Bristow added; list verified
2026-10-30); S3 gun-safe Q&A "lists of 16 and 14" → 17 and 14 (×3);
S4 FAQ "16 published service areas from Winchester" → 17 (×3) + the
shared FAQ answer in main.js (both copies); S5 best-movers guide → 17
with Bristow first; S6 moving-and-storage branch list → (Google
Business Profile, 17) with Bristow. Adjacent stale arithmetic in the
same blocks: "(full footprint, 31)" → 32 (×6) and "Extended footprint
(16 more)" → "(15 more)" with Bristow removed from the extended lists
(×24) — 17 GBP + 15 extended = 32, arithmetically true. Generator
sources fixed: descriptions.json (×2), build-phase3-full.js,
build-phase3-corridor.js, build-datasets-ocean.js (52 → 53 features,
31 → 32, GBP 16 → 17), build-planner.js.
**Legitimate 16s deliberately untouched, with reasoning:** the
GeoJSON's dated 2026-10-27 attestation ("GBP service areas: 16
Winchester…" — true when made, superseded in the same file by the
2026-10-30 Bristow attestation) and its 2026-10-29 change-log entry;
dated 2026-10-29 formulation documents (pre-Bristow); the "(Winchester
16, Martinsburg 14)" attestation prose inside build-phase3-full.js's
historical page templates (dated statements about the 2026-10-28
confirmation); all out/** backups/snapshots; unrelated 16s (16:00
closings, MH16.1, coordinates, 1600/1650-lb weights, favicon-16x16).
HF mirror copies carrying S1 + evidence quotes ride the next release
sync, same as the WG cards.

## AMENDMENT #2.2 — FTZ correction (verdict: NOT CORROBORATED — REFUTED)

Finding: FTZ 185 is the **Culpeper** zone — grantee County of Culpeper
(FTZ Board Order No. 1677, 75 FR 24571, 2010; the OFIS Zone 185 record
lists only Culpeper-area sites + the Merck Elkton subzone). The
Virginia Inland Port is not a site/subzone of #185 in any term. What
covers the Inland Port's ground: **FTZ 20 (grantee: Virginia Port
Authority)** — its Federal Register application (Docket B-34-2013,
78 FR 24157) lists "Site 7 (490 acres)—Warren County Industrial
Corridor, Routes 340, 522 and 661, Front Royal"; under that ASF
reorganization Site 7's parcels became Sites 7 and 27–31, magnet sites
7, 28, 29, 30, 31. Warren County additionally lies inside FTZ 185's
ASF **service area** (service area ≠ site designation — the likely
origin of the error).
Correction applied on all three surfaces (dataset source
datasets-transloading-inland-port.json — taxonomy, facility and
compliance sentences + keywords + a `citation` array carrying the OFIS
Zone 185 record (ofis.trade.gov/Zones/Details/220) and 78 FR 24157;
the category page div + its per-page JSON FAQ; the live article
/transloading-at-the-virginia-inland-port/ div + its per-page JSON;
the explainer page div; shared FAQ sentences ×5; the dated llms.txt
and data-txt entry clauses corrected in place), phrased strictly as a
PORT fact at the strength the sources support: "the Virginia Inland
Port sits in the Warren County Industrial Corridor covered by FTZ 20
(Port of Virginia, grantee) magnet sites, and Warren County
additionally lies within FTZ 185's service area." Residual "Foreign
Trade Zone #185" strings in the shell exist only inside the
answer-evidence embed (regenerated by the seal from the corrected
sources).

## DECISIONS RECORDED

- **P-6 ABSORPTION:** the blog batch closed 144/145 with sole miss P-6
  (parent shell mirror + answer-evidence mirror uploads). This batch's
  seal supersedes both: the NEW sealed shell and the regenerated
  answer-evidence are this batch's flagged upload pair (below), so P-6
  closes on the new seal 80ef3602…; the full suite's P-6 check passes
  in the 149/149 run.
- **build-perpage-json.py promotion into scripts/ DECLINED:** the WS2
  fixed copy stays at its B3 work path (patched in place, both copies).
  Promoting it would add a new sealed code distribution and break the
  +23 distribution arithmetic.
- Finding (c) (repo-dir/answer-engine.json Question ×7, GitHub-only)
  was NOT touched — outside this window, per brief.

## FLAGGED FOR PARENT WEB UPLOAD (over the ~5.8 MB connector ceiling — never silently skipped)

1. Machine repo `code/site-shell/index.html` ←
   `~/workspace/the-flat-rate-machine/repo-dir/index.html` —
   **24,688,315 bytes**; local SHA-256
   `c4a0d4a937413826469b52a75f9ac7c482ad655994de5d88881a6f00fe42d46d`
   (the sealed shell of seal 80ef3602…).
2. AI repo `data/datasets-answer-evidence.json` ←
   `~/workspace/the-flat-rate-movers-pages/public/datasets-answer-evidence.json` —
   **8,214,903 bytes**; local SHA-256
   `ae40f880499eb67a7842ea360cc8ec8ddbdc39584186fb3d0deb8ab9652d9b3d`.
3. AI repo `data/datasets-crawl-presence.json` ←
   `~/workspace/the-flat-rate-movers-pages/public/datasets-crawl-presence.json` —
   **7,708,560 bytes**; local SHA-256
   `042dfa089e24c53b4636ccfd722f65ea1a0173421b59aa9d03a8f2ca72fef6b0`
   (regenerated by this batch's seals; also over the ceiling).

## GSC NOTE

The 10 hub URLs + /datasets/white-glove/ are queued for the next GSC
pass. The booked 2026-11-02 09:40 pass was NOT edited; its new-pages
sweep will catch them.

## PUSHES

Pre-push key-content grep = 0 across both push sets.

- **AI repo (TheFlatRateMovers/theflatratemovers-ai), 3 commits:**
  `1f71f2918ad441eb4ddb027841abded233d81090` (56-file set split after a
  first 413: root llms.txt / ai-sitemap.json / data txt, data/ index +
  JWS + datasets, schemas/ 13 per-page JSONs incl. the 10 hubs,
  dataset-white-glove.json and dataset-local-graph-registry.json);
  `45393a1547647bd6a8f525b92a7cf514082a4a4c` (search-index +
  archive-registry datasets); `adb16725e0f73ba9e5e2c9d178c7a5cdd3499713`
  (gist entity-graph restore — see error 6). Read-backs by git blob
  SHA: ai-master-index.json 76e5df2b… == local; entity-graph.json back
  at cda897e6… (protected gist blob).
- **Machine repo (TheFlatRateMovers/the-flat-rate-machine), 1 commit:**
  `c1bb6bf5ce64f510005e600b9638342dfffccf5e` (verify.js, registries,
  graphs, scripts, head-data + middleware, phase-a copies, this
  record). Read-back: verify.js blob 571cf405… == local.
- This record's pushes section was completed in a follow-up commit
  carrying the final record text.


## CORRECTION ADDENDUM — the true closing tally (supersedes the 149/149 statements above)

The Results section and error #5 above state a 149/149 GREEN close.
That was wrong: the coordinator acted on a mangled completion delivery
for the first full verify run. The run's own log, delivered late after
a runtime restart, shows the true sequence:

- **Full run 1: 148/149** — sole FAIL **P-6** (20/27 repo-served
  digests matching), naming the Site Shell, _middleware.js,
  head-data.js, verify.js, build-intent-rubric.js, build-routes.js and
  route-assets/main.js: the GitHub mirrors lagged the new seal (five
  were covered by push c1bb6bf5… but that run's fetches raced the
  push; two — build-routes.js and route-assets/main.js — had not been
  pushed at all).
- P-6 completion pushes: `db0082ed…` (build-routes.js D-2 pin +
  route-assets/main.js — same byte size, different digest) and
  `6ca347ee…` (repo _middleware.js mirror synced to the sealed
  repo-dir twin, 29,515 B; the first push had carried the deployed
  Pages-functions twin, 29,488 B — the twins differ by exactly one
  STATIC_FILES line, "/routes-manifest.json", present in the sealed
  copy; the deployed functions copy is live and passes every route
  check, and a future deploy from the sealed tree carries the line).
- **Full run 2 (post-push): 148/149** — P-6 at 25/27, naming the shell
  + the middleware twin.
- **FINAL full run: 148/149 — sole FAIL P-6, naming ONLY the Site
  Shell** (served 23,353,941 B vs sealed 24,688,315 B), i.e. exactly
  the flagged parent web upload #1 below, mirroring the blog batch's
  closing state (144/145, sole miss P-6). Every other check passes
  live, including DataCite and PS-4 (run 1's DataCite/PS-4 lines were
  transient and did not recur in any later run).
- The P-6 ABSORPTION note above therefore reads precisely: P-6 closes
  to the single flagged shell upload on the new seal 80ef3602…; it
  completes when the parent uploads flagged file #1, exactly as the
  blog batch left it.
