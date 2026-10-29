# Merge Note — Winchester Transloading Deep Package (PROPOSAL ONLY)

**Date:** 2026-10-29. **Status:** STAGED BUILD ONLY — this package changes nothing. The parent deploys in sequence once verified (verified = live rule). **Generic `#service-transloading` untouched in every proposal below.**

## NO registry changes

- **NO services.json change.** Entry `service-transloading-winchester-va` already exists (Transloading Services — Winchester VA, pageCount 1); verify only. Generic `service-transloading` (pageCount 16) untouched.
- **NO pages.json change.** Entry `transloading-winchester-va` already live; verify only.
- **NO new page, NO new slug, NO sitemap count change.** Sitemap stays 153; services stay 22; hasPart unchanged.

## Graph node upgrades (same @id, no duplicates, no new nodes)

- **entity-graph.json** (39 nodes → 39): Winchester node `#service-transloading-winchester-va` gains `url` (https://theflatratemovers.com/transloading-winchester-va/) + the full staged description from schema.json. All other fields kept.
- **best-json-entity-graph.json** (74 nodes → 74): Winchester node gains the full staged description (url already present). All other fields kept.
- **Head graph in index.html** (24 nodes → 24): Winchester node gains `url` + the full staged description. Its 7 corridor-inclusive areaServed strings (Winchester, VA / Martinsburg, WV / Shenandoah Valley / Eastern Panhandle / I-81 / I-66 / I-70 corridors) are KEPT — accurate for a transloading node, not a defect.
- **Generic node:** `#service-transloading` untouched in entity graph (Martinsburg-pointed, string areas) and absent from best graph (left absent — do not add it). No merge, rename, or removal.

## Place @id reconciliation (flagged, not silently fixed)

- Machine graphs use `#winchester-place` / `#martinsburg-place`; the live per-page JSON uses `#winchester` / `#martinsburg`; the head graph holds NO Place nodes. This package's schema.json follows the MACHINE convention.
- **Merge agent:** reconcile without renaming either file's @ids silently and without creating duplicate Place nodes. The Service node's areaServed refs in each file must match that file's Place @ids. If a single convention is adopted later, it is a separate, approved change — not part of this merge.

## Machine Place footprint expansion (per §8 Q14, owner approval at merge)

- `#winchester-place` areaServed 16 → 31; `#martinsburg-place` areaServed 14 → 35; shared 14. Reconcile name formats (GBP ZIP-suffixed names vs GeoJSON comma names); zero normalized duplicates; branches distinct. The live page already shows the full footprint — the graphs are catching up to the page, not the other way around.

## Rubric DB rows

- Verify shapes against the residential pattern. Add attestations for new facts (live page 2026-10-29, GSC/SERP 2026-10-29, web research 2026-10-29 for domain facts). Add a rubric_check row for the Winchester node. NO duplicate opening_hours / service_area rows (dedupe by normalized name, per the deploy-batch-1 lesson).

## Text / AI files (refresh, never hand-edit counts)

- **llms.txt + data txt:** Winchester transloading section refreshed from W-D1–W-D8 (definitions, chain, cost-avoidance domain facts, port chain at system level only, quote path). No new page entry (page already listed). Counts recomputed at merge.
- **ai-sitemap.json:** transloading already listed — refresh its entry from W-D1–W-D8, do NOT duplicate it. Services count unchanged (22); hasPart unchanged (153).
- **ARD:** entry refreshed if the builder supports per-category entries; otherwise left as-is (no builder change in this package).

## Dataset JSON-LD conversion at merge (per §8 Q12, owner approval at merge)

- New file `public/datasets-transloading-winchester.json` (W-D1–W-D8, CC BY 4.0, dateModified = deploy date) + page-level Dataset markup on the Winchester page + Developer-page collection entry — following the residential pattern (datasets-residential.json, verified live as application/json).
- **Do NOT claim the ocean datasets file is served live.** `datasets-ocean-container.json` returns SPA HTML on the live domain; whether its live-domain serving is fixed in this merge or tracked separately is §8 Q15 (owner decision).

## Per-page JSON (verify, don't duplicate)

- transloading-winchester-va.json already live (5,872 bytes, application/json, 5 nodes). Merge re-verifies it serves JSON after deploy. Do NOT overwrite it with this package's schema.json (different Place @id convention — see reconciliation above); the schema.json in this package is the graph-merge definition, not a replacement page file.

## GBP (Phase G only)

- No edit here. Transloading service addition to both profiles is a Phase G item, owner-approved only.

## Deploy-time verification gate (parent, before deploy)

- node --check both inline scripts; verify.js green; Winchester page 200 + own div + FAQ + attestation; per-page JSON 200 + application/json; entity node has url; best node has full description; head node has url + full description; generic node untouched (entity: still Martinsburg-pointed; best: still absent); sitemap 153; services 22; datasets-transloading-winchester.json 200 + application/json (if Q12 approved); tagline + CTA present; 0 "DESIGN 6"; no quote test post.
