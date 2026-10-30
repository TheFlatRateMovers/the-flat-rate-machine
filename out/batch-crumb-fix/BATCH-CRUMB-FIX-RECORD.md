# Batch Crumb Fix — record (2026-10-30)

Fixes a live defect Henry reported 2026-10-30 ~12:36 EDT with a
screenshot: the header breadcrumb on the HOME page rendered "HomeHome"
— two Home links side by side.

## Root cause

The shell's breadcrumb bar is static markup — a "Home" link, the
separator span, and the current-page span — and the SPA router's
route() function fills it per route. For the home route it set the
current-crumb's text to "Home" (duplicating the link) and hid only the
separator span; it never hid the current-crumb span itself. Rendered
result on home: link "Home" + separator hidden + current "Home" =
"HomeHome". Every other route was correct (separator shown, current =
page name). The middleware rewrites only the <head>; the body and the
router are the shell byte-for-byte, so the shell was the only place to
fix.

## The fix (one clause, following the line's own pattern)

In the router crumb statement in index.html, the current-crumb span
now gets the same home-conditional display treatment the separator
already had:

- Before: `cc.textContent = h==='home' ? 'Home' : pageMeta[h].name; var sep=…`
- After: `cc.textContent = h==='home' ? 'Home' : pageMeta[h].name; cc.style.display = h==='home' ? 'none' : 'inline'; var sep=…`

No markup changes, no head-data regeneration (head-data carries only
head JSON-LD; the visible bar is shell + router), no other header/nav
behavior touched.

## Before / after crumb rendering (functional run of the real statement)

- Home — before: "HomeHome" (link + current, separator hidden).
  After: **"Home"** (exactly once).
- /moving-a-piano/ — before and after: "Home › Moving a Piano".
- /blog/ — "Home › Blog — Articles & Guides"; /residential-moving/ —
  "Home › Residential Moving" (both unchanged, re-verified against
  the LIVE served shell after deploy, plus live 200 + own titles).

## Seal set-diff (asserted before signing)

Exactly **1 digest-only change**: the site shell
(code/site-shell/index.html). 0 added, 0 removed, 0 gaps; top-level
index fields unchanged; distributions stay **209**.

## Gates

- Quote-form segment md5 unchanged: 4d8d49f05b22b129eac623a41370d9cb.
- Router gate (local + live shell): 162 == 162, sets equal.
- node --check on all inline executable scripts: clean (2/2).
- Middleware + head-data byte-identical to the previous batch's pushed
  copies (untouched by this batch).
- verify.js: 83/83 pre-deploy and **83/83 post-deploy + post-push —
  VERIFY OK**.
- PROVENANCE OK over live bytes: JWS verified against the live JWKS;
  **209 match / 0 mismatch / 0 unresolved** (repo-served files fetched
  live from raw at the new HEADs).
- Pre-push key-content grep across push payloads: 0.
- All pushed repo files read back byte-identical.

## Coordinates

- Pages deploy: **766cf712** (254 files; 3 uploaded — index.html,
  ai-master-index.json, ai-master-index.jws).
- the-flat-rate-machine: 7812a80e → **5cef44e3** (site shell).
- theflatratemovers-ai: eecd41ad → **3be48253** (signed index pair).
- Gist-based ai-repo data/entity-graph.json blob SHA re-confirmed
  untouched: cda897e61319a0f52172ef1365402e4d7179cddf.
- No counts changed: pages 162, services 24, datasets 26,
  distributions 209.
