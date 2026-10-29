# IT Relocation deep refresh — batch report (2026-10-29)

Deploy: https://0e91b34d.the-flat-rate-movers.pages.dev (7 files uploaded)
Live: https://theflatratemovers.com/it-equipment-moving-data-center-logistics-services-virginia/
Indexing target (recorded only — no Search Console requests this batch; daily quota exhausted): the IT hub URL above.

## What shipped
- Canonical #service-it-relocation node completed identically in head graph (25), entity graph (33) and best graph (80): hub url added where missing (entity + head; best already carried it), full 589-character live description carried everywhere, Place chain #winchester/#martinsburg at the full footprint (31/35) unchanged. Exactly one IT node per graph.
- datasets-it.json NEW (public JSON files 51 → 52): D1–D8, 8 nodes retyped Dataset 4 / Service 2 / Article 2, CC BY 4.0 license on Dataset nodes, all dateModified 2026-10-29. In-div markup block on the IT page parse-equal to the served file. Developer "IT data" card added.
- Per-page JSON (it-equipment-moving-data-center-logistics-services-virginia.json): ONLY the Service node replaced with the canonical node; expanded Place nodes (31/35) preserved byte-for-byte; Organization + BreadcrumbList untouched.
- ai-sitemap: IT service description refreshed to the canonical text; keywords 54 → 60 (+6 package query forms: IT equipment moving; IT relocation winchester va; data center logistics virginia; server rack movers; office IT relocation; IT equipment moving setup Winchester VA; none dropped). Services 23 / hasPart 155 unchanged.
- llms.txt: IT service line refreshed in place (canonical description + D1–D8 summary + file links); dated 2026-10-29 entry appended; history byte-identical. Data txt: dated 2026-10-29 entry appended.
- Rubric DB (in place, backup rubric.db.backup-2026-10-29-it-batch): service row description updated to canonical; attestation 99 → 103 (+4: canonical node, datasets published, demand evidence, per-page JSON refresh). service 32 / edge 40 / opening_hours 14 / service_area 66 / rubric_check 7 unchanged; integrity ok.

## Counts (unchanged by design — refresh, no new page or service)
Pages 155 / services 23 / sitemap 155 / head 25 / entity 33 / best 80 / ai-sitemap 23 services, 155 hasPart, 60 keywords.

## Reconciliation (merge-note steps vs live state)
- services.json IT entry, pageCount 1: (b) already satisfied, verified — not rewritten (per merge-note).
- pages.json IT entry present, status live: (b) already satisfied.
- Entity node refresh: (a) done as written for url; description (c) corrected — kept the LIVE entity/best description (589 chars); the package schema.json carries a longer variant text that was NOT adopted (senior-batch precedent: live description wins over staged text).
- Best node: (b) already satisfied — url + canonical description already present; untouched.
- Head node: (c) corrected — it carried a SHORTER description than entity/best and no url; upgraded in place to the canonical node (url + 589-char description).
- Per-page JSON: (a) done as written (Service-node-only swap). Notable find: the replaced live Service node carried scope language the package does not claim (backup-before-disconnection and anti-static packaging phrased as company sequence — §8 Q7 territory); the canonical node carries published scope only.
- DB edges for IT: (b) none exist for senior/warehouse either — by design, none added. rubric_check row proposed by the merge-note: (c) NOT added — rubric_check is a 7-row catalog; per-service rows are never added (standing rule).
- docs/data-center-logistics graph link (§8 Q11): merge-note default applied — left as copy cross-reference only, no graph link.
- Machine services.json description: left at the lock text (merge-note: do not rewrite).

## Retype mapping (datasets-it.json)
D1 IT Relocation Operations → Service · D2 Equipment & Site Operations → Dataset · D3 Equipment & Workstream Taxonomy → Dataset · D4 Dispatch Network & Corridor Chain → Dataset · D5 Commercial Terms & Cost Drivers → Article · D6 Buyer Personas & Trigger Events → Article · D7 Protection, Handling & Building Compliance → Service · D8 Service Areas, Dispatch & Quote Path → Dataset. §8 gated items (named systems/platforms, certifications/clearances, named facilities, IT pricing/SLA/downtime, disconnect/reconnect scope, backup/rollback scope, branch-specific IT dispatch, sub-band rack handling) appear only as explicit non-claims. No FAQPage node (no discrete Q&A pairs in the package's dataset source; the FAQ block stays staged Phase E guidance — no visible page copy changed).

## Gate results
node --check on both inline scripts OK · 13/13 ld+json blocks parse · in-div block parse-equal · verify.js 71/71 PASS · Router gate CLEAN (pageMeta 155 == router array 155 == page divs 155, sets exactly equal, no repairs) · Forbidden scans: new published blocks fully clean; index-wide — bare "flat quote" 0, USDOT 1 (documented GeoJSON R5 negation only), MC patterns 0, Spearman 0, Around Town 0, DESIGN 6 0, Bristow 0, subcontract 0, crew page 0, temp labor 1 (documented industrial-page negation only), "attest" only in pre-existing structural keys and dated history entries.

## Live verification (no sampling)
datasets-it.json 200 + application/json, 8 nodes (4/2/2), all dateModified 2026-10-29 · all three graphs live with exactly one IT node each (hub url, 589-char description, Places 31/35) · per-page JSON live (5 nodes, Places 31/35) · ai-sitemap live 23/155/60 · sitemap 155 locs · llms + data txt dated entries live (data txt confirmed on re-fetch after one stale-cache read) · route proofs: IT page + /senior-moving/ + /videos/ + /moving-and-storage/ + /warehouse-relocation/ all 200 with page div + router slug present · regression sweep: ALL 52 public JSON files 200 + application/json + valid JSON · live index: tagline present, CTA count 389, DESIGN 6 = 0, IT data card present, 13/13 ld+json parse.

## GitHub (before this batch)
theflatratemovers-ai HEAD 11f603a3cfb0559a1e5840b499ff9c47b6ac6ba6 · the-flat-rate-machine HEAD 1890cacf610bfd0fa2846e1275573aebd4dac1e5 · gist graph data/entity-graph.json SHA cda897e61319a0f52172ef1365402e4d7179cddf (2,486 B) — verified before pushes; never overwritten.
