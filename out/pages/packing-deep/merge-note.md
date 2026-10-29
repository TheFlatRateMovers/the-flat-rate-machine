# Packing & Unpacking — Merge Note (PROPOSAL ONLY, 2026-10-29)

Nothing in this note has been applied. Do NOT edit `data/`,
`scripts/`, or `verify.js`; do NOT touch
`~/workspace/the-flat-rate-movers-pages/`; do NOT deploy; do NOT push
to GitHub. The deploy batch owns all of those, in sequence behind the
batches ahead of it (gun-safe → commercial → office → local-regional →
long-distance → storage activation → senior/warehouse/IT/transloading
+ packing/SIR-heavy as each verifies).

## 1. Entity graph (`data/entity-graph.json`) — REPLACE, do not add

- **Target:** the single existing `#service-packing` node (verified
  2026-10-29: exactly 1 occurrence; url =
  `https://theflatratemovers.com/packing-movers-martinsburg-wv/`;
  areaServed = 35 flat strings).
- **Replacement:** the canonical hub node from
  `out/pages/packing-deep/schema.json` (same @id
  `https://theflatratemovers.com/#service-packing`; name/serviceType
  "Packing and Unpacking"; url →
  `https://theflatratemovers.com/packing-unpacking-services-2/`;
  areaServed via branch @ids `#winchester` + `#martinsburg`).
- **Result:** still exactly one `#service-packing` node — no duplicate
  @id (unlike the office/local-regional merges, which collapse two).
- **Place nodes:** per-branch aggregateRatings stay on the Place nodes
  only (Winchester 5.0/1; Martinsburg 4.7/6). Never blend, never move a
  rating onto the Service node.
- **areaServed at merge:** full footprint (Winchester 31, Martinsburg
  35, shared 14) via the branch Place chains — never the skewed node's
  35 flat strings, and never the conceptual labels (Port of Virginia,
  Virginia Inland Port, Shenandoah Valley, corridor names) as areas.

## 2. Head graph (live index JSON-LD) — UPGRADE in place

- Replace the thin node (name, serviceType "Packing services",
  provider, description; no url, no areaServed) with the same full
  chain as §1 (same @id).
- serviceType "Packing services" → "Packing and Unpacking" (registry
  name). Sweep check: no other head node may keep the old casing.

## 3. Best graph (`data/best-json-entity-graph.json`) — ADD

- Currently 0 `#service-packing` fragments (verified 2026-10-29; only
  page-slug `#service` nodes exist for the export-packing and
  Martinsburg packing pages).
- Add the canonical node with the same @id chain. Count check after
  merge: best graph packing fragments 0 → 1 (the canonical node).

## 4. Datasets — convert §6, do not copy twice

- Convert research doc §6 (D1–D8) into the per-page Dataset JSON-LD in
  the same motion (residential pattern: 8 nodes, CC BY 4.0,
  dateModified = deploy date). See `dataset-status.md`: the research
  doc is the dataset file until then.

## 5. Registries — deploy-batch decisions, not staging edits

- `services.json`: description update is a builder-alignment decision
  (same follow-up as residential's unchanged description). Do not
  hand-edit in staging. pageCount stays 9; services stay 22; sitemap
  stays 153 (no new page — see `content-note.md`).
- `pages.json`: no change (9 service-packing pages already correct).
- `pageMeta`: no change (9 svc pointers already correct).
- `#/services` ItemList: packing already present (1 of the 11 live
  `#service-packing` occurrences). The standing ItemList omission is
  industrial-commercial, not packing — carried, not owned, by this
  package.

## 6. Rubric DB — add at deploy time

- Row: packing, R1–R5 = 3, R6 = 3, R7 = 2, with research doc §8
  questions Q1–Q8 as the R7 open items.

## 7. Post-merge verification (gate, same bar as residential)

- `verify.js` green (71/71 or current count).
- `node --check` on both inline scripts after any index.html edit.
- Live checks: hub + Winchester + Martinsburg + cost + estimator
  pages return 200 with own-slug content; the merged node validates
  as JSON; sitemap count reconciled at 153; CTA "Get My Flat Rate
  Quote" present; 0 "DESIGN 6" strings.
- No quote test posts, ever.
- Phase H re-pull (2–4 weeks): packing-cost position (78.4 baseline),
  "packing services for moving" clicks, Winchester packing query rows.

## 8. Standing open items carried (not owned by this package)

- Ocean D-node sameAs for the new Winchester page.
- `#/services` ItemList omission of industrial-commercial.
- services.json description builder-alignment.
- Developer-page stale "37 / 89 @ids" prose.
- Storage pricing basis attested 2026-10-29 (per job, monthly, or by
  volume — no rates): belongs to the moving-and-storage package, not
  this one; noted here only because packing-for-storage (Q5) touches
  it. No packing price claim follows from it.
