# EXECUTION RECORD — Batch Sitemap Architecture (2026-11-02)

Status at open: seal 80ef3602, 523 distributions, 224 pages, 30 services,
39 dataset files, sitemap.xml = 263 unique locs (224 registry pages + 39
dataset files), verify.js 149 checks.

## Errors first
(none yet — appended as they occur, with their fixes)

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

## Closing state
(to be completed: seals, deploys, pushes, IndexNow, closing verify)
