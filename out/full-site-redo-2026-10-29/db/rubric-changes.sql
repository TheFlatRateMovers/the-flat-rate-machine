-- FULL-SITE REDO 2026-10-29, AREA D — rubric.db changes, STAGED COPY ONLY.
-- Source (untouched): ~/workspace/theflatratemovers/rubric.db
-- Target (this script applied to): ~/workspace/the-flat-rate-machine/out/full-site-redo-2026-10-29/db/rubric.db
-- No rows added, no rows deleted. No rubric_check rows added. No fragment-service edge rows added.
-- Every change below rewrites wording/URL only; facts, counts, branches, and ratings are unchanged.
-- Forbidden-name note: change 2 removes forbidden third-party names from row 15; the old
-- wording is NOT reproduced in this log or in the audit report, by owner instruction.

-- 1. attestation rowid 12: drop stale-error framing ("superseded unified-hours ... removed").
--    Reason: POWER framing — state the distinct-branches rule affirmatively, not as a correction history.
UPDATE attestation SET claim = 'Winchester and Martinsburg hours are distinct and must not be unified' WHERE rowid = 12;

-- 2. attestation rowid 15: remove forbidden third-party names (redacted here, not quoted).
--    Reason: owner instruction 2026-10-28 — those names must not be published; keep only the fact they were removed.
UPDATE attestation SET claim = 'Industrial & Commercial Project Support page live 2026-10-28, dynamic filter, GeoJSON area counts, exact CWT rates Unload $8.00, Load $10.00, APU $12.00, Residential/Driver Meet $400-$425 per man, third-party names removed per owner instruction' WHERE rowid = 15;

-- 3. attestation rowid 41: drop gap framing ("thin head node", "previously held zero occurrences").
--    Reason: state the shipped Residential node affirmatively; do not publish a before-state gap.
UPDATE attestation SET claim = 'Residential Moving full Service node #service-residential added to both machine graphs 2026-10-29; head node carries the same two-branch chain' WHERE rowid = 41;

-- 4. attestation rowid 42: replace gating word "gated fields ... omitted" with a factual scope statement.
--    Reason: new thought process — no hedging/gating framing; the omitted-field list is kept as provenance, reframed neutrally.
UPDATE attestation SET claim = 'Residential Moving datasets D1–D8 published as Dataset JSON-LD 2026-10-29, CC BY 4.0, creator organization @id, dateModified 2026-10-29; fields without a verified company term (storage terms, valuation offering, apartment capability, same-day availability, debris scope, prohibited list, pricing beyond flat-rate-in-writing) not published' WHERE rowid = 42;

-- 5. attestation rowid 43: drop "Martinsburg-skewed node (url and areaServed replaced)" history framing.
--    Reason: state the shipped two-branch gun-safe chain affirmatively; branches stay distinct, footprint 31/35 unchanged.
UPDATE attestation SET claim = 'Gun-safe Service node refreshed to full two-branch chain in both machine graphs and head graph: entity node and best-graph node carry the hub chain, head node upgraded (serviceType casing, areaServed pattern), Place areaServed expanded to full footprint Winchester 31 / Martinsburg 35, branches distinct' WHERE rowid = 43;

-- 6. attestation rowid 44: replace gating word "gated fields omitted" with a factual scope statement.
--    Reason: same as change 4 — no gating framing in copy that could be quoted.
UPDATE attestation SET claim = 'Gun-safe datasets D1-D8 published as Dataset JSON-LD (CC BY 4.0, dateModified 2026-10-29) at /datasets-gun-safe.json with hub-div markup and Developer-page collection entry; fields without a verified company term not published' WHERE rowid = 44;

-- 7. attestation rowid 45: drop "fragment upgraded in place from Winchester branch page url" history framing.
--    Reason: state the shipped commercial hub chain affirmatively; Q10a hub approval is retained in the wording.
UPDATE attestation SET claim = 'Commercial Service node shipped to full two-branch chain in both machine graphs and head graph: entity node carries the commercial-moving hub url (owner-approved Q10a Option A 2026-10-29), best-graph node added, head node upgraded with hub url and Place chain and full footprint, branches distinct' WHERE rowid = 45;

-- 8. attestation rowid 49 (evidence field, not claim): remove the word "staged" from evidence wording.
--    Reason: no staged/pending framing in copy; the batch reference itself is unchanged.
UPDATE attestation SET evidence = 'commercial-moving page div + schema description, commercial deep batch 2026-10-29' WHERE rowid = 49;

-- 9. attestation rowid 50: drop gap framing ("thin head node", "string-area fragment node", "page-slug-only coverage, corrected to").
--    Reason: state the canonical-hub outcome affirmatively; do not publish a before-state gap.
UPDATE attestation SET claim = 'Commercial graph finding 2026-10-29: one canonical hub node now carried in all three graphs (head, entity, best)' WHERE rowid = 50;

-- 10. service #service-commercial: URL moves from the fragment @id to the approved hub page.
--     Reason: owner-approved Q10a Option A 2026-10-29 — fragment url moves to hub https://theflatratemovers.com/commercial-moving/ everywhere.
--     service_id (stable @id) is unchanged; only the url field moves. The page-slug row for commercial-moving already carries this hub url.
UPDATE service SET url = 'https://theflatratemovers.com/commercial-moving/' WHERE service_id = 'https://theflatratemovers.com/#service-commercial';

-- 11. service #service-senior-moving: fix garbled description wording ("survey room with").
--     Reason: copy cleanup only — no fact changed; the survey and the human-made estimate are both retained.
UPDATE service SET description = 'Flat-rate senior moves quoted in writing for seniors downsizing, transitioning to assisted or independent living, or relocating closer to family, with packing support and a free film-only video-walkthrough survey, with a human-made estimate.' WHERE service_id = 'https://theflatratemovers.com/#service-senior-moving';
