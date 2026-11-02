# verify.js pin re-expression — Blog Wave 1 Transloading flagship batch, 2026-11-02

Stale-check rule applied in the same motion as the state change (never
waived, rewritten stricter): the batch adds one page (registry 212 → 213)
and two signed distributions (498 → 500: the new per-page JSON and the new
route document). No check was weakened, deleted, re-scoped or renumbered;
the §14 D-2 Dataset-instance pin (shellCountD === 362) is unchanged
because a blog route document carries no Dataset nodes.

Pins re-expressed (both copies — machine root verify.js and
repo-dir/verify.js — byte-identical after the edit; `node --check` clean):

- §11 skipLive label for P-5: "all 212 per-page JSONs + all 212 route
  documents … (498 distributions)" → 213 / 213 / 500.
- P-5 body: `pageFiles.length === 212` → 213;
  `(servedIndex.distribution || []).length === 498` → 500;
  the P-5 check name text updated to match.
- §14 D-2 check name: "all 212 route documents" → 213;
  `routeDocsD.length === 212` → 213.

Expected counts after this batch: pages 213, sitemap 251 locs,
distributions 500, dataset files 38, services 29.
