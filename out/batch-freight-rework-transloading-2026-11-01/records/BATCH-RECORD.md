# BATCH RECORD — Freight Rework & Transloading category build, 2026-11-01

New category, full Machine treatment. Dossier:
~/workspace/theflatratemovers/retrieval-machine/category-freight-rework-transloading/DOSSIER.md
(33 buyer titles; question universe in 6 groups; competitors live-searched
2026-11-01; every gap carries its designed solution).

## Errors first — each found in-batch and fixed in the same motion

1. Head-graph node over-escaped on first insertion (literal \n / \"
   sequences) because the head @graph region is plain JSON. build-llms-full
   failed parsing it; the block was replaced with the plain-form node and
   all routes were regenerated from the fixed shell.
2. Rubric generator "no HUB configured", then zero rows ("graph-node-
   missing"): fixed by extending the generator's HUB/PHRASE/DATASETS/
   BASE_ONLY/BRANCH config maps for the new service and adding the Service
   node to the machine data graph copies the generator reads.
3. Landing slug initially written in dash form in pages.json; corrected
   to the slash form datasets/freight-rework used by every dataset landing.
4. DC-2 failure: the new dataset's non-Dataset nodes carried plain
   distributions typed DataDownload without sha256. Estate pattern is
   UNtyped plain entries; builder fixed, dataset rebuilt.
5. DC-4 failure: Dataset nodes' publisher was an untyped {"@id"} ref;
   estate pattern is the full typed Organization. Builder fixed.
6. Verify run 1 (pre-deploy): 119/144 — the failures were the live-state
   items cured by deploy plus items 4, 5, 7–10 here.
7. routes-manifest.json (build staging artifact) was rsynced into
   public/; removed, and the reseal loop now deletes it after every
   install. It is not a distribution and was never deployed.
8. Reseal loop briefly LOST the 497th distribution: the loop's sign step
   installed the previous digested index over the staged 497-entry index.
   The landing per-page JSON entry was seeded into the digested index
   itself; the loop re-converged. (Pattern recorded in the verify-fix
   record so it is not repeated.)
9. I-6 coverage 211/212: the dataset landing's R13 row was gate-excluded
   until dataset-freight-rework.json became a signed distribution; after
   the entry landed, regeneration emitted the row ("freight rework
   datasets", awaiting-observation). Coverage 212/212; rows 3,096.
10. Intent landing embed stale: the shell's datasets-intent-coverage div
    embedded the pre-batch 36-node intent graph with stale DataDownload
    digests (DC-2). Embed re-synced verbatim to the current 37-node file.
11. S-4: datasets-videos.json has no node dateModified; the composed
    sitemap now falls back to the dataset landing's registry lastmod
    (2026-10-30) instead of emitting an empty value.
12. Staged ai-sitemap: out/phase-a/ai-sitemap.json refreshed via the
    build-ai generator's staged output (services 29, hasPart 212,
    keywords = 29 service names) — not by copying the public file, whose
    keyword scheme differs.
13. API test totals re-expressed (28/37/492 -> 29/38/497) in
    api-worker/test/run-tests.mjs; suite 51/51 after the update.
14. build-routes D-2 pin: the literal sits inline at line 370, not in the
    named constant an earlier edit targeted; corrected in both copies.

## What shipped (all live and verified)

- Hub: https://theflatratemovers.com/freight-rework-transloading/
  (200, own content, baked per-page JSON, 14 FAQs, both branch cards).
- Dataset landing: https://theflatratemovers.com/datasets/freight-rework/
- Dataset file: https://theflatratemovers.com/datasets-freight-rework.json
  (41,276 B, SHA-256 e51e126f8dbd787e5e176ebaf6022ac4f51e06bba9e41a42c710b11add8acb9a;
  8 nodes at ocean depth: operations, process chain, taxonomy, corridor &
  network chain, commercial terms, buyer personas, compliance & handling,
  areas/dispatch/quote).
- Per-page JSONs: freight-rework-transloading.json (16,615 B),
  dataset-freight-rework.json (10,518 B).
- Registry: services 28 -> 29 (service-freight-rework-transloading);
  pages 210 -> 212; dataset files 37 -> 38; sitemap 250 locs.
- Full propagation in the same motion: head graph node, both public
  graphs (39 / 98 nodes), machine data graph copies, ai-sitemap (29
  services, 212 hasPart), llms.txt, llms-full regenerated (497
  distributions stated), data txt, Developer card, services hub,
  datasets hub, all-pages chips, sitemap listing, head-data entries
  (212), middleware STATIC_FILES (545), cross-links from the
  transloading children (container-deconsolidation hub, Virginia Inland
  Port page, transloading-winchester, warehouse-relocation + two new
  Related-pages sections), phase-a staged copies, rubric.db canonical
  service row + attestation + R8/R9 gate rows (29 each).
- Intent rubric: regenerated 2026-11-01 — 3,096 rows (was 3,018; +78).
  New pages stand as awaiting-observation; era rules observed (GSC
  overlay unchanged in kind: 15 queries, pre-rebuild era).
- Registry datasets regenerated: search-index (2,288 query clusters,
  212 URL-supply rows), answer-evidence (3,095+1 questions; 2,243
  fragments; answer-UI citation standing remains UNMEASURED — no panel
  run has occurred), local-graph (6 owner steps), archive-registry.
- Certificate: digest->sign iterated to a fixpoint — final index
  SHA-256 0ae48cfc0b001489767d793aa0853a28fe5dfd6c76f4b4f78fa458a3130dd2d0,
  497 distributions, 0 gaps; JWS signed with kid
  theflatratemovers-2026-10-29-1.
- Deploys: Cloudflare Pages x2 (final https://68808649.the-flat-rate-movers.pages.dev);
  API worker flat-rate-estate-api version f8d3dab4-cef8-408a-97e0-ce913469f227
  after refresh-bundle reported signed-index digest matches 43/43
  compared; tests 51/51; live /v1/index = 497, /v1/services = 29 with
  the new service, /v1/verify?file=datasets-freight-rework.json match:true.
- Verify: 143/144 at this writing — the single open check is P-6
  (GitHub-served copies), closed by the pushes below + the parent's
  shell upload. Full detail: out/verify-fix-2026-11-01-freight-rework.md.

## Pushes (one per repo, back-to-back; pre-push key-content grep = 0)

- ai repo (theflatratemovers-ai): root llms.txt, llms-full.txt,
  ai-sitemap.json, the-flat-rate-movers-data.txt; data/ ai-master-index
  .json + .jws, entity-graph-full.json, best-json-entity-graph-full.json,
  datasets-freight-rework.json + 27 changed datasets-*.json;
  schemas/ freight-rework-transloading.json, dataset-freight-rework.json,
  dataset-intent-coverage.json. (data/entity-graph.json — the 2,486 B
  gist-based file — NOT touched.)
- Machine repo (the-flat-rate-machine): verify.js, scripts/
  build-routes.js, scripts/build-intent-rubric.js, code/pages-functions/
  head-data.js, data/services.json, data/pages.json, data/entity-graph
  .json, data/best-json-entity-graph.json, out/verify-fix-2026-11-01-
  freight-rework.md, this record.

## Parent-upload flags (over the ~5.8 MB connector ceiling)

1. Machine repo code/site-shell/index.html — 23,347,357 B, SHA-256
   (from the final signed index) — see close-out report for the value.
2. AI repo data/datasets-answer-evidence.json — size + SHA-256 from the
   final signed index — see close-out report.

## GBP products — PREPARED for the parent (browser route)

Add one product to EACH profile (Winchester "The Flat Rate Movers" and
Martinsburg "Flat Rate Movers Martinsburg WV"):
- Name: Freight Rework & Transloading
- Price: none
- Link: https://theflatratemovers.com/freight-rework-transloading/
No other fields. (Same pattern as the 2026-10-30 takeover products.)

## Indexing queue entries (for the 2026-11-02 09:40 EST GSC pass)

- https://theflatratemovers.com/freight-rework-transloading/
- https://theflatratemovers.com/datasets/freight-rework/
(Recorded here per the batch instructions; no GSC pass run in this batch.)

## Archive cadence entries (E6-B3 list; no wave run in this batch)

- https://theflatratemovers.com/freight-rework-transloading/
- https://theflatratemovers.com/datasets/freight-rework/
- https://theflatratemovers.com/datasets-freight-rework.json
(The archive registry's target table is a seed baked into its generator
at the E6-B2 generation; these URLs join the target table at the E6-B3
generation.)
