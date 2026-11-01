# Verify-fix record — Freight Rework & Transloading category batch, 2026-11-01

Batch: out/batch-freight-rework-transloading-2026-11-01. New service
service-freight-rework-transloading; pages 210 -> 212; services 28 -> 29;
dataset files 37 -> 38; signed distributions 492 -> 497; intent rows
3,018 -> 3,096 (+78: 77 hub rows + 1 dataset-landing row).

## Checks re-expressed STRICTER in this batch (never weakened)

1. build-routes.js D-2 instance pin 353 -> 362 (both copies, byte-identical):
   +8: the Dataset nodes of datasets-freight-rework.json embedded in the
   hub and landing route documents (4 Dataset-type nodes x 2 docs); +1:
   the new service's Dataset-typed coverage node embedded in the intent
   landing route document after that div's embed was re-synced to the
   current 37-node intent dataset (see below).
2. verify.js D-2 (both copies): shellCountD pin 353 -> 362 and route-document
   count 210 -> 212; check name updated to "all 212 route documents".
3. verify.js P-5: per-page JSON count 210 -> 212; distribution count
   492 -> 497; check name updated. (The 497th distribution is the landing
   per-page JSON dataset-freight-rework.json, added after D-1 required it.)
4. verify.js I-9: intent dataset node frame 36 -> 37 (the new service's
   coverage node #intent-coverage-freight-rework-transloading); name updated.
5. verify.js L-4: name/comment updated 28 -> 29 service names (the check
   itself is registry-driven and was already dynamic).

## Defects found by the suite in this batch and fixed in the data

- DC-2: the new dataset's non-Dataset nodes carried plain distributions
  typed "@type": "DataDownload" without sha256. Estate pattern (junk /
  transloading files): plain distribution entries are UNtyped. Builder
  fixed; dataset rebuilt.
- DC-4: Dataset nodes' publisher was an untyped {"@id"} reference. Estate
  pattern: publisher is the full typed Organization. Builder fixed.
- I-6 coverage 211/212: the dataset landing's R13 row was gate-excluded
  while dataset-freight-rework.json was not yet a signed distribution;
  adding the distribution (497) and regenerating produced the row
  ("freight rework datasets", awaiting-observation). Coverage 212/212.
- routes-manifest.json (a build-routes staging artifact) had been rsynced
  into public/; removed, and the batch's reseal loop deletes it after every
  install. It is not a distribution and is not deployed.
- DC-2 (intent landing embed): the shell's datasets-intent-coverage div
  still embedded the pre-batch 36-node intent graph, whose DataDownload
  sha256 values for the other dataset files went stale when this batch's
  digest cascade changed those files. The embed was re-synced verbatim to
  the current 37-node datasets-intent-coverage.json @graph.
- S-4: datasets-videos.json carries no node dateModified; the composed
  sitemap now falls back to the dataset landing page's registry lastmod
  (2026-10-30) for such files instead of emitting an empty value.
- Staged ai-sitemap keywords: out/phase-a/ai-sitemap.json is the build-ai
  generator's staged variant (keywords = service names); it was refreshed
  by running scripts/build-ai.js and staging its generated output
  (services 29, hasPart 212, keywords 29 names) rather than copying the
  public file, whose keyword scheme differs.
- Staged copies synced in the same motion: out/phase-a/ai-sitemap.json and
  out/phase-a/llms.txt (registry totals 212; new service line added);
  ~/workspace/theflatratemovers/{entity-graph,best-json-entity-graph}.json
  re-synced byte-identical to the machine data copies (new Service node).
- rubric.db: canonical service row + service attestation + R8 crawlability
  and R9 provenance gate attestations inserted for the new service
  (28 -> 29 on all four counts the suite asserts).

## Reseal fixpoint

Digest->sign iterated to a stable index SHA-256 across two consecutive
full rounds: 4b2052164f6991de93fa6ffee7d2f492c85f81dfb8bf9a7b95e46fb85c2650ed
(497 distributions, 0 gaps). An intermediate round briefly lost the 497th
entry when the loop's sign step installed the previous digested index over
the staged one; the entry was seeded into the digested index itself and
the loop re-converged — recorded here so the pattern is not repeated.
