# Office Moving deploy batch — report (2026-10-29)

**Deploy URL:** https://673e5053.the-flat-rate-movers.pages.dev (custom domain https://theflatratemovers.com serving the same build, verified on both)
**Counts unchanged by design:** pages 153, services 22, sitemap 153. No new page, no new slug.
**Gate:** node --check both inline scripts OK (885 + 122,912 chars); verify.js **71/71 PASS** pre-deploy; branches distinct; forbidden scans zero in all new content (pre-existing dated-history hits in llms/data unchanged); no quote test sent; no GBP/DNS edits.

## Reconciliation — merge-note steps vs current live state

The package merge-note was written against the pre-redo graph state. The full-site redo + cleanup deploys changed that state before this batch ran. Every merge-note step, reconciled:

| Merge-note step | Disposition |
|---|---|
| §1 services.json: verify office entry exists, pageCount 3, no new entry | (b) Already satisfied — verified present ("Office Moving", pageCount 3); no change |
| §2 pages.json: verify hub + 2 branch entries, no new entry | (b) Already satisfied — all 3 present, status live; no change |
| §3 Entity graph: REPLACE two duplicate #service-office-moving nodes with one canonical | (c) Changed — the redo dedupe had already collapsed the duplicates (39→32 nodes); exactly ONE node existed at batch start. This batch UPGRADED it in place: added hub url + full package description (545 chars). Count stays 32 |
| §3 Best graph: ADD the canonical node (was zero) | (a) Done in this batch — node added; 76 → 77 nodes |
| §3 Head graph: verify office node, upgrade to canonical chain, never a second node | (a) Done in this batch — one thin node existed (no url, 146-char description); surgically upgraded in place: hub url inserted after provider, full package description. Head stays 24 nodes |
| §3 Place areaServed: expand to full footprint 31/35 at merge | (b) Already satisfied by the redo — live Place nodes already carry Winchester 31 / Martinsburg 35 in both machine graphs; this batch did not shrink them. The hub JSON (below) was expanded from the staged GBP 16/14 to 31/35 from the live Place nodes |
| §3 Do not touch Organization / other services / gist graph | Honored — gist graph verified 2,486 bytes before and after both pushes |
| §4 service row: verify canonical row exists | (b) Already satisfied — canonical row present (22 canonical); not duplicated |
| §4 attestation rows (a)–(f) | (a/c) Done as 5 rows for facts this batch newly publishes (published scope; GSC demand evidence; canonical-node completion; datasets publication; hub JSON creation). Branch facts (a)/(b) and GBP/footprint (c) were already covered by existing rows (commercial-batch pattern rows + Phase A), so they were not duplicated. Attestation 63 → 68 |
| §4 edge rows (add service→provider/location/areaServed edges; remove duplicate-node edges) | (c) Changed — NOT done, per the batch brief's explicit rule (NO edge rows; the edge table holds zero fragment-service edges by model — recorded in the redo decisions). Edge count unchanged at 40 |
| §4 rubric_check row for office | (c) Changed — NOT done, per the batch brief's explicit rule (the rubric_check table is a 7-row checks catalog, not per-service scores). Count unchanged at 7 |
| §4 opening_hours / service_area rows: verify only | (b) Already satisfied — 14 / 66 rows verified; no additions |
| §5 llms.txt office section refresh + dated entry | (a/c) Done with one change: llms.txt had NO dedicated Office Moving service line (only the Commercial and Office Moving line) — this batch ADDED the office line after the commercial line (package description + D1–D8 summary + datasets/hub-JSON links) and appended the dated batch entry. History lines preserved verbatim |
| §5 data txt office section refresh | (a) Done — dated batch entry appended (the data txt page list carries no hub lines for any category; hubs are recorded in dated entries, so no page-list line was added) |
| §5 ai-sitemap: refresh office entry + keyword additions | (a) Done — office description replaced with the full package description. Keywords: all four merge-note queries are real GSC queries; "corporate movers winchester va" and "business moving companies near me" were already present (added by the commercial batch), so only the two missing ones were added — "office moving company winchester va" and "virginia flat rate office moving company". Keywords 36 → 38, none dropped |
| §5 ARD catalog refresh | (c) Changed — ai-catalog.json carries no per-category office/dataset entries (2,293 bytes, zero office hits); left unchanged, as in every prior batch |
| §5 Dataset JSON-LD D1–D8 on hub page + Developer entry, CC BY 4.0, dateModified = deploy date | (a) Done under the post-redo RETYPE rule (below) — page-level markup block inside the hub div (page-office), parse-equal to the served file, plus a Developer-page "Office data" card |
| §6 No new page div / no new pageMeta; svc pointers verified | (b) Already satisfied — 5 pageMeta svc pointers already aim at #service-office-moving; no div or pageMeta added |
| §6 Per-page JSON on the verified serving path | (a) Done — hub JSON created (below). Branch JSONs already live; merge-note does not call for branch-JSON changes, so they are unchanged (state: 5 nodes each, branch-url Service nodes, live) |
| §6 Sitemap: no count change | Honored — 153 before and after |
| §6 Breadcrumb: verify, do not duplicate | (b) Already satisfied — hub JSON carries the package BreadcrumbList (Home › Office Moving); page trail unchanged |
| §7 NOT in package (Phase E visible-copy depth brief, dedicated corporate page, §8 gated items) | Honored — NO visible page copy was changed; the Phase E brief stays staged guidance; all §8 items (after-hours/weekend scope, COI, coordinator, size scope, IT scope beyond the IT page, confidential handling, cubicle scope, debris scope, enterprise scope) remain unpublished and unclaimed |

