# Batch Record — Medical & Laboratory Equipment Relocation (Takeover Category #5, FINAL)

Deployed 2026-10-30. Standing authorization: deploy after checks pass,
GitHub in the same motion, one push per repo back-to-back. Staged
package: `out/batch-medical-lab-relocation/` (research-notes.md,
datasets-medical-lab-relocation.json, page-div.html,
medical-lab-equipment-relocation.json, rubric-inserts.json,
propagation-manifest.md, gap-table.md), applied with REBASELINE —
deltas onto the current estate (166 pages / 27 services), not the
manifest's stale 162/24 baseline. Deploys: Cloudflare Pages `a186bead`
(initial, 13 files uploaded) and `47efb6f4` (the ai-sitemap entry-form
seal fix below, same motion).

## Transport-only boundary — held at every gate

The company TRANSPORTS medical and laboratory equipment; the batch
claims nothing more. Gate-scanned at zero across div + dataset +
per-page JSON: calibration / certification / commissioning /
decontamination / requalification performance claims (all carried as
the customer's vendor / EHS layer, in writing, on the page, in dataset
D7 and in the Service description); specimen, chemical, reagent or
hazmat transport (excluded everywhere it is named; routes to licensed
handlers); cryogenic CONTENTS (equipment only, moving empty, prepared
by the customer's team — the distinction stated on the page, in FAQ #4,
in dataset D1/D3/D7 and in the cold-thermal detail node); HIPAA
language beyond facility protocols (only "works to the facility's own
privacy, access and infection-control protocols"; no compliance status
claimed); institution/client names (zero — geography by city, county
and corridor only). Market figures labeled MARKET with named publishers
(Meyer avg lab move >$100k; Armstrong $10–25k small / $100k–$1M+
multi-floor; PatientImage MRI $60–100k — all fetched 2026-10-30); the
index-only Stewart figures are excluded from all copy. The workforce
per-hundredweight schedule is stated in the dataset's commercial-terms
node as never extended to relocation pricing. No "attested" wording;
American spellings throughout.

## Materials & supplies naming (Henry's ruling, applied pre-insert)

Named at the steps that use them, framed as purchased per project:
padded instrument covers, anti-static / ESD-safe packing for electronic
instruments, foam-lined and foam-in-place custom crating,
moisture-barrier wrap for sensitive units, tilt and shock indicator
labels on instrument crates read at each hand-off — in the page's pack
and transport steps + taxonomy table and in dataset D1 (operations) and
D3 (taxonomy), in the same words.

## Canonical-node hygiene (staging predated the logo fix)

The staged per-page JSON's Organization node lacked the logo
ImageObject; it was replaced with the current canonical form (from the
live data-center-relocation.json). The staged Place nodes were verified
BYTE-IDENTICAL to the current canonical post-Bristow forms (Winchester
32 areas incl. Bristow, VA; Martinsburg 35; ratings 5.0/1 vs 4.7/6
unblended) and were not touched. The div's logo figure carries `wideph
logo-wide`; the staged-only deploy comment was stripped (the breadcrumb
comment stays, per the live pattern).

## Counts — before → after (all verified)

| Counter | Before | After |
|---|---|---|
| Pages / sitemap | 166 | **167** |
| Services | 27 | **28** (`#service-medical-lab-relocation`) |
| Datasets | 30 | **31** |
| Signed distributions | 218 | **220** (PROVENANCE OK over live bytes, verify.js P-3/P-6) |
| STATIC_FILES | 270 | **272** |
| Router / pageMeta | 166 == 166 | **167 == 167** |
| Rubric attestations | 300 | **317** (see rubric note) |
| Rubric edges | 51 | **55** (+4) |
| Intent rows | 1,197 | **1,218** (+21; generator v1.3.0 → v1.3.1) |
| Site entity graph | 37 | **38** |
| Site best graph | 96 | **97** |
| Machine entity / best graphs | 37 / 93 | **38 / 94** |
| ai full graphs | 37 / 96 | **38 / 97** (append-only; their Org-node variants untouched) |
| all-pages.json hasPart (curated) | 120 | **121** |
| Sitemap-page accounting | 276 URLs / 162 with-a-page | **277 / 163** |
| Estate-in-numbers blocks | — | ×13 each updated (pages, services, datasets, entity, best) |

## Rubric note — staging missed the three standing per-service rows

The staged inserts carried 14 content rows (all inserted,
dedupe-verified) but — the same staging defect the data-center package
had — omitted the three standing rows every prior service batch added:
the services.json coverage row and the R8 crawlability / R9 provenance
gate rows. They were added in the DB's exact existing forms (mirroring
the data-center rows verbatim in structure): **+3 → 317 total**, with
coverage, R8 and R9 counts all at 28 == services (verify.js S-6 green).
Edge mapping, per the staged file's own edge_note: the staged
`isPartOf` relation is not in the live edge vocabulary, so the SIR
parentage edge is recorded with the live `subServiceOf` relation (the
mapping the data-center batch used for its parent edge) — recorded
here, never silent. The other three edges (provider, location ×2) were
inserted as staged. Rubric service-row description keeps the
transport-only boundary verbatim.

## Seal

- Pass 1: repo-dir assembled (11 unchanged code files @ Data Center
  repo-dir copies, currency proven by the set-diff; 5 batch-changed).
  Added exactly 2 distributions (datasets-medical-lab-relocation.json,
  medical-lab-equipment-relocation.json); digest-changed exactly the
  expected 10 (ai-sitemap, llms, both site graphs, all-pages, shell,
  middleware, head-data, verify.js, gen-head-data.js); removed 0.
  Signed, kid `theflatratemovers-2026-10-29-1`.
