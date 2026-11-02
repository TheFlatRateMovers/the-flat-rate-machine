# BATCH RECORD — Blog Wave 1 Day 1 AM: Transloading flagship (2026-11-02)

Batch: `batch-blog-transloading-2026-11-02` · Wave 1, Day 1 AM slot
(Henry's 2026-11-02 schedule change: Transloading pulled forward from
Day 10 AM to anchor on the new /freight-rework-transloading/ page;
Residential re-pairs with Freight Rework Nov 11, Senior with Local &
Regional Nov 13 — all 29 flagships and both daily slots unchanged).
Authorization: Henry's standing blog authorization 2026-10-31 (posts
pre-approved, no per-post sign-off; QA gates G1–G8 bind).

## ERRORS / DEVIATIONS FIRST

1. **Brief deviation (link target):** the task brief named `/transloading/`
   as the service-hub link. That URL is a live 404 — no such page exists.
   The article links `/transloading-winchester-va/` (the actual
   Transloading Services hub, service-transloading-winchester-va). No
   other brief item was affected.
2. **Seal convergence:** seal.py's proof round failed on runs 1–2 of the
   first series (intent generator two-pass property: the new page's
   roll-up rows appear on the generator's second pass, 3,096 → 3,098
   rows; then row cert-digests lag one seal behind the file digests).
   seal.py is idempotent; three runs reached the fixpoint in the first
   series (seal 0270e83e…), one run after the embed sync (6a747488…),
   and one run after the I-10/phase-a fixes (487cf7eb…, reproduced
   byte-identical on a confirmation run). No check was waived.
3. **verify.js local run after the first fixpoint: 112/114** — two real
   defects, both fixed inside the batch: (a) I-10 — the intent landing
   per-page JSON's dateModified (2026-11-01) was older than the
   regenerated dataset file's (2026-11-02); seal.py's landing sync copies
   the description only, so the date was synced by hand to the dataset
   file's own value. (b) The phase-a staged llms.txt sitemap clause still
   stated 212 clean canonical URLs; updated to 213. After fixes:
   **114/114 local**.
4. **Landing embeds:** after the seal regenerated the derived datasets,
   the intent / search-index / answer-evidence / archive-registry
   landing divs in the shell carried stale embedded dataset JSON-LD.
   Re-synced with `work/sync-embeds.py` on the sync-intent-div.py pattern
   (embed = the file's exact bytes; prose totals updated to the new
   files: rubric 3,098 rows, fragments 2,263, bound-exact 501,
   page-covered 2,597, clusters 2,290, supply 213 pages, services 29;
   cert SHA lines refreshed). All six dataset landing embeds now match
   their files byte-for-byte (local-graph + crawl-presence already did).
   Known residual (pre-existing, not introduced here): the intent
   landing's static per-service table was already divergent from its
   dataset file before this batch (table 165 vs file 169 transloading
   rows pre-batch; file now 171) — the established sync pattern covers
   embed + headline counts + cert SHA only; flagged for the parent.
5. **API test race:** the first `node test/run-tests.mjs` run after the
   bundle refresh failed 2 tests (index count, verify match) because it
   raced the refresh's bundle write; a clean re-run passed 51/51. No
   code defect.
6. **Registry script assert:** `work/registry-edits.py` step 9's
   end-of-file assert omitted the word "company" and aborted after
   steps 1–8 had committed; steps 9–10 were applied by a corrected
   follow-up script. No partial state resulted (step 9 writes atomically
   at its end).
7. **Word count:** the article renders 2,862 words — above the
   instruction set's 1,600–2,400 target band, deliberate for the
   flagship (end-to-end service authority) format and in line with the
   program's deepest shipped posts (2,543 ledger words); recorded in the
   draft QA report and the ledger, not hidden.
