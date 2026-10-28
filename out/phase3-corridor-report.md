# Flat Rate Machine — Phase 3, Corridor Batch Report (STAGED ONLY)

**Status: staged. Nothing in this batch has been published, deployed, or
added to the live site.** Owner approval per batch is required before
any live publish. Builder: `scripts/build-phase3-corridor.js`, run
2026-10-28. Machine-readable scores:
`out/phase3-corridor-scores.json`.

## Owner decisions that unblocked this batch (2026-10-28, recorded)

Phase 2 left both corridor pages blocked on two missing sections. The
owner resolved both in discussion on 2026-10-28:

1. **AUDIENCE:** build "Who it is for" from the published GBP service
   areas for both branches (Winchester 16 areas, Martinsburg 14 areas).
   I-66 anchors on Winchester (published: Winchester home base at the
   I-81 × I-66 junction); I-70 anchors on Martinsburg (published Route
   81 stops tag: "Eastern Panhandle base · I-81 × I-70 side").
   Audience = households and businesses across those service areas
   needing corridor moves. Owner's words: "you have the areas, you saw
   the screenshots, all areas for both locations, you have many to
   chose from."
2. **ROUTE DESCRIPTION:** maximum VERIFIED coverage for visibility —
   the full three-corridor dispatch network (published Route 81 card),
   both hub junction tags, both branches' full service areas as the
   coverage footprint, and cross-links between the three corridor
   pages and the branch pages. Owner's words: "as many routes as
   possible, this is for visibility." No exits, stops, path detail, or
   town-on-highway claims are invented: the service areas are the
   audience/coverage pool, NOT a claim that a town sits on a
   particular highway — said explicitly on each page.

## Batch summary

- **Batch:** the 2 `gap-corridor-page` rows from
  `out/planner-matrix.json` (both P1).
- **Result: 2 READY, 0 BLOCKED.** Every page scores 3 on R1–R5 and 2
  on R6–R7, meeting the rubric go-live bar (3 on R1–R5, at least 2 on
  R6–R7). R6/R7 are 2, not 3, for publish-time reasons stated below —
  that is honest staging, not a failure.
- **Per page files:** `out/pages/<slug>/content.md` (full-format:
  What it includes / Who it is for / Where we serve / Route
  description — dispatch network / Questions, answered + standard
  service-area/published-data/quote card), `meta.json` (Phase 1
  corridor template, no editorial descriptions), `schema.json`
  (Service JSON-LD + canonical URL, both branch records kept distinct).
- **Branch facts used on every page (both branches, never blended):**
  Winchester — The Flat Rate Movers · 116 W Piccadilly St Suite 11,
  Winchester, VA 22601 · geo 39.18711576, -78.1668352 · hours Mon-Fri
  8-6, Sat 8-4, Sun 9-4 · Google rating 5.0 with 1 review · 16 service
  areas. Martinsburg — Flat Rate Movers Martinsburg WV · 736
  Williamsport Pike Suite 2, Martinsburg, WV 25404 · geo 39.48319665,
  -77.94760443 · hours Mon-Fri 9-6, Sat 9-4, Sun 9-4 · Google rating
  4.7 with 6 reviews (4 at 5 stars, 2 at 4 stars) · 14 service areas.
  Phone +1-540-422-2153 and price range $$ are company-wide.
  Moorefield 26836 appears in both lists; that is correct — it is
  served by both branches — and the pages say so.
