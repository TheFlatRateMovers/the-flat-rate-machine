# EXECUTION RECORD — Batch Sitemap Architecture (2026-11-02)

Status at open: seal 80ef3602, 523 distributions, 224 pages, 30 services,
39 dataset files, sitemap.xml = 263 unique locs (224 registry pages + 39
dataset files), verify.js 149 checks.

## Errors first
1. MIDDLEWARE TWIN SYNCED ONE SEAL TOO LATE (coordinator error, fixed
   in-batch by seal #3). The repo-dir middleware twin must be synced
   BEFORE the seal whose digest phase covers it: I rebuilt the twin
   after seal #2, so seal #2's index digested the stale head-hub twin
   (29,515 B) while the tree, the deployed functions copy and GitHub
   all carried the new 574-entry twin (29,615 B). First closing run:
   152/155 with P-6 + M-2 + M-3 all naming _middleware.js. Fix: seal #3
   run with the correct twin already in place (the twin on disk and on
   GitHub was already the right bytes — only the sealed digest was
   stale). Local tier after seal #3: 121/121 with M-2/M-3/CP-2/CP-3/
   CP-5 green. Standing lesson: in any batch that changes the static
   tree, sync repo-dir/_middleware.js after the routes generation and
   BEFORE the closing seal — in a two-seal batch, that means after
   seal #1, not after seal #2.
2. Two API test expectations (signals count, distribution count) were
   stale literals — updated stricter-in-place per the stale-check rule
   (see Build log); not errors in the estate, recorded here so the
   tally is honest.

## Design decisions (taken in-batch, recorded per the brief)
1. SECTION ASSIGNMENT RULE (declared in scripts/build-sitemap.js, applied
   in order): (1) datasets — registry pages whose URL path starts with
   /datasets/ (40: hub + 39 landings) plus the 39 published dataset files
   = 79; (2) blog — the blog hub /blog/ plus registry pages whose slug is
   a published post in the blog ledger (10 posts) = 11; (3) pages — all
   remaining registry pages = 173. Union = 263, disjoint by construction;
   the generator proves set equality on every run and fails the seal
   otherwise. (Registry types do not classify blog posts — the ledger is
   the blog classifier of record.)
2. Section paths: /sitemaps/pages.xml, /sitemaps/datasets.xml,
   /sitemaps/blog.xml. sitemap.xml becomes the sitemapindex referencing
   those three + /news-sitemap.xml, so existing GSC/Bing submissions of
   sitemap.xml follow automatically.
3. Distribution count +1 only (523 → 524): only news-sitemap.xml joins
   the signed index, per Spec A. Precedent: sitemap.xml and robots.txt
   were never signed distributions; the index and section files inherit
   that class.
4. Generator vehicle: scripts/build-sitemap.js rewritten from a differ
   into the sections+index writer; new scripts/build-news-sitemap.js for
   Spec A. Both wired into seal.py as phase 2b (after derived datasets,
   before llms-full, routes/middleware and the digest phase — so the
   middleware static manifest picks up the new XML files and the digest
   phase seals the news sitemap). Neither generator joins the sealed
   code set — same status build-sitemap.js always had (not a
   distribution); the news-sitemap FILE is the new distribution.
5. News window arithmetic: schema datePublished is date-only today, read
   as midnight America/New_York. At this batch's generation the only
   in-window post is transloading-at-the-virginia-inland-port
   (2026-11-02); the 2026-10-31 posts sit at ~54.8h and prune. The
   generator copies datePublished verbatim into
   <news:publication_date> — for date-only values that string is itself
   the W3C form; when the News Formula batch lands full ISO instants,
   they flow through unchanged.
6. CP-3 rewritten stricter in the same motion (the genesis-only form
   pinned the genesis body_digest as the drift evidence): every entry's
   22-field shape + timestamp_token key, genesis prev_entry_digest null,
   chain linkage, unique entry ids, EVERY entry's Ed25519 signature
   verified against the JWKS key, the LATEST entry's body_digest ==
   live robots.txt digest.
7. Signal entry 002 follows the E5-B1 two-seal pattern: seal #1 +
   deploy #1 ships the robots.txt change; the SERVED file is then
   observed (headers + body + artifact) and signed as
   sig-2026-11-02-robots-002 chaining to the genesis entry_digest;
   build-crawl-presence.js moves to a SIGNALS array (drift gate +
   servedFile read the latest entry; totals.signalObservations =
   SIGNALS.length); seal #2 + deploy #2 close CP-2/CP-3.
   Note: build-crawl-presence.js is NOT run by seal.py (checked the
   live file — phase 2 runs four derived-dataset generators only); it
   is run manually in this batch before seal #2, the same way E5-B1
   ran it.
8. Prose propagation: llms.txt Sitemap clauses (public + phase-a
   copies) describe the index + sections and gain a News Sitemap
   bullet, preserving the exact substring "224 clean canonical URLs"
   (the staged-file check pins it). The data txt gains the section +
   news reference lines and a dated 2026-11-02 update entry in its own
   accumulating style; historical dated entries are never rewritten.
   The shell and developer page assert no sitemap.xml paths/counts
   (their "sitemap" references are ai-sitemap.json and the /sitemap/
   HTML page — route content, out of scope per the guardrail);
   ai-sitemap.json's sitemap.xml URL references stay valid (the URL
   now serves the index). llms-full.txt regenerates in the seal with
   the new distribution count.

