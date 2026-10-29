# Merge note — Commercial Moving deep-data package (PROPOSAL ONLY — do not apply without the merge agent's review)

Staged: 2026-10-29. Author: Commercial deep-data package (staged). This note proposes exact `data/` and graph additions. **Nothing in this note has been applied.** A deploy batch owns `data/`, `scripts/`, and `verify.js` right now; the merge agent applies these, recomputes counts, and re-runs verify.js. Do NOT hand-edit counts anywhere — pageCounts and totals are recomputed from pages.json at merge time.

## 1. Graph nodes (the core of this package)

- Add the full #service-commercial fragment node (package dir schema.json, Service node is the first @graph entry) to BOTH machine graphs:
  - `data/entity-graph.json`: UPGRADE the existing #service-commercial node (currently: name "Commercial and Office Moving", string areaServed list, url = commercial-movers-winchester-va) to the staged full chain (provider → Organization → Places with addresses/geo/hours/ratings, areaServed via branch @ids, url = commercial-moving hub — the url change ONLY with research doc §8 Q10a approval; if not approved, keep the existing url and record the deviation).
  - `data/best-json-entity-graph.json`: ADD the #service-commercial fragment node (absent today). Do NOT remove or rename any page-slug node (commercial-moving/#service, commercial-office-moving-2/#service, commercial-movers-winchester-va/#service) — research doc §8 Q10c recommends leaving them alone; consolidation needs its own approval.
  - Inline head graph: UPGRADE the thin #service-commercial node to the same chain (same @id, no duplicate).
- Do NOT modify the Organization node, the Place nodes, or any rating. Do NOT touch the remote gist graph (data/entity-graph.json) — new path only (data/entity-graph-full.json convention).

## 2. data/services.json — NO new entry (verify, do not duplicate)

service-commercial ("Commercial and Office Moving", "Flat-rate commercial and office relocation.", pageCount 6) already exists. Verify pageCount recomputes to 6 across the batch (hub + branch page + category index + docs/data-center-logistics + IT page + Martinsburg guide). Registry rename to "Commercial Moving" ONLY with §8 Q10b approval — a registry change, not a staged edit, and it must propagate to ai-sitemap keywords and llms/data txt in the same batch if approved.

## 3. data/pages.json — NO new entry

No new slug. The commercial-moving page already exists. Verify its entry carries the service-commercial ref (it does — pageCount 6 includes it).

## 4. data/descriptions.json — verify, do not duplicate

Verify the commercial-moving description entry matches the live pageMeta desc. If the merge refreshes it from D1–D8, use the hero wording in the staged schema description, not a generic template — verify generic count stays 0 after merge.

## 5. Rubric DB rows (~/workspace/theflatratemovers/rubric.db — proposal; verify table shapes at merge)

- **service row:** verify the service-commercial row exists (it should — Phase A synced 18 canonical rows); do NOT add a duplicate. If the row is page-anchored legacy shape, add the canonical row per the Phase A convention and record it.
- **attestation rows (one per fact group):** (a) branch facts Winchester (address/geo/hours/rating 5.0/1) — source: Places 2026-10-27 + GBP check 2026-10-28; (b) branch facts Martinsburg (address/geo/hours/rating 4.7/6) — same sources; (c) GBP areas Winchester 16 + Martinsburg 14 — source: GBP screenshots 2026-10-27, confirmed 2026-10-28; (d) GSC commercial demand (2,013 imp @ 53.4, AI 34; "corporate movers winchester va" 123 @ 32.1; "business moving companies near me" 1.0) — source: GSC 3-month pull to 2026-10-27, read 2026-10-29; (e) commercial page scope (planning sentence, freight chain, SIR conditional, FAQs) — source: live page div extract 2026-10-29; (f) graph fragmentation finding (thin head node, string-area fragment node, best-graph page-slug-only coverage) — source: graph inspection 2026-10-29; (g) domain research (phasing models, downtime math, building/COI practice, IT checklist, market rates) — source: web research 2026-10-29, labeled domain.
- **edge rows:** service-commercial → provider → #organization; #organization → location → #winchester; #organization → location → #martinsburg; service-commercial → areaServed → #winchester; service-commercial → areaServed → #martinsburg; cross-ref edges to office-moving, industrial-offices, it-relocation, warehouse-relocation, industrial-commercial, transloading, final-mile (only if the DB models cross-refs as edges; otherwise the llms/data-txt cross-links cover them — verify at merge, do not duplicate).
- **opening_hours rows:** NONE new — both branches' hours rows already exist. Verify Winchester (Mon-Fri 8-6, Sat 8-4, Sun 9-4) and Martinsburg (Mon-Fri 9-6, Sat 9-4, Sun 9-4) rows are present and distinct; do not add a merged/company-level hours row.
- **service_area rows:** NONE new for the GBP lists if the existing rows already cover Winchester 16 + Martinsburg 14 — verify at merge. If the merge agent expands the staged schema to the full footprint (Winchester 31, Martinsburg 35, shared 14 — REQUIRED per the full-build authorization, branches distinct), add the corresponding rows with the footprint.json/GeoJSON source, never the GBP source.
- **rubric_check row:** one row for commercial-moving with R1 = 3, R2 = 3, R3 = 3, R4 = 3, R5 = 3, R6 = 3, R7 = 2, verdict READY (pending deploy-time R7 re-check), dated 2026-10-29, referencing rubric.md in this package dir.