- **Guardrail scans run independently on both pages (not just the
  builder's assertions):** no USDOT/MC numbers, no bare "flat quote"
  (only "Get My Flat Rate Quote" / "flat-rate quote"), no prices
  other than $$, no testimonials, no placeholder words, no numbered
  exit or stop claims, canonical URLs match slugs, schema areaServed
  is exactly each branch's list, schema node chain intact
  (Service → Organization; both LocalBusiness nodes →
  parentOrganization → Organization). All pass.
- **Gate note:** the builder's first run scored both pages BLOCKED
  (R5=0) on a display-formatting bug — numeric rating 5 rendered as
  "5" instead of the verified display form "5.0". The bug was in the
  builder, not the data: display strings now format ratings to one
  decimal (schema keeps the raw numbers). Re-run: 2 READY. No data
  file was touched to fix it.

## Per-page results

### 1. interstate-66-corridor — READY

- **Title:** Interstate 66 Corridor Moving
- **Anchor branch:** Winchester (at the I-81 × I-66 junction);
  Martinsburg is the second dispatch point.
- **Rubric:** R1=3, R2=3, R3=3, R4=3, R5=3, R6=2, R7=2
- **Audience wording (exact, first paragraph + Who it is for):**
  "Interstate 66 Corridor Moving for households and businesses across
  the published service areas — Winchester's 16 areas and Martinsburg's
  14 areas — needing corridor moves, dispatched from Winchester, VA
  and Martinsburg, WV and anchored on Winchester, at the I-81 × I-66
  junction." Plus the rubric's corridor row: "everyone in the 30
  published service-area entries: Winchester's 16 areas plus
  Martinsburg's 14 areas, each list kept per branch and never merged
  into one list."
- **Route description wording (exact, Route description — dispatch
  network):** "This section describes the dispatch network for
  corridor moves — not a turn-by-turn route. The published dispatch
  claim is: I-81, I-66 & I-70 dispatch from Winchester and Martinsburg.
  The network runs from two hubs: Winchester, at the I-81 × I-66
  junction (116 W Piccadilly St Suite 11, Winchester, VA 22601), and
  Martinsburg, Eastern Panhandle base · I-81 × I-70 side (736
  Williamsport Pike Suite 2, Martinsburg, WV 25404). The coverage
  footprint is the two branches' full published service areas, listed
  in full under Where we serve above: Winchester's 16 areas and
  Martinsburg's 14 areas." Cross-links: Route 81, both branch pages,
  Local & Regional Moving, and the Interstate 70 page. Scope
  disclaimer, printed on the page: "the service areas above are the
  audience and coverage pool for corridor moves. They are NOT a claim
  that any listed town sits on Interstate 66. No exits, stops, or
  turn-by-turn path are claimed on this page — none are published in
  any verified source, and none are invented here."
- **Missing sections:** none. (What is deliberately NOT published is
  listed below — that is scope, not a gap.)

### 2. interstate-70-corridor — READY

- **Title:** Interstate 70 Corridor Moving
- **Anchor branch:** Martinsburg (Eastern Panhandle base · I-81 × I-70
  side); Winchester is the second dispatch point.
- **Rubric:** R1=3, R2=3, R3=3, R4=3, R5=3, R6=2, R7=2
- **Audience wording (exact):** same audience pool as I-66, anchored
  on Martinsburg: "Interstate 70 Corridor Moving for households and
  businesses across the published service areas — Winchester's 16
  areas and Martinsburg's 14 areas — needing corridor moves,
  dispatched from Winchester, VA and Martinsburg, WV and anchored on
  Martinsburg, Eastern Panhandle base · I-81 × I-70 side."
- **Route description wording (exact):** same dispatch-network
  structure as I-66, with the scope disclaimer naming Interstate 70:
  "They are NOT a claim that any listed town sits on Interstate 70.
  No exits, stops, or turn-by-turn path are claimed on this page."
  Cross-links: Route 81, both branch pages, Local & Regional Moving,
  and the Interstate 66 page.
- **Missing sections:** none. (Deliberately-not-published items below.)

## Deliberately NOT published (scope, not gaps)

These were the Phase 2 "missing" items. The owner decisions above
resolved them by defining the page scope — the scope is now built and
printed on the pages, not left blank:

- Turn-by-turn path, numbered exits, and named stops for I-66 or I-70:
  no verified source states them, so they are not published anywhere
  on these pages. The Route description section covers the verified
  dispatch network instead, and says so.
- Any claim that a listed service-area town sits on I-66 or I-70: not
  claimed, and explicitly disclaimed on each page.
- The rubric's VA long-distance destination list (FL/TX/NY/CA/NV): not
  carried to the corridor pages. The owner-defined corridor audience
  is the service-area households and businesses; the destination list
  is a long-distance-page claim, not a corridor-page claim.

## Decisions embedded in this batch (owner approval items)

1. **Schema service node:** both corridor pages attach to the verified
   `#service-route81` node ("Route 81 Corridor Moving and Dispatch"),
   because its published description covers all three corridors
   ("Moving and logistics dispatch along Interstate 81, I-66 and I-70
   from Winchester, VA and Martinsburg, WV"). No new service node was
   invented for I-66/I-70. The page URL and title disambiguate the
   corridor.
2. **Schema areaServed:** the Service node references the two branch
   nodes by @id (`#winchester`, `#martinsburg`) rather than carrying
   a merged 30-entry list — so the per-branch lists are never blended
   even in schema. Each LocalBusiness node carries its own exact list.
3. **Title rule:** corridor name + "Corridor Moving" ("Interstate 66
   Corridor Moving"), from the Phase 1 corridor description template's
   own phrasing ("Interstate 66 corridor moving — ..."). The live
   corridor page is titled simply "Route 81"; the owner may rename
   these titles at approval.
4. **Q&A area answers:** the "Where do we serve?" answer names both
   branches and their counts and points to the full lists under Where
   we serve, rather than repeating all 30 entries a second time. The
   full lists appear once, in full, on each page.

## Why R6 and R7 are 2 (publish-time items, not content failures)

- **R6 = 2 on both pages:** staged content has no image assigned. At
  publish, each page must get a real credited photo (a verified
  company photo with an honest caption, or a photo explicitly labelled
  "Style example"). No image was invented or attached here.
- **R7 = 2 on both pages:** the staged quote card uses the exact
  wording ("Get My Flat Rate Quote", Short/Quick Quote by default,
  Detailed Project, From/To/What's moving preserved) and points to
  the live form, which was verified with that toggle on 2026-10-28.
  Toggle behavior itself is a property of the live form and must be
  re-checked at publish time, which is why the staged page scores 2
  rather than claiming 3 for a form it does not contain.

## What the owner must approve before these could go live

1. **The 2 staged pages as content** — read
   `out/pages/interstate-66-corridor/content.md` and
   `out/pages/interstate-70-corridor/content.md`; approve, or request
   edits.
2. **The audience wording** — households and businesses across both
   branches' published service areas, anchored per page (Winchester
   for I-66, Martinsburg for I-70).
3. **The route-description scope** — verified dispatch network only,
   with the printed disclaimer; no exits, stops, path, or
   town-on-highway claims.
4. **The schema decisions** — shared `#service-route81` node,
   @id-referenced areaServed, and the title rule above.
5. **Image assignment per page** (closes R6) — one real credited
   photo per page, or an explicit "Style example" label.
6. **Live-form toggle re-check at publish** (closes R7) — confirm
   Short/Detailed still preserves From/To/What's moving on the live
   form at publish time.
7. **Slugs** — planner-pattern slugs (`interstate-66-corridor`,
   `interstate-70-corridor`), zero collisions in the registry;
   confirm they are the slugs wanted.

No page in this batch goes live without all seven. With this batch,
the Phase 2 P1 queue is closed: the corridor gap is built, and the
Martinsburg batch 1 (5 pages) plus this corridor batch (2 pages) are
the staged Phase 3 output awaiting owner approval.


---

## REVISED 2026-10-28 — full footprint build (supersedes the verdicts above for the pages in this batch)

These pages were revised by scripts/build-phase3-full.js: expanded from
GBP-only to the full published footprint per owner decision 2026-10-28
(Winchester 31, Martinsburg 35, shared noted), plus logo image,
backlinks, and BreadcrumbList. New scores and verdicts are in
out/phase3-full-scores.json; the full report is out/phase3-full-report.md.
Previous content approval does NOT carry over — the revised pages need
re-approval before any publish. Nothing was deployed or published.
