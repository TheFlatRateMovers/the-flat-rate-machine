# BATCH 9 — STRUCTURAL — DEPLOY REPORT (2026-10-29)

Deployed under standing authorization (test/check -> deploy -> GitHub
in one motion) from the staged build at out/batch9-structural/
(MANIFEST.md governs). Production Pages deployment b5433469.

Start state (verified): pages 156, sitemap 156, services 23, datasets
25, best graph 92, rubric attestation 190, verify.js 75/75, per-page
JSONs 156/156; ai HEAD 2d04d6b8f3b7e63112f840bc17da1fd343a92144,
machine HEAD 3f72a1a569450aec44b41bbbc811808b060f8777.

## Item 1 — per-URL head: BUILT (buffered Pages middleware)

Mechanism (final): functions/_middleware.js + functions/head-data.js
(generated). For the 156 canonical paths the middleware reads the SPA
asset response in full at the edge, rewrites only its head (title,
meta description, canonical, og:title/description/url/type/image,
twitter:title/description/image, the previously empty #page-jsonld
script filled with the page's own graph, and the page's published
per-page JSON appended as a second JSON-LD block fetched via the
ASSETS binding), and returns the reassembled document. index.html is
never edited; bodies are byte-identical (proven on the preview:
preview body == source index.html + head additions to the byte).
Head data derivation: pageMeta (title/description/canonical source) +
the site's OWN setPageLD() executed against a DOM stub at build time,
so the served #page-jsonld is byte-identical to the graph the client
router computes today; og:image swaps to the page's pageMeta image on
the 22 pages that carry one (asset existence verified) with the
default image's width/height/alt metas removed on swap so no false
caption survives; titles follow the router's exact rule.

Prototype evidence: two streamed variants were built and REJECTED on
evidence — under a sequential all-156 route test the manually
reconstructed stream truncated 55/156 and a TransformStream variant
111/156 responses, while the unmodified production asset delivered
156/156 complete over the identical test path and isolated bursts
passed 30/30 (intermittent, load-correlated). The buffered form then
passed the preview test 156/156 and, after the production deploy, the
live test 156/156 (own title, canonical, description, OG set,
page-jsonld equal to the client graph, per-page JSON embedded and
parsing, own div present, body complete) with per-slug results
recorded in work/route-results-prod.json.

Performance (curl via the estate's usual path, 3 runs/route, medians;
production baseline -> buffered preview): home TTFB 0.84s -> 0.78s,
total 2.21s -> 2.07s; gun-safe Winchester 0.66/1.94 -> 0.52/1.72;
invisible-risk article 0.66/2.25 -> 0.44/1.57; workforce 0.36/2.02 ->
0.48/1.69; category/logistics 0.54/2.02 -> 0.35/1.43. No material
degradation; totals equal or better (preview additionally skips the
zone's email-obfuscation pass, which remains active on production —
227 obfuscation rewrites counted in the live workforce response, so
the human experience is unchanged there too).
Passthroughs proven on preview: unknown legacy paths keep the generic
head (client redirect behavior untouched), robots.txt and .json files
serve untransformed, slash-less page URLs resolve with their own head,
POST /api/quote bypasses the transform by method gate.
Rollback: delete functions/_middleware.js + functions/head-data.js
and redeploy; pre-batch state is in out/batch9-structural/backup/.

## Item 2 — rubric gates

rubric_check 7 -> 9: R8 crawlability gate + R9 provenance & integrity
gate definitions added. attestation 190 -> 236: 46 scored rows (23
services x 2), every crawlability row PASS with its page tally (from
the post-deploy 156/156 route test + sitemap set equality), every
provenance row PASS citing the service's dataset file(s) inside the
signed index with digests matching live bytes (verify.js P-3, 30/30).
PRAGMA integrity_check ok; the canonical coverage rows the suite
counts (evidence LIKE 'services.json id') remain exactly 23 — the new
rows deliberately use 'registry entry' phrasing. DB backed up first
(backup/rubric.db); other tables unchanged (service 32, edge 40,
opening_hours 14, service_area 66).

## Item 3 — real sitemap lastmod

Derivation (tools/derive-lastmod.py; per-URL sources in
work/lastmod-map.json): 2026-10-29 for 125 URLs, 2026-10-28 for 31.
Evidence classes: G1 per-page JSON dateModified 2026-10-29 (103 URLs),
G2 Batch 8a JSON creation (85), G3 Batch 8b div deepening (96,
router keys resolved through pageMeta), G4 photo batch (4), G5 Batch
7d JSON edits (13), G6 registry lastmod already 2026-10-29 (7), G7 P1
Developer card (1); the remaining 31 carry only the estate build +
cutover date 2026-10-28 that the registry records as their
attestation date. No date is later than the evidenced change; no URL
needed the no-lastmod fallback because every URL has at least the
build-date evidence. pages.json lastmod values synced to the same
derivation (118 updated). Live sitemap verified: 156 values, 2
distinct dates, range 2026-10-28..2026-10-29 (verify.js S-4).

## Item 4 — robots.txt

