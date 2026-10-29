# Residential deep-data batch — deploy report (2026-10-29)

**Deploy URL (Pages):** https://f93e5a00.the-flat-rate-movers.pages.dev — live domain serving the new build (verified on theflatratemovers.com).
**Gate:** node --check passed on both inline scripts. verify.js 71/71 PASS after registry updates (re-run by the merge agent). No quote test posts, no GBP edits, no DNS changes, no paid services.
**Counts (unchanged by design):** pages 153, services 22. No new page, no new pages.json entry, no services.json change (service-residential already among the 18 original services, pageCount 11 verified).

## What shipped

1. **Full #service-residential node into BOTH machine graphs** (data/entity-graph.json 38 → 39 nodes; data/best-json-entity-graph.json 73 → 74 nodes), same @id, no duplicate. Node shape follows the senior-machine pattern: areaServed via #winchester-place / #martinsburg-place @ids, provider #organization, serviceType "Residential Moving", description = the staged schema description (also the live pageMeta desc). The machine graphs previously held ZERO occurrences of service-residential.
2. **Thin head-graph node UPGRADED in place** (same @id, no duplicate): serviceType "Residential moving" → "Residential Moving" (registry name), areaServed 6 broad strings → 4 broad strings (Winchester, VA / Martinsburg, WV / Shenandoah Valley / Eastern Panhandle — the senior/IT head pattern), description → the full staged description. Head graph still 24 nodes.
3. **D1–D8 datasets converted to Dataset JSON-LD** (CC BY 4.0, creator organization @id + 6 social sameAs, temporalCoverage 2010/2026, spatialCoverage = two branch @ids never merged, dateModified 2026-10-29):
   - Live machine file: /datasets-residential.json (8 Dataset nodes).
   - Page-level markup: static Dataset JSON-LD block inside the residential-moving page div in index.html (present in raw HTML; verified inside the div, before the commercial div).
   - Developer-page collection entry: new "Residential datasets" card in the developer div linking to /datasets-residential.json.
   - Gated fields OMITTED, not guessed: storage terms, valuation offering, apartment-specific capability, same-day availability, debris scope, prohibited-items list, pricing beyond flat-rate-in-writing.
4. **llms.txt:** residential services line fixed (link now /residential-moving/, was home) + D1–D8 summary; dated "Update — 2026-10-29 (residential deep batch)" section appended. History lines intact.
5. **Data txt:** dated "Update 2026-10-29 — residential deep batch" section appended. The SERVICES name list already contained Residential Moving; it was left alone (as were the legacy SAL / Extreme-Mass names — out of scope).
6. **ai-sitemap.json:** residential entry description refreshed to the staged full description (not duplicated); keywords 22 → 26 (22 service names + 4 real GSC queries: movers near me, moving companies winchester va, winchester movers, movers martinsburg wv). dateModified/version already 2026-10-29, unchanged. services 22, hasPart 153.
7. **Rubric DB:** canonical service rows already 22 (residential fragment row existed); opening_hours 14 and service_area 66 already cover the full footprint — no new rows there. Two attestation rows added for the new facts (node + datasets), with evidence deliberately NOT containing "services.json id" so the verify attestation check stays 22.

## Live verification (custom domain, curl with browser UA) — all pass

- residential-moving: 200 + hero "Home moves at one flat rate" present.
- datasets-residential.json: 200 + application/json, 8 Dataset nodes, all CC BY 4.0, all dateModified 2026-10-29.
- sitemap.xml: 153 locs (unchanged). ai-sitemap: services 22, hasPart 153, keywords 26, residential description refreshed, 4 GSC keywords present.
- Per-page JSONs still application/json: senior-moving, warehouse-relocation, transloading-winchester-va, it-equipment-moving-data-center-logistics-services-virginia.
- Live index: tagline present, "Get My Flat Rate Quote" present, 0 "DESIGN 6", quote form markers intact (heroQuote, quoteForm, hqWalk, qWalk).
- Live head graph: 24 nodes, exactly one #service-residential, serviceType "Residential Moving", areaServed 4 strings.
- Live graphs: entity 39 nodes / best 74 nodes, exactly one #service-residential node each.
- Live developer card + residential Dataset block present in the served index.

## GitHub (same motion)

- **theflatratemovers-ai — commit 28792464bbbc8df70510a3c420aba5afadb45d4b** (6 files: llms.txt, the-flat-rate-movers-data.txt, ai-sitemap.json, data/entity-graph-full.json, data/best-json-entity-graph-full.json [new path], data/datasets-residential.json). Gist graph data/entity-graph.json untouched — push paths contained no such file.
- **the-flat-rate-machine — commit (see parent report)** (data/entity-graph.json, data/best-json-entity-graph.json, out/pages/residential-deep/ incl. datasets-residential.json, out/residential-batch/build-residential-batch.py + this report; backup/ excluded).

## Merge-note deviations (decided, recorded — brief governs over proposal)

1. **Per-page JSON (residential-moving.json) NOT deployed.** Merge-note §6 proposed deploying Dataset JSON-LD + schema to the new-page JSON serving path; the batch brief explicitly excluded the per-page JSON as a follow-up. The brief (parent instruction) governs over the proposal. Page-level markup was delivered instead as the static Dataset block in the residential div + the /datasets-residential.json machine file + the Developer card. Follow-up: real per-page JSON for residential-moving remains open (verify the new-page JSON serving path at that time).
2. **No edge rows added.** The merge-note proposed #service-residential edges, but the edge table holds ZERO fragment-service edges (senior/warehouse/IT/transloading got none in the previous batch either) — only page-slug edges exist. Adding residential-only fragment edges would break the pattern; left for a future edge-model decision.
3. **No rubric_check row added.** The rubric_check table is a checks catalog (check_id, check_text, passes_when — 7 rows), not per-service scores; the merge-note's proposed row shape does not fit it (it says "verify table shapes at merge" — verified, does not fit). The rubric record is rubric.md in the package dir.
4. **services.json description unchanged** (merge-note §1: "description stays"). The ai-sitemap description refresh therefore diverges from a future build-ai.js regeneration (which composes services entries from services.json descriptions) — a builder-alignment follow-up, not a blocker. The ai-sitemap diff was verified to contain ONLY the intended lines (1 description + 4 keywords).
5. **No service/edge/opening_hours/service_area row changes** beyond the 2 attestation rows (all already covered — verified, not assumed).

## Held / excluded (verified absent from this batch)

No moving-and-storage node or page (storage activation is a separate later batch; terms still being attested at this writing — Q1 answered yes, leased/any-items/30-day-minimum/customer-access attested, pricing basis still open — none of it touched here); no master Dataset node; no gun-safe, commercial, office, or local-regional merges (separate batches); no GBP edits; no DNS/track.sl changes; no quote test posts; no paid services; no residential page-copy changes (Phase E depth brief stays staged guidance only); no apartment or storage page.

## Still open (not this batch)

- Per-page JSON for residential-moving (follow-up; see deviation 1).
- Ocean D-node sameAs for the new Winchester transloading page (future regeneration; carried over from the previous batch).
- #/services ItemList omission of industrial-commercial (out of scope, left as-is; carried over).
- Developer-page "37 / 89 @ids" counts are stale prose from an older build (entity 39 / best 74 now) — not corrected here because the counting method behind those numbers could not be derived; flag for a future copy pass.
- ai-sitemap generator alignment for the hand-refreshed residential description (see deviation 4).
