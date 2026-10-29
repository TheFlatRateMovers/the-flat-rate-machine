# Long-Distance Moving deploy batch — report (2026-10-29)

**Deploy URL:** https://841e4171.the-flat-rate-movers.pages.dev (custom domain https://theflatratemovers.com verified serving the same build)
**Counts unchanged by design:** pages 154 / services 22 / sitemap 154. No new page, no new slug.
Public JSON files 45 → 47 (+datasets-long-distance.json, +long-distance-movers-winchester-va.json).

## Reconciliation (merge-note vs current live state — the redo changed the package's assumed state)

| Merge-note step | Disposition |
|---|---|
| §1 services.json LD entry (pageCount 17) | (b) Already satisfied — verified present; pageCount recomputes to 17 from pages.json; no change |
| §2 pages.json 17 LD entries; cross-refs stay under SIR/gun-safe/packing | (b) Already satisfied — 17 entries verified; high-mass LD page still under SIR, Las Vegas page under gun-safe, interstate pack guide under packing; no re-parenting |
| §3 best graph: add ONE full Service node (was 0) | (a) Done — added; 78 → 79 |
| §3 entity graph: upgrade Martinsburg-skewed fragment in place (url = Martinsburg page, areas = Martinsburg 14) | (c) Changed in form, same end state — the redo had already removed the skew: the surviving node already carried the registry name/serviceType, the Place chain and a two-branch short description. Only the hub url and the full 357-char package description were missing; upgraded in place. Count stays 32 |
| §3 head graph: upgrade thin node (casing "Long-distance moving", 3 corridor strings as areaServed, no url) | (c) Changed in form, same end state — the redo had already unified serviceType to "Long-Distance Moving" and replaced the corridor strings with the Place chain. Only url + full description remained; surgically upgraded in place (url after provider, description last). Head stays 24. Corridor strings live in the D3 dataset representation, not as Service areaServed — as the merge-note requires |
| §3 Place footprint expand to 31/35 at merge | (b) Already satisfied by the redo — not shrunk. The new hub JSON was expanded from the live Place nodes (staged schema carried GBP 16/14) |
| §3 pageMeta svc pointers: reconcile 13 literal patterns vs 17 registry pages | (b/c) Reconciled, NO edits needed — see the pointer table below. The package's "13" counted only single-quote literal `svc:` patterns; the remaining 4 registry pages carry the pointer in the JSON-style pageMeta entries. Recount by canonical across both syntaxes: 17/17 |
| §3 authorization wording: no authority claim / no number without Q1 answer; "no authority" → STOP for wording review | (c) Superseded by Henry's 2026-10-29 answer — Q1 gate RETIRED. Interstate moves performed and supported; satellite scope language stands untouched; NO number published; NO authority-mechanics copy added. D3 published on the confirmed branch (below). The "if no authority" wording-review branch is VOID and was not run |
| §4 DB service row | (b) Canonical row present (1 row), not duplicated. (A pre-existing page-slug service row for the hub also exists — the documented standing pattern; left in place) |
| §4 DB attestation rows (a)–(g) | (a/c) 5 rows added for facts this batch newly publishes: node completion; GSC demand evidence; datasets publication; hub JSON creation; interstate scope confirmation (the (g) gate row reworded to the confirmed disposition — no number published). Branch/GBP facts (a)–(c) already covered by existing rows — not duplicated. 81 → 86 |
| §4 DB edge rows (5 proposed) | (c) NOT done, per the brief's standing rules (edge table holds zero fragment-service edges by model). Edge stays 40 |
| §4 opening_hours rows | (b) Verified distinct/standing (14); none added |
| §4 service_area rows | (b) Verified standing (66); none added — footprint rows already cover the extended areas |
| §4 rubric_check row (R1–R5 = 3, R6 = 3, R7 = 2) | (c) NOT done, per the brief's standing rules (rubric_check is a 7-row checks catalog; no per-service rows). Scores stand in the package rubric.md |
| §5 llms.txt LD section refresh + dated entry | (a/c) Done with one change: the existing service line was a stub pointing at the homepage — refreshed IN PLACE to the hub URL + full package description + D1–D8 summary (a service-list line, not history) + dated entry appended. History preserved verbatim |
| §5 data txt refresh | (a) Dated entry appended (data txt page list carries no per-category section text to refresh) |
| §5 ai-sitemap LD entry refresh + 4 keyword additions | (a) Description replaced with the full package description. All 4 merge-note queries were absent ("winchester long distance moving company", "cross country moving company", "cross country movers", "long distance movers") — all added. Keywords 40 → 44, none dropped |
| §5 ARD catalog | (c) Unchanged — ai-catalog.json carries no per-category entries (prior-batch precedent) |
| §5 Dataset JSON-LD conversion (markup on hub + Developer entry) | (a) Done under the RETYPE rule (mapping below); markup block inside the hub div, parse-equal to the served file; Developer "Long-Distance data" card after the Videos card |
| §6 Per-page JSON ("follow-up, not this batch" in the merge-note) | (c) DONE in this batch per the deploy brief (the follow-up is now due — the serving path is proven by 20+ live per-page JSONs): long-distance-movers-winchester-va.json created (5 nodes). Branch JSON (Martinsburg) already live, unchanged |
| §6 NO new page div / NO new pageMeta entry / sitemap no change / breadcrumb verify | (b) Honored — hub pageMeta entry exists with svc #service-long-distance and unchanged canonical/desc; sitemap 154; breadcrumb pattern stands |
| §7/§8 gated items (Q2–Q10) | Honored — no visible page copy changed; no delivery-window practice, valuation offering, estimate-type mapping, tracking, SIT terms, access scope, or vehicle-transport claims published; Phase E depth brief stays staged guidance. The package's storage cross-reference was NOT imported (stale; storage package is source of truth) — storage appears only as a named cross-reference in D8 |

