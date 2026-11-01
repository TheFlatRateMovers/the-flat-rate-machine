# BATCH RECORD — Quote-form fixes, 2026-11-01

Henry's orders of 2026-11-01 (three fixes, corrected scope: NONE of the
chips function). Diagnosis:
~/workspace/theflatratemovers/quote-form-chip-diagnosis-2026-11-01.md.
Verify-fix record: out/verify-fix-2026-11-01-quote-form-fixes.md.
One narrow batch; full pipeline inside the batch. Delivery route
(Worker flat-rate-quote-email, functions/api/quote.js) byte-untouched —
delivery was confirmed working by Henry; this batch is
selection/capture/UX only. No test quote submissions were made at any
point.

## Errors first — each found in-batch and fixed in the same motion

1. First build-routes run failed on "head template lacks the seeded
   page-jsonld slot": the generator's default --shell is the Pages
   tree's public/index.html, which held the previous generated home
   document. Fixed by the established order (copy the source shell to
   public/index.html first, then generate) — the same order the
   freight reseal loop uses.
2. Second build-routes run failed on the quote-form segment md5 pin —
   the expected, designed failure: it printed the new canonical
   segment md5 23d1825f2f5c87ff519e60bba628805d. Pins re-expressed in
   the same motion (verify.js W-2 + build-routes.js QUOTE_MD5, both
   copies of each); regeneration then passed with the new pin.