## What shipped

1. **Canonical office node end state** — exactly one #service-office-moving in each graph, same @id, url = https://theflatratemovers.com/commercial-office-moving-2/, serviceType "Office Moving", full package description, areaServed via #winchester / #martinsburg (full footprint on the Place nodes):
   - Head graph: 24 nodes (office node upgraded in place).
   - Entity graph: 32 nodes (upgraded in place; was already deduped by the redo).
   - Best graph: 76 → 77 nodes (fragment node added).
   - Graphs mirrored byte-identical across machine data/, the workspace mirror, and public/ (verify.js byte-identity checks pass).
2. **datasets-office.json** — 8 nodes from D1–D8 under the RETYPE rule (mapping below), all dateModified 2026-10-29, matching markup block inside the hub div (parse-equal), Developer "Office data" card added after the Commercial card.
3. **commercial-office-moving-2.json (NEW)** — hub per-page JSON from the package schema: 5 nodes (Service with hub url + Place chain, Organization, both Places expanded to the full footprint 31/35 with per-branch ratings/hours, BreadcrumbList).
4. **Visibility** — ai-sitemap office description refreshed + 2 keywords (36 → 38); llms.txt office service line added + dated entry; data txt dated entry; Developer card (above). ARD unchanged (no per-category entries exist).
5. **Rubric DB** — backed up first (out/office-batch/backup-2026-10-29/, unpushed); canonical service row verified present, not duplicated; +5 attestation rows (63 → 68); final counts: service 31, attestation 68, edge 40, opening_hours 14, service_area 66, rubric_check 7; integrity ok. No rubric_check row, no edge rows (brief rule).

## Retype mapping — office datasets D1–D8

| Dataset | Node @id (suffix) | Type | Reason |
|---|---|---|---|
| D1 Office Move Operations | #dataset-office-operations | Service | Service-description prose (the operation chain as offered) |
| D2 Office Types & Size Bands | #dataset-office-types-sizes | Dataset | Reference/tabular data (type taxonomy + labeled industry size bands) |
| D3 Workstation, Furniture & Equipment Taxonomy | #dataset-office-taxonomy | Dataset | Reference taxonomy (item classes + handling) |
| D4 Phasing Models & Day-One Planning | #dataset-office-phasing-dayone | Article | Guide/informational prose (industry phasing models, labeled) |
| D5 Commercial Terms & Cost Drivers | #dataset-office-terms | Article | Guide prose; company terms = flat-rate-in-writing only, all figures labeled industry data |
| D6 Buyer Personas & Trigger Events | #dataset-office-personas | Article | Audience/guide prose |
| D7 Building Access, Protection & Compliance | #dataset-office-access-protection | Service | Service-description prose (access as quote inputs; protection as performed) |
| D8 Service Areas, Dispatch & Quote Path | #dataset-office-areas-quote | Dataset | Reference data (branch facts, footprint, dispatch, quote path) |

