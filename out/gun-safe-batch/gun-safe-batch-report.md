# Gun-safe deep batch — deploy report (2026-10-29)

Deploy URL: https://94897d4a.the-flat-rate-movers.pages.dev
Live domain verified: https://theflatratemovers.com (same build, all checks pass on both).

## Gate (all passed before deploy)

- `node --check` on both inline scripts in index.html: OK (885 chars, 122,899 chars).
- `verify.js` re-run after registry updates: **71/71 PASS**, exit 0.
- Counts recomputed, never hand-edited: pages 153, services 22 (unchanged by design).
- Branches never blended: Winchester name/hours/rating 5.0/1 and Martinsburg
  name/hours/rating 4.7/6 distinct in every artifact; Place areaServed lists
  distinct with 14 shared areas (attested, not blending).
- Zero placeholders; zero invented prices, ratings, testimonials, credentials,
  contracts, clearances, or USDOT/MC; zero private-job details. USDOT mentions
  in live index.html: 0 before, 0 after. Banned-string counts unchanged
  (Spearman 0, Around Town 0, crew page 0, subcontract 0; one pre-existing
  "temp labor" hit unchanged from backup — not touched by this batch).

## What shipped (exactly the brief scope)

1. Full `#service-gun-safe` node refresh in BOTH machine graphs (same @id, no
   duplicate): entity node upgraded IN PLACE from Martinsburg-skewed
   (url = Martinsburg page, areaServed = Martinsburg areas) to two-branch
   (url = hub https://theflatratemovers.com/gun-safe-movers/, areaServed via
   `#winchester-place` / `#martinsburg-place` @ids); best graph gained the
   fragment node (was 0 occurrences). Entity 39 nodes, best 74 → 75 nodes.
2. Head-graph node upgraded in place (same @id, still 24 nodes total):
   serviceType "Gun safe moving" → "Gun Safe Moving", areaServed 6 broad
   strings → 4 broad strings (Winchester, VA / Martinsburg, WV /
   Shenandoah Valley / Eastern Panhandle of West Virginia); description
   already equaled the staged description (verified, kept).
3. Place areaServed expanded to the FULL footprint in both machine graphs
   (brief §5 + merge-note §3): Winchester 31, Martinsburg 35, shared 14,
   from the rubric DB service_area rows (66 rows, already covering the
   footprint — no new DB rows). Note: `scripts/build-graph.js` regenerates
   Place areaServed from `locations.json` GBP lists (16/14), so a future
   full regeneration would revert this expansion — builder-alignment
   follow-up, same family as the ai-sitemap generator alignment item.
4. D1–D8 datasets as Dataset JSON-LD (CC BY 4.0, creator organization @id +
   6 verified social sameAs, temporalCoverage 2010/2026, spatialCoverage =
   two branch @ids never merged, dateModified 2026-10-29): machine file
   `datasets-gun-safe.json` (8 nodes) + static block inside the gunsafe hub
   div (verified inside the div, before the residential div) + Developer-page
   "Gun Safe datasets" card after the Residential card.
5. llms.txt gun-safe services line refreshed to the full staged description +
   D1–D8 summary + datasets link; dated "Update — 2026-10-29 (gun-safe deep
   batch)" section appended; history intact.
6. Data txt dated "Update 2026-10-29 — gun-safe deep batch" section appended;
   SERVICES name list and SIR/KIM-GS section left alone (residential pattern).
7. ai-sitemap gun-safe entry verified in place (description already equaled
   the staged description — no duplicate entry); keywords 26 → 29 with the 3
   real GSC queries (gun safe movers; gun safe movers winchester va; gun safe
   movers martinsburg wv). Text diff vs pre-batch file = keyword lines only
   (re-dumped with ensure_ascii=False to keep the diff byte-minimal).
8. Rubric DB: canonical fragment row verified present (no new service row);
   opening_hours 14 and service_area 66 verified (no new rows); 2 attestation
   rows added (node refresh; datasets publication) with evidence deliberately
   NOT containing "services.json id", so the verify constraint stays 22.
   No edge rows, no rubric_check row (brief governs over merge-note §4
   proposals on both — see deviations).

## Deviations from merge-note proposals (brief governs)

- NO per-page JSON for the hub (merge-note §6 proposed it; brief §6 makes it
  a FOLLOW-UP, not this batch).
- NO edge rows (merge-note §4 proposed 3 new fragment-service edges; the edge
  table holds ZERO fragment-service edges — adding gun-safe-only fragment
  edges would break the pattern; residential precedent).
- NO rubric_check row (merge-note §4 proposed one; that table is a checks
  catalog, not per-service scores — residential lesson, brief explicit).
- ARD catalog unchanged (merge-note §5 fallback: leave unchanged and note it;
  residential datasets are not in ARD either, so no per-category ARD entry
  exists to mirror).

## Not in this batch (verified absent)

No new page, no pages.json/services.json change, sitemap stays 153, no
moving-and-storage node/page, no master Dataset node, no commercial/office/
local-regional/long-distance merges, no GBP edits, no DNS/track.sl changes,
no quote test posts, no paid services, no live page-copy changes (Winchester
parity stays a Phase E item), no gist-graph overwrite (ai push uses
data/entity-graph-full.json only).

## Live verification (all PASS, both deployment URL and custom domain)

- Gun-safe hub 200 with own div, dataset block, and Gun Safe card.
- datasets-gun-safe.json 200 + application/json, 8 nodes, all CC BY 4.0,
  all dateModified 2026-10-29.
- sitemap.xml 153 locs; ai-sitemap services 22, hasPart 153, keywords 29
  (all 3 gun-safe GSC keywords present).
- Live head graph 24 nodes, exactly one #service-gun-safe, serviceType
  "Gun Safe Moving".
- Live machine graphs: entity 39 nodes / best 75 nodes, exactly one
  #service-gun-safe each, url = hub, Place lists 31/35.
- Tagline present; "Get My Flat Rate Quote" present (371 → 372 mentions:
  +1 is the CTA wording inside the new D8 dataset description, expected);
  0 "DESIGN 6"; quote markers heroQuote/quoteForm/hqWalk/qWalk unchanged.
- Prior per-page JSONs still application/json: senior, warehouse,
  transloading-winchester-va, IT page, datasets-residential.

## Backups

`out/gun-safe-batch/backup-2026-10-29/` (index.html, ai-sitemap.json,
llms.txt, data txt, both graphs, rubric.db — true pre-edit copies; the
builder never overwrites existing backups on re-runs). Excluded from pushes.

## Build incidents (fixed pre-deploy, no live impact)

- Place-span search initially counted @id references instead of the Place
  node itself; fixed with a typed-span search (@id + @type Place).
- `re.sub` replacement-string escape error on the head description (em-dash
  escapes); fixed with a lambda replacement.
- Minified head-graph node broke the areaServed indent computation (line
  prefix ≠ whitespace); fixed to leading-whitespace-only indent.
- Dataset-block position check used pre-insertion offsets; fixed to
  post-insertion positions. Each failure happened before any index.html
  write; graphs were restored from backup before the final clean run.