## D3 authorization disposition

Henry answered §8 Q1 on 2026-10-29 (operating model: leased trucks; contractors hold their own authority and proper equipment; "interstate authority is good... stop making a issue"). Applied: D3 (Route, Corridor & Destination Network) publishes the network and destination lanes as published scope on the confirmed basis — no GATED/unconfirmed flag language, no authority-mechanics wording, no number. D2's interstate band likewise carries the scope without the build-time gate framing. D7's authorization row is omitted entirely from the published dataset (the closed question stays closed; no USDOT string appears in any file this batch touched).

## pageMeta pointer reconciliation (before → after, per pointer)

Method: pageMeta entries parsed by canonical URL across both syntaxes (single-quote `svc:'…'` and JSON-style `"svc":"…"`); registry = pages.json entries carrying service-long-distance (17).

| # | Page (canonical) | Before | After |
|---|---|---|---|
| 1 | /category/long-distance-moving/ | #service-long-distance | unchanged |
| 2 | /category/winchester-va/residential-logistics/relocation-services/moving/long-distance/ | #service-long-distance | unchanged |
| 3 | /interstate-moving-guide-winchester-va/ | #service-long-distance | unchanged |
| 4 | /interstate-moving-network/ | #service-long-distance | unchanged |
| 5 | /interstate-moving-winchester-va/ | #service-long-distance | unchanged |
| 6 | /long-distance-cross-country-moving/ | #service-long-distance | unchanged |
| 7 | /long-distance-movers-martinsburg-wv/ | #service-long-distance | unchanged |
| 8 | /long-distance-movers-miami/ | #service-long-distance (JSON style) | unchanged |
| 9 | /long-distance-movers-winchester-va-guide/ | #service-long-distance (JSON style) | unchanged |
| 10 | /long-distance-movers-winchester-va/ (hub; pageMeta key `longdistance`) | #service-long-distance | unchanged |
| 11 | /the-data-science-of-displacement-how-predictive-analytics-is-redefining-the-mid-atlantic-relocation-path/ | #service-long-distance (JSON style) | unchanged |
| 12 | /the-strategic-roadmap-for-long-distance-residential-relocation/ | #service-long-distance (JSON style) | unchanged |
| 13 | /virginia-to-california-movers/ | #service-long-distance | unchanged |
| 14 | /virginia-to-florida-movers/ | #service-long-distance | unchanged |
| 15 | /virginia-to-nevada-movers/ | #service-long-distance | unchanged |
| 16 | /virginia-to-new-york-movers/ | #service-long-distance | unchanged |
| 17 | /virginia-to-texas-movers/ | #service-long-distance | unchanged |

Result: 17/17 registry pages already pointed correctly; 0 fixes; 0 pointers outside the registry set.

## End state / node counts

| Graph | Before | After | LD node |
|---|---|---|---|
| Head (in index.html) | 24 | 24 | 1 → 1 upgraded (hub url, 357-char desc, Place chain) |
| Entity | 32 | 32 | 1 → 1 upgraded |
| Best | 78 | 79 | 0 → 1 added |

Canonical node identical in all three (core fields verified equal): @id `https://theflatratemovers.com/#service-long-distance`, name + serviceType "Long-Distance Moving", url `https://theflatratemovers.com/long-distance-movers-winchester-va/`, full 357-char package description with both branches at equal weight, areaServed → #winchester / #martinsburg (Place chain; footprint 31/35 lives on the Place nodes). Graphs byte-identical across machine data/, workspace mirror, public/.

## Datasets — retype mapping (datasets-long-distance.json, 8 nodes, all dateModified 2026-10-29)