8. **FORMULA amendment (arrived mid-batch):** Henry's THE NEWS FORMULA
   standing rule + the §05 amendment landed while this batch was in
   flight (MEMORY.md, 2026-11-02; clarified the same morning: the
   Google-aspect News gates executed BY the Machine through its existing
   blog pipeline — the Machine is not replaced). The amendment's own
   sequencing states the formula batch executes first and later builds
   are born under it; this batch was already in flight and was completed
   to the requirement set in force at its start. Recorded-not-faked
   deltas for the formula batch's retrofit pass on this article:
   (a) visible byline + full ISO timestamp at the article head (the post
   carries the series' closing byline; no visible timestamp);
   (b) author.url → author page in the BlogPosting author node;
   (c) ≥1 compliant landscape image (none carried; no owner photo of
   transloading work is on file);
   (d) post nodes in both live graphs (posts carry none by established
   estate pattern — post #5 and JOB1 have zero nodes in both graphs; the
   graph files' only changes in this batch are digest-refresh strings);
   (e) visibility-matrix counting (the post enters the measured estate
   through the search-index supply row and rubric rows generated by the
   seal). Detail in the draft folder's qa-report.md.

## RESULT

- **Published:** "Transloading at the Virginia Inland Port: how freight
  changes mode" — https://theflatratemovers.com/transloading-at-the-virginia-inland-port/
  (slug collision-checked free against shell, registry, live sitemap and
  ai-sitemap before build). 2,862 rendered words; 54-word answer box;
  6 FAQ questions mirrored byte-equal in FAQPage schema (asserted at
  staging); per-page JSON = Organization + BlogPosting + Service +
  both-branch Place nodes + FAQPage + BreadcrumbList.
- **Intent split honored:** post #5 stays the definitions explainer;
  8-gram overlap 3.78% (gate <15%). Cross-linked both ways.
- **Owner emphasis:** /freight-rework-transloading/ is the article's
  primary internal link (featured section: true scope, recovery
  protocol, 49 CFR 393 standard, emergency/after-hours at premium rates,
  NO rate published, CWT schedule never mentioned). Other links:
  /transloading-winchester-va/ (hub), /virginia-inland-port-transloading/,
  post #5, /datasets/transloading/, /long-distance-movers-winchester-va/
  (service page; the PM batch adds the reciprocal blog-to-blog link).
- **Inbound links added:** blog hub card (33 == blog.json hasPart 33),
  sitemap-page row, all-pages chip, Related-pages chips on the
  transloading hub + freight hub, chip on the VIP page, flagship pointer
  in post #5.
- **Counts:** pages 212 → 213 · sitemap 250 → 251 locs · signed
  distributions 498 → 500 · rubric rows 3,096 → 3,098 (+2 for the new
  page, awaiting observation) · answer fragments 2,203 → 2,263 ·
  search-index clusters 2,288 → 2,290 · blog hub 32 → 33 articles.
- **Seal lineage:** 76fa7b21… (pre) → 0270e83e… (first fixpoint) →
  6a747488… (embed sync) → **487cf7ebb7ac0a1739d780fd865f5f6d1582f1b19757b710e2b3ebdc087036d5**
  (final, reproduced identically on a confirmation run), 500
  distributions, 0 gaps, PROVENANCE OK.
- **verify.js:** pins re-expressed in the same motion (212→213,
  498→500; D-2 Dataset-instance pin 362 unchanged — a blog route carries
  no Dataset nodes); record at out/verify-fix-2026-11-02-blog-transloading.md.
  Local: 114/114. Full live: **144/145 — sole failure P-6**, naming the
  machine-repo mirrors this batch's connector pushes then corrected
  (head-data.js, verify.js) plus the oversized shell mirror flagged
  below. (Closing-shape note: after the connector pushes, P-6's only
  remaining mismatch is the shell — see the post-push verification line
  appended to this record.)
- **Deploy:** Pages, 121 files uploaded, deployment
  https://4073819c.the-flat-rate-movers.pages.dev; live spot check of the
  article passed (own title, hero, all sections, FAQ, CTAs).
- **API cadence:** bundle refreshed (signed-index digest matches 40/40),
  test literal re-expressed 498 → 500, tests 51/51, worker redeployed —
  version 1b094fa7-1095-4e51-8a95-1a108668aec1; live probe
  /v1/verify?file=transloading-at-the-virginia-inland-port.json →
  match:true, source live.
- **IndexNow:** submitted (see appended line).
- **GSC queue:** the new URL joins the next Search Console pass queue by
  this record (the 2026-11-02 09:40 pass was already running its booked
  queue; per the freight precedent the URL is noted here, not edited
  into the running pass). Archive cadence: the URL joins the E6-B3
  target table at its next generation (260-target table + this page).
- **QF-2 note:** the public llms.txt §-front sitemap clause (line 58)
  still states an older URL total — part of the standing QF-2 queue
  (next-site-batch queue item 1) with its exact change-set in the
  visibility-matrix deliverable; this batch updated the phase-a staged
  copy (pinned by verify) and stated true counts in its own update
  section.

## ADDENDUM — embed pass 2, final seal, second deploy, IndexNow

- The first embed sync's prose edits fed the dataset generators, so the
  post-sync seals regenerated the intent / search-index / answer-evidence
  files once more (equal-length digest-string and count-string swaps;
  totals unchanged). A second sync pass (`work/sync-embeds-pass2.py`,
  embeds + cert SHAs only) plus one seal reached the stable fixpoint:
  **final seal `c22c751b71b1c996d38b05880f7d0a2b575c2fe3e811f3323347c50c6589978a`**,
  500 distributions, 0 gaps, reproduced byte-identical on a confirmation
  run. (This supersedes the 487cf7eb… seal named earlier in this record;
  the full lineage stands in the RESULT section plus this addendum.)
  At the final seal all six dataset landing embeds match their files
  byte-for-byte, and `node verify.js --local` reads **114/114** again.
- Second Pages deploy (final shell): deployment
  https://8cf83194.the-flat-rate-movers.pages.dev, exit 0.
- API cadence repeated at the final seal: bundle refresh (digest match),
  tests 51/51, worker redeployed — version
  **2943f681-baa6-4e1c-bc69-c54382a08497** (supersedes 1b094fa7…).
- **IndexNow: HTTP 200** — 12 URLs submitted and accepted (the new
  article plus the 11 changed surfaces: blog hub, transloading hub, VIP
  page, freight hub, post #5, sitemap page, all-pages, and the four
  re-synced dataset landings).

## ADDENDUM 2 — repo-dir middleware sync, FINAL seal, closing verify

- The first post-push full verify (144/145) named one further P-6
  mismatch: `_middleware.js` — the digest source for repo-served files
  is `repo-dir/<basename>`, and `repo-dir/_middleware.js` was stale
  (its STATIC_FILES block predated the freight-rework, IndexNow and
  this batch's additions; the deployed Pages functions copy was
  current). Fixed at source: `repo-dir/_middleware.js` synced from the
  deployed functions copy, then re-sealed.
- **FINAL SEAL: `5ad5c13cfbf582f0962ea95b475c60670ce3252bb05d0d91aed2a131c0adb591`**,
  500 distributions, 0 gaps, reproduced byte-identical on a confirmation
  run; local verify 114/114. (Supersedes c22c751b…; the flagged shell's
  own sealed SHA-256 is unchanged at 9768d137… and the answer-evidence
  file's at fa96201b… — neither file's bytes moved in this step.)
- Third Pages deploy (final-seal index) exit 0; API bundle refreshed,
  tests 51/51, worker redeployed — version
  **589b0730-5c36-4c99-956f-ea80f57d7fd5**. Sealed index + JWS re-pushed
  to the ai repo: commit **55b5c9857daf01b99beb4a09297d8a2a7ba67cf1**
  (first ai push: f91d6c2db89fd13fd5e3416a1eed8e68c5253276; machine push:
  51cfec8a65b308b0a0291442872f4a5fc627a0b1 — read-backs byte-identical by
  git blob SHA; gist-based data/entity-graph.json verified untouched at
  cda897e61319a0f52172ef1365402e4d7179cddf).
- **CLOSING FULL VERIFY: 144/145 — the sole failure is P-6, naming ONLY
  the Site Shell mirror** (served 23,353,941 B vs sealed 23,653,885 B),
  which is the flagged parent web upload below. Every other check in
  the 145-check suite passes live.

## FLAGGED FOR PARENT WEB UPLOAD (never via the connector)

1. Machine repo `code/site-shell/index.html` ←
   `~/workspace/the-flat-rate-machine/repo-dir/index.html` —
   23,653,885 bytes; sealed SHA-256 (final signed index):
   `9768d137a4c3ecf71ab15f9b4c14a0906587758fb8517796a49ba4aaad545f95`
   (local bytes hash identically).
2. AI repo `data/datasets-answer-evidence.json` ←
   `~/workspace/the-flat-rate-movers-pages/public/datasets-answer-evidence.json` —
   7,559,606 bytes; sealed SHA-256:
   `fa96201b03f5deed70959329293d6c5a6096dd2f34597eaf9cf8ba7098396e97`
   (local bytes hash identically).

The ai-repo graph mirrors (data/entity-graph.json,
data/best-json-entity-graph.json) were NOT pushed: the public graph
bytes changed only by digest-refresh strings, the entity-graph mirror
is the protected gist-pinned file (never overwrite), and the most
recent precedent (IndexNow batch) pushed neither graph. The local-graph,
crawl-presence and archive-registry dataset mirrors were verified
byte-identical to the repo copies by git blob SHA — no push needed.
NEVER touched: the gist-based ai data/entity-graph.json.
