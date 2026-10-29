# Packing & Unpacking — Deep Datasets (STAGED ONLY)

**Date:** 2026-10-29 · **Status:** STAGED — not deployed, not pushed, no live-site edit.
**Method:** full ocean-method deep treatment (same structure as
`ocean-container-datasets-2026-10-29.md` and
`residential-deep-datasets-2026-10-29.md`).
**Package dir:** `~/workspace/the-flat-rate-machine/out/pages/packing-deep/`
(`schema.json`, `rubric.md`, `content-note.md`, `dataset-status.md`,
`merge-note.md`).
**License for datasets:** CC BY 4.0
(`https://creativecommons.org/licenses/by/4.0/`), attribution to
The Flat Rate Movers, `https://theflatratemovers.com/`.
**dateModified for all staged nodes:** 2026-10-29.

## Record corrections (read before using any earlier packing note)

1. **A dedicated Winchester packing page EXISTS.** The seizure plan's
   Phase D note said packing had a Martinsburg page only. Wrong. Live
   sitemap + live div extraction 2026-10-29 confirm
   `packing-services-winchester-va` — "Packing Services — Winchester VA",
   458 words, 6 headings, published scope (full / partial / fragile-only,
   blue padded blankets + clear stretch wrap, crates-and-export section).
   The Winchester branch is NOT uncovered for packing.
2. **9 pages carry `service-packing`, not 7.** `pages.json` confirms 9:
   7 content pages (hub, Winchester, Martinsburg, cost, estimator,
   full-service article, interstate guide) + 2 category indexes
   (estate-relocation, paper-padding). The 2 ISPM/crating cross-assigned
   pages (`international-export-packing-crating-winchester-va`,
   `how-international-export-packing-crating-protects-global-shipments`)
   carry `service-ispm15` + `service-crating`, NOT `service-packing` —
   correctly excluded from the 9.
3. **The entity-graph defect is SKEW, not DUPLICATE.**
   `entity-graph.json` holds `#service-packing` ONCE (unlike office and
   local-regional, which hold their @ids twice). The single node is
   Martinsburg-skewed: `url` = the Martinsburg page, `areaServed` = 35
   flat strings (Martinsburg GBP 14 + extended 21, including conceptual
   labels — Port of Virginia, Virginia Inland Port, Shenandoah Valley,
   I-81 / I-66 / I-70 corridors — mixed in with real areas), no Place
   chain, no Winchester branch, no ratings. Best graph: ZERO fragment
   occurrences (only page-slug nodes). Head graph node: THIN (name,
   serviceType "Packing services", provider, description — no url, no
   areaServed, no Place chain).
4. **Naming inconsistency.** Head node says "Packing services"; registry
   (`services.json`) says "Packing and Unpacking". The staged node uses
   the registry name, same fix as local-regional.
5. **"packing services for moving" @ 1.0 is a thin #1, not a defended
   position.** It has no click volume behind it in the baseline, unlike
   "movers near me" (246 impressions @ 5.0, 11 clicks). Treat it as a
   query-match artifact until a re-pull shows clicks — the same caution
   the baseline applies to "moving and storage" @ 1.0 (85 impressions,
   no service behind it at the time).

## §1 — What packing & unpacking is (published scope first)

Packing & Unpacking is the service of preparing a home or business for
transport and putting it back together at destination, quoted inside the
company's one flat rate. The published scope, taken verbatim from the
live hub, Winchester, and Martinsburg pages, is:

- **Three packing levels:** full packing (whole home), partial packing
  (a few rooms), fragile-only packing (just the fragile pieces) —
  "scoped with you up front and quoted inside your one flat rate."
- **The wrap standard:** "Furniture is fully blanketed and stretch-wrapped
  before it leaves the room — nothing exposed, nothing rubbing."
  Published materials: blue padded moving blankets + clear stretch wrap,
  furniture "staged cleanly in the room" before loading.
- **Unpacking & placement:** "At destination we unpack and place, so rooms
  come back together in order."
- **Fragile & high-value escalation:** "high-value or fragile pieces get
  white-glove handling or a custom crate" (cross-reference: custom
  crating and piano/antique/white-glove are SEPARATE categories — this
  package references them, never duplicates them).
- **Export escalation:** "export pieces are packed to ISPM 15 when the
  journey crosses a border" (cross-reference: ISPM 15 is a SEPARATE
  category — referenced, never duplicated).
- **Commercial terms:** packing is priced by flat-rate quote, NOT a
  published price list. The cost page states it outright: "we do not
  publish a packing price list, because honest packing cost depends on
  what is actually being packed — rooms, fragile pieces, crates." The
  estimator page states the same guardrail: the estimator "is not a
  calculator with invented prices — you scope the packing room by room,
  add the move."
- **Audiences named on the pages:** residential, commercial, senior and
  estate clients (hub, Martinsburg); Winchester households and businesses
  (Winchester page); busy households, seniors and estates (full-service
  article); interstate movers preparing their own packing (guide —
  advice audience, NOT a service claim; see §5).

What packing is NOT, on the published record: no published price list,
no pack-only standalone offer, no debris-removal claim, no materials
list beyond blankets + stretch wrap, no valuation/liability offer, no
no-pack list. Those are attestation questions (§8), not scope. Domain
knowledge below is labeled DOMAIN wherever it goes beyond published
scope, and domain facts never become company claims.

