# Batch Record — Data Center Relocation (Takeover Category #4)

Deployed 2026-10-30. Standing authorization: deploy after checks pass,
GitHub in the same motion, one push per repo back-to-back. Staged package:
`out/batch-data-center-physical/` (research-notes.md,
datasets-data-center-relocation.json, page-div.html,
data-center-relocation.json, rubric-inserts.json,
propagation-manifest.md, gap-table.md), applied with REBASELINE — deltas
onto the current estate (165 pages / 26 services), not the manifest's
stale 162/24 baseline. Deploy: Cloudflare Pages `9e17edb0` (13 files
uploaded).

## The superseding update — gap G3 REVISED before insertion (Henry, 2026-10-30)

After staging, Henry ruled: **disconnect and reconnect of IT equipment IS
in scope** — the crew performs the work, and where a scope element
requires certified specialists, the company engages certified contractors
to handle it. This REPLACED the staged package's direction-split (client
IT team directs shutdown/unplug; crew physical only). The revision was
applied in ONE enrichment pass (work/enrich.py) across the page div, the
dataset, the per-page JSON and the rubric inserts, before any insertion.
Old → new, principal passages:

- Hero: "de-installed with crew support under your IT team's direction"
  → "disconnected and reconnected, de-installed".
- Process step 3: "Your IT team shuts down, unplugs and directs the
  order. Our crew performs the physical de-rack work under that
  direction" → "Working to the sequence fixed at survey with your IT
  team, our crew shuts down and unplugs device by device… Elements that
  require certified specialists are handled by the certified contractors
  the company engages." Owner cell: "Your team directs; our crew handles"
  → "The Flat Rate Movers — sequence agreed with your team".
- Process step 6: "Power-up, cabling and recommissioning stay with your
  IT team" → "reconnected and re-cabled to the manifest, and powered up
  to the scope agreed at survey… Recommissioning — bringing systems and
  services back online — stays with your IT team."
- FAQ: "Who unplugs and shuts down our systems?" → "Who disconnects and
  shuts down our systems?" — "Our crew does…"; "Do you re-rack, cable and
  power systems back up?" now answered yes (re-rack, re-cable, power up
  to the surveyed scope; recommissioning stays with the client's team).
- Dataset D1 operations, D3 taxonomy workstream line, D6 personas, D7
  protection/compliance boundary list, per-page Service description and
  rubric claim rows 1, 3, 4 + the rubric service-row description were
  revised in the same words.
- **The ITAD wall is kept exactly:** no R2v3 / NAID AAA / NIST SP 800-88 /
  IEEE 2883 claim, no data destruction or Certificates of Destruction as
  company deliverables — destruction, where a job includes it, is
  performed by the certified partner engaged for the job and any
  certificate is that partner's (the staged "partner you designate"
  framing widened to the engaged-partner model). No workload-migration
  claims. The company claims no IT certifications of its own; certified
  elements belong to the engaged contractors.
- Post-revision gate: ZERO occurrences of the old split across div +
  dataset + per-page JSON + rubric inserts ("under your IT team",
  "under that direction", "shuts down, unplugs and directs", "stay with
  your IT team", "de-install support", "partner you designate", …) —
  asserted in enrich.py and again in page-gates.py, and re-verified at 0
  in the LIVE served page.

## Materials & supplies naming (Henry's ruling, same pass)

Named at the steps that use them, framed as purchased per project:
anti-static bubble wrap, ESD shielding bags, ESD-safe packing materials,
foam-lined server shipping crates, cable labels and tags, tamper-evident
seals — in the page's pack & seal step and dataset D1. Gap G4 resolved
(the anti-static-aware packing wording stands). Gap G2 stands (no
valuation offering ships).

## Canonical-node hygiene (staging predated two fixes)

The staged per-page JSON's Organization node lacked the logo ImageObject
and its Place nodes carried stale pre-Bristow areaServed lists. All three
nodes were replaced with the current canonical forms (from the live
virginia-inland-port-transloading.json) before insertion; page-gates
assert Winchester 32 areas incl. Bristow, VA, Martinsburg 35, ratings
5.0/1 vs 4.7/6 unblended. The div's logo figure carries `wideph
logo-wide` per the logo batch's standing rule for new divs.

## Counts — before → after (all verified)

| Counter | Before | After |
|---|---|---|
| Pages / sitemap | 165 | **166** |
| Services | 26 | **27** (`#service-data-center-relocation`) |
| Datasets | 29 | **30** |
| Signed distributions | 216 | **218** (PROVENANCE OK over live bytes, verify.js P-3/P-6) |
| STATIC_FILES | 268 | **270** |
| Router / pageMeta | 165 == 165 | **166 == 166** |
| Rubric attestations | 285 | **300** (see rubric note) |
| Rubric edges | 45 | **51** (+6) |
| Intent rows | 1,176 | **1,197** (+21; generator v1.2.1 → v1.3.0) |
| Site entity graph | 36 | **37** |
| Site best graph | 95 | **96** |
| Machine entity / best graphs | 36 / 92 | **37 / 93** |
| ai full graphs | 36 / 95 | **37 / 96** (append-only; their Org-node variants untouched) |
| all-pages.json hasPart (curated) | 119 | **120** |
| Sitemap-page accounting | 275 URLs / 161 with-a-page | **276 / 162** |
| Estate-in-numbers blocks | — | ×13 each updated (pages, services, datasets, entity, best) |

## Rubric note — staging missed the three standing per-service rows

The staged inserts carried 12 content rows (+12 → 297, all inserted,
dedupe-verified). The deploy-time gates (verify.js §"attestations cover
services.json entries", S-6) additionally require, per service, the three
standing rows every prior service batch added: the services.json coverage
row and the R8 crawlability / R9 provenance gate rows. They were missing
from this package's staging — the same class of staging defect as the G3
split — so they were added in the DB's exact existing forms (mirroring
the FF&E rows verbatim in structure): **+3 → 300 total**, with coverage,
R8 and R9 counts all at 27 == services. Rubric inserts' ids were
normalized to the DB's full-URL convention (`#service-…` fragment URLs;
dataset edges target the dataset nodes' own @ids — no `dataset`-relation
edges existed before; these are the first).

