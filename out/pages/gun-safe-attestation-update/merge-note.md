# Merge note — gun-safe full-page hub update + Winchester parity (STAGED, 2026-10-29 — deploy agent applies)

Staged: 2026-10-29. This note proposes exact deploy steps. **Nothing in this note has been applied to any live file.** The parent deploys this batch after the commercial batch, in sequence. Deploy effects: NO new page, NO new slug, sitemap stays 153, services stay 22, pages stay 153. No new services.json entry (service-gun-safe exists, pageCount 9 — verify recomputation, do not add). No new pages.json entry (hub + branch pages exist — verify, do not add).

## 1. Division of labor with the commercial batch (DO NOT double-edit)

- Commercial batch (DEPLOYED + verified live 2026-10-29, https://b77a97d8.the-flat-rate-movers.pages.dev): head `#service-gun-safe` now carries hub url + Place @ids. THIS BATCH DOES NOT TOUCH THE HEAD NODE AT ALL. Do not re-apply a head url/Place chain change, do not re-open the head graph for gun-safe.
- This batch owns: hub div `page-gunsafe` copy, Winchester div `page-gun-safe-movers-winchester-va` sections, hub per-page JSON, datasets file update, machine-graph node description refresh, ai-sitemap gun-safe entry refresh, llms/data txt dated sections, Developer card, rubric DB attestation rows (below), GitHub pushes (below).

## 2. Live-site deploy artifacts (deploy agent, in order)

1. Back up `public/index.html`, `public/datasets-gun-safe.json`, and the live head graph section before editing (backup dir under `out/gun-safe-attestation-update/backup-2026-10-29/` in the machine repo working copy — backup files are never pushed).
2. Replace div `page-gunsafe` with `hub-div-draft.html` (preserving div id, page order, and router behavior; new divs/sections go before `<footer>` only if the deploy agent restructures — the hub div already sits before `<footer>`, so no move is needed). Replace the div's trailing inline Dataset script with the updated 18-node datasets content from `datasets-gun-safe-updated.json` (dateModified stamped to deploy date on all 18 nodes first).
3. Insert `winchester-parity-draft.html` sections into div `page-gun-safe-movers-winchester-va` before the `Start here` card, preserving hero, photo caption, `Surveyed before it moves`, `Discreet by default`, branch card, `Start here` card, and `Service area, published data & quote` card unchanged.
4. Create `public/gun-safe-movers.json` from `gun-safe-movers.json` in this package dir (5 nodes: Service, Organization, 2 Places, BreadcrumbList; Service description = powerful industry-standard version). Verify live: 200 + application/json, parses, exactly one #service-gun-safe, url = hub. This closes the hub-JSON follow-up inside this batch.
5. Replace `public/datasets-gun-safe.json` with `datasets-gun-safe-updated.json` (18 nodes, dateModified = deploy date on all nodes). Verify live: 200 + application/json, 18 nodes, all CC BY 4.0, unique @ids.
6. Run `node --check` on BOTH inline scripts in index.html before any deploy. Run verify.js; it must be green before deploy. Deploy from project root (`~/workspace/the-flat-rate-movers-pages`) with `wrangler pages deploy public --project-name=the-flat-rate-movers` (deploying from anywhere else breaks Functions). No quote test post at any point.
7. Live verification of EVERY changed URL: hub 200 with new sections + 39 Q&A present (3 preserved + 36 new), Winchester page 200 with new sections, gun-safe-movers.json application/json, datasets-gun-safe.json application/json 18 nodes, sitemap 153, services 22, tagline + "Get My Flat Rate Quote" present, 0 "DESIGN 6", quote markers heroQuote/quoteForm/hqWalk/qWalk intact, head graph exactly one #service-gun-safe with hub url + Place chain (unchanged from commercial — verify, do not edit).

## 3. Machine graphs + visibility files (in place, never duplicated)

- Entity graph + best graph (`data/entity-graph.json`, `data/best-json-entity-graph.json`, new path only — NEVER the gist graph): refresh the `#service-gun-safe` node DESCRIPTION to the powerful version in `schema.json` (same @id, same url = hub, same Place chain, same serviceType — description-only change). No new node, no duplicate, no @id change. Place areaServed stays at the full footprint 31/35 (commercial batch state) — do not regenerate Place areas from GBP lists (builder-alignment open item: `scripts/build-graph.js` regenerates Place areas from locations.json GBP lists 16/14 and would revert the live 31/35 expansion; do NOT run a full graph regeneration in this batch).
- ai-sitemap.json: REFRESH the existing gun-safe service entry in place from the service-detail datasets (description + keywords from real likely-search phrasing in qa-bank.json). Do not duplicate the entry. Counts recomputed at merge (services 22, hasPart 153 — no change from this batch alone).
- llms.txt + data txt: append dated update sections (gun-safe service detail: 10 topics, 36 questions, hub update, Winchester parity, hub JSON created, datasets 8 → 18 nodes). Keep history lines intact; do not rewrite prior changelog entries.
- Developer page: add/merge the "Gun Safe service detail" dataset card (datasets-gun-safe.json + hub page), listed once.
- ARD catalog: UNCHANGED (see dataset-status.md).

## 4. Rubric DB rows draft/plan (verify table shapes at merge; proposal, not applied)

- **service row:** VERIFY the service-gun-safe canonical row exists; do not duplicate. If the description is stale (pre-update wording), refresh it to the powerful Service description in `schema.json`.
- **attestation rows (new, one per fact group, only if not already covered):** (a) sub-band same-care practice; (b) emptying always; (c) stairs up/down; (d) equipment matched to project (taxonomy as background, no inventory claim); (e) re-anchoring on request; (f) vault any size; (g) standard classes (with internal note: meaning + TL coverage pending owner clarification — the note lives in the DB row's evidence field as internal provenance, never in page copy); (h) Winchester parity approved + shipped as branch update; (i) long-distance published runs (Las Vegas) + audience research (collectors/dealers/estates/households/high-value); (j) no locksmith services; (k) since-2010 authority; (l) hub JSON created (follow-up closed in this batch); (m) datasets 8 → 18 nodes. Evidence for each row: owner answers 2026-10-29 + research doc sections + live sitemap/div verification 2026-10-29. NO private-job detail in any row. NO named federal client in any row (owner-stated client base is internal research flag only, public naming pending — it does not enter the DB as a published fact).
- **rubric_check row:** NONE — per the established pattern, `rubric_check` is a 7-row checks catalog, not per-service scores. Do not add one.
- **edge rows:** NONE — per the established pattern, no fragment-service edges are added (future edge-model decision). Do not add any.
- **opening_hours rows:** NONE new (both branches' hours rows exist; verify distinctness; no merged/company-level hours row).
- **service_area rows:** NONE new (footprint rows exist at 31/35; verify, do not duplicate).

## 5. GitHub pushes at deploy (deploy agent, read-back verified, gist graph untouched)

- theflatratemovers-ai (main): `gun-safe-movers.json` (new hub JSON), `datasets-gun-safe.json` (updated 18-node file — confirm the ai-repo path convention for dataset files at push time; the live file and the ai-repo file must match byte-for-byte after the deploy stamp), `llms.txt`, data txt, `ai-sitemap.json`, both graph-full files (description refresh only). NEVER overwrite remote `data/entity-graph.json` (gist graph) — new path only.
- the-flat-rate-machine (main): this package dir (`gun-safe-attestation-update/` incl. hub div draft, Winchester draft, qa-bank, schema, hub JSON, datasets draft, content-update, rubric, backlinks, dataset-status, merge-note) + research doc `gun-safe-attestation-research-2026-10-29.md` + data/ + scripts/ changes from §3 (if any — description refresh only) + verify.js result. Backup/ excluded. Secret re-scan before push.
- After each push, read back: file list + one content spot-check per repo (hub JSON parses at HEAD; datasets file node count at HEAD = 18). Report both commit hashes in the deploy report.

## 6. Explicitly NOT in this package

- Any head-node edit (commercial batch owns it, already live).
- Any new page or slug, including `/gun-safe-moving/` (never created).
- Any GBP edit (Phase G, owner-approved), DNS change, quote test post, or live-file edit by this staged package itself.
- Any named federal client, contract, clearance, or authorization claim in copy, datasets, schema, or DB rows (government pages' standing position — no contracts/clearances claimed — is unchanged).
- Any private-job or private-client detail (none appears anywhere in this package; the standing privacy principle — low review volume is expected for high-value sensitive work, never a quality signal — is preserved in copy only as the existing discreet-handling lines, with no client detail of any kind).
- Any price, discount, fee, move count, testimonial, certification, equipment inventory, route, or authority claim beyond the published facts + service practice stated plainly in this package.