## Pre-push gist guard (standing, used for every ai-repo push in this batch)
- [ ] BEFORE: data/entity-graph.json blob SHA == cda897e61319a0f52172ef1365402e4d7179cddf
- [ ] AFTER: same SHA re-verified

## Build log
- Generators written and run standalone: sections 173/79/11, union 263
  == expected 263; news sitemap 1 entry (in-window post above), 9 pruned.
- ai-master-index.json: news-sitemap entry added (523 → 524 entries)
  before seal #1 so phase 0 reads the new count.
- robots.txt: news-sitemap Sitemap line added (source tree).
- verify.js rewritten (§2 architecture, D-3, S-4 via sections, S-5
  news line, PS-2/PS-4 via sections, CP-3 chain, P-5 523→524 + name,
  new §26 NS-1..NS-5); repo-dir twin synced byte-identical.
- Local verify iteration: 116/121 local, full suite now 155 checks;
  failures exactly the designed pre-seal set (M-2/M-3 stale digests,
  CP-2/CP-3 robots drift awaiting entry 002, CP-5 regen awaiting the
  generator update).

## Build log (continued)
- Seal #1: f370ddf1…, 524 distributions, gaps 0, proof round clean.
  Middleware regenerated at 574 static entries (+4: the news sitemap
  and the three sections).
- Deploy #1: https://0076446d.the-flat-rate-movers.pages.dev — live
  checks: sitemap.xml (index), all three sections and news-sitemap.xml
  return 200 application/xml; robots.txt 200 with both Sitemap lines.
- Signal observation #2 (work/observe_robots_002.py, E5-B1 pattern):
  served robots.txt 200, 1,014 B, sha256 1ba13284… == source bytes
  (drift gate holds against the new entry). Entry
  sig-2026-11-02-robots-002: entry_digest 2eb4642e…, chained to the
  genesis entry_digest e6927f38…; signature verified against the
  published JWKS key before embedding; raw artifact at
  work/signal-artifacts/robots-2026-11-02.txt; archive note records
  the honest CDX result (only predecessor-era www captures exist,
  latest 2026-03-04 — this revision recorded absent, never invented).
- build-crawl-presence.js updated: SIGNALS array (genesis + 002),
  SIGNAL = latest entry (drift gate + servedFile follow it),
  totals.signalObservations = SIGNALS.length, DATE_MOD 2026-11-02,
  driftGate.checkedOn 2026-11-02, signal-observations node prose now
  names the latest entry as the drift evidence. Generator re-run:
  datasets-crawl-presence.json regenerated (7,714,853 B, sha256
  ab82f0d7…) with 2 chained observations and served==source digest.
  repo-dir twin synced.
- API test expectations updated in the same motion (stale-check rule):
  signals count 1→2, index distributions 523→524 in
  api-worker/test/run-tests.mjs — the tests stay literal and strict.
- Seal #2: 982309da403af7eec49f67f5332970e3a519db989913e9f23748b2cea266f8a6,
  524 distributions, gaps 0, proof round clean.
- Middleware twin rebuilt: repo-dir/_middleware.js = functions copy +
  exactly the "/routes-manifest.json" line (29,605 B vs 29,578 B).
- Deploy #2: https://42a7f027.the-flat-rate-movers.pages.dev.
- API cadence: refresh-bundle 44/44 digests matched (46 files fetched),
  tests 51/51, worker redeployed, version c869ac50-9b34-4178-b6ea-1e329d096677.
- IndexNow: the 5 sitemap URLs (index, 3 sections, news) → HTTP 200;
  record at records/indexnow-submission.json.