| Dataset | Final @type | Note |
|---|---|---|
| D1 Long-Distance Move Operations | Service | operations prose (LR D1 precedent) |
| D2 Distance Bands & Shipment Sizes | Dataset | tabular bands/weights reference |
| D3 Route, Corridor & Destination Network | Dataset | route/lane reference; confirmed-branch scope |
| D4 Delivery Windows & Transit Operations | Article | domain models only — prose education, no company practice |
| D5 Commercial Terms & Cost Drivers | Article | FMCSA-cited domain education; 110% rule, FVP $6/lb min, RVP $0.60/lb, >$100/lb declaration — labeled domain, never company prices/policy |
| D6 Buyer Personas & Trigger Events | Article | personas prose |
| D7 Protection, Inventory & Compliance | Service | protection/compliance pattern (LR D7 precedent); authorization row omitted |
| D8 Service Areas, Dispatch & Quote Path | Dataset | branch/dispatch/quote reference |

Totals: **Dataset 3 (CC BY 4.0) / Service 2 / Article 3**, no FAQPage. @ids `#dataset-long-distance-*`.

**Hub JSON (new):** long-distance-movers-winchester-va.json — 5 nodes (Service hub url + Place chain, Organization, both Places at 31/35 with per-branch ratings/hours, BreadcrumbList).

## Rubric DB
Backed up first (~/workspace/the-flat-rate-machine/out/long-distance-batch/backup-2026-10-29/, unpushed). +5 attestation rows (81 → 86). Final: service 31 / attestation 86 / edge 40 / opening_hours 14 / service_area 66 / rubric_check 7; integrity ok.

## Gate (all passed pre-deploy)
node --check both inline scripts OK (885 + 123,395 chars — big script grew only by the dataset block + Developer card); **verify.js 71/71 PASS** (run pre-deploy and re-run post-build); counts 154/22/154, ai-sitemap 22/154/44; exactly one LD node per graph with hub url; branches distinct everywhere; forbidden scans zero in all new files and zero DELTAS vs backup in index.html/llms.txt/data txt/graphs (llms "attest" 2→2 = pre-existing dated history only; data txt "USDOT" 1→1 = pre-existing entry, untouched); hub markup parse-equal to the served datasets file; zero placeholders, zero private client data; R7 re-checked by pattern only — no quote test post.

## Live verification (no sampling — all changed/new URLs + full JSON sweep)
- Hub page → 200; served index carries the LD dataset block parse-equal to the live datasets file + Developer card; tagline present, CTA "Get My Flat Rate Quote" ×379, **0 "DESIGN 6"**, 0 Bristow, 0 USDOT, markers heroQuote/quoteForm/hqWalk/qWalk intact.
- datasets-long-distance.json → 200 + application/json; 8 nodes; 3 Dataset / 2 Service / 3 Article; all dateModified 2026-10-29; CC BY 4.0 on Dataset nodes.
- long-distance-movers-winchester-va.json → 200 + application/json; 5 nodes; Service url = hub; Places 31/35 with ratings 5.0 / 4.7 distinct.
- Live entity 32 / best 79 / head 24 — exactly one LD node each, hub url, 357-char description.
- ai-sitemap live 22/154/44 with refreshed LD description + all 4 new keywords; sitemap live 154 locs; llms.txt + data txt live with the new line/entries.
- ALL 47 public JSON files → 200 + application/json (full sweep, zero exceptions), including datasets-residential/commercial/gun-safe/office/local-regional/videos, videos.json, and every per-page JSON.

## GitHub (same motion, read-back verified at HEAD)
- **theflatratemovers-ai:** 7 files (llms.txt, ai-sitemap.json, the-flat-rate-movers-data.txt at root; data/entity-graph-full.json, data/best-json-entity-graph-full.json, data/datasets-long-distance.json; schemas/long-distance-movers-winchester-va.json). Commit hash reported in the batch handoff.
- **the-flat-rate-machine:** data/entity-graph.json, data/best-json-entity-graph.json, out/pages/long-distance-deep/ (5 package files), out/long-distance-batch/ (build script, this report, research-doc copy). Rubric DB binary and backups NOT pushed.
- **Gist graph (ai repo data/entity-graph.json): SHA cda897e61319a0f52172ef1365402e4d7179cddf before AND after. Untouched.**

## Deviations / incidents
All deviations are the (c) items in the reconciliation table, each with its reason — chiefly: the redo had already removed the entity skew and upgraded most of the head node; the merge-note's per-page-JSON "follow-up" was executed in this batch per the deploy brief; edge/rubric_check rows withheld per the brief's standing rules; the llms stub line (homepage URL) was refreshed in place rather than duplicated; the §4(g) gate attestation row was reworded to the confirmed disposition. One build-tooling incident, pre-build and harmless: the first write of the build script was truncated mid-file by the file tool; the script was rewritten in chunks, compiled clean, and ran end-to-end on its first execution with all preconditions asserted. No failed deploys, no partial state. No other package was touched.

## Indexing targets (for the Search Console pass)
- https://theflatratemovers.com/long-distance-movers-winchester-va/
- https://theflatratemovers.com/long-distance-movers-martinsburg-wv/
- https://theflatratemovers.com/long-distance-movers-winchester-va.json
- https://theflatratemovers.com/datasets-long-distance.json