75 bytes -> 958 bytes. Added: a policy comment header (open policy,
llms.txt + signed-index references) and 16 explicit AI-crawler groups,
each Allow: / — GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot,
Claude-User, anthropic-ai, Google-Extended, PerplexityBot,
Perplexity-User, CCBot, Applebot-Extended, Meta-ExternalAgent,
cohere-ai, YouBot, DuckAssistBot, MistralAI-User (all documented
agent tokens; none invented). The original wildcard group and the
Sitemap line are preserved verbatim. Diff: additions only.

## Item 5 — llms / data-txt consolidation + re-sign

Audit findings (both files): page coverage llms.txt 55/156, data txt
54/156; the authority book was absent from both (title, ASIN and EAN
all missing); the signed index's own URL (ai-master-index.json) was
not named (only its .jws was); the data txt lacked the registry name
'IT Relocation & Setup' verbatim. Already present and verified: all
25 dataset files, both graphs, the GeoJSON, the signing key URL, the
48-state workforce coverage, the workforce page URL.
Filled, as appended dated sections in each file's own style
(additions only; originals are strict prefixes): per-URL head note;
signed-index URL; the book — "The Strategic Integrator: A
Professional Guide to Precision Moving and Digital Dominance in the
AI Era", Henry Pitts Jr. with Gem AI (Co-Producer), Amazon ASIN
B0GRBKR5DS, Barnes & Noble EAN 2940185300718; a verbatim 23-service
registry roster; and the complete page index (all 156 pages grouped
by registry service, each with its per-page JSON link). Post-fill
audit: 156/156 pages named in both files, 23/23 services verbatim,
25/25 datasets, forbidden strings in additions = 0. llms.txt
84,958 -> 119,173 bytes (served); data txt 55,387 -> ~87.8 KB.
ai-sitemap.json was NOT changed by this batch (no re-sign trigger
from it).
Re-sign (P1 procedure, key from custody only, never copied/printed):
the 5 repo-served files re-fetched at ai HEAD 2d04d6b8; digest-index
re-ran over the updated public/ -> 35/35 complete, 0 gaps, exactly
ONE entry changed (llms.txt digest -> a097132176507ead..., byteSize
119,173); sign-index re-signed (kid theflatratemovers-2026-10-29-1,
canonical 16,601 bytes); local verify-provenance PROVENANCE OK
pre-deploy; post-deploy verify.js P-2/P-3 pass against live bytes
(30/30 digests) and the public-only verification closes below.

## Gates

- verify.js extended in the same motion: section 12, checks S-1..S-6
  (out/verify-fix-2026-10-29-batch9.md). Final suite 81/81 PASS.
- Route test post-deploy: 156/156 production URLs (see Item 1).
- Quote-form segment md5 live: 4d8d49f05b22b129eac623a41370d9cb
  (index.html untouched by this batch).
- node --check clean on both function modules (checked as .mjs).
- Counts after: pages 156, sitemap 156, services 23, datasets 25,
  best graph 92, per-page JSONs 156/156, rubric attestation 236,
  rubric_check 9.
- Forbidden sweep on all shipped additions/files: Spearman / Around
  Town / Bristow / USDOT / FBI / "attested" = 0.
- No quote test posts. Gist SHA + HEADs recorded at close below.

## Closeout addendum

- Public-only provenance verification POST-DEPLOY: signing key,
  index and JWS fetched fresh from the live site and all 30
  site-served distributions re-fetched live -> PROVENANCE OK, 35/35
  digests match (the 5 repo-served files verified from the current
  ai HEAD; this batch does not change them).
- Gist-based ai-repo data/entity-graph.json blob SHA re-confirmed
  identical after the batch: cda897e61319a0f52172ef1365402e4d7179cddf.
- GitHub same-motion pushes: the ai-repo push (llms.txt,
  the-flat-rate-movers-data.txt, data/ai-master-index.json,
  data/ai-master-index.jws from push-ai/) is staged and IN FLIGHT,
  waiting on Henry's approval tap — pending card
  connector-c80126ea-6e61-4599-b833-1631f1761d3c (requested
  2026-10-30T05:36:41Z); ai HEAD still 2d04d6b8 at report time. The
  machine-repo push (verify.js, data/pages.json,
  out/verify-fix-2026-10-29-batch9.md, out/batch9-structural records
  incl. the deployed functions as files/_middleware.js +
  files/head-data.js) is staged at push-machine/ and fires after the
  ai push clears; machine HEAD 3f72a1a5 at report time. Everything
  else in this report is deployed and verified live.

## Deviations

(a) Item 1 mechanism iterated twice on evidence (two streamed
variants rejected for intermittent truncation under sequential load;
buffered form shipped) — inside the brief's engineering freedom; the
disposition-(b) stop condition was not triggered because a mechanism
met every constraint.
(b) The Batch P1 record's canonical length was 16,600 bytes; the
re-signed canonical is 16,601 (+1 digit from the llms byteSize) —
expected arithmetic, not drift.
(c) Sitemap lastmod: every URL had build-date evidence, so the
brief's no-lastmod fallback was never needed.
