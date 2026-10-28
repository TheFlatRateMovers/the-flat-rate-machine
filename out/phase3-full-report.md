# Flat Rate Machine — Phase 3 FULL build (staged only)

Built 2026-10-28. Gate first and last: node verify.js 43/43 before and
after (re-run at the end of this build). data/ and verify.js unmodified.
Nothing deployed, published, or pushed. The live site was not touched.
All output is staged in out/.

## Pages: 24 READY, 0 BLOCKED

| Slug | Title | Branch | R1–R7 | Verdict |
|---|---|---|---|---|
| local-regional-movers-martinsburg-wv | Local & Regional Movers — Martinsburg WV | martinsburg | 3,3,3,3,3,3,2 | READY (revised) |
| long-distance-movers-martinsburg-wv | Long-Distance Movers — Martinsburg WV | martinsburg | 3,3,3,3,3,3,2 | READY (revised) |
| packing-movers-martinsburg-wv | Packing Movers — Martinsburg WV | martinsburg | 3,3,3,3,3,3,2 | READY (revised) |
| sir-heavy-movers-martinsburg-wv | SIR Heavy Movers — Martinsburg WV | martinsburg | 3,3,3,3,3,3,2 | READY (revised) |
| gun-safe-movers-martinsburg-wv | Gun Safe Movers — Martinsburg WV | martinsburg | 3,3,3,3,3,3,2 | READY (revised) |
| interstate-66-corridor | Interstate 66 Corridor Moving | both | 3,3,3,3,3,3,2 | READY (revised) |
| interstate-70-corridor | Interstate 70 Corridor Moving | both | 3,3,3,3,3,3,2 | READY (revised) |
| commercial-movers-winchester-va | Commercial and Office Movers — Winchester VA | winchester | 3,3,3,3,3,3,2 | READY |
| local-regional-movers-winchester-va | Local & Regional Movers — Winchester VA | winchester | 3,3,3,3,3,3,2 | READY |
| piano-antique-movers-martinsburg-wv | Piano, Antique & White-Glove Movers — Martinsburg WV | martinsburg | 3,3,3,3,3,3,2 | READY |
| ispm15-movers-martinsburg-wv | ISPM 15 Export Packing — Martinsburg WV | martinsburg | 3,3,3,3,3,3,2 | READY |
| crating-movers-martinsburg-wv | Custom Crating — Martinsburg WV | martinsburg | 3,3,3,3,3,3,2 | READY |
| transloading-movers-martinsburg-wv | Loading, Transloading & Container Services — Martinsburg WV | martinsburg | 3,3,3,3,3,3,2 | READY |
| final-mile-movers-martinsburg-wv | Final-Mile Delivery — Martinsburg WV | martinsburg | 3,3,3,3,3,3,2 | READY |
| office-moving-movers-winchester-va | Office Moving — Winchester VA | winchester | 3,3,3,3,3,3,2 | READY |
| office-moving-movers-martinsburg-wv | Office Moving — Martinsburg WV | martinsburg | 3,3,3,3,3,3,2 | READY |
| industrial-offices-movers-winchester-va | Industrial Offices Moving — Winchester VA | winchester | 3,3,3,3,3,3,2 | READY |
| industrial-offices-movers-martinsburg-wv | Industrial Offices Moving — Martinsburg WV | martinsburg | 3,3,3,3,3,3,2 | READY |
| government-movers-winchester-va | Government Movers — Winchester VA | winchester | 3,3,3,3,3,3,2 | READY |
| government-movers-martinsburg-wv | Government Movers — Martinsburg WV | martinsburg | 3,3,3,3,3,3,2 | READY |
| military-movers-winchester-va | Military Movers — Winchester VA | winchester | 3,3,3,3,3,3,2 | READY |
| military-movers-martinsburg-wv | Military Movers — Martinsburg WV | martinsburg | 3,3,3,3,3,3,2 | READY |
| industrial-commercial-movers-winchester-va | Industrial & Commercial Services — Winchester VA | winchester | 3,3,3,3,3,3,2 | READY |
| industrial-commercial-movers-martinsburg-wv | Industrial & Commercial Services — Martinsburg WV | martinsburg | 3,3,3,3,3,3,2 | READY |

