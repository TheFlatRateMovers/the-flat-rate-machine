# BATCH 9 — STRUCTURAL (per-URL head, rubric gates, sitemap lastmod, robots, txt consolidation)

Authorized under Henry's standing deploy rule (test/check -> deploy ->
GitHub in the same motion). Scope governed by
~/workspace/theflatratemovers/full-format-gap-inventory-2026-10-29.md
Batch 9 + the Batch 9 brief (which adds the rubric provenance gate and
the txt signing-layer/book checks from Batch P1's follow-ups).

Start state (verified at staging): pages 156, sitemap 156, services 23,
datasets 25, best graph 92, rubric attestation 190, verify.js 75/75,
per-page JSONs 156/156; ai HEAD 2d04d6b8f3b7e63112f840bc17da1fd343a92144,
machine HEAD 3f72a1a569450aec44b41bbbc811808b060f8777; gist
data/entity-graph.json blob SHA cda897e61319a0f52172ef1365402e4d7179cddf.

Backups: out/batch9-structural/backup/ (index.html, sitemap.xml,
robots.txt, llms.txt, data txt, ai-master-index.json/.jws, functions/,
rubric.db, pages.json, verify.js, phase-a llms + ai-sitemap).

## Item 1 — per-URL head (mechanism)
A Cloudflare Pages middleware (functions/_middleware.js) + a generated
data module (functions/head-data.js). For each of the 156 canonical
paths the middleware streams the SPA asset response, buffers only until
</head> (~54 KB of a 2.9 MB document), applies anchored replacements —
<title>, meta description, canonical link, og:title/description/url/
type/image, twitter:title/description/image, fills the (currently
empty) #page-jsonld script, and appends the page's published per-page
JSON as a second JSON-LD block — then passes the rest of the stream
through byte-untouched. Unknown paths, non-GET requests, and non-HTML
responses pass through unchanged.
Head data derivation (no invented copy): titles/descriptions/canonicals
come from pageMeta in index.html; the page JSON-LD is produced by
RUNNING the site's own setPageLD() against a DOM stub at build time, so
the served graph is byte-identical to what the client router computes;
og:image uses the page's pageMeta image when the asset exists (22
pages), otherwise the estate default; on image swap the default image's
width/height/alt metas are removed rather than left as false captions.
Per-page JSON is fetched per request via the ASSETS binding.
Rollback: delete functions/_middleware.js + functions/head-data.js and
redeploy — index.html is never edited by this batch.

## Item 2 — rubric gates
rubric_check gains R8 (crawlability) + R9 (provenance & integrity).
attestation gains 46 scored rows (23 services x 2 gates), populated from
the post-deploy all-URL route test and the verify.js P-3 result.

## Item 3 — sitemap lastmod
Per-URL dates derived from evidence only (tools/derive-lastmod.py):
a URL is 2026-10-29 when any of G1..G7 evidences a change that day
(per-page JSON dateModified, Batch 8a creation, Batch 8b div deepening,
photo batch, Batch 7d edits, registry marking, P1 Developer card);
otherwise 2026-10-28, the estate build + cutover date the registry
records. pages.json lastmod values are synced to the same derivation.

## Item 4 — robots.txt
16 explicit AI-crawler groups (Allow: /), the original wildcard group
and sitemap line preserved verbatim, llms.txt + signed index references
added as comments.

## Item 5 — txt consolidation
Appended dated sections only (each file's own style): per-URL head
note; signed-index URL; the authority book with Amazon ASIN B0GRBKR5DS
and Barnes & Noble EAN 2940185300718 (both were ABSENT from both files);
a verbatim 23-service registry roster (repairs the data txt's missing
'IT Relocation & Setup'); and the complete 156-page index grouped by
service with per-page JSON links (coverage was 55/156 and 54/156).
llms.txt is a signed distribution -> the P1 re-sign procedure runs in
this batch (re-digest -> sign from custody -> deploy -> public-only
PROVENANCE OK). ai-sitemap.json is NOT changed by this batch.

## Gates
verify.js extended with section 12 (S-1..S-6) in the same motion;
record in out/verify-fix-2026-10-29-batch9.md. Final suite must PASS at
its new total. Route test: all 156 URLs post-deploy (own-slug head +
own div). Quote-form segment md5 4d8d49f05b22b129eac623a41370d9cb.
Forbidden sweep on shipped additions = 0. Gist SHA re-confirmed.
No quote test posts.
