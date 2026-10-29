# Packing & Unpacking deep refresh — deploy batch report (2026-10-29)

Refresh batch (no new page, no new service): the packing-deep package merged
into the live authority data. Counts unchanged: pages 155, services 23,
sitemap 155. Deploy: https://f78dfbef.the-flat-rate-movers.pages.dev
Build script: out/packing-batch/build-packing-batch.py (backups in
out/packing-batch/backup-2026-10-29/). Rubric DB edited in place (backup
first), never replaced.

## Reconciliation (merge-note steps vs live state found)

| # | Merge-note step | Disposition |
|---|---|---|
| 1 | Entity splice (§3.1): replace the skewed Martinsburg-url node with the canonical hub node + Place chain | (c) corrected from stale note. The skew (35 flat strings + Martinsburg url) was already fixed by the full-site redo: the live entity node already carried the branch Place chain and no wrong url. Remaining work: url ADDED (it was absent) + 196-char redo description replaced by the 478-char package description. Exactly 1 node changed; the node now equals the canonical package node on all 8 content keys. |
| 2 | Head completion (§3.2): thin packing node, serviceType "Packing services" | (c) partially stale. The live head node already carried name/serviceType "Packing and Unpacking" + the Place chain (redo). Remaining work: url inserted after "provider" + package description. Exactly 1 of 25 head nodes changed. |
| 3 | Best graph: canonical node added (§3.3) | (a) done as written. Verified zero #service-packing fragments pre-build; canonical node appended; best graph 80 → 81 nodes. All three copies (public / machine data/ / flat mirror) byte-identical after the write. |
| 4 | Per-page JSONs (§2/§3): only packing-movers-martinsburg-wv.json exists; Winchester + hub have none | (b) verified; no new per-page files created (the hub's first structured block is the datasets block, per the standing pattern). |
| 5 | Martinsburg per-page Service node: canonical-swap vs surgical | (c) corrected with reason. The live node is deliberately branch-scoped (provider #martinsburg, areaServed [#martinsburg], url = Martinsburg page) and does NOT equal the canonical node — a full swap would have erased branch identity (senior/office/local-regional branch-file precedent). Surgical correction instead: ONLY the Q2-gated materials clause removed (see Materials gate). Exactly 1 node changed; the expanded LocalBusiness node (35 areas) byte-preserved. |
| 6 | services.json description upgrade (§5) | (c) NOT hand-edited — builder-alignment follow-up, identical to the residential-batch precedent recorded in the merge-note itself. Live surfaces (head/entity/best/ai-sitemap/DB) carry the canonical description. |
| 7 | pages.json rows (§4) | (b) already satisfied: all 8 listed pages point at #service-packing; pageMeta carries the service on 9 pages. No change. |
| 8 | Rubric DB rows (§4: service row exists; 4 attestation rows planned) | (a) done as written against the REAL schema (see Incidents): service row description 86 → 478 chars; attestation 107 → 111 (+4). rubric_check stays the 7-row catalog ((c) — no per-service row added, transloading precedent); no fragment-service edges added. |
| 9 | Phase E visible-copy depth (hub/Winchester FAQ parity, cost-page FAQ) | NOT executed — gated on §8 answers by the package itself ("if Q2/Q3 remain open, ship the merge without Phase E copy"). Phase E is downstream of the merge and stays gated. No visible packing copy changed in this batch. |
| 10 | Ocean Q15-style knock-ons | n/a — none in this package. |

## Materials gate — merge-time read + Q1–Q8 dispositions

The Martinsburg packing page's "Sources & verification" section was read in
full at merge time. It sources ONLY: service name/description (head graph,
2026-10-28), audience, branch facts (GBP), the service footprint, the 4.7/6
rating, the logo image, flat-rate terms/tagline, and the page slug. It
answers NONE of Q1–Q8.

| Q | Subject | Disposition |
|---|---|---|
| Q1 | Debris removal after unpacking | UNCLAIMED — explicit non-claim in D5 step 9 |
| Q2 | Materials beyond blankets + stretch wrap | UNCLAIMED — D2 publishes the industry list labeled as reference only, plus the explicit non-claim; the one live violation (Martinsburg per-page JSON) surgically corrected |
| Q3 | Pack-only service without a move | UNCLAIMED — explicit non-claim in D1 |
| Q4 | Pack timing (day before vs same day) | UNCLAIMED — no timing statement published anywhere |
| Q5 | Packing for storage | UNCLAIMED — explicit non-claim in D1 |
| Q6 | Crew-packed vs owner-packed valuation/liability | UNCLAIMED — explicit non-claim in D7 |
| Q7 | No-pack list | UNCLAIMED — D8 records the industry conventions as planning inputs with an explicit boundary |
| Q8 | Unpacking depth ("place" = surfaces vs full setup) | UNCLAIMED — published wording stays "unpacking and placement" as-is |

Scope note: the gated vocabulary also appears inside datasets-residential.json,
datasets-local-regional.json, and their in-page blocks — prior batches' labeled
industry-reference text, not packing-service claims. Out of this batch's scope;
untouched.

## Retype mapping (datasets-packing.json, 8 nodes)

D1 → Service (service levels) · D2 → Dataset (material classes) · D3 → Dataset
(room/item classes) · D4 → Dataset (fragile/high-value classes) · D5 → Dataset
(process chain) · D6 → Article (personas) · D7 → Article (commercial terms) ·
D8 → Dataset (labeling/inventory/access). Split: 5 Dataset / 1 Service /
2 Article. No FAQPage: the package carries no discrete Q&A pairs to publish
(the cost-page FAQ is Phase E, gated). Dataset nodes CC BY 4.0;
dateModified 2026-10-29; identical @graph embedded in the hub page div.

## Counts before → after

Pages 155 → 155 · services 23 → 23 · sitemap URLs 155 → 155 · head graph 25 →
25 (1 node changed) · entity graph 33 → 33 (1 node changed) · best graph 80 →
81 (canonical node added) · public JSON files 54 → 55 (+ datasets-packing.json)
· ai-sitemap keywords 66 → 72 (+6 canonical service forms, none dropped) ·
rubric DB: service 32, attestation 107 → 111, edge 40, opening_hours 14,
service_area 66, rubric_check 7; integrity ok · ld+json blocks in index.html
14 → 15 (hub datasets block added).

## Gate (pre-deploy, all green)

node --check on BOTH inline scripts (885 + 124,113 chars) rc=0 · all 15
ld+json blocks parse · hub in-div block parse-equal to datasets-packing.json ·
verify.js 71/71 · router audit clean pre- and post-build (pageMeta 155 keys ==
router array 155 entries, sets exactly equal; no repair needed) · forbidden
scans: new blocks clean (no "attest", no "$", no USDOT/MC patterns, no bare
"flat quote", no Spearman / Around Town / DESIGN 6 / Bristow / subcontract);
index-wide deltas vs backup all zero.

## Live verification (post-deploy, no sampling)

datasets-packing.json 200 + application/json, 8 nodes, split 5/1/2, all
dateModified 2026-10-29, Datasets CC BY 4.0 · live entity graph 33 nodes /
best graph 81 nodes, exactly one canonical packing node each (hub url,
478-char description), Place chain 31/35 · live head graph packing node
canonical · live Martinsburg per-page JSON: gated clause gone, branch node
preserved (35 areas, provider #martinsburg) · live ai-sitemap 23/155/72 with
canonical packing description · live sitemap 155 · llms dedicated line + dated
entry live · data txt dated entry live · Developer "Packing data" card live ·
route proofs pass for the packing hub, Winchester packing page, Martinsburg
packing page, packing cost page, /senior-moving/, /videos/,
/moving-and-storage/, /warehouse-relocation/, the IT page, and
/transloading-winchester-va/ · regression sweep of ALL 55 public JSON files:
200 + application/json + valid JSON, zero exceptions · index tagline + CTA
present, "DESIGN 6" count 0. No quote test posted; no Search Console work.

Indexing target recorded (request in a future pass, not submitted):
https://theflatratemovers.com/packing-unpacking-services-2/

## GitHub (before this batch)

ai repo HEAD 71abe924bc5dbdb200c00f0892c2967ca96ed006 · machine repo HEAD
7af70aed1bfc7f93e5770be57298ddc98e4f39d7 · gist graph data/entity-graph.json
SHA cda897e61319a0f52172ef1365402e4d7179cddf (2,486 B) — verified before the
push; this batch does not touch that file. After-state hashes are in the batch
handoff.

## Incidents (both inside the build, zero live effect)

1. First build run failed at the DB step: the pattern adapted from the
   package-era script draft assumed service.entity_id and a six-column
   attestation insert. The live DB's real schema is
   service(service_id, name, url, description, provider_id) and
   attestation(claim, source, verified, evidence) — confirmed against prior
   batches' rows 105–108. The run's UPDATE rolled back uncommitted (verified:
   attestation stayed 107, description stayed 86 chars); every file change was
   restored from the run's own backups. The script was corrected, and in the
   same pass the ai-sitemap keyword append was narrowed from all dataset
   keywords (+36) to the canonical Service node's keyword forms (+6) — the
   precedent set by every prior batch (senior +2, warehouse +5, IT +6,
   transloading +6).
2. Second run passed the DB step but failed the final forbidden scan: the word
   "attestation" inside an internal DB row's source string tripped the strict
   scan. Restored from backups again, reworded the source string, third run
   green end to end. Final state was produced by ONE clean full run of the
   corrected script.