## §2 — Who needs packing (cross-references, not duplicates)

| Buyer | Why packing matters to them | Cross-reference (do not duplicate) |
|---|---|---|
| Homeowners, houses + apartments | Whole-home or room-by-room pack before a local, regional or long-distance move | Residential deep package |
| Seniors + estates | Full-service pack/unpack for downsizing and estate moves; the full-service article names "busy households, seniors and estates" | Senior deep package; estate-relocation category |
| Busy professionals / time-poor movers | Full pack because there is no time to pack; the full-service article is written for them | Residential; commercial |
| Businesses + offices | Office packing as part of a commercial/office move; hub names commercial clients | Commercial + office deep packages |
| Interstate movers (self-packers) | The guide teaches self-packers how to wrap, stage and record a home — advice, not a service claim | Long-distance deep package |
| Export / freight shippers | Export pieces packed to ISPM 15; crates for high-value pieces | ISPM 15 + crating (separate categories) |
| Storage-bound movers | Pack prepared for storage when dates do not line up — DOMAIN pattern; company storage activation is separately staged, so NO packing-for-storage claim is made here | Moving-and-storage activation (staged) |

## §3 — Process chain (published steps vs domain steps, labeled)

Published steps (traceable to live page copy):

1. **Scope up front.** Packing level (full / partial / fragile-only) is
   "scoped with you up front" and quoted inside the one flat rate.
2. **Room-by-room pack.** "wrapped right, room by room"; the estimator
   scopes "room by room."
3. **Wrap standard applied.** Furniture fully covered in blue padded
   blankets, sealed with clear stretch wrap, staged cleanly in the room.
4. **Fragile escalation.** High-value / fragile pieces get white-glove
   handling or a custom crate; export pieces to ISPM 15.
