# BATCH BRISTOW — DEPLOY REPORT (2026-10-30)

Owner ruling 2026-10-30: Bristow, VA is SERVED, assigned to the WINCHESTER
branch (closest). Before this batch Bristow appeared nowhere in the estate
(every prior batch enforced Bristow = 0). Deployed under standing
authorization (checks -> deploy -> GitHub in one motion). Pages deployment
2b09a994 (89 files uploaded).

## The fact
- Bristow, VA — unincorporated community, Prince William County, ZIP 20136.
- Coordinates 38.73258, -77.54573 via map geocoding 2026-10-30 (city-level
  match, relevance 100; the Census address geocoder returns no match for a
  bare place name, as expected — it geocodes street addresses).
- GeoJSON feature place-bristow-va, Point [-77.54573, 38.73258], branch
  "winchester", gbp_service_area FALSE — Bristow is NOT one of the 16 GBP
  Winchester areas; no copy anywhere claims GBP status for it. Feature
  mirrors the Front Royal expansion-place structure (rubric_score 2 +
  rubric_note), inserted after place-woodstock-va.

## Counts (before -> after)
- GeoJSON features 52 -> 53; Winchester footprint 31 -> 32 (GBP 16 +
  extended 15 -> 16); Martinsburg 35 (unchanged); shared 14 (unchanged).
- Route 81 coverage entries 66 -> 67 (Winchester 32, Martinsburg 35);
  union == GeoJSON feature id set (53) and intersection == 14 re-proven
  programmatically. Bristow entry at position 20 (after Woodstock),
  positions renumbered 1..67.
- Rubric DB: service_area Winchester rows 31 -> 32 (Bristow row added,
  source = GeoJSON footprint adopted 2026-10-30, owner ruling);
  attestation 236 -> 238 (Bristow addition + propagation records);
  integrity ok. Backup: backup/rubric.db.before-bristow.
- Sitemap lastmod: 124 URLs -> 2026-10-30 (evidence: changed per-page
  JSONs + changed page divs, computed by per-div diff); distribution now
  124 @ 2026-10-30, 21 @ 2026-10-29, 11 @ 2026-10-28. data/pages.json
  lastmods synced for the same 124 slugs.

## Propagation (all surfaces)
1. service-area.geojson — site + machine data/ + theflatratemovers/
   mirror, byte-identical trio (md5 a2a5f463…); version/dateModified
   2026-10-30.
2. Both machine graphs (site + machine data/ + theflatratemovers/
   mirrors + ai-repo -full mirrors): Winchester Place areaServed +
   Bristow (alphabetical string lists; the best graph's @id-ref list
   gained the string "Bristow, VA" after the Berryville @id entry);
   printed counts updated (entity-graph attestation claims + edge label
   + rubric check text, best graph _humanSummary). Gist
   data/entity-graph.json untouched (see HEADs).
3. Head graph in index.html (Winchester areaServed + Bristow,
   alphabetical) — the only JSON string list in the shell.
4. ai-sitemap.json areaServedByBranch.winchester + Bristow (after
   Woodstock, branch order) + counts; phase-a staged copies updated in
   the same motion (ai-sitemap, entity-graph x7 service lists, best
   graph x7 service lists, llms.txt, ard.json).
5. llms.txt: current-state lines 26 (Route 81), 50 (GeoJSON: 53
   features, 32 cities), 57 updated in place; dated 2026-10-30 Bristow
   entry appended to the updates list. Dated historical entries (lines
   105, 119, 177-219) left byte-identical by design.
6. the-flat-rate-movers-data.txt: line 169 (footprint) + line 285
   (corridor coverage discipline) updated; dated Bristow section
   appended. Dated merge records (256, 260) untouched.
7. Winchester enumerations estate-wide: 74 Winchester footprint lists
   verified at 32 with Bristow (55 site JSONs incl. per-page JSONs for
   every page carrying the list, areas-served.json, both graphs,
   ai-sitemap; machine data graphs + locations.json serviceAreaFull;
   phase-a staged graphs). 94 Martinsburg lists verified clean at 35 —
   Bristow in zero Martinsburg/shared lists. GBP-only lists (16/14, org
   GBP union of 30, locations.json serviceArea) verified unchanged.
8. Page prose: in-depth alphabetical enumerations + Bristow (83
   Berryville-prose + 29 Woodstock-prose insertions); "Where we serve"
   blocks: "Extended footprint (15 more)" -> "(16 more)" x12 with
   Bristow inserted after Woodstock; counts phrases updated (index.html
   x218, head-data.js x130 — and head-data.js REGENERATED with the
   Batch 9 generator: byte-identical to the edited file, 156 entries).
