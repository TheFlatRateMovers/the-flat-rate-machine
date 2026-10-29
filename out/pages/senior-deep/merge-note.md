# Merge note — Senior Moving deep-data package (PROPOSAL ONLY — parent deploys in sequence once verified)

Staged: 2026-10-29. Author: senior-deep package (staged build only). This note proposes exact merge actions. **Nothing in this note has been applied.** The parent deploys in sequence once this package is verified, per the owner's verified = live rule. This package itself makes NO live-site edit, NO deploy, NO GitHub push, NO data/ edit, NO scripts/ edit, NO verify.js edit, NO quote test post.

## 0. Counts at merge — UNCHANGED (refresh, not addition)

- services.json: stays 22 entries. service-senior-moving already exists (pageCount 1 — recompute at merge, expect unchanged).
- pages.json: stays 153 entries. senior-moving already exists (status live — stays live).
- descriptions.json: entry exists (Phase B meta description, verbatim). Refresh ONLY if wording changes — it doesn't; leave it.
- sitemap.xml: stays 153 locs. No new URL, no removed URL.
- entity-graph.json: stays 39 nodes. best-json-entity-graph.json: stays 74 nodes. Head graph: stays 24 nodes.
- Any count that moves at merge signals a merge error, not an intended change — stop and report it.

## 1. Graph refresh (in place, same @ids, no duplicates)

