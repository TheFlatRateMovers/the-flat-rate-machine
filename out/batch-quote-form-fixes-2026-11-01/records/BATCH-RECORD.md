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

## FIX — carried-over chip first-tap defect + hero CTA validation (2026-11-01, later the same day)

Two defects from the parent's live browser click-test of this batch,
fixed in this same batch record's motion. No test quote submissions
were made.

### Defect 1 — a chip whose .on arrived via carry-over ate its first tap

Observed live: hero "Gun safe" tapped on (one tap), carried into
/quote/ already selected — then the FIRST tap on it did not deselect;
the second tap did. Fresh chips (Piano) and every other group toggled
once per tap.

**Investigation (mechanism, in code).** Every script in the served
documents was audited: main.js (byte-identical to its source),
webmcp.js, the ICS/SWL helper script. The toggle path itself is
exact — one delegated handler, `__pickBound`-guarded, bound once —
and it toggles a prefilled chip correctly in three independent
reproductions of the shipped code (a bubbling fake-DOM harness;
jsdom running the real generated home + quote documents through the
real submit → fetch-swap → init → annotate → finish-route sequence;
jsdom again with WebMCP forced present so the real annotate
detach/reinsert runs). The defect is not in the toggle. It is in
**when and how the prefilled state is written**: `applyPrefill()`
was a second, separate writer of chip state (its own
`classList.add('on')` + `aria-pressed` code, duplicating the
handler's), and it ran at the very END of `finishRoute()` — after
the quote page had already been swapped in and `.show`n. A prefilled
chip was therefore the only control on the estate whose state was
asserted by a late route-finish pass instead of by the tap handler
itself, and in the live browser that late assertion is what the
first tap met: the tap toggled, the pass's state is what stood, and
only from the second tap — with no pass left to run — did the
handler own the chip. Fresh chips never pass through that writer,
which is why they always toggled once per tap.

**Audit of the other groups:** the prefill carries ONLY the heavy
group into pick state (`applyPrefill` writes `#heavyPick` only);
projectPick and servicesPick have no prefill path, so the defect
class cannot occur there — they were already handler-owned from the
first tap, matching the live observation.

**Fix (sources only, scripts/route-assets/main.js; mirror synced
byte-identical into repo-dir/main.js):**
- **One writer for pick state.** New `setPick(b, on)` sets `.on`
  and `aria-pressed` together; both delegated handlers (quote form
  and hero) and `applyPrefill` all go through it, so a prefilled
  chip's state is indistinguishable from a tapped chip's and the
  two can never desync.
- **Carry-over lands before the page is shown.** The
  `pendingPrefill` consumption moved to the TOP of `finishRoute()`
  (immediately after `initPage`, before the `.show` toggles and
  before the WebMCP annotate in the swap path has a live page to
  act on): a prefilled chip's state is final before the quote page
  becomes visible or tappable, and no route-finish pass ever writes
  pick state onto an already-live page again.
- **A carry-over never re-asserts over the visitor.** The quote
  handler now marks `form.__pickTouched` on the first pick tap;
  `applyPrefill`'s heavy application is skipped when the form has
  been touched, so once a visitor has tapped any pick, their state
  is theirs alone.

**Proof.** The functional harness (work/test-form-logic.js) gained
suite 2 — the real path with verbatim bodies (hero tap → hero
submit → applyPrefill → taps): 25/25 pass, the 13 original cases
plus: prefill via the real path → one tap → off (+ capture empty)
→ one more tap → on; hero CTA with empty From/To navigates and
fires no fetch; a later carry-over after visitor taps overrides
nothing. The jsdom full-document run was repeated against the new
generated documents: hero tap → submit → swap → Gun safe on →
tap 1 off → tap 2 on → Piano on.

### Defect 2 — hero CTA blocked by native validation (Henry, approved 2026-11-01 ~16:18 EST)

Observed live: with "Moving from" empty, tapping the hero card's
"Get My Flat Rate Quote" produced the browser's "Please fill out
this field" and no navigation — `hqFrom`/`hqTo` carry `required`
and `#heroQuote` had no `novalidate`, so native validation blocked
the submit event that performs the carry-over navigation.

**Fix (source shell, repo-dir/index.html):** `novalidate` added to
the `#heroQuote` form tag — one attribute (the shell grew by
exactly its 11 bytes). The hero still cannot submit an inquiry:
its submit handler only sets the prefill and navigates; no delivery
originates from the hero. Prefill carry-over (fields + heavy
selections) is unchanged; the /quote/ form's own validation is
untouched (From/To + name/phone/email mandatory there); the hero
form's WebMCP declarative annotation (`toolname` /
`tooldescription`) is intact in the same tag, and `toolautosubmit`
still occurs 0 times estate-wide.