9. Datasets: counts phrases updated in 23 of 25 dataset files (packing
   + videos carry no footprint counts — byte-identical, digests
   unchanged); datasets-route81.json coverage node as above; every
   changed file's dateModified restamped 2026-10-30. Index.html dataset
   embeds kept parse-equal to their standalone files (map of 34 blocks
   verified identical pre/post, incl. the 3 route81 embeds transformed
   structurally).
10. Developer/data surfaces: ai-catalog.json (site + .well-known +
    ai-repo root variant) and .well-known/ard.json geojson descriptions
    updated to 53 features; ai-repo data/footprint.json counts
    (53/32/16) + winchesterFootprint + areas record for Bristow.

## Re-sign (mandatory, same batch)
digest-index.py re-ran: 35/35 complete, 0 gaps. Exactly 29 digests
changed (ai-sitemap, both graphs, ai-catalog, llms, geojson, 23
datasets); unchanged: capabilities matrix, answer engine, predictive
query map, authority index, packing datasets, videos datasets.
Index top-level dateModified stamped 2026-10-30; sign-index.py
re-signed (kid theflatratemovers-2026-10-29-1, canonical 16,601 B).
Local verify-provenance: PROVENANCE OK. Post-deploy public-only run
against live-fetched artifacts: PROVENANCE OK, 35/35 digests match
live bytes.

## Gates
- verify.js: pre-deploy 79/81 (only the 2 live-dependent checks red —
  documented transient); post-deploy 81/81 PASS.
- node --check: both executable inline scripts pass; head-data.js
  syntax ok. Quote-form segment md5 unchanged
  (4d8d49f05b22b129eac623a41370d9cb, gates.py definition).
- Router gate: no new page; router array 156 == head-data entries 156
  == sitemap 156.
- Live spot checks: /, /moving-company-winchester-va/, /areas-served/,
  /route81/, /gun-safe-movers-winchester-va/,
  /specialized-workforce-labor/, /interstate-66-corridor/ — all 200
  with their own titles; live GeoJSON 53 features; live Winchester
  per-page JSON contains Bristow.
- Forbidden sweep: Bristow in Martinsburg lists = 0; GBP claims for
  Bristow = 0 (gbp_service_area false everywhere); no "attested" added
  to public copy (the word survives only as a pre-existing field name
  in ai-repo footprint.json's per-area records, kept for schema
  consistency); Spearman/Around Town = 0; no quote tests.

## Deviations / dispositions
- (c) CORRECTED during build: the best graph's Winchester areaServed
  (site + machine copies) is an @id-ref list whose string items carry
  no Winchester-only place names, so the first structural pass (and a
  first verification pass built on the same markers) missed it; caught
  by the @id-ref rescan, fixed by direct insertion after the
  Berryville @id entry, and the verification suite was rewritten to
  cover @id-ref lists (74 lists now proven).
- (c) CORRECTED during build: first index.html pass restamped
  dateModified in ALL dataset embeds, breaking parse-equality with the
  UNCHANGED datasets-packing.json; index.html restored from the batch
  backup and re-run with the restamp scoped to embeds of files changed
  in this batch. Final embed equality map: identical pre/post.
- (b) ALREADY SATISFIED, verified: locations.json GBP serviceArea
  lists (16/14) need no Bristow (not GBP); its serviceAreaFull
  Winchester list DID need it and was updated (found by the corrected
  rescan). Phase-a entity-graph.generated.json @graph[1] is a GBP-only
  list (16) — correctly untouched.
- (b) The ai repo holds no service-area.geojson (404 at root and
  data/); its footprint counterpart is data/footprint.json, updated.
  The signed geojson distribution resolves to the site + machine
  copies, which are byte-identical.
- Note: footprint.json's per-area schema field is named "attested"
  (all 53 records) — a field name in the file's established schema,
  not copy; retained unchanged for schema consistency.

## HEADs
- Site: Pages deployment 2b09a994 (the-flat-rate-movers).
- ai: 5cf48b78 -> 881c0bc4d3426586d3deeb49e7bb379aad56c723 (32 files;
  read-backs md5-match on llms.txt, ai-catalog.json,
  data/footprint.json, data/datasets-route81.json,
  data/entity-graph-full.json, data/ai-master-index.jws).
- machine: 39c8517b -> (this push; read back at deploy).
- Gist data/entity-graph.json blob SHA re-confirmed at the new ai
  HEAD: cda897e61319a0f52172ef1365402e4d7179cddf (2,486 B, untouched).
