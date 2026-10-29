# FULL-SITE REDO 2026-10-29 — AREA D: Rubric Database Audit (STAGED ONLY)

- Source (read-only, untouched): `~/workspace/theflatratemovers/rubric.db`
- Staged copy: `~/workspace/the-flat-rate-machine/out/full-site-redo-2026-10-29/db/rubric.db`
- SQL log (every change, with reason comments): `~/workspace/the-flat-rate-machine/out/full-site-redo-2026-10-29/db/rubric-changes.sql`
- Nothing live, nothing deployed, nothing pushed, no quote test run. The gun-safe staged directory was not touched.
- The `attestation` table is internal provenance only. It was NOT renamed and no rows were deleted for containing the word "attestation"; only published/quotable wording inside rows was reframed.

## Verification

- Copy made with `sqlite3 .backup` while no writer was active. Pre-change dump of source vs. copy was identical.
- Post-change staged copy: `PRAGMA integrity_check` = `ok`.
- Source after work: md5 unchanged (`97e422f6da56d255b679a617857b4e90`), integrity `ok`, attestation still 50 rows.
- Source-vs-copy dump diff after changes: exactly 11 rows changed (11 old lines / 11 new lines), all listed in `rubric-changes.sql`. No other row differs.
- Changed-row forbidden scans = 0 for: the two forbidden third-party names (terms not spelled out here, per owner instruction), temp labor, crew page, bare "flat quote", subcontract, gated, pending, staged.
- Full-copy residual: the only USDOT hit in the whole staged copy is rubric_check R5, an internal check worded as a negation ("license/USDOT omitted") — unchanged, and allowed for internal notes. No USDOT claim about the company exists anywhere in the DB.
- No private client data found: scans for known private-client surnames returned 0 rows in every table, and attestation row 9 states only that license details are private — it contains no license details. No private content was copied into this report or the SQL log.
- Branches distinct in the staged copy (place + service_area): Winchester = The Flat Rate Movers, 116 W Piccadilly St Suite 11, Winchester VA 22601, Google 5.0 / 1 review, 31 service areas; Martinsburg = Flat Rate Movers Martinsburg WV (no "The"), 736 Williamsport Pike Suite 2, Martinsburg WV 25404, Google 4.7 / 6 reviews, 35 service areas. Phone +1-540-422-2153 on both. Ratings are stated factually and per branch, never blended, never aggregator-substituted.

## Pre / post row counts (identical — wording/URL fixes only, no adds, no deletes)

| Table | Before | After |
|---|---|---|
| entity | 1 | 1 |
| place | 2 | 2 |
| service | 31 | 31 |
| service_area | 66 (Winchester 31, Martinsburg 35) | 66 (unchanged) |
| edge | 40 | 40 |
| attestation | 50 | 50 |
| rubric_check | 7 | 7 |
| opening_hours | 14 | 14 |

## Table-by-table findings

### entity (1 row) — CLEAN
- `https://theflatratemovers.com/#organization`, Organization/LocalBusiness/MovingCompany, "The Flat Rate Movers LLC", url `https://theflatratemovers.com/`. No hedging, no stale URL. No change.

### place (2 rows) — CLEAN
- Both rows match the standing facts exactly (addresses, geo, phone, per-branch Google name/rating/review count above). No blended rating, no blended name, no change.

### opening_hours (14 rows) — CLEAN
- Winchester: Mon–Fri 08:00–18:00, Sat 08:00–16:00, Sun 09:00–16:00. Martinsburg: Mon–Fri 09:00–18:00, Sat 09:00–16:00, Sun 09:00–16:00. Exactly the standing hours, distinct per branch. No change.

### rubric_check (7 rows) — CLEAN, catalog untouched
- R1–R7 are a checks catalog, not per-service scores. No rows added, none changed. R5's "license/USDOT omitted" is an internal negation check, not a company claim, and is left as-is. R4 ("fact is omitted" if unattested) is internal procedure, not customer copy.

### service_area (66 rows) — CLEAN, with two documented notes (no changes)
- Winchester 31, Martinsburg 35 — matches the 31/35 footprint and attestation row 47 ("shared 14": verified, the two area sets intersect on exactly 14 names).
- Every GBP base area is present: all 16 Winchester GBP areas and all 14 Martinsburg GBP areas appear in service_area (Martinsburg "Eastern Panhandle of West Virginia" is the GeoJSON wording of the GBP "Eastern Panhandle of West Virginia" area). The extra rows beyond the GBP base are all sourced per-row as "service-area.geojson footprint (branch property), adopted 2026-10-28" — a documented expansion, not a stale count.
- No blended areas: each row is keyed to exactly one place_id.