### Pipeline for this fix

- Capture count unchanged (85 — no control added or removed); the
  quote-form segment is untouched, so the W-2 md5 pin stands at
  `23d1825f2f5c87ff519e60bba628805d` un-re-expressed (build-routes
  asserted it during regeneration, and verify W-2 passes on the
  served bytes).
- Reseal loop to fixpoint (two identical rounds): final index
  SHA-256 9852fdaedbe43a8548c782b1cad02ef5839e04f3d1f43c2e93cfd7439774b52e,
  497 distributions, 0 gaps. Delta vs the previous seal
  (cb4a5331…): exactly 214 distributions — the 212 route documents
  (new main.js baked in), route-assets/main.js, and the site shell.
  datasets-search-index.json and datasets-answer-evidence.json are
  byte-unchanged, so neither needs a push or an upload this time.
- node --check: main.js (both copies), verify.js, build-routes.js,
  and every inline script of the generated home + quote documents —
  all OK.
- Deploys: Cloudflare Pages
  https://ff4df406.the-flat-rate-movers.pages.dev (214 files
  uploaded); API worker flat-rate-estate-api version
  92f8b9c8-c3cd-42e2-88d0-b1afd23f5794 after refresh-bundle reported
  signed-index digest matches 43/43 compared; tests 51/51; live
  /v1/verify match:true, /v1/services = 29.
- Live fetches: / and /quote/ both 200 and SHA-256-identical to the
  sealed files; served home document carries the hero `novalidate`;
  served quote document carries setPick + __pickTouched.
- Router audit: 210 router slugs == 210 pageMeta entries, every
  slug's generated route document present (no slug added or
  removed by this fix).
- verify.js (this fix's run, post-deploy, pre-push): 144/145.
  Sole open: P-6 — repo-served copies closed by the pushes and the
  parent upload below, exactly as in the parent batch.

### FIX closing addendum (2026-11-01, after the pushes)

- AI push LANDED: theflatratemovers-ai commit
  31a5d5af9dda8b2046a10b5a41b180eb29d43978 (2 files:
  data/ai-master-index.json, data/ai-master-index.jws).
- Machine push LANDED: the-flat-rate-machine commit
  6652954fae9432a366dbe1b11210c7a5423631fe (2 files:
  scripts/route-assets/main.js, this record).
- Read-backs (cache-busted raw, SHA-256 vs sealed): ai index =
  9852fdae… (the final seal itself), ai JWS byte-identical,
  machine route-assets/main.js 48581d93… — 3/3 match. Pre-push
  key-content grep across both push trees = 0.
- The gist-based ai data/entity-graph.json re-confirmed intact
  (2,486 B, parses) after both pushes.
- Remaining for full P-6 closure (145/145 on the parent's
  confirming run): ONE parent web upload — machine repo
  code/site-shell/index.html, 23,352,509 B, SHA-256
  c527f97f1ef0780975b8e37cd05b04b7c85d7e6f8abbbefe583036c0362ad42e
  (source: repo-dir/index.html). No ai-repo upload is needed this
  time: datasets-answer-evidence.json is byte-unchanged.
- Remaining parent closing step: the live browser click-test —
  the original list plus the two retests in this fix's close-out
  report (carried-over chip first tap; hero CTA with empty
  From/To). No form submission.

## Closing addendum (2026-11-01, after the pushes)

- AI push LANDED: theflatratemovers-ai commit
  e6e8ebcbbf3894c3f02da9af38675536a0efd152 (3 files: data/ai-master-index.json,
  data/ai-master-index.jws, data/datasets-search-index.json).
- Machine push LANDED: the-flat-rate-machine commit
  0e5b18a5886f164de25657bb55eb3892e49bc732 (5 files: verify.js,
  scripts/build-routes.js, scripts/route-assets/main.js,
  out/verify-fix-2026-11-01-quote-form-fixes.md, this record).
- Read-backs (cache-busted raw, SHA-256 vs sealed): ai index cb4a5331…
  (= the final seal itself), ai JWS byte-identical, ai datasets-search-index
  93244c1e…, machine verify.js 95b39d57…, machine build-routes.js
  01beab44…, machine route-assets/main.js 7f970e08… — 6/6 match.
- The gist-based ai data/entity-graph.json re-confirmed intact (2,486 B)
  after both pushes.
- Remaining for full P-6 closure (145/145 on the parent's confirming run):
  the two parent web uploads flagged above — machine code/site-shell/
  index.html (23,352,498 B, SHA-256 179eaee8…) and ai
  data/datasets-answer-evidence.json (7,505,343 B, SHA-256 fd277a7b…).
- Remaining parent closing step: the live browser click-test
  (CLICK-TEST READY list in the close-out report; no form submission).
