# VERIFY FIX — Quote-form chip bindings, hero heavy group, per-type sections (2026-11-01)

Batch: Quote-Form Fixes (Henry's orders of 2026-11-01; diagnosis at
~/workspace/theflatratemovers/quote-form-chip-diagnosis-2026-11-01.md).
Full record: out/batch-quote-form-fixes-2026-11-01/records/BATCH-RECORD.md.

## What was broken

1. **Heavy chips on the quote form were dead (proven in code).** Their
   click binding existed only inside `initHeavy()` in
   scripts/route-assets/main.js, dispatched only for the Heavy Asset
   page. `initQuote()` never bound them and `initQuotePicks()` bound
   only #projectPick/#servicesPick — so on /quote/ the heavy chips had
   no handler, no selected state, and `pickList('heavyPick')` always
   returned empty: every inquiry summary read
   "Heavy / high-value: None noted".
2. **The hero Short form had no heavy selector at all (proven in
   markup).** No chip group existed on the home hero card, so a Short
   quote started there could never note a heavy item.
3. **Project/services chips: binding present but fragile.** A single
   per-button binding set existed and no second binding was found in
   the served documents; the structure had no guard against a double
   binding (which toggles twice per tap and reads as a dead chip —
   Henry's live report was that NONE of the chips function). The fix
   removes the fragility class rather than arguing with the report:
   one delegated handler, bound exactly once, owns every group.

## The fix (sources only; routes regenerated, never hand-edited)

- `initQuotePicks()` now binds ONE delegated click handler on
  #quoteForm (guard: `form.__pickBound`) covering #heavyPick,
  #projectPick and #servicesPick. A tap toggles `.on` exactly once and
  mirrors `aria-pressed`; `pickList()` reads the same state into the
  summary and the payload. The stray binding was removed from
  `initHeavy()`. Delegation on the form element survives the WebMCP
  annotation's detach/annotate/reinsert of the form.
- Hero Short form: a `#heroHeavyPick` group (same six items, same
  labels) with the same delegated contract (`initHeroPicks`, bound
  from `initHome`). Selections ride the existing prefill into the
  quote form's #heavyPick group (`applyPrefill`), so the Short
  summary captures them instead of "None noted".
- Project type: multi-select (unchanged mechanism, now delegated) and
  the list expanded 8 → 20 with the registry's specialty types
  (Senior Moving, Gun Safes, Pianos & Antiques, Medical Equipment,
  Cryogenic, Heavy Assets (SIR), ISPM 15 Export, Warehouse
  Relocation, Data Center & IT, Freight Rework & Transloading,
  Moving & Storage, Junk Removal). Five conditional sections
  (`.ptype-fields`, shown by `refreshProjectSections()` from each
  section's `data-types`) reveal only a selected type's own fields:
  ptResidential (room-by-room inventory: bedrooms up to 6, living,
  dining, kitchens, bathrooms, home office, garage, basement, loft,
  patio/deck, on-property storage), ptHeavy + ptAccess (the existing
  heavy/sensitive and origin/destination access fields), ptExport
  (destination country, items to pack & crate), ptFreight (situation,
  the load). The submit handler composes only revealed sections into
  the summary and the payload; new values ride the existing payload
  keys (the notes value carries the labeled inventory/export/freight
  lines), so the delivery route — Worker, functions/api/quote.js —
  is byte-untouched.
- Capture completeness: visitor-value controls 54 → 85 (hero heavy
  6; projectPick +12; inventory selects 11; export 2; freight 2),
  every one inside the value-capture path. Honeypot still excluded
  and still hardcoded `website: ''` in the payload.

## Check changes in this motion (stricter, never waived)

- **W-2 pin re-expressed**: the quote-form segment md5 moved
  `4d8d49f05b22b129eac623a41370d9cb` → `23d1825f2f5c87ff519e60bba628805d`
  because the form markup changed. Same property (the canonical
  segment identity), new canonical value. The matching QUOTE_MD5 pin
  in scripts/build-routes.js (both copies) moved in the same motion.
- **W-5 added (new)**: served-byte assertions that every pick group
  is present with its full button set (heavyPick 6, projectPick 20,
  servicesPick 7, heroHeavyPick 6), all five `.ptype-fields` sections
  carry `data-types`, all 15 conditional-section controls are
  present, and the delegated binding (`__pickBound`,
  `refreshProjectSections`) is present in the served script. Suite
  144 → 145 checks.
- Functional proof before deploy: a harness exercising the shipped
  function bodies (extracted verbatim from the new main.js) against a
  fake DOM — 13/13 pass (exactly-one handler after double init,
  toggle on/off, multi-select section reveals per type, capture).
  The live click-test on the real pages is the parent's closing step,
  per the standing rule (no test quote submissions, ever).