5. **Load.** Packed + wrapped items leave the room for loading (the
   hub's photo caption: "staged cleanly in the living room before
   loading").
6. **Unpack & place.** "At destination we unpack and place, so rooms
   come back together in order."

DOMAIN steps (industry practice, NOT published company claims — planning
inputs only, never capability claims):

7. **Survey / quote intake.** Walkthrough counting rooms + fragile items
   to size crew and materials; the Detailed Project form needs access
   detail (guide: "Tell the form the truth"). DOMAIN — the company
   publishes a Short/Detailed quote toggle, but does not publish a
   packing walkthrough step.
8. **Label + inventory discipline.** Every box marked by room and
   contents; fragile marked FRAGILE; orientation marked THIS SIDE UP;
   box-number inventory for larger moves. DOMAIN — site-wide "label"
   appears 124 times and "inventory" 27 times, but no packing page
   publishes a labeling standard. Treated as a planning input, not a
   company claim, until attested.
9. **Debris handling.** Cartons + paper removed after unpacking. DOMAIN
   ONLY — "debris" appears 0 times site-wide. Attestation Q1 (§8).
   Never claimed until Henry confirms.

## §4 — Taxonomy

### 4.1 Packing levels (published vs domain)

| Level | Status | Scope |
|---|---|---|
| Full packing | PUBLISHED (hub, Winchester, Martinsburg) | Whole home, every room |
| Partial packing | PUBLISHED (hub, Winchester, Martinsburg) | A few rooms, or selected rooms |
| Fragile-only packing | PUBLISHED (hub, Winchester, Martinsburg) | Just the fragile pieces |
| Unpacking + placement | PUBLISHED (hub, Martinsburg) | Unpack and place at destination |
| Unpacking-only (no pack) | DOMAIN — unattested | Unpack a move the client packed |
| Pack-only (no move) | DOMAIN — unattested | Pack for a client moving themselves |
| Kitchen-first partial | DOMAIN pattern | Kitchen + fragile as the common partial split |
| Pack for storage | DOMAIN — gated on storage activation | Boxing prepared for storage when dates do not line up |

### 4.2 Material classes (published vs domain — the vocabulary gap lives here)

| Material class | Status | Site evidence 2026-10-29 |
|---|---|---|
| Padded moving blankets (blue) | PUBLISHED | "blanket" 71 mentions |
| Clear stretch wrap | PUBLISHED | "stretch wrap" 49 mentions |
| Cartons, small / medium / large | DOMAIN | "carton" 2 mentions |
| Dish barrels / dish packs with dividers | DOMAIN | "dish pack" 0 mentions |
| Wardrobe boxes | DOMAIN | "wardrobe" 1 mention site-wide; "wardrobe box" 0 |
| Packing paper (unprinted) | DOMAIN | "packing paper" 0 mentions |
| Bubble wrap / foam pouches | DOMAIN | "bubble" 0 mentions |
| Packing tape + dispensers | DOMAIN | "tape" 3 mentions |
| Markers / labels | DOMAIN (labeling discipline) | "label" 124 mentions (site-wide, not packing-specific) |
| Mirror / picture cartons | DOMAIN | "mirror carton" 1 mention |
| TV boxes | DOMAIN | No packing-page claim |
| Mattress bags | DOMAIN | "mattress bag" 1 mention |
| Corner protectors | DOMAIN | No packing-page claim |
| Custom wooden crates | PUBLISHED as escalation | "crating" 213 mentions (crating category) |
| ISPM 15 wood packaging | PUBLISHED as export escalation | "ISPM" 132 mentions (ISPM 15 category) |

The gap is stark: the two published materials (blankets, stretch wrap)
are well covered; every carton/paper/wrap material term is at or near
zero. A `paper-padding` category index exists (346 words) but the
material vocabulary it indexes is absent from packing copy. That is a
Phase E depth brief item (§9), gated on attestation Q2 — the terms enter
copy only if Henry confirms the materials are actually supplied.

### 4.3 Room / item classes (DOMAIN taxonomy for scoping)

Rooms: kitchen, primary bedroom, secondary bedrooms, living room,
dining room, home office, bathroom, garage, basement, attic.
Item classes: furniture (blanket + stretch-wrap class), boxed household
goods, fragile kitchen (dishes, glassware, stemware), electronics
(TVs, monitors, setups photographed before disassembly — DOMAIN),
art / mirrors / glass tops (crate-or-carton class), lamps + lampshades,
clothing (hanging vs folded), books + heavy smalls (small-box class —
DOMAIN weight discipline: heavy items in small boxes), bedding +
linens (large-box class), high-value / sentimental (plan-first class).

### 4.4 Fragile classes (DOMAIN, ordered by breakage risk)

1. Dishes + glassware + stemware (individually wrapped, cell dividers)
2. Art, mirrors, glass tabletops (corner protection, mirror cartons,
   custom crates for oversized/high-value)
3. Electronics (padding, cable bagging/labeling, setup photos)
4. Antiques + collectibles (individual assessment — cross-ref
   piano/antique/white-glove, never duplicated)
5. Lamps, lampshades, ceramics (double-boxing for ceramics — DOMAIN)

## §5 — Live page mapping (verified 2026-10-29, live sitemap 153 + div extraction)

Scoring: STRONG = full-format page (scope + audience + FAQ + attestation
or equivalent depth); PARTIAL = correct scope, thin depth or missing
FAQ; GAP = indexed but not carrying the service's depth. Word counts are
own-div words (cut at the next page div), not whole-file counts.

| # | Page (slug) | Words / headings / FAQ | Score | Evidence |
|---|---|---|---|---|
| 1 | `packing-unpacking-services-2` (hub) | 368 / 6 / NO | PARTIAL | Scope complete (3 levels, wrap standard, unpack + place, ISPM 15 + crate escalation, both branches + hours + phone). Thin at 368 words; no FAQ; photo honestly captioned style example (Bright Mover credit). |
| 2 | `packing-services-winchester-va` (Winchester) | 458 / 6 / NO | PARTIAL | Dedicated Winchester page (corrects seizure plan). Scope + crates-and-export section + service-area card. No FAQ; thinner than Martinsburg by 513 words. |
| 3 | `packing-movers-martinsburg-wv` (Martinsburg) | 971 / 8 / YES | STRONG | Full-format Phase 3 page: What it includes / Who it is for / Where we serve / Related pages / Questions, answered / Sources & attestation. Logo as brand image (not a job photo). The parity benchmark. |
| 4 | `packing-cost-winchester-va` (cost) | 435 / 6 / NO | PARTIAL | Strength: honest by-quote framing, scope drivers named (rooms, fragile pieces, crates). Weakness: answers a price question with no price vocabulary and no FAQ — the position problem (§7). |
| 5 | `professional-packing-services-moving-cost-estimator` (estimator) | 445 / 6 / NO | PARTIAL | Scope-it-room-by-room estimator; explicit anti-invented-price guardrail. No FAQ. |
| 6 | `full-service-packing-unpacking-systematic-asset-encapsulation` (article) | 450 / 6 / NO | PARTIAL | System framing ("encapsulated in order — wrapped, padded, boxed and labelled room by room"); busy-household / senior / estate audience. No FAQ. |
| 7 | `how-to-pack-for-interstate-move` (guide) | 427 / 6 / NO | PARTIAL | Advice for SELF-packers (wrap, stage, record; "Tell the form the truth"). Distinct audience — must not be read as service scope. No FAQ. |
| 8 | `category/winchester-va/residential-logistics/relocation-services/moving/estate-relocation` (category) | 333 / — / NO | PARTIAL | Category index, svc packing. Index function, not depth; estate audience cross-ref. |
| 9 | `category/winchester-va/residential-logistics/relocation-services/paper-padding` (category) | 346 / — / NO | PARTIAL | Category index, svc packing ("paper & padding — the packing materials standard"). Index exists while the material terms it names are 0-mention in copy — the §4.2 gap in miniature. |

Cross-assigned, correctly NOT service-packing (excluded from the 9):
`international-export-packing-crating-winchester-va` and
`how-international-export-packing-crating-protects-global-shipments`
(svc ispm15 + crating). Cross-reference only.

pageMeta svc pointers: 9 — exactly the 9 pages above. Live index
`#service-packing` occurrences: 11 = head node (1) + pageMeta (9) +
`#/services` ItemList (1). No orphan pointers, no missing pointers.

Parity finding (Phase E, same family as gun-safe / long-distance):
Martinsburg 971 words + FAQ + attestation vs Winchester 458 words, no
FAQ, vs hub 368 words, no FAQ. The gap is depth and FAQ parity, NOT
coverage — there is no missing branch page to build (§9 decision).

## §6 — D1–D8 datasets (full depth; every field traces to a verified fact or a labeled DOMAIN fact)

License: CC BY 4.0, attribution The Flat Rate Movers,
`https://theflatratemovers.com/`. `dateModified`: 2026-10-29.
`@id` base: `https://theflatratemovers.com/#service-packing`.
Company facts: Winchester = The Flat Rate Movers, 116 W Piccadilly St
Suite 11, Winchester VA 22601, geo 39.18711576, -78.1668352, Mon-Fri
8-6, Sat 8-4, Sun 9-4, Google 5.0/1. Martinsburg = Flat Rate Movers
Martinsburg WV, 736 Williamsport Pike Suite 2, Martinsburg WV 25404,
geo 39.48319665, -77.94760443, Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google
4.7/6. Phone +1-540-422-2153. Founded 2010-06. Tagline "Guaranteed Flat
Rate or Your Move is Free!" Branches distinct, ratings never blended.

### D1 — Packing service levels

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Packing and Unpacking — service levels (The Flat Rate Movers)",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "dateModified": "2026-10-29",
  "creator": {"@id": "https://theflatratemovers.com/#organization"},
  "about": {"@id": "https://theflatratemovers.com/#service-packing"},
  "hasPart": [
    {"name": "Full packing", "status": "PUBLISHED",
     "scope": "Whole home, every room, packed by the crew",
     "audience": ["residential", "commercial", "senior", "estate"],
     "source": "Live hub + Winchester + Martinsburg packing pages, 2026-10-29"},
    {"name": "Partial packing", "status": "PUBLISHED",
     "scope": "A few rooms, or selected rooms, packed by the crew",
     "audience": ["residential", "commercial", "senior", "estate"],
     "source": "Live hub + Winchester + Martinsburg packing pages, 2026-10-29"},
    {"name": "Fragile-only packing", "status": "PUBLISHED",
     "scope": "Just the fragile pieces, packed by the crew",
     "audience": ["residential", "commercial", "senior", "estate"],
     "source": "Live hub + Winchester + Martinsburg packing pages, 2026-10-29"},
    {"name": "Unpacking and placement", "status": "PUBLISHED",
     "scope": "Unpack and place at destination so rooms come back together in order",
     "audience": ["residential", "commercial", "senior", "estate"],
     "source": "Live hub + Martinsburg packing pages, 2026-10-29"},
    {"name": "Unpacking-only", "status": "DOMAIN — unattested, not a company claim",
     "scope": "Unpack a move the client packed themselves",
     "source": "Industry practice, web research 2026-10-29"},
    {"name": "Pack-only (no move)", "status": "DOMAIN — unattested, not a company claim",
     "scope": "Pack for a client moving themselves",
     "source": "Industry practice, web research 2026-10-29"},
    {"name": "Pack for storage", "status": "DOMAIN — gated on storage activation",
     "scope": "Boxing prepared for storage when dates do not line up",
     "source": "Industry practice, web research 2026-10-29; company storage terms staged separately"}
  ]
}
```

### D2 — Material classes (published vs domain, explicitly split)

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Packing and Unpacking — material classes (The Flat Rate Movers)",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "dateModified": "2026-10-29",
  "creator": {"@id": "https://theflatratemovers.com/#organization"},
  "about": {"@id": "https://theflatratemovers.com/#service-packing"},
  "hasPart": [
    {"name": "Blue padded moving blankets", "status": "PUBLISHED",
     "use": "Furniture fully covered before it leaves the room",
     "siteMentions": 71, "source": "Live packing pages, 2026-10-29"},
    {"name": "Clear stretch wrap", "status": "PUBLISHED",
     "use": "Seals blankets; secures drawers and doors",
     "siteMentions": 49, "source": "Live packing pages, 2026-10-29"},
    {"name": "Custom wooden crates", "status": "PUBLISHED as escalation",
     "use": "High-value, oversized or fragile pieces; export pieces to ISPM 15",
     "source": "Live hub page + crating category, 2026-10-29"},
    {"name": "Cartons, small / medium / large", "status": "DOMAIN",
     "use": "Small for heavy smalls (books, tools); medium for kitchen; large for light bulky goods",
     "siteMentions": 2, "source": "Industry practice, web research 2026-10-29"},
    {"name": "Dish barrels / dish packs with dividers", "status": "DOMAIN",
     "use": "Dishes, glassware, crystal, fragile kitchen",
     "siteMentions": 0, "source": "Industry practice, web research 2026-10-29"},
    {"name": "Wardrobe boxes", "status": "DOMAIN",
     "use": "Hanging clothes, closet to closet on the rail",
     "siteMentions": 0, "source": "Industry practice, web research 2026-10-29"},
    {"name": "Packing paper (unprinted)", "status": "DOMAIN",
     "use": "Wrapping dishes and glassware; filling voids so items do not shift",
     "siteMentions": 0, "source": "Industry practice, web research 2026-10-29"},
    {"name": "Bubble wrap / foam pouches", "status": "DOMAIN",
     "use": "Cushioning for corners, stems, electronics, delicate items",
     "siteMentions": 0, "source": "Industry practice, web research 2026-10-29"},
    {"name": "Packing tape + dispensers", "status": "DOMAIN",
     "use": "Sealing box seams; H-taping",
     "siteMentions": 3, "source": "Industry practice, web research 2026-10-29"},
    {"name": "Markers / labels", "status": "DOMAIN labeling discipline",
     "use": "Room + contents on every box; FRAGILE; THIS SIDE UP",
     "siteMentions": 124, "note": "Site-wide count, not packing-specific",
     "source": "Industry practice, web research 2026-10-29"},
    {"name": "Mirror / picture cartons", "status": "DOMAIN",
     "use": "Wall art, mirrors, glass tops, with corner protection",
     "siteMentions": 1, "source": "Industry practice, web research 2026-10-29"},
    {"name": "TV boxes", "status": "DOMAIN",
     "use": "Flat-screen TVs, monitors, with foam inserts",
     "source": "Industry practice, web research 2026-10-29"},
    {"name": "Mattress bags", "status": "DOMAIN",
     "use": "One per bed",
     "siteMentions": 1, "source": "Industry practice, web research 2026-10-29"},
    {"name": "Corner protectors", "status": "DOMAIN",
     "use": "Art, mirrors, framed pieces",
     "source": "Industry practice, web research 2026-10-29"}
  ]
}
```

