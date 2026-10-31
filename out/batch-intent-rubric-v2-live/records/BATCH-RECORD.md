# Batch record — Intent Rubric v2 Live (2026-10-31)

Batch dir: `out/batch-intent-rubric-v2-live/` (backup/, files/, records/, work/, repo-dir/).
Verify changes: `out/verify-fix-2026-10-31-intent-rubric-v2.md` (I-6..I-9 added;
P-5 extended 255 → 257; two deploy-time corrections recorded there as an addendum).
Order: the owner's 2026-10-31 directive — full coverage (all 202 pages),
dynamic evidence wiring, API live on v2. No staging endpoint; deployed live.

## What shipped

- **Generator v2.0.0 live** at `scripts/build-intent-rubric.js` (v1.3.2
  preserved at `rubric-v2-staging/tools/build-intent-rubric-v1.3.2-baseline.js`
  and in this batch's backup/). Supporting tools installed the same motion:
  `scripts/import-gsc-export.py` (GSC export importer) and
  `scripts/ingest-outcome-evidence.py` (evidence ingest — see §Evidence wiring).
- **Rows: 1,218 → 2,732** (rows digest `e5d9e8ee10a973133fc3ac39bccde22183abfadb5e6349a8e972c046ff632937`).
  Composition: 1,218 v1-pattern rows preserved exactly + 275 page-derived (R13)
  + 1,239 roll-up (R14). Exclusions: 105, all duplicates; zero gate exclusions.
  Row sources: estateGenerated 2,732 · pageDerived 275 · **gscObservedRows 0**.
- **Full coverage: 202/202 pages are rubric targets; uncovered = [].**
  The 47 previously uncovered pages close two ways, both at the source:
  (a) the 5 label-named per-page JSONs (freight-services.json, port-logistics.json,
  category-museum-logistics.json, logistics-transportation.json,
  container-deconsolidation.json) resolve through the generator's WebPage-@id
  resolution — each file declares its page's canonical @id and was already in
  the signed index; no gate was waived; (b) 42 service-less hub/category/
  utility pages carry R14 roll-up rows grouped by registry child-page union,
  branch-location grouping, and two config tables (ROLLUP_SETS for
  category/logistics, category/shenandoah-valley-logistics, videos,
  datasets/videos; ROLLUP_ALL for 34 estate hubs) — same emit() gates, target =
  the hub page itself. No page is named as uncoverable: the target is met in full.
- **Per-area coverage published** (owner addition): D8 `rowsByArea` carries all
  53 GeoJSON features with row counts (zeros included) + `rowsByNonFeatureArea`
  (corridors i-81/i-66/i-70: 9 each; scopes winchester/martinsburg/shenandoah-valley:
  140 each). Zero-row areas are exactly the 7 landmark/region/corridor features,
  named on the landing page with the reason (their coverage rides on corridor
  and branch-scope rows).
- **Landing page presents v2** (owner addition): /datasets/intent-coverage/
  rebuilt from the dataset file itself — hero = the file's D1 description,
  node table regenerated from the file, new sections "The rubric in plain
  language" (what it is, 2,732 rows, evidence story, outcome distribution),
  "Coverage by category" (28 services), "Coverage by service area" (53 areas +
  corridor/scope rows + zero-area note), Facts date 2026-10-31, certificate SHA
  = the file's live SHA-256 `5176e3713abb8826cf8c8c38afac40c6670b3ead9d93173aedc928d6bb080834`,
  embed = the file byte-identical. The rebuild also repaired a pre-existing
  drift: the page's displayed certificate SHA and hero were discoverability-era
  (5764d637…) while the file had moved on.
- **GSC seed imported into the LIVE rubric.db** as era-tagged evidence only:
  batch 1, window 2026-07-29 → 2026-10-28, source sha256
  `39a54b1073e37b8b508bf9356a20e81980f278db69906b6fffb07fdf5baf0a81`
  (== the seed of record). 1,000 queries + 103 pages ingested; **15 queries
  attached → 98 rows enriched**; 985 unattached; 73 of 103 exported pages still
  live, 30 stale. No rows were created from observed data; no current-era
  performance is claimed anywhere.
- **Outcome state (honest distribution):** unknown 1,119 · awaiting-observation
  1,613 · partial 0 · blocked 0 · complete 0. Highest gate passed: none 2,732.
  No gate state is asserted anywhere — states change only through the ingest tool.
- **Surfaces updated in the same motion:** llms.txt (current-state count +
  appended dated Update entry), phase-a llms.txt figures, data txt (appended
  dated entry), pageMeta desc for datasets/intent-coverage, functions/head-data.js
  regenerated (202 entries, 0 problems; diff confined to that one description).

## Evidence wiring (the living-certificate mechanism) — runbook

Tool: `scripts/ingest-outcome-evidence.py` (sealed, see below). One JSON
verdict file per ingest; three kinds:

- `indexing` — the GSC indexing pass's per-URL verdicts, transcribed into
  `{"kind":"indexing","source":"gsc-indexing-pass","observed_at":"YYYY-MM-DD","verdicts":[{"url":…,"coverage":…,"crawled":bool,"indexed":bool,"detail":…}]}`.
  Mapping: indexed ⇒ crawled+indexed passed; crawled-only ⇒ crawled passed /
  indexed failed; "Discovered"/"unknown" verdicts are recorded as observations
  with no gate claimed.
- `performance` — after importing a fresh GSC export with
  `scripts/import-gsc-export.py` and regenerating, pages present in the new
  window's Pages aggregate gain indexed=passed with the window as reference.
- `citations` — backlink/citation audit results; each cited page's rows gain
  corroborated=passed.

Rules enforced by the tool: append-only evidence log; a passed gate is never
downgraded; every state carries checked_at + evidence_source; status and
highest-gate are recomputed from the gate chain, never asserted; unmatched
URLs write nothing and are reported. Default chain: regenerate → dataset to
public/ → reseal (digest+sign) → verify-provenance, then the standard estate
motion (Pages deploy → API bundle refresh + worker redeploy → one push per
repo), with the exact commands printed at the end of the run.
**Tested** on a scratch DB with a synthetic verdict file in the pass's shape
(`work/synthetic-verdicts.json`): gun-safe-movers/ → 9 rows partial/indexed;
transloading-winchester-va/ → 22 rows partial/crawled with indexed failed;
developer/ → 28 rows evidence-only, no state change; an unknown URL matched
nothing. 90 evidence records appended; states survived a subsequent
regeneration (dataset roll-up partial=31). Synthetic data never touched the
live DB. **First real input: today's 2026-10-31 09:40 EDT indexing pass** —
transcribe its per-URL verdicts into the shape above and run
`python3 scripts/ingest-outcome-evidence.py <verdicts.json>`.

## Certificate / seal

- Generator + ingest tool added as signed distributions: **255 → 257**
  (raw.githubusercontent machine-repo URLs; P-5 extended stricter in the same
  motion). Seal assertions: added == exactly those 2; top-level index fields
  identical INCLUDING dateModified; digest-changed == exactly 5
  (datasets-intent-coverage.json, llms.txt, site shell, head-data.js, verify.js);
  "Entity Graph — Site (38 nodes)" label intact. **PROVENANCE OK 257/257**
  (standalone verify-provenance over the sealed tree, twice — before and after
  the resolution fix below).
- Two gate-caught corrections during the batch (full detail in the verify-fix
  record's addendum): (1) I-1 instability exposed the slug→file collision on
  the intent landing page (derived name = the dataset file); the generator's
  resolution now prefers a unique WebPage-@id match — the 56 affected rows now
  carry dataset-intent-coverage.json with its stable digest e047a517….
  (2) I-9's roll-up equality was made vocabulary-complete after values proved
  identical but zero-key serialization differed.
- The data txt is not a signed distribution (it never was); it rides the ai push.

## Gates run

- Generator `--check` on the live DB: PASS (2,732 rows, digest stable across
  the reseal — the property I-1 asserts).
- Shell: quote-form segment md5 `4d8d49f05b22b129eac623a41370d9cb` (canonical,
  byte-identical); node --check on both executable inline scripts PASS (one
  defect found and fixed during the batch: an unescaped apostrophe in the new
  pageMeta desc broke the main script's string — rephrased, rechecked);
  router array byte-identical to pre-batch; pageMeta identical modulo the one
  desc ⇒ router == pageMeta == 202 stands.
- verify.js: pre-deploy 95/97 — the only failures P-5 (served index still 255,
  code files not yet pushed) and I-5 (live dataset still old), both pure
  live-state ordering. Post-push full run recorded below.
- API: bundle refresh gate 37/37 signed-index digest matches; tests 34/34
  (incl. the new v2-shape assertions); worker redeployed.
- Pre-push key-content grep across all push files: 0. Gist-based
  ai-repo data/entity-graph.json untouched (not in either manifest).

## Deploys

- Pages: deployment https://b8d26adf.the-flat-rate-movers.pages.dev (6 files
  uploaded). Live dataset sha == sealed sha; landing serves the v2 sections.
- API worker `flat-rate-estate-api` version `dd7ec549-a63a-42cc-9eb3-1dbc0b00f8c7`:
  /v1/intent total 2,732 with v2 row shape; /v1/verify for the intent dataset
  match:true source "live"; MCP search_intent returns v2-shaped rows; landing
  count bundle-driven (no hard-coded row counts remain in the worker).
- GitHub: one push per repo, back-to-back (manifests in this record's batch
  dir: work/push-ai.bin, work/push-machine.bin). Read-backs byte-identical;
  HEADs reported in the delivery message.
- Indexing queue note: /datasets/intent-coverage/ and /datasets/ join the
  NEXT Search Console pass; today's 09:40 queue was not edited.

## Gaps + suggestions (computed from the live DB at deploy)

Per-category rows (awaiting-observation in brackets): Transloading 157 [62] ·
Packing 143 [110] · Final-Mile 135 [79] · Residential 131 [30] · Government 126 [72] ·
Industrial & Commercial 126 [102] · Military 126 [72] · Commercial 123 [50] ·
Industrial Offices 123 [99] · ISPM 15 121 [74] · Crating 117 [44] · Office Moving
113 [89] · Long-Distance 96 [53] · SIR Heavy 92 [60] · Piano/Antique 88 [37] ·
Route 81 88 [64] · Gun Safe 81 [34] · Local & Regional 76 [52] · FF&E 69 [45] ·
Medical & Lab 69 [45] · Transloading Winchester 68 [44] · Warehouse Relocation
68 [44] · Data Center 67 [43] · IT Relocation 67 [43] · Senior Moving 66 [42] ·
Warehouse Racking 66 [42] · Junk Removal 65 [41] · Moving & Storage 65 [41].

Thinnest categories (suggestion list): Junk Removal (65) and Moving & Storage
(65) — both single-page services with no branch variants; then Warehouse
Racking (66) and Senior Moving (66); then Data Center and IT Relocation (67).
These are thin because their page sets are small, not because pages are
missing — every page carries rows. Deepening them means more real pages/
question-bank phrasings for those services, not more patterns over the same pages.

Per-area rows: Winchester 28 · Martinsburg 27 · every footprint town 12 ·
every county 10 · corridors 9 each (under corridors.json ids) · branch scopes
140 each. Zero-row areas (7, all landmarks): Port of Virginia, Virginia Inland
Port, Shenandoah Valley, Eastern Panhandle of West Virginia, Interstate 81
Corridor, Interstate 66 Corridor, Interstate 70 Corridor — named explicitly;
their coverage rides on the corridor/scope rows by design of the registries.

Awaiting-observation concentration: Packing (110), Industrial & Commercial
(102), Industrial Offices (99), Office Moving (89) — the categories whose pages
were rebuilt most heavily after the evidence window; they clear mechanically
as current-era windows and indexing verdicts are ingested. Pages without
rows: **none** (202/202).