- **Head graph (live index.html):** upgrade the thin #service-senior-moving node to the full chain from schema.json in this package dir (Service node: name, alternateName, serviceType "Senior Moving", provider #organization, areaServed via #winchester / #martinsburg @ids, url https://theflatratemovers.com/senior-moving/, staged description verbatim). Same @id. No second senior node. No other head node touched.
- **entity-graph.json:** refresh the senior node in place: ADD url (https://theflatratemovers.com/senior-moving/ — currently absent); keep description, serviceType, provider, areaServed via place @ids. Node count stays 39.
- **best-json-entity-graph.json:** refresh the senior node in place (url already present; keep it; keep description, serviceType, provider, areaServed via place @ids). Node count stays 74.
- **Place-side areas:** expand Place areaServed to the full footprint at merge (Winchester 31, Martinsburg 35, shared 14) per the full-build authorization, branches distinct. Machine convention: the merge script converts staged #winchester / #martinsburg @ids to #winchester-place / #martinsburg-place form, as it did for residential. The Service node references Place @ids; it does not carry flat area strings.
- **Do NOT touch:** the Organization node, any rating, any other service node, any @id. Do NOT touch the remote gist graph (data/entity-graph.json on GitHub) — new path data/entity-graph-full.json only (residential precedent).

## 2. Datasets (D1–D8 conversion at merge)

- Convert research-doc §6 D1–D8 to Dataset JSON-LD with dateModified = deploy date (never the draft date 2026-10-29): (a) page-level Dataset markup on the senior-moving page div; (b) a Developer-page collection entry ("Senior datasets" card, following the "Residential datasets" card pattern); (c) the machine file public/datasets-senior.json (following the datasets-residential.json pattern: 8 Dataset nodes, all CC BY 4.0).
- License CC BY 4.0 on every node; creator = organization @id + 6 verified social sameAs; temporalCoverage 2010/2026; spatialCoverage = two branch @ids, never merged; sameAs = https://theflatratemovers.com/senior-moving/.
- Gated fields stay OMITTED (see rubric.md Gaps 1–9 + 17). The held Phase B dataset-node.json in senior-moving/ is SUPERSEDED/ARCHIVED at merge and verified absent from public/ and both GitHub repos — it must not ship under any name.
- GitHub (parent's deploy motion): theflatratemovers-ai (datasets-senior.json + refreshed graphs + llms.txt + data txt + ai-sitemap.json) + the-flat-rate-machine (this package dir + data/ + scripts/ + verify.js changes, if any). NEVER overwrite remote data/entity-graph.json (gist graph).

## 3. Text files (refresh, counts unchanged)

- **llms.txt:** refresh the senior section (datasets summary + D1–D8 pointer). Counts unchanged. History lines intact; dated changelog entry appended (residential precedent).
- **data txt:** refresh the senior section the same way. The SERVICES name list already contains Senior Moving — leave it alone.
- **ai-sitemap.json:** refresh the senior entry (description stays the staged description — do not duplicate the entry). Keywords: merge agent DECIDES whether to append the real GSC queries "senior moving" + "senior movers near me" following the residential precedent (keywords 22 service names + 4 real GSC queries → 26); flagged here, not asserted. If appended, record the new keyword count; if not, record why.
- **ARD catalog:** add a senior Dataset entry (identifier urn:air:theflatratemovers.com:data:senior-moving, type application/ld+json, url the senior-moving page or datasets-senior.json per builder convention) IF the builder supports per-category entries; otherwise leave ARD unchanged and note it (Phase B precedent).

## 4. Rubric DB rows (verify table shapes at merge — residential precedent: do not force a row shape that does not fit)

- Canonical service row: EXISTS (service-senior-moving). Verify, don't duplicate.
- Attestation rows: ADD rows for the NEW facts only — (a) D1–D8 datasets (CC BY 4.0, dateModified = deploy date); (b) head-node upgrade (url + Place chain, same @id); (c) footprint expansion (Place areas 16/14 → 31/35, GeoJSON source). Each row carries source + date. Do NOT re-add rows for facts already attested (branch facts, GBP lists, GSC queries, survey room, SIR conditional).
- opening_hours rows: NONE new — both branches' hours rows already exist. Verify Winchester (Mon-Fri 8-6, Sat 8-4, Sun 9-4) and Martinsburg (Mon-Fri 9-6, Sat 9-4, Sun 9-4) rows are present and distinct; do NOT add a merged/company-level hours row.
- service_area rows: NONE new for the GBP lists if existing rows already cover Winchester 16 + Martinsburg 14 — verify at merge. ADD rows for the extended footprint areas ONLY if the merge expands Place areas and the existing rows don't already cover them, with the footprint.json/GeoJSON source (never the GBP source for extended areas).
- Edge rows: NONE — the edge table holds ZERO fragment-service edges (residential batch pattern; senior got none in the previous batch either). Left for a future edge-model decision; do not add senior-only fragment edges.
- rubric_check row: VERIFY the table shape before adding (the residential batch found the proposed row shape does not fit that table — it is a checks catalog, not per-service scores). If it fits, add one row (R1–R5 = 3, R6 = 3, R7 = 2, verdict READY pending deploy-time R7 re-check, dated 2026-10-29, referencing rubric.md in this package dir). If it does not fit, record that the rubric record is rubric.md in this package dir, and do not force the row.

## 5. Live verification at deploy (parent's gate — this package verifies nothing live)

- node --check on BOTH inline scripts in index.html after any edit, before deploying.
- Re-run verify.js after any registry touch; it must pass. Fix registries, NEVER weaken a check.
- senior-moving: 200 + own content (hero "Senior Moving — Winchester VA & Martinsburg WV" + branch sections + FAQ).
- senior-moving.json: still 200 + application/json (exists live from the 2026-10-29 batch — verify, don't rebuild).
- datasets-senior.json: 200 + application/json, 8 Dataset nodes, all CC BY 4.0, dateModified = deploy date.
- Head graph: 24 nodes, exactly one #service-senior-moving, WITH url + Place chain.
- Machine graphs: entity 39 / best 74 nodes, exactly one senior node each, entity node WITH url.
- sitemap.xml: 153 locs. ai-sitemap: services 22, hasPart 153 (keywords per §3 decision).
- Tagline present; "Get My Flat Rate Quote" present; 0 "DESIGN 6"; quote form markers intact (heroQuote, quoteForm, hqWalk, qWalk).
- No quote test post. No GBP edit. No DNS/track.sl change. No paid service.
- Held dataset-node.json verified absent from public/ and both GitHub repos.

## 6. Explicitly NOT in this package (left for their own batches)

- Any GBP edit (Phase G, 2 profiles only, owner-approved).
- Any storage page/node (separate activation batch; storage pricing basis attested 2026-10-29: per job, monthly, or by volume, no rates attested).
- Any other category's merge (warehouse / IT / transloading deep packages are their own builds; gun-safe / commercial / office / local-regional / long-distance deploys are their own batches).
- Any live copy change to the senior page (Phase E depth brief in content-note.md is staged guidance only; live copy changes only from §8 answers or domain-labeled education, in gated batches).
- Any new page, new slug, or branch split for senior intent (one two-branch page defends the generic query; a split would cannibalize the #1s).
- Any senior price, discount, deposit, fee, NASMM membership, move-manager service, care service, facility/community name, testimonial, review solicitation, crew-size/truck claim, valuation offering, prohibited-items list, or USDOT/MC — all gated or unverified, never built on assumption.