### D3 — Room and item classes for scoping

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Packing and Unpacking — room and item classes for scoping",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "dateModified": "2026-10-29",
  "creator": {"@id": "https://theflatratemovers.com/#organization"},
  "about": {"@id": "https://theflatratemovers.com/#service-packing"},
  "hasPart": [
    {"class": "Room", "members": ["kitchen", "primary bedroom", "secondary bedrooms",
      "living room", "dining room", "home office", "bathroom", "garage",
      "basement", "attic"],
     "status": "DOMAIN taxonomy; the estimator scopes room by room (PUBLISHED method)",
     "source": "Live estimator page + industry practice, 2026-10-29"},
    {"class": "Furniture", "handling": "Blanket + stretch-wrap class (PUBLISHED)",
     "source": "Live packing pages, 2026-10-29"},
    {"class": "Boxed household goods", "handling": "Room-by-room cartons, labeled (DOMAIN discipline)",
     "source": "Industry practice, 2026-10-29"},
    {"class": "Heavy smalls", "handling": "Small boxes only (DOMAIN weight discipline)",
     "members": ["books", "tools", "canned goods", "records"],
     "source": "Industry practice, 2026-10-29"},
    {"class": "Light bulky goods", "handling": "Large boxes (DOMAIN)",
     "members": ["linens", "bedding", "pillows", "lampshades"],
     "source": "Industry practice, 2026-10-29"},
    {"class": "Hanging clothing", "handling": "Wardrobe boxes (DOMAIN)",
     "source": "Industry practice, 2026-10-29"}
  ]
}
```

### D4 — Fragile and high-value classes

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Packing and Unpacking — fragile and high-value classes",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "dateModified": "2026-10-29",
  "creator": {"@id": "https://theflatratemovers.com/#organization"},
  "about": {"@id": "https://theflatratemovers.com/#service-packing"},
  "hasPart": [
    {"class": "Dishes, glassware, stemware", "handling": "Individually wrapped; cell dividers (DOMAIN technique)",
     "publishedAnchor": "Fragile-only packing is a PUBLISHED level",
     "source": "Live hub page + industry practice, 2026-10-29"},
    {"class": "Art, mirrors, glass tabletops", "handling": "Corner protection; mirror cartons; custom crates for oversized/high-value (PUBLISHED escalation)",
     "source": "Live hub page + crating category, 2026-10-29"},
    {"class": "Electronics", "handling": "Padding; cable bagging/labeling; setup photos before disassembly (DOMAIN technique)",
     "source": "Industry practice, 2026-10-29"},
    {"class": "Antiques and collectibles", "handling": "Individual assessment (DOMAIN); cross-ref piano/antique/white-glove, never duplicated",
     "source": "Industry practice, 2026-10-29"},
    {"class": "Lamps, lampshades, ceramics", "handling": "Double-boxing for ceramics (DOMAIN technique)",
     "source": "Industry practice, 2026-10-29"},
    {"class": "High-value / sentimental, plan-first", "handling": "Flagged before packing day and planned specifically (DOMAIN practice)",
     "source": "Industry practice, 2026-10-29"}
  ]
}
```