3. First live fetch of the served documents truncated (proxy
   IncompleteRead, the environment's known pattern); re-fetched with
   curl — served bytes SHA-256-identical to the sealed files.
4. Verify run 1+2: 144/145 — the single open check is P-6 (GitHub
   copies), itemized below; it closes with this batch's machine push
   plus the parent's shell web upload, exactly as in prior batches.

## What was broken (audit of every chip group, both forms)

- **heavyPick on /quote/ — no handler at all (proven in code).** The
  binding lived inside initHeavy() in scripts/route-assets/main.js,
  dispatched only for the Heavy Asset page; initQuote() never called
  it and initQuotePicks() bound only #projectPick/#servicesPick.
  pickList('heavyPick') therefore always returned empty → "Heavy /
  high-value: None noted" on every inquiry.
- **Hero Short form — no heavy selector existed (proven in markup).**
  The home hero card had From / To / What's-moving-type only.
- **projectPick / servicesPick — binding present, structure fragile.**
  One per-button binding set, no duplicate in the served documents;
  but no guard existed against a double binding (two toggles per tap
  reads as a dead chip — Henry's live report: NONE function). Replaced
  with a structure where a tap provably registers exactly once.

## What changed

Sources only (repo-dir/index.html markup+CSS; scripts/route-assets/
main.js behavior; mirrors synced byte-identical into repo-dir/):

- **Delegated chip binding.** initQuotePicks() now binds ONE delegated
  click handler on #quoteForm (guard form.__pickBound) covering
  #heavyPick, #projectPick, #servicesPick; a tap toggles .on exactly
  once and mirrors aria-pressed. The stray binding was removed from
  initHeavy(). initHeroPicks() gives the hero form the same contract.
  Delegation on the form element survives the WebMCP annotation's
  detach/annotate/reinsert; toolautosubmit still occurs 0 times.
- **Hero heavy group.** #heroHeavyPick (same six items/labels as the
  quote form) added to the hero Short form; selections ride the
  prefill (prefill.heavy) and applyPrefill() sets them .on in the
  quote form's #heavyPick group, so the Short summary captures them.
- **Project type: 8 → 20 types, multi-select, per-type sections.**
  Added: Senior Moving, Gun Safes, Pianos & Antiques, Medical
  Equipment, Cryogenic, Heavy Assets (SIR), ISPM 15 Export, Warehouse
  Relocation, Data Center & IT, Freight Rework & Transloading,
  Moving & Storage, Junk Removal (all from the service registry).
  Five conditional sections (.ptype-fields + data-types, CSS pair
  added beside .detailed-fields; refreshProjectSections() recomputes
  on every project tap and at init):
  - ptResidential (Residential, Senior Moving): room-by-room
    inventory — bedrooms (up to 6), living rooms, dining rooms,
    kitchens, bathrooms, home office/study, garage, basement, loft,
    patio/deck, on-property storage (11 selects, leading empty option
    so an untouched select is never sent as a choice).
  - ptHeavy (13 facility/specialty types): the existing Heavy &
    sensitive items fields.
  - ptAccess (same 13 types): the existing origin/destination access
    fields; headings renamed "SIR / KIM-GS access —" → "Access —" so
    the section reads correctly for every type it serves.
  - ptExport (ISPM 15 Export): destination country; items to pack &
    crate for export.
  - ptFreight (Freight Rework & Transloading): what happened
    (load shift / rejected / rework / rail-to-truck / cross-dock /
    other); the load and where it sits now.
  A residential selection reveals ONLY the residential section — no
  ISPM-15 or industrial fields are shown, per Henry's design.
- **Capture.** The submit handler composes only revealed sections
  into the summary and payload: heavy/access payload keys are gated
  on their sections; the inventory/export/freight values ride the
  existing notes payload key as labeled lines (the Worker renders the
  email from a fixed key list — new keys would be dropped; the
  delivery route itself is untouched). Visitor-value controls
  54 → 85, all inside the capture path; honeypot still excluded.
- **Invariants held:** contact block always visible before
  #detailedFields and captured in both modes; mandatory = name,
  phone, email (+ From/To) only; dates optional, captured when
  filled; Short/Detailed toggle preserves all entries; hero card
  cannot submit; WebMCP annotations intact and atomic.

## Verification (no test submissions, ever)

- Functional harness (work/test-form-logic.js) exercising the shipped
  function bodies verbatim against a fake DOM: 13/13 pass — exactly
  one handler after double init; heavy chip on/off + capture;
  Residential reveals only ptResidential; Gun Safes adds ptHeavy +
  ptAccess; Export adds only ptExport; Freight adds ptFreight;
  multi-select capture string exact; deselect hides only its section;
  services chips toggle + capture.
- node --check: main.js, verify.js, build-routes.js, and every inline
  script of the generated home + quote documents — all OK.
- build-routes: 212 documents; quote segment md5 canonical at the new
  pin; D-2 Dataset-node instances 362 (unchanged); hero segment in
  the generated home document byte-equal to the source shell's.
- Reseal loop to fixpoint (two identical rounds): final index
  SHA-256 cb4a53319f5f0dfc008821a4673595fea17b2e0ee1621311e0fb21cc6d058160,
  497 distributions, 0 gaps. Rubric rows unchanged (3,096); services
  29; pages 212; dataset files 38.
- Deploys: Cloudflare Pages https://7a35ba3e.the-flat-rate-movers.pages.dev
  (216 files uploaded); API worker flat-rate-estate-api version
  b0bf9852-0706-419b-a9e9-50b3c6488ae6 after refresh-bundle reported
  signed-index digest matches 43/43 compared; tests 51/51; live
  /v1/index = 497 distributions, /v1/services = 29, /v1/verify
  match:true.
- Live fetches: / and /quote/ both 200, served bytes SHA-256-identical
  to the sealed files; served quote segment md5 =
  23d1825f2f5c87ff519e60bba628805d; all five sections + delegated
  binding present in served HTML; hero group present on the home
  document; router pages array unchanged (no new slugs; / and /quote/
  serve their own documents — the byte equality above is the route
  test).
- verify.js (this batch's run, post-deploy, pre-push): 144/145.
  W-2 PASS at the new pin; W-5 PASS (full structure on served bytes).
  Sole open: P-6 — 23/27 repo-served match; mismatches are exactly
  verify.js, scripts/build-routes.js, scripts/route-assets/main.js
  (closed by the machine push below) and the site shell (parent web
  upload below). After both land, the suite reads 145/145.

## Changed distributions (218 of 497)

All 212 route documents (shared head CSS + the new main.js are baked
into every document), datasets-answer-evidence.json and
datasets-search-index.json (regenerated in the reseal loop), and the
four machine-repo files. llms.txt, llms-full.txt, ai-sitemap.json,
both graphs, the intent dataset and the other registry datasets are
byte-unchanged.

## Pushes (one per repo, back-to-back; pre-push key-content grep = 0)

- ai repo (theflatratemovers-ai): data/ai-master-index.json,
  data/ai-master-index.jws, data/datasets-search-index.json.
  (datasets-answer-evidence.json changed but is over the connector
  ceiling — parent upload below.)
- Machine repo (the-flat-rate-machine): verify.js,
  scripts/build-routes.js, scripts/route-assets/main.js,
  out/verify-fix-2026-11-01-quote-form-fixes.md, this record.
  (code/site-shell/index.html changed but is over the connector
  ceiling — parent upload below.)

## Parent-upload flags (over the ~5.8 MB connector ceiling)

1. Machine repo code/site-shell/index.html — 23,352,498 B, SHA-256
   179eaee8bad631182572775c05d151d4e35b7eb7a7d68548ac1e8b33654e01aa
   (source: repo-dir/index.html). This is the last P-6 mismatch.
2. AI repo data/datasets-answer-evidence.json — 7,505,343 B, SHA-256
   fd277a7b712aa087e547466746384b1693ce40443e73e2f70a8c9dc250d6c8eb
   (source: public/datasets-answer-evidence.json).

## Parent closing step — live click-test

The browser click-test (no form submission) is the parent's closing
step; the exact list is in the batch's close-out report
(CLICK-TEST READY).