- Pushes. Gist guard: BEFORE cda897e61319a0f52172ef1365402e4d7179cddf ✓,
  AFTER cda897e61319a0f52172ef1365402e4d7179cddf ✓ (unchanged; the push
  sets exclude both graph files by construction). Key-material grep
  over both push sets: 0 (only the key's filename in the observation
  script's path expression, as in E5-B1).
  - ai repo c0174208: llms.txt, llms-full.txt, the-flat-rate-movers-data.txt,
    data/ai-master-index.json, data/ai-master-index.jws,
    data/datasets-intent-coverage.json, data/datasets-search-index.json
    (remote-vs-local blob-SHA diff decided the set; local-graph-registry
    and archive-registry proved byte-identical remotely and were not
    re-pushed).
  - machine repo 3933ad64: verify.js, scripts/build-crawl-presence.js,
    scripts/build-sitemap.js, scripts/build-news-sitemap.js,
    scripts/seal.py, code/pages-functions/_middleware.js,
    out/phase-a/llms.txt, this record + batch work files.
- FLAGGED for the parent's GitHub web-upload route (over the ~5.8 MB
  connector ceiling; do NOT connector-push):
  1. machine repo code/site-shell/index.html — NEW sha256
     c20e4f50eb426df6be9af65da56721bad7fc53e7c6ffd6981723ce62dc26e4c0
     (supersedes the head-hub batch's flagged c4a0d4a9… shell).
  2. ai repo data/datasets-crawl-presence.json — NEW sha256
     ab82f0d75a9c60fb69ed8a284f0d77e33e5b89ce4c9b375c0b11da77b93ef025
     (supersedes the head-hub flag 042dfa08…).
  3. ai repo data/datasets-answer-evidence.json — NEW sha256
     c32d6dd8818a882e0d3503a6d29fdbf00eb15fd3687820deee8d88919eda9c03
     (supersedes the head-hub flag ae40f880…; the file changed because
     it embeds the changed files' certificate digests).
- QUEUED for the parent (browser work a generic subagent cannot run):
  Bing Webmaster sitemap submission and the GSC Sitemaps-page
  submission of sitemap.xml (the index — no URL-inspection quota).

## Addendum — seal #3 (middleware twin correction, see Errors #1)
- Seal #3: ad874d6f6b7af90a583697b754fa14f0353736e708a23fe218190bc7d29d8aee,
  524 distributions, gaps 0, proof round clean. Local tier 121/121.
- Deploy #3: https://0b65cc50.the-flat-rate-movers.pages.dev. API
  refresh 44/44, tests 51/51, worker bde75fbc-65e3-4d41-be2e-e242db22bd27.
- ai repo: ai-master-index.json/.jws re-pushed at seal #3 (read-back
  blob 50b49523… == local); llms-full.txt proved byte-identical across
  seal #3 (blob ff230511…) and was not re-pushed. Gist guard held.

## Closing state
- Final seal: ad874d6f6b7af90a583697b754fa14f0353736e708a23fe218190bc7d29d8aee
  (seal #3; seal #1 f370ddf1…, seal #2 982309da… superseded) ·
  distributions: 524 · suite: 155 checks.
- Deploys: #1 0076446d, #2 42a7f027, #3 0b65cc50 (current).
  API worker current version bde75fbc-65e3-4d41-be2e-e242db22bd27
  (refresh 44/44, tests 51/51 after each seal).
- ai repo index re-push at seal #3 verified byte-identical remotely
  (blob 50b49523…); gist guard re-run for that push: BEFORE and AFTER
  cda897e61319a0f52172ef1365402e4d7179cddf ✓.
- First closing verify: 152/155 — P-6 (shell + the two flagged ai-repo
  datasets awaiting web upload, plus the middleware item since fixed)
  + M-2 + M-3 (middleware, fixed by seal #3).
- Final closing verify (run twice at the end state): 154/155 — the
  SOLE miss is P-6 naming the Site Shell (26/27 repo-served match;
  served 24,688,315 B vs sealed 24,688,315 B — same size, stale
  digest: GitHub still serves the head-hub shell). Per the brief's
  P-6 exception this tally is recorded honestly and THE CLOSING LINE
  STAYS OPEN: the batch is neither declared failed nor green; the
  parent re-runs `node verify.js` after the web upload of flag #1
  (shell, sha256 c20e4f50…) lands, which is the only remaining step
  to 155/155. (One intermediate run showed 153/155 with an added
  transient S-3 miss on '/'; direct replication of all four S-3
  comparisons against the live home page passed immediately after,
  and the confirming re-run passed S-3 — recorded as a fetch/
  propagation transient, not an estate defect.)