### D5 — Process chain steps

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Packing and Unpacking — process chain",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "dateModified": "2026-10-29",
  "creator": {"@id": "https://theflatratemovers.com/#organization"},
  "about": {"@id": "https://theflatratemovers.com/#service-packing"},
  "hasPart": [
    {"step": 1, "name": "Scope up front", "status": "PUBLISHED",
     "detail": "Packing level scoped with the client up front and quoted inside the one flat rate",
     "source": "Live hub page, 2026-10-29"},
    {"step": 2, "name": "Quote (Short / Detailed toggle)", "status": "PUBLISHED",
     "detail": "Short (Quick Quote) default; Detailed Project preserves From / To / What's moving; Detailed needs access detail",
     "source": "Live quote form + guide page, 2026-10-29"},
    {"step": 3, "name": "Room-by-room pack", "status": "PUBLISHED",
     "detail": "Wrapped right, room by room; estimator scopes room by room",
     "source": "Live hub + estimator pages, 2026-10-29"},
    {"step": 4, "name": "Wrap standard", "status": "PUBLISHED",
     "detail": "Furniture fully covered in blue padded blankets, sealed with clear stretch wrap, staged cleanly in the room",
     "source": "Live hub + Winchester pages, 2026-10-29"},
    {"step": 5, "name": "Fragile escalation", "status": "PUBLISHED",
     "detail": "High-value / fragile pieces get white-glove handling or a custom crate; export pieces to ISPM 15",
     "source": "Live hub page, 2026-10-29"},
    {"step": 6, "name": "Label + inventory discipline", "status": "DOMAIN planning input",
     "detail": "Room + contents on every box; FRAGILE; THIS SIDE UP; box-number inventory on larger moves",
     "source": "Industry practice, 2026-10-29; NOT published company scope"},
    {"step": 7, "name": "Load", "status": "PUBLISHED",
     "detail": "Packed and wrapped items leave the room for loading",
     "source": "Live hub page caption, 2026-10-29"},
    {"step": 8, "name": "Unpack and place", "status": "PUBLISHED",
     "detail": "At destination unpack and place so rooms come back together in order",
     "source": "Live hub + Martinsburg pages, 2026-10-29"},
    {"step": 9, "name": "Debris handling", "status": "DOMAIN ONLY — attestation Q1",
     "detail": "Cartons and paper removed after unpacking; 0 site mentions; NEVER claimed until confirmed",
     "source": "Industry practice, 2026-10-29"}
  ]
}
```

### D6 — Buyer personas and trigger events (DOMAIN buyer logic, not company claims)

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Packing and Unpacking — buyer personas and trigger events",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "dateModified": "2026-10-29",
  "creator": {"@id": "https://theflatratemovers.com/#organization"},
  "about": {"@id": "https://theflatratemovers.com/#service-packing"},
  "hasPart": [
    {"persona": "Closing-driven mover", "trigger": "Closing date sets a hard pack deadline",
     "levelFit": "Full packing", "status": "DOMAIN"},
    {"persona": "Downsizing senior / estate executor", "trigger": "Downsizing or estate clearance",
     "levelFit": "Full packing + unpacking and placement", "status": "DOMAIN; audience PUBLISHED on hub/Martinsburg"},
    {"persona": "Renovation mover", "trigger": "Rooms must be emptied and restored in order",
     "levelFit": "Partial packing + unpacking and placement", "status": "DOMAIN"},
    {"persona": "Time-poor professional / busy household", "trigger": "No time to pack; wants it handled as a system",
     "levelFit": "Full-service packing and unpacking", "status": "DOMAIN; audience PUBLISHED on full-service article"},
    {"persona": "Business / office mover", "trigger": "Office move with packing as one phase",
     "levelFit": "Partial or full packing within the office move", "status": "DOMAIN; audience PUBLISHED on hub"},
    {"persona": "Interstate self-packer", "trigger": "Wants to pack themselves but pack correctly",
     "levelFit": "Guide (advice), not a service level", "status": "DOMAIN; guide audience PUBLISHED"},
    {"persona": "Storage-bound mover", "trigger": "Move-out and move-in dates do not line up",
     "levelFit": "Pack for storage — GATED on storage activation", "status": "DOMAIN"}
  ]
}
```

