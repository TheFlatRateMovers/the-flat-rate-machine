# Merge note — Moving and Storage ACTIVATION package (PROPOSAL ONLY — do not apply without the merge agent's review)

Staged: 2026-10-29 (original package) / activation staged 2026-10-29. This note proposes exact `data/` and graph additions. **Nothing in this note has been applied.** A deploy batch owns `data/`, `scripts/`, and `verify.js`; the merge agent applies these, recomputes counts, and re-runs verify.js. Do NOT hand-edit counts anywhere.

## 0. THE GATE — PARTLY SATISFIED, PARTLY STILL ENFORCED (read first)

**SATISFIED 2026-10-29:** the owner answered the storage question YES and attested: storage is LEASED; scope is ANY type of items (owner examples: containers, household goods, machines including robotic arms); minimum stay 30 days; customers CAN access stored items while stored (no notice period, hours, or attendant rule attested); lease terms VARY (owner's words — no single uniform arrangement). The staged schema.json description carries those attested terms; no gate sentence remains in any publishable file in this package. The page (content.md), meta (meta.json), and backlinks (backlinks.md) in this package are staged from those attested terms only.

**STILL GATED — the single remaining terms gap:** storage pricing basis (quoted per job? monthly? by volume?). Do NOT invent it. **STANDING NON-CLAIMS (deliberately not claimed, not awaiting answers):** facility/lessor identity (unnamed — no name attested); SIT qualification (NOT established — leases vary, and SIT requires a carrier-owned warehouse or a long-term lease); climate control for the leased space; valuation during hold; any company exclusions list (owner scope "anything" stands alone; domain exclusions are education only). A merge agent that adds any of these from domain sources violates the gate.

**SEQUENCE:** this package deploys in sequence AFTER the residential/gun-safe/commercial/office batches. The merge agent must reconcile counts against the batch's actual running totals at merge time (the 153/22 figures in this note are the totals at activation staging, not a promise about merge day).

## 1. data/services.json — new entry (23rd service)

New entry: id "service-moving-and-storage", name "Moving and Storage". Description (written from attested terms only — no domain wording): "Moves with a storage interval between move-out and move-in, in leased storage for any type of items — containers, household goods, machines including robotic arms — with a 30-day minimum stay and customer access while stored; lease terms vary. Quoted flat in writing." pageCount recomputed from pages.json at merge (expected 1 after the new page entry below is added). Services count becomes 23 (22 + 1) for this package alone, recomputed across the full batch at merge.

## 2. data/pages.json — new entry (154th page)

New entry (mirror the senior/warehouse entry shape): slug "moving-and-storage", url "https://theflatratemovers.com/moving-and-storage/", title from this package's meta.json — "Moving and Storage — Winchester VA & Martinsburg WV" (title must match meta.json title exactly), type "service", services ["service-moving-and-storage"], lastmod = deploy date, status "live" at deploy, source "Moving-and-storage activation package 2026-10-29 + owner attestation 2026-10-29 (leased; any item type + examples)", attested = deploy date. Pages count becomes 154 (153 + 1) for this package alone, recomputed across the full batch at merge.

## 3. Entity graph nodes (for the merge agent's graph builder — proposal, not applied)

- Add ONE Service node to entity-graph.json AND best-json-entity-graph.json AND the live head graph: @id https://theflatratemovers.com/#service-moving-and-storage, serviceType "Moving and Storage", provider #organization, areaServed [#winchester, #martinsburg], url https://theflatratemovers.com/moving-and-storage/. The node is schema.json in this package dir (Service node is the first @graph entry; the Organization/Place/BreadcrumbList entries mirror the existing graph conventions and the senior/residential schema shapes). Same @id in all three graphs — no duplicate node anywhere.
- The staged description ALREADY carries the attested terms (leased; any item type + owner examples) — the old gate sentence is gone. Verify at merge that no "GATED" or "STAGED" wording survives in the deployed node; if it does, stop.
- AreaServed on the Place nodes: EXPAND to the full footprint at merge (Winchester 31, Martinsburg 35, shared 14) per the full-build authorization, branches kept distinct. The staged schema.json carries GBP lists only (16/14) as the draft baseline.
- Do NOT modify the Organization node, the Place names/addresses/hours/ratings, or any other Service node. Do NOT touch the remote gist graph (data/entity-graph.json) — new path only (data/entity-graph-full.json convention). Do NOT merge, rename, or remove the residential node — the moving-and-storage node stands alone (one page per intent, senior precedent), cross-referenced from residential at most.

## 4. Rubric DB rows (~/workspace/theflatratemovers/rubric.db — proposal; verify table shapes at merge)

- **rubric_check row:** one row for moving-and-storage-deep with R1 = 3, R2 = 3, R3 = 3, R4 = 3, R5 = 3, R6 = 3, R7 = 2, verdict STAGED-READY (activation package, pending deploy in sequence), dated 2026-10-29, referencing rubric.md in this package dir. (Supersedes the earlier STAGED-GATED row for the same package — update it, do not duplicate it.)
- **service row:** one row for service-moving-and-storage ("Moving and Storage", description from attested terms per §1, attested = deploy date). Services table goes 22 → 23 for this package alone.
- **attestation rows (one per fact group):** (a) branch facts Winchester (address/geo/hours/rating 5.0/1) — source: Places 2026-10-27 + GBP check 2026-10-28; (b) branch facts Martinsburg (address/geo/hours/rating 4.7/6) — same sources; (c) GBP areas Winchester 16 + Martinsburg 14 + full footprint 31/35 — source: GBP screenshots 2026-10-27, confirmed 2026-10-28, footprint.json/GeoJSON; (d) GSC moving-and-storage demand (85 @ 1.0; flat rate moving and storage 1 @ 1.0) — source: GSC 3-month pull to 2026-10-27, read 2026-10-29; (e) live-inventory absence proof (4 "without storage" mentions; 59 safe-vault mentions; 0 graph occurrences; 0 slugs at staging) — source: live fetch + grep 2026-10-29; (f) owner attestation 2026-10-29: storage offered (Q1 YES), leased, any item type + owner examples (containers, household goods, machines including robotic arms); (g) company-terms search negative 2026-10-29: no published TFRM storage terms found online (directory labels + freight content only); (h) domain research 2026-10-29: SIT rules (FMCSA/NCUC), vault size, pricing ranges, access models, exclusions, climate rationale — each row labeled domain, never company terms.
- **edge rows:** service-moving-and-storage → provider → #organization; #organization → location → #winchester; #organization → location → #martinsburg; service-moving-and-storage → areaServed → #winchester; service-moving-and-storage → areaServed → #martinsburg; service-moving-and-storage → crossRef → #service-residential (move side). Verify against existing edges; do not duplicate.
- **opening_hours rows:** NONE new — both branches' hours rows already exist. Verify distinctness; do not add a merged/company-level hours row. (No storage hours are claimed — branch hours are not storage hours.)
- **service_area rows:** NONE new for the GBP lists if existing rows cover them; ADD rows for the extended-footprint areas only if the merge expands Place areaServed to the full footprint (source: footprint.json/GeoJSON, never the GBP source).

## 5. Machine-readable files (merge-time, proposal)

- **llms.txt:** add a Moving and Storage section from D1–D8 + attested terms + labeled domain education (never from domain text alone); keep history lines intact; dated changelog entry.
- **data txt:** same Moving and Storage section.
- **ai-sitemap.json:** add service entry (Moving and Storage, description from attested terms per §1) + hasPart entry for https://theflatratemovers.com/moving-and-storage/ + keyword "moving and storage". Services count 22 → 23, hasPart 153 → 154 for this package alone — recompute across the full batch at merge.
- **ARD catalog:** add an entry for the moving-and-storage Dataset node (identifier urn:air:theflatratemovers.com:data:moving-and-storage, type application/ld+json, url the new page) if the ARD builder supports per-category entries; otherwise leave ARD unchanged and note it.
- **Dataset JSON-LD:** convert research doc §6 D1–D8 PLUS the owner-directed online domain findings (see dataset-status.md) to Dataset JSON-LD at merge: page-level markup on the new moving-and-storage page + Developer-page collection entry, CC BY 4.0, creator organization @id, dateModified = deploy date. ATTESTED fields enter: leased storage; any item type + owner examples (containers, household goods, machines including robotic arms); 30-day minimum stay; customer access while stored (yes, no further access rule); lease terms vary. DOMAIN fields enter labeled domain: storage types; SIT rules (180-day cap, conversion, notice, valuation under bill of lading, weight-based 30-day billing); SIT lease-type rule (carrier-owned OR long-term-leased public warehouse — with the qualification explicitly NOT claimed, since leases vary); vault size 7.5'×7'×5' ≈ 245 cu ft, one vault ≈ one room; inventory/protection process; access models; pricing ranges with their sources; typical exclusions (education only); climate rationale. GATED field stays OMITTED: storage pricing basis. STANDING NON-CLAIMS (not converted): facility/lessor identity, SIT qualification, climate control for the leased space, valuation during hold, company exclusions list. No light node file is created at any point.

## 6. Live-site deploy artifacts (merge-time, proposal — NOT done here)

- Page div (from this package's content.md) BEFORE `<footer>` in public/index.html; pageMeta entry (name/svc/canonical/desc from this package's meta.json); node --check on both inline scripts before any deploy.
- Per-page JSON: deploy schema.json (attested terms, gate sentence gone — verify) + Dataset JSON-LD to the verified new-page JSON serving path (verify against a live new-page JSON first; old .json URLs return SPA fallback HTML and do not count).
- Sitemap: sitemap.xml + sitemap-page row + all-pages index entry → 154 URLs for this package alone; reconcile (canonical + redirects + unmapped + footer) at merge, against the batch's actual running totals.
- Breadcrumb: visible trail Home › Moving and Storage.
- Link from residential-moving to moving-and-storage (move-side parent → dedicated storage page).
- GitHub (same batch, after the test/check gate): theflatratemovers-ai (schema JSON, datasets JSON-LD, llms.txt, data txt, ai-sitemap.json, graphs) + the-flat-rate-machine (this package dir + research doc + data/ + scripts/ + verify.js changes). NEVER overwrite remote data/entity-graph.json (gist graph).
- GBP: NO edit in this package (Phase G batch, owner-approved).

## 7. Explicitly NOT in this package (left for their own batches)

- Any live-site edit, deploy, GitHub push, quote test post, GBP edit, DNS change, or license wording change.
- Any gated field from research doc §8 that remains unanswered — now only the storage pricing basis — plus the standing non-claims (SIT qualification, since leases vary; climate-control claim for the leased space; facility/lessor identity; valuation during hold).
- Any re-captioning of the 4 "without storage" mentions, the 59 safe-vault mentions, or any warehouse-floor photo as household storage coverage.
- Any company exclusions list (owner scope "anything" stands alone; domain exclusions are education only).
- Any claim that any company is a client, or any implication of a client relationship (robotic arms is an item type only).
