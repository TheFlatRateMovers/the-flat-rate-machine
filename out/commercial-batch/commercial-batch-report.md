# Commercial deep batch — deploy report (2026-10-29, second attempt)

Deploy URL: https://b77a97d8.the-flat-rate-movers.pages.dev
Live domain verified: https://theflatratemovers.com (same build, all checks pass on both;
deploy-URL index 1,133,805 bytes vs custom-domain index 1,163,558 bytes is Cloudflare
obfuscation variance only — every content check passes on both, and every JSON file is
byte-identical across both origins).

Q10a: APPROVED by the owner 2026-10-29 ~07:13 (widget tap "Yes, point it at the hub",
Option A). The #service-commercial node points at the hub
https://theflatratemovers.com/commercial-moving/ everywhere. The first attempt stopped
(not deployed, nothing edited, nothing pushed) on the brief-vs-merge-note conflict; this
attempt resolves it by the owner's decision and does not re-open it.

## Gate (all passed before deploy)

- `node --check` on both inline scripts in index.html: OK (885 chars, 122,899 chars).
- `verify.js` pre-deploy: **71/71 PASS**, exit 0. Post-deploy re-run: **71/71 PASS**.
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

1. Full `#service-commercial` node in BOTH machine graphs (same @id, no duplicate):
   entity node upgraded IN PLACE from branch-page url + 31 flat string areas to
   hub url, serviceType "Commercial Moving", alternateName "Commercial Moving",
   staged description, areaServed via `#winchester-place` / `#martinsburg-place`
   @ids. Best graph gained the fragment node (was 0 occurrences) with the same
   full fields. Entity 39 nodes, best 75 → 76 nodes. Place nodes already
   31/35 in both graphs (verified, not changed).
2. Head-graph nodes upgraded in place (still 24 nodes total): commercial
   serviceType "Commercial moving" → "Commercial Moving", description replaced
   with the staged description, url = hub ADDED, areaServed 7 broad strings →
   Place @ids `#winchester` / `#martinsburg` (head convention, as the
   industrial-commercial head node already used).
3. D1–D8 datasets as Dataset JSON-LD (CC BY 4.0, creator organization @id +
   6 verified social sameAs, temporalCoverage 2010/2026, spatialCoverage =
   two branch @ids never merged, dateModified 2026-10-29): machine file
   `datasets-commercial.json` (8 nodes, 27,228 bytes) + static block inside
   the commercial-moving page div (verified inside the div, before the office
   div) + Developer-page "Commercial datasets" card after the Gun Safe card.
4. llms.txt commercial services line refreshed to the hub link + full staged
   description + D1–D8 summary + datasets link; dated "Update — 2026-10-29
   (commercial deep batch)" section appended; history intact.
5. Data txt dated "Update 2026-10-29 — commercial deep batch" section appended;
   SERVICES name list and SIR/KIM-GS section left alone (residential pattern).
6. ai-sitemap commercial entry refreshed in place (description replaced with
   the staged description — no duplicate entry); keywords 29 → 32 with 3 real
   GSC queries (corporate movers winchester va; business moving companies near
   me; commercial movers winchester va). Text diff vs pre-batch file =
   commercial description + keyword lines only. Services 22, hasPart 153.
7. Rubric DB: canonical fragment row verified present (no new service row);
   opening_hours 14 and service_area 66 verified (no new rows); 7 attestation
   rows added (node shipment; branch facts; GBP areas + footprint; GSC demand;
   page scope; fragmentation finding; domain research) with evidence
   deliberately NOT containing "services.json id", so the verify constraint
   stays 22. Attestations 43 → 50. No edge rows, no rubric_check row
   (brief governs over merge-note §5 proposals on both — see deviations).

## Carried follow-ups (both shipped in this batch, verified live)

- (a) Residential hub per-page JSON: `public/residential-moving.json` created
  (was verified absent) from the residential-deep staged schema, Place areas
  expanded to the DB footprint 31/35. Live: 200 + application/json, 5 nodes.
- (b) Gun-safe head node: upgraded to carry url + Place chain under the same
  @id (url = https://theflatratemovers.com/gun-safe-movers/, areaServed =
  Place @ids). URL and Place chain ONLY — gun-safe datasets, page copy, and
  attestations untouched. Live head graph: exactly one #service-gun-safe,
  url = hub, Place @ids.