### D7 — Commercial terms (flat-rate-in-writing ONLY; NO dollar prices anywhere)

Domain price research was reviewed 2026-10-29 (industry ranges for full
packing by home size, per-packer hourly rates, materials costs, pack
times) and DELIBERATELY EXCLUDED from this dataset: the company
publishes no packing price list, and the cost page says so explicitly.
No dollar figure in this package is a company term. Any future price
vocabulary needs Henry's attested basis first.

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Packing and Unpacking — commercial terms",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "dateModified": "2026-10-29",
  "creator": {"@id": "https://theflatratemovers.com/#organization"},
  "about": {"@id": "https://theflatratemovers.com/#service-packing"},
  "hasPart": [
    {"term": "One flat rate in writing before move day", "status": "PUBLISHED",
     "detail": "Packing is quoted inside the one flat rate, not hourly, not a price list",
     "source": "Live hub + cost pages, 2026-10-29"},
    {"term": "No published packing price list", "status": "PUBLISHED",
     "detail": "Cost page: 'we do not publish a packing price list, because honest packing cost depends on what is actually being packed'",
     "source": "Live cost page, 2026-10-29"},
    {"term": "Scope drivers", "status": "PUBLISHED",
     "detail": "Rooms, fragile pieces, crates — these change the scope, hence the quote",
     "source": "Live cost page, 2026-10-29"},
    {"term": "Estimator is scope, not a price calculator", "status": "PUBLISHED",
     "detail": "Estimator 'is not a calculator with invented prices — you scope the packing room by room, add the move'",
     "source": "Live estimator page, 2026-10-29"},
    {"term": "Guarantee", "status": "PUBLISHED",
     "detail": "Guaranteed Flat Rate or Your Move is Free!",
     "source": "Site tagline, live pages, 2026-10-29"},
    {"term": "Materials included vs separate line", "status": "UNATTESTED — Q2",
     "detail": "Not published whether materials are bundled in the flat rate or itemized",
     "source": "Gap, 2026-10-29"},
    {"term": "Valuation / liability treatment of crew-packed vs owner-packed boxes",
     "status": "DOMAIN ONLY — Q6",
     "detail": "Industry practice treats crew-packed boxes differently for breakage claims; NO company offer published",
     "source": "Industry practice, 2026-10-29"}
  ]
}
```

### D8 — Labeling, inventory and access discipline (planning inputs, never capability claims)

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "Packing and Unpacking — labeling, inventory and access discipline",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "dateModified": "2026-10-29",
  "creator": {"@id": "https://theflatratemovers.com/#organization"},
  "about": {"@id": "https://theflatratemovers.com/#service-packing"},
  "hasPart": [
    {"input": "Room + contents label on every box", "status": "DOMAIN planning input",
     "why": "Unpacking is guesswork without it; load order follows room order",
     "source": "Industry practice, 2026-10-29"},
    {"input": "FRAGILE marking", "status": "DOMAIN planning input",
     "why": "Breakables must be visible to every handler",
     "source": "Industry practice, 2026-10-29"},
    {"input": "THIS SIDE UP orientation", "status": "DOMAIN planning input",
     "why": "Orientation-sensitive pieces travel correctly",
     "source": "Industry practice, 2026-10-29"},
    {"input": "Box-number inventory on larger moves", "status": "DOMAIN planning input",
     "why": "Nothing misplaced across multiple handlings; essential for long-distance and storage moves",
     "source": "Industry practice, 2026-10-29"},
    {"input": "First-night / essentials box", "status": "DOMAIN planning input",
     "why": "The box the client needs first at destination stays accessible",
     "source": "Industry practice, 2026-10-29"},
    {"input": "Photo electronics setups before disassembly", "status": "DOMAIN planning input",
     "why": "Reassembly at destination matches the original setup",
     "source": "Industry practice, 2026-10-29"},
    {"input": "Access detail in the Detailed Project form", "status": "PUBLISHED-adjacent",
     "why": "Guide: 'Tell the form the truth' — access detail is what the Detailed form needs",
     "source": "Live guide page, 2026-10-29"},
    {"input": "Valuables ride with the customer (jewelry, cash, papers)", "status": "DOMAIN planning input",
     "why": "Industry no-pack convention; NO company no-pack list published (Q7)",
     "source": "Industry practice, 2026-10-29"},
    {"input": "Hazardous items not packed", "status": "DOMAIN planning input",
     "why": "Industry no-pack convention; NO company no-pack list published (Q7)",
     "source": "Industry practice, 2026-10-29"}
  ]
}
```

