# Flat Rate Machine — Phase 3, Batch 1 Report (STAGED ONLY)

**Status: staged. Nothing in this batch has been published, deployed, or
added to the live site.** Owner approval per batch is required before
any live publish. Builder: `scripts/build-phase3-batch1.js`, run
2026-10-28. Machine-readable scores:
`out/phase3-batch1-scores.json`.

## Batch summary

- **Batch:** first 5 Martinsburg `gap-branch-page` rows from
  `out/planner-matrix.json`, in planner order. All 5 are P1.
- **Result: 5 READY, 0 BLOCKED.** Every page scores 3 on R1–R5 and 2 on
  R6–R7, meeting the rubric go-live bar (3 on R1–R5, at least 2 on
  R6–R7). R6/R7 are 2, not 3, for publish-time reasons stated below —
  that is honest staging, not a failure.
- **Per page files:** `out/pages/<slug>/content.md` (full-format:
  What it includes / Who it is for / Where we serve / Questions,
  answered + standard service-area/published-data/quote card),
  `meta.json` (Phase 1 deterministic service template, no editorial
  descriptions), `schema.json` (Service JSON-LD + canonical URL,
  Martinsburg branch facts only).
- **Branch facts used on every page (Martinsburg only):** Flat Rate
  Movers Martinsburg WV · 736 Williamsport Pike Suite 2, Martinsburg,
  WV 25404 · geo 39.48319665, -77.94760443 · phone +1-540-422-2153 ·
  hours Mon-Fri 9-6, Sat 9-4, Sun 9-4 · Google rating 4.7 with 6 reviews
  (4 at 5 stars, 2 at 4 stars) · price range $$ · founded June 2010 ·
  the 14-area Martinsburg GBP service area. Winchester facts appear
  only where they legitimately belong: the published company service
  descriptions (e.g. long-distance "from Winchester, VA and Martinsburg,
  WV"), and explicit non-blending statements ("Winchester's 16 service
  areas are a separate list and are not used on this page").
- **Guardrail scans run on all 5 pages:** no USDOT/MC numbers, no bare
  "flat quote" (only "Get My Flat Rate Quote" / "flat-rate quote"), no
  Winchester hours, no prices other than $$, no testimonials, no
  placeholder words, canonical URLs match slugs, schema areaServed is
  exactly the 14 Martinsburg areas. All pass.

## Per-page results

### 1. local-regional-movers-martinsburg-wv — READY

- **Title:** Local & Regional Movers — Martinsburg WV
- **Service:** Local and Regional Moving (`service-local-regional`)
- **Rubric:** R1=3, R2=3, R3=3, R4=3, R5=3, R6=2, R7=2
- **Facts used:** service description verbatim from the live head graph
  ("Local and regional moves along the I-81, I-66 and I-70 corridors");
  audience "homeowners, renters, families, and seniors" (rubric.html
  §1); Martinsburg branch record (see above).
- **Missing sections:** none.

### 2. long-distance-movers-martinsburg-wv — READY

- **Title:** Long-Distance Movers — Martinsburg WV
- **Service:** Long-Distance Moving (`service-long-distance`)
- **Rubric:** R1=3, R2=3, R3=3, R4=3, R5=3, R6=2, R7=2
- **Facts used:** service description verbatim ("Flat-rate
  long-distance moving from Winchester, VA and Martinsburg, WV");
  audience stated from the service description (households and
  families moving to or from Martinsburg, WV and the Eastern Panhandle).
- **Conservative note (not a gate failure):** the rubric's VA
  destination list (FL/TX/NY/CA/NV) was deliberately NOT carried to
  this Martinsburg page — it is not attested for Martinsburg. If the
  owner wants Martinsburg-specific long-distance destinations named,
  that is owner input, not a builder guess.
- **Missing sections:** none.

### 3. packing-movers-martinsburg-wv — READY

- **Title:** Packing Movers — Martinsburg WV
- **Service:** Packing and Unpacking (`service-packing`)
- **Rubric:** R1=3, R2=3, R3=3, R4=3, R5=3, R6=2, R7=2
- **Facts used:** service description verbatim ("Full, partial and
  fragile-only packing and unpacking, including loading and
  unloading"); audience "residential, commercial, senior, and estate
  clients" (rubric.html §1); Martinsburg branch record.
- **Missing sections:** none.

### 4. sir-heavy-movers-martinsburg-wv — READY

- **Title:** SIR Heavy Movers — Martinsburg WV
- **Service:** SIR Heavy Asset Relocation (KIM-GS Protocol)
  (`service-sir-heavy`)
- **Rubric:** R1=3, R2=3, R3=3, R4=3, R5=3, R6=2, R7=2
- **Facts used:** service description verbatim (SIR Structural
  Integrity Relocation + KIM-GS Protocol, high-mass assets 1,500–
  3,500 lbs — safes, medical devices, cryogenic equipment, pianos,
  antiques — floor deflection analysis to L/360); audience from that
  description; Martinsburg branch record.
- **Missing sections:** none.

### 5. gun-safe-movers-martinsburg-wv — READY

- **Title:** Gun Safe Movers — Martinsburg WV
- **Service:** Gun Safe Moving (`service-gun-safe`)
- **Rubric:** R1=3, R2=3, R3=3, R4=3, R5=3, R6=2, R7=2
- **Facts used:** service description verbatim (SIR + KIM-GS, safes
  1,500–3,500 lbs, route and clearance survey, floor deflection to
  L/360, load spreading, floor protection, verified placement, one
  flat rate in writing); audience "safe owners, collectors, and
  high-value households" (rubric.html §1); Martinsburg branch record.
- **Missing sections:** none.

## Why R6 and R7 are 2 (publish-time items, not content failures)

- **R6 = 2 on all 5 pages:** staged content has no image assigned.
  At publish, each page must get a real credited photo (a verified
  company photo with an honest caption, or a photo explicitly labelled
  "Style example"). No image was invented or attached here.
- **R7 = 2 on all 5 pages:** the staged quote card uses the exact
  wording ("Get My Flat Rate Quote", Short/Quick Quote by default,
  Detailed Project, From/To/What's moving preserved) and points to
  the live form, which was verified with that toggle on 2026-10-28.
  Toggle behavior itself is a property of the live form and must be
  re-checked at publish time, which is why the staged page scores 2
  rather than claiming 3 for a form it does not contain.

## Corridor pages — BLOCKED, pending owner input (NOT in this batch)

The I-66 and I-70 corridor pages were deliberately NOT built in batch
1, per the task scope and the Phase 2 outlines:

- **Interstate 66** (proposed slug `interstate-66-corridor`):
  missing *Who it is for* (no verified I-66 audience) and *Route
  description — path, exits, stops* (no verified I-66 route data).
- **Interstate 70** (proposed slug `interstate-70-corridor`):
  missing the same two sections, for the same reason.

**Exactly what input is needed:** for each corridor, either (a) the
owner supplies the audience and the route description (path, exits,
stops) with a source, or (b) the owner approves building the pages
with those two sections held out. Until one of those happens, the
corridor pages stay blocked and no route detail will be invented.

## What the owner must approve before batch 1 could go live

1. **The 5 staged pages as content** — read `out/pages/<slug>/
   content.md` for each slug above; approve, or request edits.
2. **Image assignment per page** (closes R6) — one real credited
   photo per page, or an explicit "Style example" label.
3. **Live-form toggle re-check at publish** (closes R7) — confirm
   Short/Detailed still preserves From/To/What's moving on the live
   form at publish time.
4. **Slugs** — planner-pattern slugs (`<service>-movers-martinsburg-wv`),
   zero collisions in the registry; confirm they are the slugs wanted.
5. **Long-distance audience note** — confirm the VA destination list
   stays off the Martinsburg long-distance page, or supply
   Martinsburg-attested destinations.
6. **Corridor pages stay out** until the owner input in the section
   above arrives.

No page in this batch goes live without all six. The next batches
(Martinsburg rows 6–15 in planner order) follow the same gate.


---

## REVISED 2026-10-28 — full footprint build (supersedes the verdicts above for the pages in this batch)

These pages were revised by scripts/build-phase3-full.js: expanded from
GBP-only to the full published footprint per owner decision 2026-10-28
(Winchester 31, Martinsburg 35, shared noted), plus logo image,
backlinks, and BreadcrumbList. New scores and verdicts are in
out/phase3-full-scores.json; the full report is out/phase3-full-report.md.
Previous content approval does NOT carry over — the revised pages need
re-approval before any publish. Nothing was deployed or published.
