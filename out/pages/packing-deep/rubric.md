# Packing & Unpacking — Rubric (STAGED ONLY, 2026-10-29)

**Go-live bar:** R1–R5 = 3, R6–R7 ≥ 2.
**Scores:** R1 = 3, R2 = 3, R3 = 3, R4 = 3, R5 = 3, R6 = 3, R7 = 2.
R7 is 2 (not 3) because attestation questions Q1–Q8 (§8 of the research
doc) remain open. The node is deployable; the Phase E depth brief is
gated on Henry's answers.

## Fact table (every fact: source + date; gaps named, never filled)

| # | Fact | Source | Date |
|---|---|---|---|
| 1 | Registry entry: "Packing and Unpacking", serviceType "Packing and Unpacking", pageCount 9, hub `packing-unpacking-services-2` | `data/services.json` | 2026-10-29 |
| 2 | 9 pages carry `service-packing` in `pages.json` (7 content + 2 category indexes) | `data/pages.json` | 2026-10-29 |
| 3 | pageMeta svc pointers for packing: 9, exactly the 9 pages in #2 | Live index `pageMeta` block | 2026-10-29 |
| 4 | Live index `#service-packing` occurrences: 11 = head node (1) + pageMeta (9) + `#/services` ItemList (1) | Live index fetch (browser UA) | 2026-10-29 |
| 5 | Hub `packing-unpacking-services-2`: 368 words, 6 headings, no FAQ | Live div extraction | 2026-10-29 |
| 6 | Winchester `packing-services-winchester-va`: 458 words, 6 headings, no FAQ — dedicated Winchester page EXISTS (corrects seizure plan Phase D) | Live div extraction + sitemap | 2026-10-29 |
| 7 | Martinsburg `packing-movers-martinsburg-wv`: 971 words, 8 headings, FAQ + Sources & attestation | Live div extraction | 2026-10-29 |
| 8 | Cost `packing-cost-winchester-va`: 435 words, 6 headings, no FAQ | Live div extraction | 2026-10-29 |
| 9 | Estimator page: 445 words, 6 headings, no FAQ | Live div extraction | 2026-10-29 |
| 10 | Full-service article: 450 words, 6 headings, no FAQ | Live div extraction | 2026-10-29 |
| 11 | Interstate guide: 427 words, 6 headings, no FAQ | Live div extraction | 2026-10-29 |
| 12 | Category estate-relocation: 333 words; category paper-padding: 346 words | Live div extraction | 2026-10-29 |
| 13 | Published levels: full, partial, fragile-only packing; unpacking + placement | Live hub / Winchester / Martinsburg copy | 2026-10-29 |
| 14 | Published wrap standard: blue padded blankets + clear stretch wrap, staged cleanly in the room | Live hub / Winchester copy | 2026-10-29 |
| 15 | Published escalation: high-value/fragile → white-glove handling or custom crate; export pieces → ISPM 15 | Live hub copy | 2026-10-29 |
| 16 | Published commercial terms: quoted inside one flat rate; NO published price list; estimator is not a price calculator | Live cost + estimator copy | 2026-10-29 |
| 17 | Entity graph holds `#service-packing` ONCE, Martinsburg-skewed (url = Martinsburg page; areaServed = 35 flat strings incl. conceptual labels) | `data/entity-graph.json` | 2026-10-29 |
| 18 | Best graph: ZERO `#service-packing` fragments (only page-slug `#service` nodes: export-packing page + Martinsburg packing page) | `data/best-json-entity-graph.json`, own grep 2026-10-29 | 2026-10-29 |
| 19 | Head node thin: name, serviceType "Packing services", provider, description; no url, no areaServed, no Place chain | Live index JSON-LD | 2026-10-29 |
| 20 | GSC: packing-cost page 332 impressions @ 78.4; "packing services for moving" @ 1.0 (thin, no clicks) | GSC baseline, 3 months to 2026-10-27 | 2026-10-29 read |
| 21 | SERP 2026-10-29 "packing services Winchester VA movers": TFRM 7th of 9 listed (earlier check #5; plan says 6th — order varies) | Web search | 2026-10-29 |
| 22 | Vocabulary: packing 646, unpacking 101, fragile 76, stretch wrap 49, blanket 71, label 124, inventory 27 | Live index counts | 2026-10-29 |
| 23 | Vocabulary gaps: dish pack 0, bubble wrap 0, packing paper 0, wardrobe box 0, debris 0, carton 2, tape 3, mirror carton 1, mattress bag 1 | Live index counts | 2026-10-29 |
| 24 | Winchester branch: The Flat Rate Movers, 116 W Piccadilly St Suite 11, 22601, geo 39.18711576/-78.1668352, Mon-Fri 8-6, Sat 8-4, Sun 9-4, Google 5.0/1 | Verified branch record | 2026-10-27/28 |
| 25 | Martinsburg branch: Flat Rate Movers Martinsburg WV, 736 Williamsport Pike Suite 2, 25404, geo 39.48319665/-77.94760443, Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google 4.7/6 | Verified branch record | 2026-10-27/28 |
| 26 | Phone +1-540-422-2153; founded 2010-06; tagline "Guaranteed Flat Rate or Your Move is Free!" | Verified company record | 2026-10-27/28 |
| 27 | Full footprint at merge: Winchester 31, Martinsburg 35, shared 14 | GeoJSON 52 features | 2026-10-29 |
| 28 | ISPM 15 + custom crating are SEPARATE categories — cross-referenced, never duplicated | Registry + seizure plan | 2026-10-29 |
| 29 | Domain research: packing levels, materials, labeling/inventory discipline, buyer personas, process steps | Web research | 2026-10-29 |

## Named gaps (open, not filled)

- **G1 — Debris removal:** 0 site mentions; DOMAIN only; attestation Q1.
- **G2 — Materials beyond blankets/stretch wrap:** dish barrels, wardrobe
  boxes, bubble wrap, packing paper, tape, mattress bags, mirror/TV
  cartons — all DOMAIN until Q2 confirms supply.
- **G3 — Pack-only / unpacking-only standalone offers:** DOMAIN, Q3.
- **G4 — Pack timing:** day-before vs same-day, Q4.
- **G5 — Packing for storage:** gated on storage activation, Q5.
- **G6 — Crew-packed vs owner-packed liability/valuation:** DOMAIN, Q6.
- **G7 — No-pack list:** DOMAIN convention, no company list, Q7.
- **G8 — Unpacking depth ("place" = surfaces vs full setup):** Q8.
- **G9 — Martinsburg "Sources & attestation" content:** not extracted;
  merge-time read required (research doc §8 verification step).
- **G10 — Cost-page position (78.4):** diagnosed (§7), fixable only via
  the Phase E depth brief + node merge, then a Phase H re-pull.

## Scoring rationale

- **R1 (identity) = 3:** one canonical @id, registry name used,
  provider → Organization → both Places, branches distinct, ratings
  per-branch only.
- **R2 (scope) = 3:** three published levels + unpacking + wrap
  standard + escalations, all traced to live copy; domain items
  explicitly labeled, never presented as scope.
- **R3 (evidence) = 3:** 29-row fact table, every row sourced + dated;
  live div word counts (not whole-file counts); GSC + SERP baselines.
- **R4 (graph) = 3:** merge path fixes skew + absence + thin head
  without creating a duplicate @id; best-graph addition named.
- **R5 (commercial honesty) = 3:** flat-rate-in-writing only; no dollar
  prices; domain price ranges reviewed and deliberately excluded;
  cost-page by-quote framing preserved.
- **R6 (media) = 3:** hub + Winchester photos are honestly captioned
  style examples (Bright Mover credit); Martinsburg uses the approved
  logo brand image; no job photo claimed; face-blur rule noted for any
  future crew photo.
- **R7 (attestation) = 2:** Q1–Q8 open; package is complete as research
  and the node is deployable, but full attestation awaits Henry.


## FULL-SITE REDO SWEEP NOTE — 2026-10-29 (Area E, staged-package sweep)

FLAGGED, NOT REWRITTEN (internal provenance only): this file and the other internal notes in this dir (content-note.md, merge-note.md, dataset-status.md) still contain the words "attested"/"attestation" and "GATED" as internal research/provenance language. That language was deliberately NOT edited out of the internal history and MUST NOT be carried into published-facing copy. Published-facing drafts in this dir (schema.json, plus content.md/meta.json where present) were swept clean in place: zero "attested", zero gated/pending/staged-build framing, zero blended branches, zero private client data. The full footprint expansion (Winchester 31 / Martinsburg 35) remains a merge-step per this package's merge-note; the staged schema keeps the GBP lists (16/14) as its draft baseline and was not expanded in place. No live file, deploy, or push was touched by this sweep.