## §7 — Rubric positioning (why packing is stuck, and what the node fixes)

**Search baseline (GSC, 3 months to 2026-10-27, read 2026-10-29):**

- `packing-cost-winchester-va`: 332 impressions @ 78.4 — the position
  problem. A page answering a price question, ranking on page 8, with
  no price vocabulary (by design — no published list) and no FAQ.
- "packing services for moving": @ 1.0 — thin #1, no clicks behind it;
  do not claim it as a defended position (see record correction 5).
- Site-wide packing vocabulary: packing 646, unpacking 101, fragile 76,
  stretch wrap 49, blanket 71, label 124, inventory 27 — the wrap
  standard and the levels are well covered. The missing vocabulary is
  materials (dish pack 0, bubble wrap 0, packing paper 0, wardrobe box
  0, debris 0, carton 2, tape 3) and process (debris, inventory
  discipline as packing-page copy rather than site-wide mentions).

**SERP check 2026-10-29 ("packing services Winchester VA movers"):**
TFRM 7th of 9 listed, behind Mover Dudes (4.7★, 172 reviews), Hulk
Haulers, Mail and Pack, Shields (3.9★, 10 reviews), Pattons, M.C.
Movers. Earlier checks put TFRM #5; the seizure plan says 6th — local
pack order varies by check, so report the range, not one rank. No
competitor-comparison framing goes on the site; this is rubric context
only. Note the structural disadvantage honestly: TFRM's Winchester
Google rating is 5.0 on 1 review (high-value clients do not post public
reviews for privacy — expected, not a quality signal), against
competitors with 10–172 reviews. The node + depth work cannot fix review
volume and must not try to.

**Diagnosis (three causes, all fixable inside the rules):**

1. **Graph cause.** The entity node is Martinsburg-skewed with no
   Winchester chain, the best graph has zero packing fragments, and the
   head node is thin with a mismatched name. A query for Winchester
   packing has no Winchester-anchored packing node to land on. The
   staged node fixes exactly this: same @id, hub url, both branch
   @ids, per-branch ratings only.
2. **Depth cause.** Hub 368 words, Winchester 458, both without FAQ;
   Martinsburg 971 + FAQ + attestation. Thin pages + no FAQ = no
   answer-shaped content for the cost/estimator queries. Phase E brief
   (§9) closes this by parity, not by a new page.
3. **Vocabulary cause.** Materials terms at zero mean the pages cannot
   match "dish pack", "wardrobe box", "bubble wrap" intent at all. The
   terms enter copy ONLY via attestation Q2 — never by importing
   domain vocabulary as a company claim.