Rubric bar: 3 on R1–R5, ≥2 on R6–R7. R6=3 on every page: the company logo
(assets/img-01-9c77693ba66b.png) is assigned per owner approval
2026-10-28, captioned as a brand image, not a job photo. R7=2 on every
page: quote card wording is exact ("Get My Flat Rate Quote", Short
default / Detailed toggle preserving From, To, What's moving) and points
to the verified live form; toggle behavior is a property of that live
form and is re-checked at publish. No page failed the gate.

Revised pages (7): the 5 Martinsburg batch-1 pages + the 2 corridor
pages, expanded from GBP-only to the full footprint, plus logo image,
backlinks, and BreadcrumbList. Previous content approval does NOT carry
over — these 7 need re-approval before any publish.
New pages (17): 7 Winchester + 10 Martinsburg branch pages from the
planner matrix, full footprint from the start. Zero slug collisions
with the 126-page live registry. No page needed a hand-written editorial
description: every meta description uses the Phase 1 deterministic
template (title + service description + company suffix); no template
gaps were hit.

## Footprint mapping (GeoJSON branch property is the source)

- Winchester: 31 = GBP 16 + extended 15. Extended: Clarke County,
  Fauquier County (branch=winchester) + Front Royal, VA, Strasburg, VA,
  Woodstock, VA, Warren County, Shenandoah County, Hardy County, Port of
  Virginia, Virginia Inland Port, Shenandoah Valley, Eastern Panhandle
  of West Virginia, Interstate 81 Corridor, Interstate 66 Corridor,
  Interstate 70 Corridor (branch=both, shared).
- Martinsburg: 35 = GBP 14 + extended 21. Extended: Martinsburg, WV
  (branch city), Berkeley Springs, WV, Romney, WV, Frederick, MD,
  Hancock, MD, Jefferson County, Morgan County, Hampshire County,
  Washington County (branch=martinsburg) + the same 12 shared
  branch=both areas listed above except Moorefield and Eastern
  Panhandle, which are already in the Martinsburg GBP list.
- Shared (14, served by both branches, never silently single-branch):
  Moorefield, WV, Front Royal, VA, Strasburg, VA, Woodstock, VA, Warren County, Shenandoah County, Hardy County, Port of Virginia, Virginia Inland Port, Shenandoah Valley, Eastern Panhandle of West Virginia, Interstate 81 Corridor, Interstate 66 Corridor, Interstate 70 Corridor.
- Unassigned: NONE. Every footprint area carries a GeoJSON branch
  property; nothing was guessed.
- Attribution: GBP areas ← GBP screenshots supplied by owner 2026-10-27,
  confirmed 2026-10-28. Extended areas ← live service-area.geojson
  feature branch properties + location pages, 2026-10-28, NOT GBP
  screenshots. Two data flags (see out/footprint.json discrepancies):
  (1) GeoJSON county gbp_service_area flags for Clarke, Warren,
  Shenandoah, Hardy, Jefferson, Morgan do not match the screenshot
  panels (which name only Loudoun, Frederick, Berkeley counties);
  (2) GeoJSON source strings on the 7 non-GBP towns wrongly claim GBP
  origin. Both fixes are on the publish checklist; page copy does not
  reproduce either claim.
- Proposed amendment: out/footprint.json (52 features, every area with
  name, branch(es), source, date). data/ stays frozen until the owner
  approves the amendment.

## Backlink graph (per page, clean live URLs)

Every branch page links to: Home, both branch pages, Route 81, both new
corridor pages, its same-service staged sibling (where one exists), and
its branch-neutral company service page (where one was identified).
Every corridor page links to: Home, Route 81, both branch pages, Local &
Regional Moving, and the other new corridor page.

- commercial-movers-winchester-va: 7 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/, https://theflatratemovers.com/commercial-moving/
- crating-movers-martinsburg-wv: 6 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/
- final-mile-movers-martinsburg-wv: 6 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/
- government-movers-martinsburg-wv: 8 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/, https://theflatratemovers.com/government-movers-winchester-va/, https://theflatratemovers.com/military-government-moving/
- government-movers-winchester-va: 8 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/, https://theflatratemovers.com/government-movers-martinsburg-wv/, https://theflatratemovers.com/military-government-moving/
- gun-safe-movers-martinsburg-wv: 7 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/, https://theflatratemovers.com/gun-safe-movers/
- industrial-commercial-movers-martinsburg-wv: 8 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/, https://theflatratemovers.com/industrial-commercial-movers-winchester-va/, https://theflatratemovers.com/industrial-commercial-services/
- industrial-commercial-movers-winchester-va: 8 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/, https://theflatratemovers.com/industrial-commercial-movers-martinsburg-wv/, https://theflatratemovers.com/industrial-commercial-services/
- industrial-offices-movers-martinsburg-wv: 8 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/, https://theflatratemovers.com/industrial-offices-movers-winchester-va/, https://theflatratemovers.com/industrial-offices-moving/
- industrial-offices-movers-winchester-va: 8 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/, https://theflatratemovers.com/industrial-offices-movers-martinsburg-wv/, https://theflatratemovers.com/industrial-offices-moving/
- interstate-66-corridor: 6 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/local-regional-moving/, https://theflatratemovers.com/interstate-70-corridor/
- interstate-70-corridor: 6 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/local-regional-moving/, https://theflatratemovers.com/interstate-66-corridor/
- ispm15-movers-martinsburg-wv: 6 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/
- local-regional-movers-martinsburg-wv: 8 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/, https://theflatratemovers.com/local-regional-movers-winchester-va/, https://theflatratemovers.com/local-regional-moving/
- local-regional-movers-winchester-va: 8 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/, https://theflatratemovers.com/local-regional-movers-martinsburg-wv/, https://theflatratemovers.com/local-regional-moving/
- long-distance-movers-martinsburg-wv: 7 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/, https://theflatratemovers.com/long-distance-cross-country-moving/
- military-movers-martinsburg-wv: 8 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/, https://theflatratemovers.com/military-movers-winchester-va/, https://theflatratemovers.com/military-government-moving/
- military-movers-winchester-va: 8 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/, https://theflatratemovers.com/military-movers-martinsburg-wv/, https://theflatratemovers.com/military-government-moving/
- office-moving-movers-martinsburg-wv: 7 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/, https://theflatratemovers.com/office-moving-movers-winchester-va/
- office-moving-movers-winchester-va: 7 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/, https://theflatratemovers.com/office-moving-movers-martinsburg-wv/
- packing-movers-martinsburg-wv: 6 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/
- piano-antique-movers-martinsburg-wv: 6 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/
- sir-heavy-movers-martinsburg-wv: 6 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/
- transloading-movers-martinsburg-wv: 6 outbound → https://theflatratemovers.com/, https://theflatratemovers.com/moving-company-martinsburg-wv/, https://theflatratemovers.com/moving-company-winchester-va/, https://theflatratemovers.com/route81/, https://theflatratemovers.com/interstate-66-corridor/, https://theflatratemovers.com/interstate-70-corridor/

## Publish plan

See out/publish-plan.md (plan only). Summary: 24 page divs before
<footer>, 24 pageMeta entries (trailing commas + quoted hyphenated
keys), router additions, node --check on both inline scripts, sitemap
126 → 150 URLs, 24 per-page JSON files, llms.txt / data txt / ai-sitemap
/ entity graph updates, all-pages index update, GeoJSON source-label
fix, deploy from project root, verify 24 URLs + regressions, no quote
test posts.

## What the owner must approve before publish

1. All 24 staged pages as content (revised 7 need re-approval).
2. Footprint amendment (out/footprint.json → data/).
3. GeoJSON source-label fix (live file edit).
4. Logo as page image on all 24 pages (already approved 2026-10-28;
   confirmed here as applied).
5. Final publish confirmation (deploy step itself).