## Seal

- Pass 1: repo-dir assembled (11 unchanged code files @ Inland Port
  repo-dir copies, currency proven by the set-diff; 5 batch-changed).
  Added exactly 2 distributions (datasets-data-center-relocation.json,
  data-center-relocation.json); digest-changed exactly the expected 10
  (ai-sitemap, llms, both site graphs, all-pages, shell, middleware,
  head-data, verify.js, gen-head-data.js); removed 0. Signed, kid
  `theflatratemovers-2026-10-29-1`.
- Intent regeneration, then Pass 2: only
  datasets-intent-coverage.json changed; total stays 218; re-signed.
- **Seal fix (disclosed):** the first build1 pass appended the
  ai-sitemap hasPart entry as a bare string; the file's convention (and
  verify.js §10) is object entries `{"@type":"WebPage","name","url"}`.
  Both ai-sitemap copies were corrected to the object form and the index
  re-digested/re-signed with the set-diff asserted at exactly
  {ai-sitemap.json}. No content beyond the entry form changed.

## Gates

- enrich.py: every replacement anchor asserted; dataset + per-page JSON
  serializations proven round-trip against the staged bytes (so the only
  diffs are the intended revisions + the canonical-node swap).
- local-gates: router == pageMeta == 166, div once + before `<footer>`,
  dataset embed byte-equal, quote-form md5
  `4d8d49f05b22b129eac623a41370d9cb` UNCHANGED, all ld+json parses,
  node --check on both executable inline scripts, STATIC_FILES 270.
  **LOCAL GATES OK.**
- page-gates: dataset 8 nodes (4 Dataset / 2 Service / 2 Article, CC BY
  4.0, descriptions ≥ 50), NEW wording present ×5, OLD split absent ×11
  across div+dataset+JSON, ITAD wall (partner-owned standards; company
  non-claims), materials ×6, per-page JSON 5 nodes + canonical Org/Place
  assertions, forbidden scan (no Spearman/Around Town/Design 6, no
  USDOT/MC, no kerb, no colo/facility names). **PAGE GATES OK.** One gate
  correction, documented per the stale-check rule: the CTA count check
  now counts VISIBLE page CTAs with the embedded dataset script stripped
  (3: hero button, closing button, closing paragraph) — the raw count of
  4 includes the dataset D8 quote-path node, which legitimately quotes
  the CTA once. The staged content was not changed for the gate.
- Middleware unit suite: 37/37 (33 prior + bare-path, own-title and both
  JSON passthrough cases for the new page).
- verify.js: pre-deploy 82/88 with exactly the six live-state failures;
  post-deploy 87/88 with only P-6 outstanding (repo-served digests —
  resolves with the GitHub pushes below, same motion); final run after
  pushes appended below.
- Live checks: /data-center-relocation/ 200 + own title "The Flat Rate
  Movers — Data Center Relocation" + new wording present + old split at
  0; both JSONs 200 + application/json + byte-identical to local;
  sitemap 166 locs; llms carries the service; intent dataset live at
  1,197 rows with the new coverage node; route tests for
  /virginia-inland-port-transloading/, /ffe-logistics/ and
  /moving-a-piano/ serve their own titles. No quote tests.

## Skipped (severable by design)

The manifest's optional datasets-it.json taxonomy delta was SKIPPED:
its specified sentence ships the superseded G3 framing verbatim
("de-install support… the client's designated certified ITAD partner"),
which the superseding update replaced estate-wide in this batch.
Rewriting it was outside the manifest's content-exact specification.
Noted here per the task instruction; the package is unaffected.

Also noted: the manifest's GitHub section said "no per-page JSONs in the
ai repo" — stale against the standing layout and the last three batches'
practice; the per-page JSON ships at `schemas/data-center-relocation.json`
as with racking, FF&E and Inland Port.

## GitHub (one push per repo, back-to-back; HEADs verified first)

- Pre-push: HEADs ai `2962b69e`, machine `0afa3802` (ls-remote);
  key-content grep across both push trees = 0.
- ai push paths: llms.txt, ai-sitemap.json,
  the-flat-rate-movers-data.txt, data/datasets-data-center-relocation.json,
  schemas/data-center-relocation.json, data/entity-graph-full.json,
  data/best-json-entity-graph-full.json, data/ai-master-index.json,
  data/ai-master-index.jws.
- machine push paths: code/site-shell/index.html,
  code/pages-functions/_middleware.js, code/pages-functions/head-data.js,
  verify.js, tools/gen-head-data.js, scripts/build-intent-rubric.js,
  data/services.json, data/pages.json, data/entity-graph.json,
  data/best-json-entity-graph.json, out/phase-a/ai-sitemap.json,
  out/phase-a/llms.txt, out/verify-fix-2026-10-30-data-center-relocation.md,
  this record.

(Post-push HEADs, read-backs, gist re-confirmation and the final
verify.js run are appended to the local copy of this record after the
pushes, per the FF&E precedent.)

## Follow-ons (unchanged from the manifest)

- GBP "Data Center Relocation" service entry (Winchester profile) is a
  follow-up under the traffic program — not bundled into this deploy.
- /data-center-relocation/ joins the GSC indexing pass AFTER the booked
  2026-10-31 pass, with the other takeover-category URLs.
