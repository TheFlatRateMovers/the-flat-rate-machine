# Batch Phase F — www consolidation — record (2026-10-30)

Owner approval 2026-10-30 ~04:27 EDT ("Phase F: www consolidation
(recommended, still open)... yes please do it"). Goal: every
www.theflatratemovers.com request permanently redirects (301) to the
same path on the apex https://theflatratemovers.com, consolidating the
split signals GSC showed (www home 57 clicks @ 3.9 vs apex 28 @ 19.8).
Route: the Cloudflare API token lacks Rulesets edit, so the redirect
lives in the Pages middleware. The www custom domain STAYS attached to
the Pages project (it must, to serve the redirect); no DNS or
custom-domain configuration was touched.

## Baseline (before, 2026-10-30 ~09:29 UTC)

- www / , www /gun-safe-movers/ , www /gun-safe-movers.json → all
  HTTP 200 serving the site as a Pages custom domain (duplicate
  serving; JSON served as application/json).
- apex same paths → 200.

## Implementation (functions/_middleware.js, the only code change)

At the very top of onRequest, before everything else:

```js
const url = new URL(request.url);
// Phase F (2026-10-30) — www consolidation: every www request (GET or
// HEAD) permanently redirects to the same path on the apex domain, so
// the estate's signals consolidate on https://theflatratemovers.com.
// Other methods pass through untouched — a redirected POST would drop
// its body — and no other host is matched.
if (url.hostname === 'www.theflatratemovers.com' &&
    (request.method === 'GET' || request.method === 'HEAD')) {
  return Response.redirect(
    'https://theflatratemovers.com' + url.pathname + url.search, 301);
}
if (request.method !== 'GET') return context.next();
```

- Exact-host match only ("www.theflatratemovers.com") — the survey
  subdomain and lookalike hosts can never match.
- GET/HEAD only; every other method falls through to the pre-existing
  passthrough, so the quote form's POST path is untouched by design.
- Path + query preserved exactly. head-data.js NOT edited. index.html
  NOT edited (its sha256 still equals the sealed shell digest
  7b95afce156e…, asserted at deploy time). Nothing else in the
  middleware changed: per-URL head rewriting, passthroughs, and the
  POST bypass are behaviorally identical (unit test below re-proves
  the apex transform + passthroughs against the real handler).
- Middleware bytes: 4,845 → 5,414; sha256 4ff87d5805ef… → 802a67a819e0…

## Gates (pre-deploy)

- node --check on the edited middleware: clean.
- Unit test of the REAL handler (stubbed context; out/batch-phasef-www/
  work/test-middleware.mjs): 15/15 PASS — www GET /, deep path, query
  preservation, HEAD, .json → 301 with next() never called; www
  POST/PUT/DELETE/OPTIONS on /api/quote and POST / → passthrough;
  apex known route → 200 with transformed head; apex unknown →
  byte-identical passthrough; apex POST → passthrough;
  survey.theflatratemovers.com and a lookalike host → NOT redirected.
  (A preview deploy cannot exercise this change — the redirect keys on
  the Host, which a pages.dev preview hostname never presents — so the
  deterministic handler test plus the immediate production matrix and
  the one-block rollback below are the gate, per the batch brief's
  either/or.)
- verify.js full run post-deploy: 83/83 PASS (P-3 186/186 site-served
  digests vs live; P-5 coverage 202 with pageFiles=156, missing=0;
  P-6 16/16 repo-served digests vs live, new middleware included).

## Seal (widened P2 rule — _middleware.js is a sealed distribution)

- Machine-repo canonical copy updated FIRST (code/pages-functions/
  _middleware.js, byte-identical to the deployed file) so live repo
  bytes lead the seal: machine HEAD 839a7b651c0d… → 9e13afa984ac…
- digest-index.py re-run over the served index with repo files fetched
  at HEAD (15/16 matched their sealed digests on fetch; middleware
  substituted with the new bytes). Programmatic set-diff assertion:
  202 → 202 distributions, EXACTLY ONE digest changed (the middleware
  entry: 4ff87d5805ef…/4845 B → 802a67a819e0…/5414 B); zero non-digest
  field changes in any entry; index top-level dateModified already
  2026-10-30 (the required stamp) and otherwise identical.
- Re-signed with sign-index.py (key read only from
  ~/workspace/theflatratemovers/keys/ custody; never copied/printed;
  pre-push grep for key material across all push sets = 0). Canonical
  payload 87,233 bytes.
- Local verify-provenance.py over the new pair: PROVENANCE OK
  (202/202). Post-deploy PUBLIC-ONLY run — JWKS, index, JWS and all
  202 distribution contentUrls fetched over live HTTPS (curl with
  retries; a urllib pass truncated on this egress, IncompleteRead, and
  was replaced — fetch report: 202 fetched, 0 failed):
  signature VERIFIED, payload == canonical(index), 202 match /
  0 mismatch / 0 unresolved → PROVENANCE OK.

## Deploy + production verification

- Pages production deploy: c5b9d0ac (2 files uploaded — the new index
  + JWS — plus the Functions bundle carrying the new middleware).
  Live served index/JWS md5s equal the sealed pair
  (d60f94fd… / 8cf57ea7…).
- Redirect matrix, live:
  - www / → 301 → https://theflatratemovers.com/
  - www /gun-safe-movers/ → 301 → apex same path
  - www /gun-safe-movers/?zip=22601&service=safe → 301, query preserved
  - www /gun-safe-movers.json → 301 → apex .json
  - www /videos/ → 301; www HEAD /blog/ → 301
  - followed redirect: 200 at apex
  - www OPTIONS /api/quote → 405, no Location (passthrough proven; no
    quote submitted — a POST is never redirected by the method guard,
    proven in the unit test + this OPTIONS/POST-to-static 405 evidence)
  - www POST /gun-safe-movers/ → 405, no Location
- Apex integrity: 200 with own titles on /, /gun-safe-movers/,
  /videos/, /specialized-workforce-labor/, /blog/, /areas-served/;
  apex .json 200 application/json; sitemap still 156 <loc>; router
  coverage asserted by verify.js S-1 (entries=156, registry=156).

## Pushes

- machine: 839a7b651c0d… → 9e13afa984ac… (code/pages-functions/
  _middleware.js; read-back sha256 802a67a819e0… = deployed bytes).
  This record follows in a second machine commit.
- ai: 652b9376b872… → 062f0cd221cb… (data/ai-master-index.json +
  data/ai-master-index.jws only; read-backs md5-matched:
  d60f94fd… / 8cf57ea7…).
- Gist-based ai data/entity-graph.json blob SHA re-confirmed at the
  new ai HEAD: cda897e61319a0f52172ef1365402e4d7179cddf — untouched.

## Rollback

Remove the Phase F host-check block from functions/_middleware.js,
redeploy the Pages project, restore the middleware's machine-repo code
copy, and re-run digest-index.py + sign-index.py (the middleware digest
returns to 4ff87d5805ef…/4845 B), then repush the index pair. No DNS or
domain state is involved in either direction.
