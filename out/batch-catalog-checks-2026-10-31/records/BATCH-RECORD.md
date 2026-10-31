# Batch Record — Batch 4a Catalog Checks (Retrieval Machine, Element 4)

Date: 2026-10-31. Scope: reconciliation Element 4 build inputs 1, 2,
5, 6, 7 implemented as verify.js §21 checks DC-1..DC-5 with all
violations fixed at the source, plus build input 8 (DS-RESOLVE) as a
one-time live run recorded here and wired to the C5 cadence list.
NOT in scope and untouched: the Zenodo release (batch 4b), the
Hugging Face re-sync (4c), Kaggle (parked by owner ruling), the
catalog registry build (Dossier 04 §5), Croissant depth, the C1
diagnostic, per-dataset DOIs (X1), the Croissant-first HF package
(X2).

## Checks added (verify.js §21; suite 122 -> 127 checks)

- DC-1 (DS-DESC): every Dataset node's description is 50–5,000
  characters, over the corpus: 35 dataset files, 35 per-page dataset
  JSONs, ai-sitemap.json, entity-graph.json, and every route
  document's non-baked ld+json (the D-2 population).
- DC-2 (DS-SHA256): every DataDownload entry carries schema.org
  sha256 equal to its distribution's signed-index digest (local
  index; P-3 proves served == local). Four exceptions, each verified
  mechanically inside the check, never waived: (i) an entry pointing
  at its own document (a file cannot carry its own digest);
  (ii) an entry pointing at ai-master-index.json (the index carries
  no self-digest; its integrity is the detached JWS — and it is the
  only contentUrl in the corpus that is not a sealed distribution,
  asserted by the check's unsealed-target failure mode);
  (iii) the file-pointing entry of a per-page landing JSON (the
  landing JSON and its dataset file are one publication unit; for
  the generator-backed datasets the pair is a mutual fixed point —
  the file embeds the landing JSON's digest — so an in-band value
  cannot be exact, the same infeasibility as (i)); (iv) an entry
  pointing at a route document that republishes the containing
  graph verbatim (detected by node @id-set equality; exactly one
  such entry exists: the gun-safe dataset -> /gun-safe-movers/).
- DC-3 (DS-DATES): every Dataset/DataDownload datePublished /
  dateModified present is ISO 8601, and dateModified >=
  datePublished on the same node. Absent values are not invented:
  datePublished remains absent estate-wide (no truthful source
  value exists per node), so the check binds present values only.
- DC-4 (DS-AGENT): every Dataset node's creator and publisher is an
  object typed Organization carrying the canonical @id
  https://theflatratemovers.com/#organization. The master-index
  root is excluded by design (the index is DC-2's comparison
  source; its root uses the index's own internal #org convention,
  pre-dating this batch, and its creator was already a typed
  Organization, never a bare string).
- DC-5 (DOI form): the concept DOI appears as the exact string
  https://doi.org/10.5281/zenodo.23818766 on exactly its holder
  nodes — the four intent collection nodes, the intent landing
  node, and the master-index root — identified by @id so verbatim
  route copies are asserted too, and nowhere else in the corpus;
  no PropertyValue DOI identifier remains anywhere. D-2 and D-5
  were re-expressed to the same exact-string assertion in the same
  motion (record: out/verify-fix-2026-10-31-catalog-checks.md).

## Violations found and fixed at source

- DS-DESC: 0 violations. All 549 Dataset node instances (215 file
  nodes + verbatim copies) were already inside the bound; the check
  now gates it.
- DS-DATES: 0 violations. 549 date values, all ISO 8601 day-form,
  no ordering violations.
- DS-AGENT: creator was a bare {@id, sameAs} object on 82 file
  nodes and an {@id}-only reference on 34 of 35 per-page landing
  nodes; the three bare-CREATOR generators (search-index,
  answer-evidence, local-graph) were normalized at the source to
  the canonical typed Organization object (the intent generator's
  existing literal). Publisher was absent on 171 of 180 dataset-file
  nodes, 34 of 35 per-page nodes, the ai-sitemap root, and both
  entity-graph roots (site + machine copies): added at the source —
  the four generators' node factories now emit publisher, and the
  31 generator-less dataset files, 35 per-page JSONs and the root
  documents were normalized by this batch's format-preserving
  transform (work/transform.py; each file's serialization format
  proven by round-trip before any change). Transform audit:
  91 creator fixes, 157 publisher additions, 1 publisher fix,
  2 DOI form fixes in its population. End state: DC-4 passes over
  549 instances.
- DS-SHA256: at start, 0 of the corpus's DataDownload entries
  carried sha256. Generators now inject the digest at generation
  time (disk digest of the referenced public file); the transform
  injected the rest. End state per DC-2 over the served corpus:
  2,096 sha-verified instances, 573 self/landing-unit exceptions,
  73 index exceptions, 2 republication exceptions (the gun-safe
  entry in the file and in its landing-route copy).
- DOI form: 6 nodes carried the PropertyValue form (4 intent
  collection nodes, the intent landing node, the master-index
  root); all now carry the URL string, fixed at the generator
  (build-intent-rubric.js), the landing transform, and the index
  root respectively.

## Deviations absorbed in the loop (pipeline standard)

1. Shell embed sync: dataset files are republished verbatim not
   only in the 35 landing divs but in 39 service/category page
   embeds; all were stale by this batch's fields and were synced
   from the files (work/div-sync.py, full-copy @id-multiset rule).
   One embed (transloading, on the container-deconsolidation page)
   also carried pre-existing content drift — 'sixteen' vs the
   file's 'seventeen' pages, and a shorter sameAs list — resolved
   in the file's favor (the file is the sealed source of truth).
2. The entity-graph machine copy's twin at
   ~/workspace/theflatratemovers/entity-graph.json was kept
   byte-identical with the same root edit (an existing verify
   check binds the pair).
3. Fixpoint discipline: the seal runs outside the generator loop;
   post-seal cascades (intent rows -> SI rows-digest string -> AE
   fragment digests) were iterated until every generator --check
   passed against the final sealed index and both transform passes
   were dry-run clean. llms-full.txt never changed bytes in this
   batch (its inputs are the shell's prose, not its scripts).

## DS-RESOLVE (build input 8, one-time run 2026-10-31)

Full table: records/ds-resolve-2026-10-31.json.
- Concept DOI https://doi.org/10.5281/zenodo.23818766 -> 200,
  final https://zenodo.org/records/23818767, title
  'TheFlatRateMovers/theflatratemovers-ai: v1.1.0 — The Flat Rate
  Movers AI Authority Estate (five-category edition)'. MATCH
  (the concept DOI resolves to the current version record; the
  v1.2.0 refresh is batch 4b, out of scope here).
- Every unique Dataset sameAs in the corpus: 38 URLs, all 200,
  each landing serving its own dataset title (title match
  verified per record). No mismatches; no exceptions. (First-pass
  IncompleteRead fetcher artifacts on 32 large route documents
  were re-resolved with a partial-body-tolerant reader; one title
  was confirmed by an independent fetch.)
- C5 cadence wiring: DS-RESOLVE joins the C5 cadence list as a
  named procedure — re-resolve the concept DOI and every Dataset
  sameAs after any batch that changes dataset files, landing
  pages or the DOI metadata; record title/version match per
  record in that batch's record; a mismatch is fixed at source or
  recorded as an exception with its designed remedy, never
  silently passed. The runner is work/ds-resolve.py, kept with
  this batch's tooling until the C5 cadence runner is built.

## Estate numbers after

208 pages · 35 dataset files · sitemap 243 locs · 482
distributions, PROVENANCE OK (served JWS verifies; seal audit
clean) · rubric 2,906 rows (rows digest
5564cc3a783b230fd7ccfc208a472f68c29c72cf5e8f72af0a9f73d2c918092f,
gscObservedRows = 0) · verify.js 127 checks: 126 PASS + P-6
partial at record time (repo-served 19/25 before this batch's
pushes; the five machine code files below resolve with the
machine push) · API worker version
67a7e52c-1b51-480f-97e0-f95f7e2b32d3, bundle 40/40 digests,
tests 43/43 · Pages deployment
https://93108b4e.the-flat-rate-movers.pages.dev (143 files
uploaded). Live spot checks: /v1/verify match=true for
datasets-gun-safe.json and datasets-intent-coverage.json.

## Pushes and web-upload flags

(HEADs + read-backs appended below at push time.)

Parent web uploads required (connector ceiling), exact:
- Machine repo, code/site-shell/index.html — 14,679,146 bytes,
  SHA-256 3038523d333fb2e2b3a61083a4fb097cabb793b38c47b9e70bef8fff3c4b7b78
  (source: repo-dir/index.html). Until it lands, P-6 remains open
  on the shell mirror only — the accepted B1–B3 end-state.
- AI repo, data/datasets-answer-evidence.json — 7,171,215 bytes,
  SHA-256 fd678fc8ed16ff131974828ba716b014f2a67e9a6eff4dcc9e03aec8ea136e55
  (source: public/datasets-answer-evidence.json).

## Dossier 04 items remaining for later small batches

The §5 catalog registry build (presence/completeness/sync-state
dataset + /v1/catalog); Croissant depth for the intent dataset
(C4); the Dataset Search diagnostic C1 stages T1–T4; the C5
cadence runner (DS-RESOLVE's permanent home); X1 per-dataset DOIs
(owner citation-architecture decision); X2 Croissant-first HF
package (owner priority call); batch 4b (Zenodo v1.2.0 release
refreshing the record to the current estate); batch 4c (Hugging
Face re-sync incl. the E4-3 checklist pins: license cc-by-4.0,
configs/dataset_info parity); Kaggle conditional package E4-9
(parked by owner ruling). Out-of-scope observation carried
forward: the intent landing node's description still quotes stale
v1 counts ('1218 generated rows … 167 pages') — a content fix for
a later batch, not a catalog-check violation.