**Rubric scores (go-live bar R1–R5 = 3, R6–R7 ≥ 2):**
R1 = 3, R2 = 3, R3 = 3, R4 = 3, R5 = 3, R6 = 3, R7 = 2.
R7 is 2 (not 3) because attestation questions Q1–Q8 remain open; the
package is complete as research, and the node is deployable, but the
depth brief (§9) is gated on Henry's answers. Full fact table + scoring
rationale: `out/pages/packing-deep/rubric.md`.

## §8 — Attestation questions (company-only; research cannot answer these)

- **Q1 — Debris removal.** After unpacking, are cartons + paper removed
  on the same visit? (DOMAIN term, 0 site mentions. Never claim until
  confirmed.)
- **Q2 — Materials beyond blankets + stretch wrap.** Are dish barrels,
  wardrobe boxes, bubble wrap, packing paper, tape, mattress bags,
  mirror/TV cartons supplied on packing jobs? Which are bundled vs
  separate? (Gates the §4.2 vocabulary entering copy.)
- **Q3 — Pack-only service.** Is packing offered without a move?
- **Q4 — Pack timing.** Is packing done the day before, same day, or
  either? (DOMAIN pattern: pack day before so loading starts on time.)
- **Q5 — Packing for storage.** Does packing scope change when items go
  to storage? (Ties to the separately staged storage activation; do
  not claim until both are attested.)
- **Q6 — Crew-packed vs owner-packed liability.** Is there a published
  valuation/liability difference? (DOMAIN: crew-packed boxes matter
  for claims. NO offer published; never invent one.)
- **Q7 — No-pack list.** Is there a company list of items not packed
  (hazardous, perishables, valuables, medications, cash, jewelry)?
  (DOMAIN convention exists; company list does not.)
- **Q8 — Unpacking scope.** Does unpacking mean place-on-surfaces, or
  full setup (furniture placed, items out of boxes, rooms reassembled)?
  Hub says "unpack and place" — the depth of "place" needs Henry's word.
- **Verification step (not a Henry question):** read the Martinsburg
  page's "Sources & attestation" section at merge time and confirm
  whether it already attests any of Q1–Q8; if it does, fold that
  attestation into the node instead of asking twice.

## §9 — Merge + follow-ups (PROPOSAL ONLY — nothing here has been applied)

**Merge proposal** (exact additions; deploy batch owns `data/`,
`scripts/`, `verify.js`, the live site, and GitHub):

1. `entity-graph.json`: REPLACE the single Martinsburg-skewed
   `#service-packing` node with the canonical hub node from
   `out/pages/packing-deep/schema.json` (same @id
   `https://theflatratemovers.com/#service-packing`; url → hub
   `packing-unpacking-services-2`; areaServed via branch @ids
   `#winchester` + `#martinsburg`; per-branch aggregateRatings on the
   Place nodes only, never blended). No duplicate @id is created.
2. Head graph (live index JSON-LD): UPGRADE the thin node in place to
   the same full chain (same @id); serviceType "Packing services" →
   "Packing and Unpacking" (registry name).
3. Best graph: ADD the packing node (currently zero fragments) using
   the same @id chain.
4. Datasets: D1–D8 ship as the nodes in §6 of this doc. Per
   `dataset-status.md`, NO light node file is staged and no
   `datasets-packing.json` is written — the deploy batch converts §6
   into the per-page Dataset JSON-LD in the same motion as the node
   (same pattern as residential's deployed `datasets-residential.json`,
   8 nodes, CC BY 4.0, dateModified 2026-10-29).
5. `services.json`: description update is a deploy-batch decision
   (builder-alignment follow-up, same as residential's unchanged
   description). Do not hand-edit it in staging.
6. Rubric DB: add the packing row (R1–R5 = 3, R6 = 3, R7 = 2) at deploy
   time, with the §8 questions as the R7 open items.
7. `ai-sitemap` / `llms.txt` / data-txt: refresh at deploy time from
   the merged node (full footprint at merge: Winchester 31, Martinsburg
   35, shared 14 — never the 35 flat strings from the skewed node).

**Phase E depth brief (after merge, gated on §8 answers):**

- Hub + Winchester pages: add FAQ sections (parity with Martinsburg's
  "Questions, answered"); lift hub from 368 words and Winchester from
  458 toward the Martinsburg 971-word benchmark with attested scope
  only — no new page, no invented depth.
- Cost page: add FAQ answering the by-quote scope drivers (rooms,
  fragile pieces, crates) — the page's honest answer to a price query,
  in answer shape.
- Materials vocabulary: add ONLY the Q2-confirmed materials, in the
  paper-padding category's terms, to hub + Winchester copy. If Q2
  answers "blankets + stretch wrap only," the vocabulary gap stays open
  and is reported as a limit, not filled with domain terms.
- Martinsburg page: no depth work needed (STRONG); only the merge-time
  attestation read (§8 verification step).

**Follow-ups (open, not filled):**

- §8 questions Q1–Q8 to Henry.
- Martinsburg "Sources & attestation" read at merge time.
- GSC re-pull (Phase H, 2–4 weeks post-deploy): packing-cost page
  position (78.4 baseline), "packing services for moving" clicks, and
  whether the Winchester packing page earns its own query rows.
- Standing open items carried, not owned, by this package: ocean
  D-node sameAs for the new Winchester page; `#/services` ItemList
  omission of industrial-commercial; services.json description
  builder-alignment; Developer-page stale "37 / 89 @ids" prose.