### edge (40 rows) — FLAGGED AS A DOCUMENTED DISCREPANCY, deliberately NOT changed
- Composition: organization→location 2; Winchester areaServed 16; Martinsburg areaServed 14; page-slug service→provider 8. Total 40.
- The 16/14 areaServed edges are the GBP base, NOT the full 31/35 footprint in service_area. That lag is real, but expanding edge by 36 areaServed rows would be a graph-model change, and the task forbids starting edge-model decisions in this area. Left untouched and flagged here for the graph owner to decide; no fragment-service edge rows exist (0), and none were added.
- All 8 provider edges point to the organization @id. No wrong provider. No change.

### service (31 rows) — 2 CHANGES, rest clean or documented
Violations fixed:
1. `#service-commercial` — url field: old url was the fragment `https://theflatratemovers.com/#service-commercial`. STALE after owner-approved Q10a Option A (2026-10-29): the fragment url moves to the hub `https://theflatratemovers.com/commercial-moving/` everywhere. FIXED in the copy: url = `https://theflatratemovers.com/commercial-moving/`; service_id (stable @id) unchanged. The page-slug row `commercial-moving/#service` already carried the hub url, so this removes the one remaining fragment-url straggler for commercial.
2. `#service-senior-moving` — description: old wording "...with packing support and a free film-only video-walkthrough survey room with a human-made estimate." FIXED to "...with packing support and a free film-only video-walkthrough survey, with a human-made estimate." Copy cleanup only; no fact changed.

Checked clean (no change):
- All 31 provider_id values = the organization @id. No wrong provider.
- All 22 canonical fragment rows (see reconciliation) carry POWER descriptions (flat rate quoted in writing, SIR/KIM-GS 1,500–3,500 lbs, L/360, CWT rates where verified). No "gated"/"pending"/"staged" wording in any description. "Teams" wording in the industrial rows is the owner-supplied "trained, supervised, self-managed teams" model — not temp-labor language, not a crew page — and was left alone.
- No invented prices, move counts, testimonials, credentials, contracts, or clearances in any description. The only prices are the verified CWT / per-man industrial rates.
- NOT fixed (deliberately, approval boundary): residential and gun-safe fragment rows still carry fragment urls (`#service-residential`, `#service-gun-safe`) while their page-slug rows carry hub urls. Only commercial had an explicit owner hub-everywhere approval (Q10a). Residential/gun-safe hub-url moves are left for their own batch owners to approve, not silently applied here.

### attestation (50 rows) — 9 CHANGES, rest clean or documented
Violations fixed (old wording quoted exactly, except row 15 where forbidden names are redacted rather than republished):
1. Rowid 12, claim: old "CORRECTION 2026-10-28: superseded unified-hours attestation (Martinsburg hours same as Winchester) is removed; branches are distinct, do not unify" → new "Winchester and Martinsburg hours are distinct and must not be unified". Stale-error framing removed; the rule is now stated affirmatively. (Rowid 4 is absent from the table, consistent with the old unified-hours row having been removed earlier; no further deletion was made.)
2. Rowid 15, claim: old "...exact CWT rates Unload $8.00, Load $10.00, APU $12.00, Residential/Driver Meet $400-$425 per man, names [two forbidden third-party names REDACTED — not republished here] removed" → new "...third-party names removed per owner instruction". This was the only forbidden-name hit in the DB. The source column ("names stripped per Henry instruction") names nobody and was left unchanged.
3. Rowid 41, claim: old "Residential Moving full Service node #service-residential added to both machine graphs 2026-10-29; thin head node upgraded to the same chain; machine graphs previously held zero occurrences" → new "Residential Moving full Service node #service-residential added to both machine graphs 2026-10-29; head node carries the same two-branch chain". Gap/before-state framing removed.
4. Rowid 42, claim: old "...; gated fields (storage terms, valuation offering, apartment capability, same-day availability, debris scope, prohibited list, pricing beyond flat-rate-in-writing) omitted" → new "...; fields without a verified company term (storage terms, valuation offering, apartment capability, same-day availability, debris scope, prohibited list, pricing beyond flat-rate-in-writing) not published". Gating word removed; the omitted-field list is kept as neutral provenance.
5. Rowid 43, claim: old "Gun-safe Service node refreshed to full two-branch chain in both machine graphs and head graph: entity node upgraded in place from Martinsburg-skewed node (url and areaServed replaced), best-graph fragment node added, ..." → new "...: entity node and best-graph node carry the hub chain, ...". Skewed-before-state framing removed; footprint 31/35 and branch distinction retained verbatim.
6. Rowid 44, claim: old "...; gated fields omitted" → new "...; fields without a verified company term not published". Same gating fix as row 42.
7. Rowid 45, claim: old "Commercial Service node shipped to full two-branch chain in both machine graphs and head graph: entity fragment upgraded in place from Winchester branch page url to commercial-moving hub url (owner-approved Q10a Option A 2026-10-29), best-graph fragment node added, ..." → new "...: entity node carries the commercial-moving hub url (owner-approved Q10a Option A 2026-10-29), best-graph node added, ...". History framing removed; the Q10a approval itself is retained.
8. Rowid 49, evidence (claim unchanged): old "commercial-moving page div + staged schema description, commercial deep batch 2026-10-29" → new "commercial-moving page div + schema description, commercial deep batch 2026-10-29". Staged framing removed.
9. Rowid 50, claim: old "Commercial graph fragmentation finding: thin head node, string-area fragment node at branch page url, best-graph page-slug-only coverage, corrected to one canonical hub node in all three graphs" → new "Commercial graph finding 2026-10-29: one canonical hub node now carried in all three graphs (head, entity, best)". Gap/before-state framing removed.