- Intent regeneration (generator v1.3.1: the new service wired into
  HUB / PHRASE / DATASETS / BASE_ONLY / BRANCH; 1,218 rows, 0
  excluded), the generated dataset installed to public/, then Pass 2:
  only datasets-intent-coverage.json changed; total stays 220;
  re-signed.
- **Seal fix (disclosed):** the first build pass appended the
  ai-sitemap hasPart entry as a bare string (this batch's build1
  followed the data-center build1 script, which predated that batch's
  own correction); the file's convention (and verify.js §10) is object
  entries `{"@type":"WebPage","name","url"}`. Both ai-sitemap copies
  were corrected to the object form and the index re-digested/re-signed
  with the set-diff asserted at exactly {ai-sitemap.json}, then
  redeployed (47efb6f4). No content beyond the entry form changed.
- **Gate correction (disclosed):** page-gates' forbidden-claim list
  initially included the bare substring "temperature-controlled
  transport;", which matches the page's explicit NON-claim ("We do not
  claim powered or temperature-controlled transport;"). The check was
  corrected to claim-shaped patterns only (we offer / we provide /
  available), per the stale-check rule; the staged content was not
  changed for the gate.

## Gates

- enrich.py: every replacement anchor asserted; dataset + per-page
  JSON serializations proven round-trip against the staged bytes (so
  the only diffs are the intended enrichment + the canonical Org swap);
  boundary sanity scan over div + dataset + per-page JSON.
- local-gates: router == pageMeta == 167, div once + before `<footer>`,
  dataset embed byte-equal, quote-form md5
  `4d8d49f05b22b129eac623a41370d9cb` UNCHANGED, all ld+json parses,
  node --check on both executable inline scripts, STATIC_FILES 272.
  **LOCAL GATES OK.**
- page-gates: dataset 11 nodes (4 Dataset / 5 Service / 2 Article, CC
  BY 4.0 on all nodes, descriptions ≥ 50), boundary wording present ×8,
  forbidden-claim scan (18 claim patterns + 14 institution names +
  Stewart exclusion) all absent, market figures labeled, workforce
  schedule non-extension stated, materials ×6 in div + dataset,
  per-page JSON 7 nodes + canonical Org/Place assertions, visible FAQs
  byte-equal to the per-page FAQPage (8/8), forbidden scan (no
  Spearman/Around Town/Design 6, no USDOT/MC, no kerb). **PAGE GATES
  OK.**
- Middleware unit suite: 41/41 (37 prior + bare-path, own-title and
  both JSON passthrough cases for the new page).
- verify.js: pre-deploy 81/88 with exactly the seven not-yet-live
  failures; post-deploy 87/88 with only P-6 outstanding (repo-served
  digests — resolves with the GitHub pushes below, same motion); final
  run after pushes appended below.
- Live checks: /medical-lab-equipment-relocation/ 200 + own title "The
  Flat Rate Movers — Medical & Laboratory Equipment Relocation" +
  boundary and materials wording present in the served page; both JSONs
  200 + application/json + byte-identical to local; sitemap 167 locs;
  llms carries the service; intent dataset live at 1,218 rows with the
  new coverage node (21 rows); route tests for
  /data-center-relocation/, /ffe-logistics/, /moving-a-piano/,
  /virginia-inland-port-transloading/ and
  /warehouse-racking-relocation/ serve their own titles. No quote
  tests.

## Zero SIR-estate edits

Per the manifest: `datasets-sir-heavy.json`, `datasets-gun-safe.json`,
all 14 existing SIR pages, `/heavy/`, the calibration-safe page and the
`#service-sir-heavy` node itself are untouched; the new dataset and
per-page JSON cross-link SIR by @id only (Service isPartOf; rubric
subServiceOf edge).

## GitHub (one push per repo, back-to-back; HEADs verified first)

- Pre-push: HEADs ai `4d08efac`, machine `0103aa30` (list_commits);
  key-content grep across both push trees = 0.
- ai push paths: llms.txt, ai-sitemap.json,
  the-flat-rate-movers-data.txt, data/datasets-medical-lab-relocation.json,
  schemas/medical-lab-equipment-relocation.json,
  data/entity-graph-full.json, data/best-json-entity-graph-full.json,
  data/ai-master-index.json, data/ai-master-index.jws.
- machine push paths: code/site-shell/index.html,
  code/pages-functions/_middleware.js, code/pages-functions/head-data.js,
  verify.js, tools/gen-head-data.js, scripts/build-intent-rubric.js,
  data/services.json, data/pages.json, data/entity-graph.json,
  data/best-json-entity-graph.json, out/phase-a/ai-sitemap.json,
  out/phase-a/llms.txt,
  out/verify-fix-2026-10-30-medical-lab-relocation.md, this record.

## Follow-ons (unchanged from the manifest)

- GBP "Medical & Laboratory Equipment Relocation" product on both
  profiles (owner-approved step under the traffic program) — not
  bundled into this deploy.
- /medical-lab-equipment-relocation/ joins the GSC indexing pass AFTER
  the booked 2026-10-31 pass, with the other takeover-category URLs.
- Optional later micro-batch: "Medical & lab" cross-links from /heavy/
  and the calibration-safe page (the new page already links out to
  them).

**This closes the five-category takeover program** (racking, FF&E,
Inland Port transloading, data-center physical relocation, medical &
laboratory equipment relocation — all live, sealed and pushed).
