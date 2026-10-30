# Batch Intent Rubric — record (2026-10-30)

Builds and deploys the GENERATIVE INTENT-COVERAGE RUBRIC Henry
ordered 2026-10-30: a database-style, certificate-sealed, live rubric
that maps the strings users actually search and ask — for every
service the company offers — to the exact page, per-page JSON, dataset
and graph node that answers them, so the estate presents one clear,
citable answer per intent to search and AI overviews.

## What shipped

- **Generator** — `scripts/build-intent-rubric.js` v1.0.0 (Flat Rate
  Machine). Generates every row from the registries (services.json,
  pages.json, locations.json, corridors.json, service-area.geojson)
  plus the blog question bank (10 categories × top-10 phrasings).
  Rows are never hand-typed; hub slugs, branch-page slugs, query
  phrases, the GeoJSON-capability → service map and the
  question-bank → service map are generator configuration, validated
  against the registries at run time. Modes: build (DB + dataset +
  audit files) and `--check` (regenerate in memory, compare to DB).
- **Database** — the working rubric DB (`../theflatratemovers/
  rubric.db`) gains table `intent_query` (1,134 rows: query_text,
  intent_class, service_id, area, target_url, target_json,
  dataset_ids, graph_node, cert_target_json_sha256,
  cert_dataset_digests, the three coverage gates, generated_at,
  generator_version) and `intent_meta` (rows digest, counts, kid).
  All pre-existing tables/rows untouched (attestation 250, rubric
  gates R1–R9 intact; integrity ok).
- **Public dataset** — `datasets-intent-coverage.json` at the site
  root (85,463 B, 32 nodes in the D1–D8 house style: operations,
  scope, taxonomy, resolution + gates, method, sources, boundaries,
  totals/areas/certificate — plus 24 per-service coverage nodes
  linking each service @id, hub page, per-page JSON and dataset
  files). Certificate blocks on D1/D8 reference the signed index +
  kid theflatratemovers-2026-10-29-1. No invented data; no ratings,
  prices or claims in the dataset; the word "attested" appears
  nowhere in it.
- **Propagation** — ai-sitemap.json (site + phase-a copy) gains the
  dataset as a distribution entry; llms.txt (site: Machine-Readable
  Data line + dated Update section; phase-a: data line) and
  the-flat-rate-movers-data.txt (dated entry) carry it. Index.html
  NOT touched (sha256 b0c5e5d1… before and after; quote-form segment
  md5 therefore unchanged at 4d8d49f05b22b129eac623a41370d9cb; router
  162 == 162 untouched).
- **Middleware** — STATIC_FILES manifest 254 → 255 (the new dataset
  path, in sorted position); unit suite extended 20 → 21 cases, all
  pass, including the new file's pass-through and a still-genuine 404
  for unknown paths.

## Generation rules (as built; the generator header is canonical)

- R1 Footprint: place strings use the service's real footprint — the
  GeoJSON branch/city/county features whose capability list maps to
  the service. Services with no GeoJSON capability mapping generate
  place strings for their branch base cities only (the Winchester
  transloading service: Winchester only); no wider per-area record
  exists in the estate data and none was invented.
- R2 "{phrase} {Area}" per (service, footprint area) — target: the
  serving branch's branch page when the estate has one, else the hub.
- R3 "{phrase} near me"; R9 bare "{phrase}" — hub.
- R4 "{phrase} I-81/I-66/I-70" for corridor-applicable services —
  corridor page when it is in the service's page set, else hub.
