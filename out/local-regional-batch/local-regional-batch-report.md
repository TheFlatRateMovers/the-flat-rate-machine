# Local and Regional Moving deploy batch — report (2026-10-29)

**Deploy URL:** https://d5c1e846.the-flat-rate-movers.pages.dev (custom domain https://theflatratemovers.com serving the same build, verified on both)
**Counts unchanged by design:** pages 153, services 22, sitemap 153. No new page, no new slug.
**Gate:** node --check both inline scripts OK (885 + 122,912 chars — identical sizes to the office batch, scripts untouched); verify.js **71/71 PASS** pre-deploy; branches distinct; forbidden scans zero in all new content (classifications below); no quote test sent; no GBP/DNS edits. R7 deploy-time re-check done by page/syntax pattern only (CTA "Get My Flat Rate Quote" present, quote toggle + survey markers intact) — no test post.

## Reconciliation — merge-note steps vs current live state

The package merge-note was written against the pre-redo graph state (duplicate entity fragments, thin head node, best graph at zero). The full-site redo changed that state before this batch ran. Every merge-note step, reconciled:

| Merge-note step | Disposition |
|---|---|
| §1 services.json: verify LR entry exists, pageCount 3, no new entry | (b) Already satisfied — verified present ("Local and Regional Moving", pageCount 3); no change |
| §2 pages.json: verify hub + 2 branch entries live, no new entry | (b) Already satisfied — all 3 present, status live; no change |
| §3 Entity graph: DELETE both duplicate #service-local-regional nodes, REPLACE with one canonical | (c) Changed — the redo dedupe had already collapsed the pair (39→32 nodes); exactly ONE node existed at batch start, already carrying the registry name/serviceType and the Place chain, but with NO url and the short registry description. This batch UPGRADED it in place: hub url + full package description (511 chars). Count stays 32 |
| §3 Best graph: ADD the canonical node (was zero fragment occurrences) | (a) Done in this batch — node added; 77 → 78 nodes. The two page-slug nodes (local-regional-movers-winchester-va/#service, local-regional-movers-martinsburg-wv/#service) left untouched per §8 Q9c |
| §3 Head graph: upgrade the thin node ("Local moving", string areas, no url) to the full chain | (c) Changed in form, same end state — the redo had already given the head node the registry serviceType "Local and Regional Moving" and the Place-chain areaServed; what remained thin was the missing url + short description. Surgically upgraded in place: hub url inserted after provider, full package description. Head stays 24 nodes |
| §3 Place areaServed: expand to full footprint 31/35 at merge | (b) Already satisfied by the redo — live Place nodes already carry Winchester 31 / Martinsburg 35 in both machine graphs; this batch did not shrink them. The hub JSON was expanded from the staged GBP 16/14 to 31/35 from the live Place nodes |
| §3 Do not touch Organization / other services / gist graph | Honored — gist graph verified 2,486 bytes at HEAD before and after both pushes |
| §3 Services ItemList entry kept as-is | (b) Already satisfied — entry already points at the fragment @id; unchanged |
| §3 Bristow: no area/page/dataset entry | Honored and extended — the string was kept out of every file this batch touched, including the new DB demand row (see §4) and the llms/data dated entries (omitted-fields lists do not name it) |
| §4 service row: verify canonical row exists | (b) Already satisfied — canonical row present (service_id = #service-local-regional, 1 row); not duplicated |
| §4 attestation rows (a)–(f), only if not already covered | (a/c) Done as 5 rows for facts this batch newly publishes (published scope; GSC demand evidence; canonical-node completion; datasets publication; hub JSON creation). Branch facts (a)/(b) and GBP/footprint (c) were already covered by existing rows (Phase A + earlier batch pattern rows), so they were not duplicated. (f) graph defect + fix is folded into the canonical-node row. Attestation 68 → 73 |
| §4 edge rows (service→provider, org→location ×2, service→areaServed ×2) | (c) Changed — NOT done, per the batch brief's explicit rule (NO edge rows; the edge table holds zero fragment-service edges by model — redo decisions). Edge count unchanged at 40 |
| §4 rubric_check row for local-regional-moving (R1–R5 = 3, R6 = 3, R7 = 2) | (c) Changed — NOT done, per the batch brief's explicit rule (the rubric_check table is a 7-row checks catalog, not per-service scores). Count unchanged at 7 |
| §4 opening_hours rows: none new, verify distinct | (b) Already satisfied — 14 rows verified; no merged row added |
| §4 service_area rows: none new for GBP lists; footprint rows only if merge expands Places | (b) Already satisfied — 66 rows stand; the footprint expansion itself was already done by the redo, so no rows added here |
| §5 llms.txt: refresh the Local and Regional Moving section from D1–D8 + dated entry | (a/c) Done with one change: llms.txt had NO dedicated Local and Regional Moving service line (only the two branch-page links in the page list) — this batch ADDED the service line after the Office Moving line (package description + D1–D8 summary + datasets/hub-JSON links) and appended the dated batch entry. History lines preserved verbatim |
| §5 data txt: same section refresh | (a) Done — dated batch entry appended (the data txt page list carries no hub lines for any category; hubs are recorded in dated entries, so no page-list line was added) |
| §5 ai-sitemap: refresh LR entry + keyword additions from real GSC queries ("movers near me", "winchester local moving company", "movers winchester va", "winchester movers", "movers martinsburg wv") | (a) Done — LR description replaced with the full package description. Of the five merge-note queries, three were already in the keyword list ("movers near me", "winchester movers", "movers martinsburg wv"); only the two missing ones were added — "winchester local moving company" and "movers winchester va". Keywords 38 → 40, none dropped |
| §5 ARD catalog refresh | (c) Changed — ai-catalog.json carries no per-category dataset entries; left unchanged, as in every prior batch |
| §5 Dataset JSON-LD: convert D1–D8 at merge, page markup on hub + Developer entry, CC BY 4.0, dateModified = deploy date | (a) Done under the post-redo RETYPE rule (mapping below) — page-level markup block inside the hub div (page-local-regional-moving), parse-equal to the served file, plus a Developer-page "Local & Regional data" card |
| §6 No new page div / no new pageMeta; svc pointers verified | (b) Already satisfied — 3 pageMeta svc pointers already aim at #service-local-regional (5 total occurrences in index pre-build: head node + 3 pageMeta + ItemList); no div or pageMeta added |
| §6 Per-page JSONs on the verified serving path (hub + branch) | (a) Done — hub JSON created (below). Branch JSONs already live (5 nodes each, branch-url Service nodes chained to the branch LocalBusiness node); the merge-note calls for no branch-JSON changes, so they are unchanged and reported here |
| §6 Sitemap: no count change | Honored — 153 before and after |
| §6 Breadcrumb: verify, do not duplicate | (b) Already satisfied — hub JSON carries the package BreadcrumbList (Home › Local & Regional Moving); page trail unchanged |
| §7 NOT in package (new hub page, same-day page, Bristow page, small-job page, Phase E visible-copy depth, §8 gated fields, storage claims) | Honored — NO visible page copy was changed; the Phase E brief stays staged guidance; all §8 items (same-day/next-day availability, mileage boundary, small-job scope, valuation offering, debris scope, prohibited-items list, apartment capability, local pricing beyond flat-rate-in-writing, Bristow assignment) remain unpublished and unclaimed |

## What shipped

1. **Canonical local-regional node end state** — exactly one #service-local-regional in each graph, same @id, url = https://theflatratemovers.com/local-regional-moving/, name + serviceType "Local and Regional Moving" (registry name; the head node's older "Local moving" casing was already superseded by the redo), full package description (511 chars), areaServed via #winchester / #martinsburg (full footprint on the Place nodes):
   - Head graph: 24 nodes (LR node upgraded in place).
   - Entity graph: 32 nodes (upgraded in place; was already deduped by the redo).
   - Best graph: 77 → 78 nodes (fragment node added; page-slug nodes untouched).
   - Graphs mirrored byte-identical across machine data/, the workspace mirror, and public/ (verify.js byte-identity checks pass).
2. **datasets-local-regional.json (NEW)** — 8 nodes from D1–D8 under the RETYPE rule (mapping below), all dateModified 2026-10-29, matching markup block inside the hub div (parse-equal), Developer "Local & Regional data" card added after the Office data card.
3. **local-regional-moving.json (NEW)** — hub per-page JSON from the package schema: 5 nodes (Service with hub url + Place chain, Organization, both Places expanded to the full footprint 31/35 with per-branch ratings/hours, BreadcrumbList).
4. **Visibility** — ai-sitemap LR description refreshed + 2 keywords (38 → 40); llms.txt LR service line added + dated entry; data txt dated entry; Developer card (above). ARD unchanged (no per-category entries exist).
5. **Rubric DB** — backed up first (out/local-regional-batch/backup-2026-10-29/, unpushed); canonical service row verified present, not duplicated; +5 attestation rows (68 → 73); final counts: service 31, attestation 73, edge 40, opening_hours 14, service_area 66, rubric_check 7; integrity ok. No rubric_check row, no edge rows (brief rule).

## Retype mapping — local-regional datasets D1–D8

| Dataset | Node @id (suffix) | Type | Reason |
|---|---|---|---|
| D1 Local & Regional Move Operations | #dataset-local-regional-operations | Service | Service-description prose (the operation chain as offered) |
| D2 Move Sizes & Access Operations | #dataset-local-regional-sizes-access | Dataset | Reference data (size bands, dwelling types, access taxonomy + labeled market crew/time bands) |
| D3 Local/Regional Service Taxonomy | #dataset-local-regional-taxonomy | Dataset | Reference taxonomy (bands, job types, scope, cross-references) |
| D4 Dispatch Network & Corridor Chain | #dataset-local-regional-dispatch | Dataset | Reference data (branch facts, footprint, corridors, assignment rule) |
| D5 Commercial Terms & Cost Drivers | #dataset-local-regional-terms | Article | Guide prose; company terms = flat-rate-in-writing only, all figures labeled market data |
| D6 Buyer Personas & Trigger Events | #dataset-local-regional-personas | Article | Audience/guide prose (personas, triggers, labeled seasonality) |
| D7 Protection, Handling & Building Compliance | #dataset-local-regional-protection-compliance | Service | Service-description prose (protection as performed; building items as planning inputs) |
| D8 Service Areas, Dispatch & Quote Path | #dataset-local-regional-areas-quote | Dataset | Reference data (branch facts, footprint, dispatch, quote path) |

Totals: Dataset 4 (CC BY 4.0), Service 2, Article 2. No FAQPage node — no D-record carries discrete Q&A pairs. @ids follow the established #dataset-local-regional-* pattern (the package prescribes D1–D8 identities by title; no conflicting @ids existed). Domain figures appear only inside the D5 Article, labeled as industry market data wherever they appear. "Movers near me" is recorded as shared intent (local + residential) in the D6 Article and the DB demand row — never claimed exclusively for this service.

## Node counts before / after

| Graph | Before | After | LR nodes |
|---|---|---|---|
| Head (in index.html) | 24 | 24 | 1 → 1 (upgraded) |
| Entity | 32 | 32 | 1 → 1 (upgraded) |
| Best | 77 | 78 | 0 → 1 (added) |

## Gate detail (pre-deploy)

- node --check on BOTH inline scripts of the final index.html (885 and 122,912 chars): OK.
- verify.js: 71/71 PASS.
- Counts: pages 153 / services 22 / sitemap 153 / ai-sitemap 22/153/keywords 40. Public JSON files: 39 → 41 (datasets-local-regional.json + local-regional-moving.json are new).
- Forbidden scans over the NEW files (datasets-local-regional.json, local-regional-moving.json): zero for attest / gated / Spearman / Around Town / temp labor / crew page / subcontract / USDOT / bare "flat quote" / Bristow.
- Index-wide deltas vs the pre-build backup: attest 0→0, Spearman 0→0, Around Town 0→0, crew page 0→0, subcontract 0→0, USDOT 0→0, bare "flat quote" 0→0, Bristow 0→0. Two pre-existing single hits, unchanged by this batch and classified: "gated" 1→1 is the substring inside "segregated" in transloading page copy (not the word); "temp labor" 1→1 is the owner-supplied industrial negation "Self-managed teams — not individual temp labor" (documented standing exception). llms.txt "attest" 2→2 = pre-existing dated-history lines, unchanged; all new llms/data content is clean.
- Branches distinct everywhere; zero placeholders; zero private client data; zero named federal/private clients. No quote test post.

## Live verification (deploy URL + custom domain, both PASS, no sampling)

- Hub https://theflatratemovers.com/local-regional-moving/ → 200; served index carries the local-regional dataset block (8 #dataset-local-regional-* refs, parse-equal to the live datasets file) and the Developer Local & Regional data card.
- datasets-local-regional.json → 200 + application/json; 8 nodes; types 4 Dataset / 2 Service / 2 Article; all dateModified 2026-10-29; Dataset nodes CC BY 4.0. Deploy-URL copy byte-equal to the custom-domain copy after parse.
- local-regional-moving.json → 200 + application/json; 5 nodes; Service url = hub; Places at 31/35.
- Live entity graph 32 nodes / best 78 nodes; exactly one local-regional node each, hub url, 511-char description. Live head graph 24 nodes, LR node with hub url + Place chain + full description.
- ai-sitemap live: services 22 / hasPart 153 / keywords 40, LR description = full package description. Sitemap live: 153 locs.
- Tagline (265 mentions) + "Get My Flat Rate Quote" (375 mentions) present; 0 "DESIGN 6"; quote markers heroQuote/quoteForm/hqWalk/qWalk intact.
- Prior files still application/json: datasets-residential, datasets-commercial, datasets-gun-safe, datasets-office, residential-moving.json, commercial-moving.json, gun-safe-movers.json, commercial-office-moving-2.json.

## GitHub (same motion, read-back verified at HEAD)

- theflatratemovers-ai: 7 files (llms.txt, ai-sitemap.json, the-flat-rate-movers-data.txt at root; data/entity-graph-full.json, data/best-json-entity-graph-full.json, data/datasets-local-regional.json; schemas/local-regional-moving.json). Commit hash reported in the batch handoff.
- the-flat-rate-machine: data/entity-graph.json, data/best-json-entity-graph.json, out/pages/local-regional-deep/ (5 package files), out/local-regional-batch/ (build script, this report, research-doc copy). Rubric DB binary and backups NOT pushed.
- Gist graph data/entity-graph.json: 2,486 bytes before and after — untouched.

## Deviations and incidents

- Deviations from the merge-note are itemized in the reconciliation table above (each marked (c) with its reason): entity dedupe already done by the redo; head serviceType/Place chain already upgraded by the redo (only url + description remained); edge rows and rubric_check row not added per the batch brief's standing rules; ARD left unchanged; llms service line created rather than refreshed (none existed); keyword additions limited to the two not already present; the Bristow demand figure was deliberately NOT re-entered into the new DB attestation row or the llms/data dated entries (it remains recorded in the package doc and merge-note §4(d)) — a tightening of the brief's Bristow rule, not a relaxation.
- Branch-page JSONs (local-regional-movers-winchester-va.json, local-regional-movers-martinsburg-wv.json): live, 5 nodes each, unchanged — the merge-note calls for no changes to them.
- Page copy: none changed. The package stages no visible-copy edits (its Phase E depth brief is guidance for a later batch); the only hub-div change is the dataset markup block, and the only Developer-div change is the Local & Regional data card.
- Build: one clean run end to end (all preconditions asserted in the build script passed on first run); no failed runs, no partial state.

## Indexing targets (for Mira's Search Console pass)

- https://theflatratemovers.com/local-regional-moving/ (hub)
- https://theflatratemovers.com/local-regional-movers-winchester-va/
- https://theflatratemovers.com/local-regional-movers-martinsburg-wv/
- https://theflatratemovers.com/local-regional-moving.json
- https://theflatratemovers.com/datasets-local-regional.json
