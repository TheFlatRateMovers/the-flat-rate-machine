# Senior Moving deep refresh — deploy batch report (2026-10-29)

**Deploy URL:** https://ff5afe69.the-flat-rate-movers.pages.dev (custom domain https://theflatratemovers.com verified serving the same build — every live check below ran against the custom domain)
**Counts unchanged by design:** pages 155 / services 23 / sitemap 155. Public JSON files 49 → 50 (+datasets-senior.json).

## Reconciliation (merge-note step → disposition)

| Merge-note step | Disposition |
|---|---|
| services.json senior entry (pageCount 1) / pages.json senior entry (live) | (b) Already satisfied — verified present, unchanged |
| Head graph: upgrade thin #service-senior-moving node | (c) Changed in form, same end state — the redo had already given the node the Place chain (#winchester / #martinsburg) and the short 245-char description; this batch added url + alternateName "Senior Advocacy Logistics" and replaced the description with the full 713-char package text, in place, same @id. Head stays 25 |
| Entity graph: refresh senior node in place (add url) | (a) Done — url + alternateName added, description → full 713-char package text. Stays 33 |
| Best graph: refresh senior node in place (url already present) | (a) Done — url kept; alternateName added; description → full package text. Stays 80 |
| Place footprint expand to 31/35 at merge | (b) Already satisfied by the redo in all three graphs — verified 31/35, not shrunk. The staged schema's GBP 16/14 Place lists were NOT applied to any graph |
| Place @id conversion to #winchester-place / #martinsburg-place form | (c) NOT applied — that convention is superseded; the redo canonicalized Place @ids to #winchester / #martinsburg everywhere (brief + live convention govern) |
| Merge-note count assumptions (153 pages / 22 services / entity 39 / best 74 / head 24) | (c) Stale — written pre-redo. Reconciled to current live state (155 / 23 / 33 / 80 / 25); this batch moves no count, as intended |
| Datasets D1–D8 conversion | (a) Done under the brief's RETYPE RULE (the merge-note proposed all-Dataset; the standing retype rule governs — mapping below). datasets-senior.json created; markup block inside the senior page div parse-equal to the served file; Developer "Senior data" card inserted after the Moving & Storage card |
| Held Phase B dataset-node.json superseded; verify absent | (c) Verified absent from public/ and from the ai repo (never shipped, never served). It DOES still exist in this machine repo's staging area (out/pages/senior-moving/dataset-node.json, SHA 5fbe0f534e7a3afaa8c2d581691b385f81b0acae) from a Phase B-era push — a staged record next to its HOLD note, not a published surface. This batch did not push it anywhere. Flagged for a parent decision on repo housekeeping; not deleted unilaterally (other package's staged file, outside this batch's scope) |
| senior-moving.json per-page JSON | (b) Verified live (200 + application/json), unchanged per the package's "verify, don't rebuild". Note: the brief's byte-identical premise does not hold (live 6,905 B vs staged schema 4,334 B) because the live file carries NEWER state — the expanded 31/35 Place footprints (staged schema still holds GBP 16/14) with the same 5 @ids; Organization and Breadcrumb nodes parse-identical. Rebuilding from the staged schema would have shrunk the footprints — not done |
| ai-sitemap senior entry refresh | (a) Description replaced with the full 713-char package description. Staged phase-a ai-sitemap (c) left unchanged by design — its service descriptions are registry-style (e.g. local-regional staged = 65 chars); names/counts parity unaffected |
| ai-sitemap keywords (merge-note flagged the decision to the merge agent) | (a) DECIDED + done: appended the two real GSC queries not previously present — "senior moving" (75 imp @ 1.0) and "senior movers near me" (@ 1.0). Keywords 47 → 49, none dropped |
| ARD catalog senior entry | (c) Unchanged — ai-catalog.json carries no per-category entries (standing prior-batch precedent) |
| llms.txt senior section refresh + dated entry | (a) Service line refreshed in place (full package description + D1–D8 summary + dataset/hub links, matching the local-regional/long-distance/storage line format) + dated entry appended; history byte-identical. Phase-a staged llms (b) unchanged — it already names the service and states the correct page total |
| Data txt senior refresh | (a/c) Dated entry appended. The file carries no senior hub section to refresh (its services name list already contains Senior Moving / Senior Advocacy Logistics — left alone per the merge-note) |
| descriptions.json senior entry | (b) Unchanged — the page meta description wording does not change in this batch |
| DB canonical service row | (b) Present (service_id = the canonical fragment), not duplicated. Canonical rows stay 23 = registry count |
| DB attestation rows (a) datasets, (b) head-node upgrade, (c) footprint expansion | (a) +2 rows for (a) and (b) (node completion covers head + both graphs), +1 row for the GSC demand evidence behind the keyword additions. (c) NOT added — the footprint expansion was published by the redo and is already covered by existing rows (service_area 66 stands); this batch newly publishes nothing about the footprint. Attestation 93 → 96 |
| DB opening_hours / service_area rows | (b) Verified standing and distinct (14 / 66); none added |
| DB edge rows / rubric_check row | (c) NOT added, per the brief's standing rules (edge table holds zero fragment-service edges by model; rubric_check is a 7-row checks catalog — the merge-note's own §4 anticipated this outcome; the rubric record stays rubric.md in the package dir) |
| Router gate (brief's standing addition) | Clean — audited pre- and post-build and again on the live payload: pageMeta evaluates to 155 keys, router pages array holds 155 entries, sets exactly equal, no duplicates, NO repairs needed. Route ingredients (div + pageMeta key + array entry) verified live for /senior-moving/, /videos/, /moving-and-storage/ |
| §8 gated items Q1–Q10 | Honored — no visible page copy changed; no facility coordination, downsizing/estate scope, discount, membership/credential, care-scope, or single-provider claim published. Gated items appear in the datasets only as explicit non-claims |

## Datasets retype mapping (datasets-senior.json, 8 nodes, all dateModified 2026-10-29)

- D1 Senior Move Operations → **Service**
- D2 Transition & Dwelling Operations → **Dataset**
- D3 Senior Household & Keepsake Taxonomy → **Dataset**
- D4 Branch Dispatch Network → **Dataset**
- D5 Commercial Terms & Cost Drivers → **Article** (company term = flat-rate-in-writing only; every dollar figure labeled domain education from published industry sources)
- D6 Buyer Personas & Trigger Events → **Article**
- D7 Protection, Handling & Building Compliance → **Service**
- D8 Service Areas, Dispatch & Quote Path → **Dataset**

Totals: **Dataset 4 (CC BY 4.0) / Service 2 / Article 2**, no FAQPage (the source carries no discrete Q&A pairs for the datasets file; the page's own FAQ is unchanged). @ids `#dataset-senior-*`; about → #service-senior-moving; spatialCoverage → both Place @ids; sameAs → the senior page.

## Canonical node end state

Exactly one #service-senior-moving per graph, core fields identical in head (25) + entity (33) + best (80): name Senior Moving, alternateName Senior Advocacy Logistics, serviceType "Senior Moving", provider #organization, url https://theflatratemovers.com/senior-moving/, areaServed → #winchester / #martinsburg (Place nodes carry the 31/35 footprint), full 713-char description. Graphs byte-identical across machine data/, workspace mirror, public/.

## Gate (all passed pre-deploy)

Backups first (out/senior-batch/backup-2026-10-29/, unpushed); all merge preconditions asserted against current live state (graph counts, footprints, DB baseline 32/93/40/14/66/7 + integrity ok, canonical rows 23); build ran clean on first execution. node --check BOTH inline scripts OK (885 + 124,113 chars pre-edit sizes; pageMeta untouched); all 11 ld+json blocks in index.html parse; router audit 155/155 clean; **verify.js 71/71 PASS**; forbidden scans zero in every new published block (bare "flat quote", USDOT, MC patterns, Spearman, Around Town, DESIGN 6, "attest" in new prose, subcontract, "crew page", "temp labor", NASMM) and index-wide deltas vs backup all 0→0 for attest/USDOT/Spearman/Around Town/DESIGN 6/Bristow/subcontract; in-div JSON-LD parse-equal to the datasets file; branches distinct everywhere; R7 re-checked by pattern only on the live payload (heroQuote/quoteForm/hqWalk/qWalk + CTA present) — no quote test post.

## Live verification (no sampling)

- datasets-senior.json → 200 + application/json; 8 nodes; 4 Dataset / 2 Service / 2 Article; all dateModified 2026-10-29; CC BY 4.0 on all Dataset nodes.
- Live head graph 25 nodes with exactly one senior node (hub url, alternateName, 713-char description); live entity 33 / best 80, same node state.
- Live senior div carries the datasets block parse-equal to the live datasets file; Developer "Senior data" card present.
- ai-sitemap live 23/155/49 with the refreshed senior description (713 chars) and both new keywords; sitemap live 155 locs.
- llms.txt + data txt live with the dated senior entries.
- Route proofs: /senior-moving/, /videos/, /moving-and-storage/ each 200, and the live payload carries each slug's div + pageMeta key + router array entry (live pageMeta 155 keys == live array 155, sets equal).
- Regression sweep: ALL 50 public JSON files → 200 + application/json, zero exceptions (incl. datasets-residential/commercial/gun-safe/office/local-regional/long-distance/moving-and-storage/videos, videos.json, senior-moving.json, all per-page JSONs).
- Index: tagline present, CTA present, 0 "DESIGN 6", quote markers intact. DB: service 32 / attestation 96 / integrity ok.

## GitHub (same motion, read-back verified)

- **theflatratemovers-ai:** llms.txt, ai-sitemap.json, the-flat-rate-movers-data.txt; data/entity-graph-full.json, data/best-json-entity-graph-full.json, data/datasets-senior.json; schemas/senior-moving.json. (Commit hash + read-back in the batch handoff.)
- **the-flat-rate-machine:** data/entity-graph.json, data/best-json-entity-graph.json; the senior-deep package (5 files); out/senior-batch/ (build script, research-doc copy, this report). Rubric DB binary and backups NOT pushed.
- **Gist graph (ai repo data/entity-graph.json): SHA cda897e61319a0f52172ef1365402e4d7179cddf before the pushes; re-verified after (see handoff). Untouched by design.**

## Deviations / incidents

Only the (c) items above. One tooling incident on my side, no site impact: a live-verification snippet hit a Python quoting syntax error and was re-run clean; every check it covered was completed by the re-run. No failed deploys, no partial state, no other package touched.

## Indexing target (record only — today's quota is exhausted; tomorrow's pass queue is already set)

- https://theflatratemovers.com/senior-moving/