Checked clean / false positives (no change):
- Rows 5, 6, 46 state ratings factually per branch ("Winchester Google rating 5.0, 1 review"; "Martinsburg Google rating 4.7, 6 reviews"). No review-volume apology, no "only * review" wording, no blending. Left alone.
- Row 9 ("License details private, not published") contains no license details. Left alone.
- Row 14 ("services synced, nothing deleted") and the industrial-offices description ("office areas within plants...") matched a naive "thin" substring search only because "nothing"/"within" contain "thin". Not violations. Left alone.
- Row 16's 2026-10-28 page character counts are a dated internal snapshot, not a current-count claim; left alone as history.
- Row 47's "expanded at merge to the full footprint Winchester 31 + Martinsburg 35, shared 14" is verified against service_area (31/35, shared 14). Left alone.
- No row contains a private client identity, job detail, USDOT/MC claim, price beyond the verified industrial rates, testimonial, or invented credential.

## The 31-vs-22 reconciliation (no rows deleted)

- `services.json` (read only, not edited) declares `count: 22`, with ids `service-residential` through `service-transloading-winchester-va`.
- The DB's 31 service rows decompose exactly as **22 + 8 + 1**:
  - **22 canonical rows**: `https://theflatratemovers.com/#service-*` — one per services.json id, same names and descriptions. These ARE the 22 services.
  - **8 page-slug rows**: `https://theflatratemovers.com/<page-slug>/#service` (commercial-moving, commercial-office-moving-2, container-loading-unloading-services-port-transload-virginia, gun-safe-movers, international-export-packing-crating-winchester-va, long-distance-movers-winchester-va, military-government-moving, residential-moving). These are per-page Service nodes for the same services under their hub/branch-page urls, not additional services. This is why several names repeat exactly ("Gun Safe Moving", "Residential Moving", "Long-Distance Moving", "Office Moving") or overlap ("Commercial and Office Moving" vs "Commercial Moving"; "Military Moving" + "Government Moving" vs "Military and Government Moving"; "ISPM 15 Export Packing" + "Custom Crating" vs "ISPM 15 Export Packing and Custom Crating"; "Loading, Transloading and Container Services" vs "Packing and Transloading"). They are a dual-model artifact (fragment @id model + page-slug model), not 8 extra services, and deleting them to force 31→22 would break the page-node model. Left in place; only the commercial fragment url was moved to its hub (see above).
  - **1 duplicate SPA row**: `https://theflatratemovers.com/#/industrial-commercial-services#service` ("Industrial & Commercial Project Support"), a second row for the same B2B service already carried canonically as `#service-industrial-commercial` ("Industrial & Commercial Services"), with a double-fragment id and an SPA hash-route url (`https://theflatratemovers.com/#/industrial-commercial-services`). Its description is the shorter owner-supplied pricing summary and is not wrong, so it was left in place and NOT deleted — but it is flagged here as the one true duplicate row. If a future batch consolidates models, this is the row to merge into `#service-industrial-commercial`, not any of the 22.
- **No storage service row was added.** Storage activation is a separate batch; the DB still contains no storage service, and none was invented here.
- No service row was deleted, and no rubric_check or edge row was added, per the task constraints.

## Open items for other owners (not changed here)

1. Edge areaServed lag: edge holds the 16/14 GBP base while service_area holds the 31/35 footprint (see edge section). Graph owner to decide whether edge should be expanded.
2. Residential and gun-safe fragment urls still point at `#service-*` while their page-slug rows carry hub urls; hub-everywhere for those two needs their own batch approvals (commercial's Q10a does not cover them).
3. The duplicate SPA industrial row (above) is a candidate for a future merge into `#service-industrial-commercial`; it was not merged here because that is a model change, not a wording fix.