- R5 cost ("how much do/does {phrase} cost in {scope}", "{phrase}
  cost in {scope}"), R6 how-process ("how to hire {phrase} in
  {scope}", "how to book {phrase}"), R7 best-choice ("best {phrase}
  in {scope}", "top rated {phrase} in {scope}") — scopes Winchester,
  VA / Martinsburg, WV / the Shenandoah Valley; branch scopes target
  branch pages when they exist. Rows carry no prices.
- R8 ai-question: the question bank's 100 phrasings (category 9 split
  per question between transloading and the workforce service),
  American-spelling normalized, targeting the hub — or the question's
  own page when its slug is a page of the service (e.g. "Do movers
  pack for you?" → /do-movers-pack-for-you/) — plus one generated
  phrasing per service ("what should I ask before hiring {phrase}").
- R10 Gates: a row exists only if its target page is in pages.json,
  the per-page JSON file exists in the deployed tree, and the target
  JSON + every backing dataset are distributions in the signed index
  (their digests are copied into the row). Failures are excluded and
  counted — never pointed at a fallback.
- R11 Dedupe on (query_text, service_id).

## Counts (generator run of 2026-10-30)

- **Rows: 1,134. Excluded: 0** (every candidate passed all gates; the
  one build-time fault found and fixed forward was the branch-page
  resolution: an early slug heuristic briefly picked a nested
  category page as a "branch page" for transloading and 23 rows
  gated out on its missing JSON — replaced by the explicit,
  registry-validated BRANCH configuration and regenerated clean).
- Per intent class: navigational-local 626; cost 144; how-process 96;
  best-choice 144; ai-question 124 (100 question-bank + 24 generated).
- Per service (rows): final-mile 78, packing 78, government 75,
  industrial-offices 75, military 75, transloading 75,
  industrial-commercial 71, crating 66, commercial 65, office-moving
  65, residential 65, ispm15 66, route81 34, piano-antique 31,
  local-regional 24, long-distance 24, gun-safe 21, it-relocation 21,
  junk-removal 21, moving-and-storage 21, senior-moving 21,
  sir-heavy 21, warehouse-relocation 21, transloading-winchester-va 20.
- Canonical rows SHA-256: 38c84749f035d4a40b314d7d18523b01a6a852024eb
  504fd78611a3d1cbfae69 (stored in intent_meta and in the dataset's
  totals node). Question bank: 100 parsed, 100 mapped.
- Graph nodes: 21 services resolve to their canonical #service-*
  root fragment; piano-antique and final-mile resolve to their
  Martinsburg branch-page Service nodes; route81 resolves by exact
  name match to the I-66 corridor Service node (no Service node
  exists on the route81 page itself) — the documented fallback order.

## Seal (set-diff asserted before signing)

- Exactly **1 added** distribution (datasets-intent-coverage.json,
  SHA-256 bdabfae3ba0bbfd3bd8e244b9ab77109fc88f127374dc15c4b1a91c14
  ea1fc72, 85,463 B) and exactly **4 digest-only changes**
  (ai-sitemap.json, llms.txt, _middleware.js, verify.js); 0 removed,
  0 gaps, top-level index fields unchanged; distributions 209 → 210.
- Row-certificate invariant asserted at seal time: all 1,134 rows'
  target-JSON and dataset digests are identical in the re-sealed
  index (the batch does not edit any row-target file).
- Signed from the custody key only (kid theflatratemovers-2026-10-29-1;
  canonical 90,628 B). Pre-push key-content grep across all push
  payloads: 0.

## Gates

- verify.js extended in the same motion (record
  out/verify-fix-2026-10-30-intent-rubric.md): P-5 exact totals
  209 → 210, plus new section 13 (I-1..I-5: generator re-run
  byte-identical; every row target ∈ pages.json with gates all 1;
  every row target JSON + dataset ∈ served signed index; published
  dataset counts/digest == DB; live dataset serves application/json
  with the DB digest). Suite 83 → **88**.
- Pre-deploy run: 85/88 — exactly the three live-state failures
  (P-5, I-3, I-5) the deploy cures. Post-deploy + post-push run:
  **88/88 — VERIFY OK**.
- PROVENANCE OK over live bytes (public artifacts only): JWS verified
  against the live JWKS; payload == canonical(index), 90,628 B;
  **210 match / 0 mismatch / 0 unresolved**.
- Middleware unit tests 21/21. node --check clean (generator,
  verify.js). Live checks: dataset URL 200 + application/json +
  85,463 B with the DB rows digest in its totals node; ai-sitemap,
  llms.txt, data txt and index pair live-byte-identical to the deploy
  tree; home and /moving-a-piano/ 200; unknown path still 404.
- All 12 pushed repo files read back byte-identical. Gist-based
  ai-repo data/entity-graph.json blob SHA re-confirmed untouched:
  cda897e61319a0f52172ef1365402e4d7179cddf.
- No quote test posts. No index.html edits. American spellings.

## Coordinates

- Pages deploy: **58e4da8c** (255 files; exactly 6 uploaded — the new
  dataset, ai-sitemap.json, llms.txt, the data txt, and the
  ai-master-index pair — plus the Functions bundle).
- the-flat-rate-machine: b51f627a → **415d2728** (generator, verify.js,
  middleware copy, phase-a copies, verify-fix record); this batch
  record follows in the next chunk.
- theflatratemovers-ai: 3be48253 → b84badd4 (dataset + AI surfaces)
  → **bc59f014** (signed index pair, pushed last).
- Counts after: pages 162, services 24, datasets 27 files
  (26 category + intent-coverage), distributions 210, rubric rows
  1,134 in intent_query (attestation 250 unchanged).

## Indexing note

The new dataset URL (https://theflatratemovers.com/datasets-intent-
coverage.json) is a data file, not a sitemap page; it joins the estate
through ai-sitemap, llms.txt and the signed index — the surfaces AI
systems read. No GSC page-indexing request applies to it.