## 6. Machine-readable files (merge-time, proposal)

- **llms.txt:** refresh the Commercial Moving section from D1–D8 (planning sentence, freight chain, SIR conditional, downtime-first framing, domain-labeled math pointer) + dated changelog entry. Keep history lines intact.
- **data txt:** same Commercial Moving section refresh + counts recomputed across the batch.
- **ai-sitemap.json:** refresh the commercial service entry from D1–D8 (description, keywords: commercial moving, commercial movers winchester va, corporate movers winchester va, business moving companies near me) — refresh, do NOT duplicate the entry. Services count recomputed across the batch (commercial already counted — no +1 for this package).
- **ARD catalog:** refresh the commercial entry if the ARD builder supports per-category entries; otherwise leave ARD unchanged and note it.
- **Dataset JSON-LD:** the D1–D8 datasets in the research doc convert to Dataset JSON-LD at merge (page-level markup on commercial-moving + Developer-page collection entry), CC BY 4.0, creator organization @id, dateModified = deploy date. NO light node file exists for this package (see dataset-status.md) — do not invent one at merge.

## 7. Live-site deploy artifacts (merge-time, proposal — NOT done here)

- NO new page div (no new slug). Head-graph node upgrade only (thin → full chain, same @id).
- Per-page JSON: deploy schema.json to the path matching the 24 new pages' convention — the merge agent must verify the serving path against a live new-page JSON before deploying; old-page .json URLs return SPA fallback HTML and do not count.
- Sitemap: NO count change for this package alone (the page already exists). Reconcile counts across the full batch at merge.
- Breadcrumb: visible trail Home › Commercial Moving (already present on the page — verify, do not duplicate).
- GitHub (same batch, after the test/check gate): theflatratemovers-ai (schema JSON, llms.txt, data txt, ai-sitemap.json, graphs) + the-flat-rate-machine (this package dir + research doc + data/ + scripts/ + verify.js changes). NEVER overwrite remote data/entity-graph.json (gist graph).
- GBP: NO edit in this package (Phase G batch, owner-approved).

## 8. Explicitly NOT in this package (left for their own batches)

- Phase A repairs, residential batch, moving-and-storage batch, and any other category's deep treatment — other agents/batches own them.
- Any live-site edit, deploy, GitHub push, quote test post, GBP edit, DNS change, or license wording change.
- After-hours/weekend offering, COI issuance, coordinator, IT scope, installation scope, crew-size rule, coverage offering, phasing as a named offering, client proof, prices, discounts, move counts, testimonials (all §8-gated — pending Henry).
- The downtime-cost explainer page, commercial FAQ expansion, and any new commercial slug (Phase E follow-ups, §8 Q10d where applicable).
- The legacy commercial-office-moving-2 page rewrite (merge verifies its svc pointer only).
