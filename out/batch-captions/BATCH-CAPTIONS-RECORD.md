# Batch CAPTIONS — record (2026-10-30)

Owner orders executed, in sequence:
1. 05:39 EDT — captions "not helpful": rewrite with geospatial substance /
   remove the QShark-Thumbtack wording (original brief).
2. 05:48 EDT — brief change: third-party WORK photos off (MiniMovers piano,
   QShark / Bright Mover / A Ray of Sunlight), Henry-pool-only replacements.
3. 05:52 EDT — SCOPE CORRECTION (final): only the MiniMovers piano photo is
   removed; all other images stay with the original brief's caption rewrites.
4. 05:53 EDT — AMENDMENT: fill the primary vacated slot (heavy page .split
   figure) with a gun-safe photo Henry provided, scaled properly.

## Standing rule recorded (forward-looking, per order 2 as narrowed by 3)
Never add any image Henry did not supply or approve. It is NOT a purge of
the existing library.

## What was done
- Class A place/corridor captions (37 HTML elements + 26 JSON files):
  geospatial lead (locality + county, branch address, coordinates where the
  estate carries them, corridor/exit context) from estate records ONLY
  (GeoJSON, Route 81 dataset, branch records); CC tails compacted to
  "· Photo: <author>, <license>, Wikimedia Commons" (VEDP/WV Living tails
  kept short, source identifiable). One broken attribution repaired:
  interstate-moving-guide figure + JSON credited "Photo via the Winchester
  area" for the Famartin CC BY-SA image -> proper compact credit.
- Class B style-example captions (14 HTML elements + 9 JSON files): images
  KEPT; QShark / Thumbtack / Bright Mover / A Ray of Sunlight / "Style
  example" wording removed everywhere (live sweep = 0); helpful
  wrap-standard wording + compact neutral "· Reference photo." marker.
- MiniMovers piano image (assets/img-09-b676e12626df.webp/.jpg) REMOVED:
  6 figures deleted (case-study, technical-rigging, invisible-risk,
  relocation-engineering, gun-safe-movers-winchester-va, category-rigging);
  heavy-page figure SWAPPED (below); 5 per-page JSONs lost the WebPage
  image property; pageMeta og entries for technical-rigging +
  invisible-risk reverted to the site default (img-02); functions/
  head-data.js regenerated (diff = exactly those 2 entries); asset files
  deleted from the deployment. No other image was removed.
- Heavy-page swap: Henry's provided antique-safe photo (media library
  image__3.png, 1200x1600, no people/faces) -> derivative
  assets/img-22-antique-fireproof-safe.webp, 1160x870 WebP (112,426 B),
  cropped (no distortion) to the slot's exact .ph box (aspect-ratio 4/3;
  rendered column ~571 CSS px in the 1180px wrap, so 1160w = ~2x).
  Caption (truthful, names the work class, does not claim this specific
  safe was moved by the company): "An antique Francis D. Mone commercial
  fireproof safe in a stone-foundation basement — the class of high-mass
  safe that is surveyed in place and engineered out under SIR, never
  forced. Photo supplied by The Flat Rate Movers." heavy.json image
  updated in lockstep. NOTE: Henry's provided pool contains exactly ONE
  gun-safe photo; with no second distinct safe image to vary across the
  other six slots (order: vary rather than repeat one photo everywhere),
  those slots were left without figures.
- service-area.geojson rubric R6 sentence + rubric.db R7 passes_when
  updated to the new caption practice (geojson 3 copies byte-identical;
  rubric.db backed up at out/batch-captions/backup/rubric.db.before-captions).

## Henry-image inventory (his provided pool)
- img-01 logo (published, brand). img-12 warehouse staging (published).
  img-16 container/port (published). img-18/img-19 blurred warehouse pair
  (published, industrial page). img-20 custom crate (published; original
  IMG_9205.JPG). img-21 robotic arm (published; original IMG_9204.jpg,
  faces in original — published version is the estate's processed one).
  img-11 + img-13 warehouse/container photos, faces already blurred, in
  assets but referenced nowhere (left as-is). image__3.png antique safe
  (NOW PUBLISHED as img-22 on /heavy/). Remaining media-library files are
  screenshots/dashboards, not photos. No other gun-safe photo exists in
  the provided pool.

## Gates
- node --check: 40 inline scripts, 0 failures. JSON-LD: 38 blocks, 0 parse
  failures (1 empty middleware placeholder, same as before).
- Quote-form segment md5: 4d8d49f05b22b129eac623a41370d9cb (unchanged).
- Router: 156 pages array == 156 page divs == 156 generator head entries,
  0 problems. Figures 128 -> 122 (6 removed, 1 swapped).
- verify.js pre-deploy 82/83 (only S-3 live-head dip on invisible-risk —
  the batch's own staged-vs-live delta; resolved post-deploy).
- Re-seal: digest set-diff vs the served index = exactly 44 distributions
  (site shell, head-data.js, service-area.geojson, 41 per-page JSONs);
  digest fields only, no license/dateModified drift. Assembly catch:
  batch-p2 repo-dir carried the PRE-Phase-F _middleware.js (4,845 B);
  replaced with HEAD bytes (5,414 B, sha256 802a67a819e0…) before signing,
  so the middleware digest correctly did NOT change.
- Local provenance: PROVENANCE OK (202/202 digests, JWS verified).
- Pages deploy: 4e463579.the-flat-rate-movers.pages.dev (46 files).
- Live checks: img-09/MiniMovers = 0 in served HTML on all 7 ex-piano
  pages + home + residential; heavy serves img-22 (live fetch 200
  image/webp, 1160x870); heavy.json + case-study.json verified live;
  og:image defaults restored on the 2 pages; home flagged card now ends
  "· Reference photo."; Class A samples verified live (services.json,
  areas-served.json, category-long-distance shell text, geojson R6).
  img-09 direct asset URL: absent from the deployment (deployment URL
  returns the SPA fallback HTML; one edge POP briefly served the stale
  cached webp under its 4h TTL — nothing links to it; the API token has
  no Cache Purge grant, standing estate constraint).
- verify.js post-deploy before pushes: 82/83, only P-6 failing (repo-served
  digests — resolves when the pushes below land; final run after pushes
  is the gate).
