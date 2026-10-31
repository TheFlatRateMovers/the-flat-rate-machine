# Batch Blog JOB1 Moorefield Live — Record (2026-10-31)

The blog program's first JOB STORY published under Henry's standing
rule of 2026-10-31 (Mira-created posts pre-approved, no per-post
sign-off; the packet's QA gates G1–G8 passed at draft). Run on the
exact pattern of the N5/N6 publish batch, with photographs. Sealed,
deployed, verified live, pushed. Ledger updated (row JOB1).

## What shipped

- **JOB1 "A 1,650 lb gun safe, delivered and installed in a Moorefield
  basement"** — https://theflatratemovers.com/1650-lb-gun-safe-delivered-and-installed-moorefield-wv/
  (job story, about #service-gun-safe; the job itself completed
  2026-10-29 in Moorefield, Hardy County, WV). The story is told in
  the packet's order — staging on the shipping skid, protection,
  doorway entry, basement path, placement, debris gone — with the
  packet's five photographs and captions.
- **The five photographs are live site assets**, byte-identical to the
  job archive's staged WebP derivatives
  (job-archive/2026-10-29-moorefield-gunsafe/web/), at the exact URLs
  the packet's post.jsonld names:
  /assets/moorefield-wv-gun-safe-staging-gravel-all-terrain-dolly.webp,
  /assets/moorefield-wv-gun-safe-doorway-entry-all-terrain-dolly.webp,
  /assets/moorefield-wv-gun-safe-basement-path-blanket-wrap.webp,
  /assets/moorefield-wv-gun-safe-installed-basement.webp,
  /assets/moorefield-wv-gun-safe-installed-basement-wide-angle.webp.
  All five verified serving live (200, image/webp, MD5 == staged).
- Full page pattern: hero "Get My Flat Rate Quote" CTA, byline Henry
  Pitts Jr. / reviewed by Henry Pitts, the draft's own mid-article
  bridge CTA and closing "Get your flat rate" block, Start-here card,
  and per-page JSON (Organization + BlogPosting + BreadcrumbList +
  FAQPage + the 5 ImageObjects) whose FAQPage answers are byte-equal
  to the page body — re-verified in the BUILT page against the served
  bytes, not assumed from the packet. contentLocation carries the
  Moorefield town point exactly as the packet's corrected post.jsonld
  has it (latitude 39.06215, longitude -78.96862; the town's estate
  GeoJSON coordinates, never the client's residence).
- Privacy: the client's name and address appear nowhere in the post,
  the page, the JSON, the captions, the pushed files or this record —
  greps across the push trees and the new page div return 0. No
  dispatch branch is claimed (the packet claims none).
- Blog hub: 32 unique post cards (link set == blog.json
  CollectionPage hasPart 32), the new card present, verified live.
- Intent rubric regenerated with generator v2.0.0: 2,736 → 2,738 rows
  (gun-safe 81 → 83; R13 page-derived 279 → 281; exactly the 2 new
  rows target the new page), rows digest 45ee15c7… → 671f2549…,
  target coverage 205/205 (uncovered []), exclusions 105 (all
  duplicates). Preservation verified against the pre-regeneration DB
  state: outcome states unknown 1,119 unchanged,
  awaiting-observation 1,617 → 1,619 (exactly the 2 new rows),
  partial/blocked/complete 0; era-tagged GSC evidence preserved
  (98 row-evidence links, generatedEnrichedByGsc 98, published
  gscObservedRows 0); the append-only evidence log untouched
  (0 records). Generator --check PASS after regeneration. Landing
  page re-synced from the new dataset file (hero, node table,
  presentation sections regenerated; embed is the file's exact
  bytes; certificate SHA updated 9780b531… → c665ee50…); pageMeta
  description and both llms.txt files moved to 2,738 rows / 205
  pages in the same motion.

## Counts, before → after

- Pages 204 → **205**; sitemap.xml 236 → **237** locs.
- Per-page JSONs 204 → **205**; STATIC_FILES 309 → **315** (the new
  per-page JSON + the five photographs); signed distributions
  259 → **260**; PROVENANCE OK **260/260** (standalone proof over the
  sealed tree before deploy: JWS verified, payload canonical,
  260 match / 0 mismatch / 0 unresolved).
- services.json pageCounts: service-gun-safe 9 → 10.

## Seal

- Pass 1 (7 expected digest changes, matched exactly): ai-sitemap,
  llms.txt, blog.json, shell, _middleware.js, head-data.js,
  verify.js; the new post JSON distribution added. Non-digest field
  changes: none. Signed-index label "Entity Graph — Site (38 nodes)"
  intact.
- Pass 2 (4 expected digest changes, matched exactly):
  datasets-intent-coverage.json, llms.txt, shell, head-data.js
  (head-data regenerated after the pageMeta description move).

## Gates

- verify.js: P-5 extended 204/259 → 205/260 (dated extension comment
  appended to the P-5 chain; record
  `out/verify-fix-2026-10-31-blog-job1.md`); suite stays 101 checks.
  Pre-deploy run: 95/101 with exactly the 6 expected live-lag
  failures (records/verify-predeploy.log). Post-deploy full run:
  **100/101** (records/verify-postdeploy.log) — the single failure
  is P-6, naming the repo-served copies this batch moves: the shell
  (staged for the parent's web upload — see Outstanding) plus
  _middleware.js, head-data.js and verify.js, whose new copies ride
  this batch's machine push and turn their P-6 lines green when it
  lands. No check was waived or edited beyond the P-5 extension.
- Middleware suite 59/59 (2 cases added for the new route and its
  JSON passthrough), run before deploy.
- All 3 executable inline scripts pass node --check; script 0
  (helpers) and script 2 (the WebMCP registration layer)
  byte-identical to the pre-batch shell — §15 W-1..W-4 stay green
  against the served page; the origin-trial meta is served (count 1).
- Quote-form segment md5 4d8d49f05b22b129eac623a41370d9cb —
  byte-identical before and after every shell edit.
- Router pages == pageMeta == 205; the new route verified live (200,
  own title, full CTA set and all 5 figures in the served div); the
  new JSON live at 200 with content-type application/json; /blog/
  and both N5/N6 posts route-tested live (200, own titles).
- All 9 changed files byte-identical live vs the deploy tree
  (sitemap.xml, ai-sitemap.json, llms.txt, the data txt, blog.json,
  datasets-intent-coverage.json, ai-master-index.json,
  ai-master-index.jws, the post JSON).
- Pre-push key-content grep across both push trees: 0 hits. The
  Ed25519 private key never left its custody path.
- Gist-based ai-repo data/entity-graph.json blob
  cda897e61319a0f52172ef1365402e4d7179cddf: not in either push;
  re-confirmed at read-back.

## Coordinates

- Pages deployment: https://48558c22.the-flat-rate-movers.pages.dev
  (15 files uploaded, 300 unchanged).
- GitHub: ai ONE push, HEAD `b863c65fe289783dbcf74a97b1b21860ac8fc7e5`
  (7 paths); machine — this record rides the batch's single machine
  push (9 paths, the shell mirror excluded by the parent's
  instruction); the resulting HEAD is confirmed by read-back in the
  delivery report.
- API worker: refreshed in this batch's cadence (bundle rebuilt from
  the live estate; signed-index digest matches 37/37 compared;
  intent rows exported 2,738, 98 with evidence), test expectation
  extended in the same motion (259 → 260 distributions), suite
  34/34, worker redeployed — version
  `cc15f8f6-7a33-4968-934d-0fbc4618bc78`. Live confirmations:
  /v1/verify match:true for the new post JSON and the intent
  dataset; /v1/intent total 2,738; MCP tools/list = 6 tools.
- No quote test posts were sent. No GSC cron was edited.

## Deviations

- One deviation from the N5/N6 shape, by the parent's instruction:
  the machine push EXCLUDES code/site-shell/index.html (connector
  413 ceiling). The final shell is staged at
  `out/batch-blog-job1-moorefield-live/work/push-machine/code/site-shell/index.html`
  (md5 af63ae5932103e7e9d74eea4e1a22198, 5,053,661 bytes), marked
  PENDING-PARENT-UPLOAD. The shell bytes themselves are LIVE on
  Pages and sealed in the signed index; only the repo mirror awaits
  the parent's upload, and P-6's shell line stays red until it
  lands — the check was not waived or edited.
- The staged page pattern drops the draft's preamble "Quick answer"
  block beyond the hero lead — the same pattern-faithful behavior as
  the pilots and N1–N6; the lead and the six FAQs carry the
  substance, and body/schema FAQ byte-equality holds.

## Indexing queue (next GSC pass)

Request indexing for the new post URL at the next Search Console
pass (today's 09:40 pass and its queue were not edited):

- https://theflatratemovers.com/1650-lb-gun-safe-delivered-and-installed-moorefield-wv/