- Hub per-page JSON for commercial: `public/commercial-moving.json` created
  from the commercial-deep staged schema, Place areas expanded to the DB
  footprint 31/35. Live: 200 + application/json, 5 nodes.

Per-page JSON note (recorded, not a gate failure): the Place area lists in
both new JSONs are the rubric DB service_area lists (31/35), identical to the
live machine-graph Place nodes. The older senior-moving JSON in the ai repo
renders the same 31/35 counts with a different string format (ZIP-suffixed
town names, port and corridor strings). Counts and branch assignment match;
string-rendering alignment is a future normalization pass, not a deploy
blocker, and no live file was rewritten to chase it.

## Deviations from merge-note proposals (brief governs)

- NO rubric_check row (merge-note §5 proposed one; that table is a 7-row
  checks catalog, not per-service scores — residential/gun-safe precedent).
- NO edge rows (merge-note §5 proposed fragment-service + cross-ref edges;
  the edge table holds ZERO fragment-service edges — adding commercial-only
  fragment edges would break the pattern; future edge-model decision).
- Registry rename "Commercial and Office Moving" → "Commercial Moving" NOT
  taken (only the url move was approved; Q10b stays flagged). Registry name,
  ai-sitemap service name, and llms service name stay "Commercial and
  Office Moving"; serviceType and alternateName carry "Commercial Moving".
- Page-slug nodes untouched (commercial-moving/#service,
  commercial-office-moving-2/#service, commercial-movers-winchester-va/#service
  all remain; consolidation stays flagged, not taken).
- ARD catalog unchanged (residential/gun-safe datasets are not in ARD either).
- No live page-copy changes (Phase E depth brief stays staged).

## Not in this batch (verified absent)

No new page, no pages.json/services.json change, sitemap stays 153, no
gun-safe attestation content, no Winchester parity copy, no video page, no
other category, no GBP edits, no DNS/track.sl changes, no quote test posts,
no paid services, no gist-graph overwrite (ai push uses
data/entity-graph-full.json only; data/entity-graph.json is not in the push).

## Live verification (all PASS, both deployment URL and custom domain)

- Commercial hub 200 with own div, dataset block, and Commercial card.
- datasets-commercial.json 200 + application/json, 8 nodes, all CC BY 4.0,
  all dateModified 2026-10-29.
- commercial-moving.json 200 + application/json, 5 nodes; residential-moving.json
  200 + application/json, 5 nodes.
- sitemap.xml 153 locs; ai-sitemap services 22, hasPart 153, keywords 32
  (all 3 new commercial GSC keywords present).
- Live head graph 24 nodes, exactly one #service-commercial (url = hub, Place
  @ids) and exactly one #service-gun-safe (url = hub, Place @ids).
- Live machine graphs: entity 39 nodes / best 76 nodes, exactly one
  #service-commercial each, url = hub, Place lists 31/35.
- Tagline present; "Get My Flat Rate Quote" present; 0 "DESIGN 6"; quote markers
  heroQuote/quoteForm/hqWalk/qWalk unchanged.
- Prior per-page JSONs still application/json: senior, warehouse,
  transloading-winchester-va, IT page, datasets-residential, datasets-gun-safe.

## Backups

`out/commercial-batch/backup-2026-10-29/` (index.html, ai-sitemap.json,
llms.txt, data txt, both graphs, rubric.db — true pre-edit copies; the
builder never overwrites existing backups on re-runs). Excluded from pushes.

## Build incidents (fixed pre-deploy, no live impact)

- First builder run failed at the data-txt name check: the check expected the
  exact string "Commercial and Office Moving" in the data txt, but the file
  carries "Commercial Moving" and "Commercial and Office Movers — Winchester
  VA" instead. By that point the run had already written the graphs, the
  llms.txt refresh, and the datasets file, but had NOT written index.html or
  touched the rubric DB. All written files were restored from the pre-edit
  backup (verified: entity commercial url back to the branch page, best
  75 nodes / 0 fragments), the check was corrected to "Commercial Moving",
  and the second run completed clean. No live impact: the deploy happened
  only after the clean run + verify.js green.
- Gun-safe attestation clarification (MEMORY.md, 2026-10-29 ~07:17, arrived
  during this build): the gun-safe answers are general starting points, not
  final copy — the follow-up gun-safe attestation batch must dig deeper,
  research full understanding, and formulate customer-search/AI phrasing,
  with company claims limited to what Henry attested. That clarification
  affects the follow-up batch only; this batch correctly shipped no
  gun-safe attestation content, per its exclusions.
