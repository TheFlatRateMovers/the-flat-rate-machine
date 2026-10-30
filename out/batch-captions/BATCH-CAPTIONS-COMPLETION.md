# Batch CAPTIONS — completion addendum (2026-10-30)

- Pages deploy: https://4e463579.the-flat-rate-movers.pages.dev (46 files
  uploaded; img-09 assets absent from the deployment manifest).
- Live verification: all caption samples PASS (see BATCH-CAPTIONS-RECORD.md);
  img-09/MiniMovers = 0 in served HTML on every ex-piano page, home, and
  residential; img-22 serves 200 image/webp at 1160x870 on /heavy/ and in
  heavy.json. Deleted-asset direct URL returns the SPA fallback HTML from
  the deployment; one edge POP briefly served the stale cached webp inside
  its 4 h TTL (nothing links to it; no Cache Purge grant on the token).
- verify.js post-push: 83/83 — VERIFY OK.
- Public-only provenance (all artifacts fetched live): JWS VERIFIED,
  202 match / 0 mismatch / 0 unresolved — PROVENANCE OK.
- Pushes: machine code+data a0a67e77d3fa…, records on top -> HEAD
  2c222d4ef795dc7ee9f1079fe0c2ca5608c581cb; ai index pair -> HEAD
  1fb37c28874835929239d010c91919557d1926f9. Read-backs of all 5 pushed
  content files (commit-pinned raw) md5-match the staged originals.
- Gist-based ai-repo data/entity-graph.json blob SHA re-confirmed:
  cda897e61319a0f52172ef1365402e4d7179cddf (unchanged).
- Standing rule recorded in BATCH-CAPTIONS-RECORD.md: never add any image
  Henry did not supply or approve (forward rule, not a library purge).