Totals: Dataset 3 (CC BY 4.0), Service 2, Article 3. No FAQPage node — no D-record carries discrete Q&A pairs. @ids follow the established #dataset-office-* pattern (the package prescribes D1–D8 identities by title; no conflicting @ids existed).

## Node counts before / after

| Graph | Before | After | Office nodes |
|---|---|---|---|
| Head (in index.html) | 24 | 24 | 1 → 1 (upgraded) |
| Entity | 32 | 32 | 1 → 1 (upgraded) |
| Best | 76 | 77 | 0 → 1 (added) |

## Live verification (deploy URL + custom domain, both PASS, no sampling)

- Hub https://theflatratemovers.com/commercial-office-moving-2/ → 200; served index carries the office dataset block (8 #dataset-office-* refs) and the Developer Office data card.
- datasets-office.json → 200 + application/json; 8 nodes; types 3 Dataset / 2 Service / 3 Article; all dateModified 2026-10-29; Dataset nodes CC BY 4.0.
- commercial-office-moving-2.json → 200 + application/json; 5 nodes.
- Live entity graph 32 nodes / best 77 nodes; exactly one office node each, hub url, 545-char description. Live head graph 24 nodes, office node with hub url + Place chain.
- ai-sitemap live: services 22 / hasPart 153 / keywords 38. Sitemap live: 153 locs.
- Tagline + "Get My Flat Rate Quote" present (374 mentions); 0 "DESIGN 6"; quote markers heroQuote/quoteForm/hqWalk/qWalk intact.
- Prior files still application/json: datasets-residential, datasets-commercial, datasets-gun-safe, residential-moving.json, commercial-moving.json, gun-safe-movers.json.

## GitHub (same motion, read-back verified at HEAD)

- theflatratemovers-ai: 7 files (llms.txt, ai-sitemap.json, the-flat-rate-movers-data.txt at root; data/entity-graph-full.json, data/best-json-entity-graph-full.json, data/datasets-office.json; schemas/commercial-office-moving-2.json). Commit hash reported in the batch handoff.
- the-flat-rate-machine: data/entity-graph.json, data/best-json-entity-graph.json, out/pages/office-deep/ (5 package files), out/office-batch/ (build script, this report, research-doc copy). Rubric DB binary and backups NOT pushed.
- Gist graph data/entity-graph.json: 2,486 bytes before and after — untouched.
- Note: the ai repo also holds stale duplicate copies at data/ai-sitemap.json and data/the-flat-rate-movers-data.txt from an earlier layout; recent batches publish those files at the repo root, so this batch followed the same convention and did not touch the data/ duplicates.

## Deviations and incidents

- Deviations from the merge-note are itemized in the reconciliation table above (each marked (c) with its reason): entity dedupe already done by the redo; edge rows and rubric_check row not added per the batch brief's standing rules; ARD left unchanged; llms office line created rather than refreshed (none existed); keyword additions limited to the two not already present.
- Branch-page JSONs (office-moving-movers-winchester-va.json, office-moving-movers-martinsburg-wv.json): live, 5 nodes each, unchanged — the merge-note does not call for changes to them.
- Page copy: none changed. The package stages no visible-copy edits (its Phase E depth brief is guidance for a later batch); the only hub-div change is the dataset markup block, and the only Developer-div change is the Office data card.
- Build: one clean run end to end (all preconditions asserted in the build script passed on first run); no failed runs, no partial state. Three build-script assertion families (graph counts, anchor-once checks, DB counts) all passed pre-deploy.
- The stale local mirror copies of llms.txt / ai-sitemap.json / data txt under ~/workspace/theflatratemovers/ were left as-is: they are pre-existing stale working copies (the mirror ai-sitemap predates Phase A regeneration); only the two entity graphs are byte-identity-enforced mirrors (verify.js §4) and both were updated in all three locations.

## Indexing targets (for Mira's Search Console pass)

- https://theflatratemovers.com/commercial-office-moving-2/ (hub)
- https://theflatratemovers.com/office-moving-movers-winchester-va/
- https://theflatratemovers.com/office-moving-movers-martinsburg-wv/
- https://theflatratemovers.com/commercial-office-moving-2.json
- https://theflatratemovers.com/datasets-office.json
