# Gun-safe full-page hub update — DEPLOY REPORT (2026-10-29)

**Deploy URL:** https://8f1cf416.the-flat-rate-movers.pages.dev
**Live domain:** https://theflatratemovers.com (same build — verified on both, no custom-domain lag)
**AI repo commit:** 309c469a07c547229962c549f2c0773a61af3cf1 (read-back verified; machine commit below in parent handoff)
**Sequence:** next batch after commercial (deployed + verified live 2026-10-29), before office.

## Gate (all passed)
- `node --check` both plain inline scripts: OK (885 chars, 122,899 chars).
- `verify.js`: **71/71 PASS**, exit 0.
- Counts unchanged by design: pages 153, services 22, no new page/slug (never `/gun-safe-moving/`).
- Branches distinct everywhere (Winchester 5.0/1, Martinsburg 4.7/6, distinct hours/addresses).
  Zero placeholders, zero USDOT/MC/price/testimonial/contract/clearance claims, zero private-job
  details, zero named federal/private clients. Banned scans 0 (Spearman, Around Town, temp labor,
  crew page, subcontract, USDOT, FBI). No "attest"/"gated" hedging in published copy. No quote test sent.

## What shipped
1. **Hub div `page-gunsafe` replaced** with `hub-div-draft.html` (comments stripped, div id/order/
   router preserved): new sections Before move day (emptied always), Equipment chosen by the project,
   Re-anchoring on request, Vaults any size, Safe classes standard, Long distance published runs,
   Locksmith boundary, plus expanded FAQ — **39 HTML Q&A (36 new + 3 preserved)**.
2. **Dataset script replaced inside hub div** with stamped 18-node datasets content; **FAQPage script
   placed inside hub div** after it (36 questions, schema FAQ == qa-bank exactly) per dataset-status
   placement note. Head graph NOT touched (see below).
3. **Winchester div**: parity sections inserted before the Start here card (What it includes,
   Who it is for, Where we serve, Questions answered, Sources and method note); hero, photo caption,
   Surveyed before it moves, Discreet by default, branch card, Start here card, Service area card preserved.
4. **Datasets updated in place:** `public/datasets-gun-safe.json` 8 → 18 nodes, all CC BY 4.0,
   18 unique @ids, dateModified 2026-10-29 on all 18. No new dataset file.
5. **Hub JSON created:** `public/gun-safe-movers.json` (5 nodes, exactly one #service-gun-safe,
   url = hub, Places expanded to footprint 31/35). Closes the hub-JSON follow-up.
6. **Machine graphs, description-only refresh:** #service-gun-safe description added (powerful
   schema.json version) in entity (39 nodes) + best (76 nodes); same @id/url/Place chain/serviceType;
   NO regeneration (builder-alignment open item stands). Mirrored byte-identical to local mirror + public/.
7. **Visibility in place:** ai-sitemap gun-safe description refreshed (services 22, hasPart 153,
   keywords 32 → 36 with 4 verbatim qa-bank questions); llms.txt line + dated section; data txt dated
   section; Developer Gun Safe card merged in place (18 nodes + hub JSON, listed once). ARD unchanged.
8. **Rubric DB:** canonical service-gun-safe description refreshed to powerful version + 13 new
   attestation rows (att 50 → 63); canon 22, att22 22, edge 40, rubric_check 7, opening_hours 14,
   service_area 66 — all constraints hold. NO rubric_check row, NO edge rows.

## Head node (verified, NOT edited)
Head graph byte-identical to pre-edit backup: 24 nodes, exactly one #service-gun-safe,
url = hub, Place @ids #winchester/#martinsburg (commercial state, preserved).

## Live verification (deploy URL + custom domain, both PASS)
- Hub 200: all new sections present, 36/36 qa-bank questions present, FAQPage 36 nodes,
  HTML bold questions 39, preserved questions (really flat, cannot carry) present.
- Winchester 200: all new sections + all preserved cards present.
- gun-safe-movers.json 200 + application/json, 5 nodes, exactly one gun-safe, url hub, places 31/35.
- datasets-gun-safe.json 200 + application/json, 18 nodes, CC BY 18, unique 18, dates all 2026-10-29.
- sitemap 153; ai-sitemap services 22 / hasPart 153 / keywords 36.
- Tagline + "Get My Flat Rate Quote" present (373 mentions); 0 "DESIGN 6"; quote markers intact.
- Public graphs live: entity 39 / best 76, gun-safe description present (powerful version).
- Prior JSONs still application/json: commercial-moving, residential-moving, datasets-commercial,
  datasets-residential (5/5/8/8 nodes).

## GitHub — ai repo (read-back verified)
Commit 309c469a07c547229962c549f2c0773a61af3cf1 (7 files: llms.txt, data txt, ai-sitemap.json,
data/entity-graph-full.json, data/best-json-entity-graph-full.json, data/datasets-gun-safe.json,
schemas/gun-safe-movers.json). Read-back at HEAD: datasets 18 nodes CC BY 18 dates 2026-10-29,
byte-identical to live file; hub JSON 5 nodes url hub, byte-identical to live file;
gist graph data/entity-graph.json still 2,486 bytes, untouched.

## Deviations from merge-note (not silent)
- FAQPage script placed inside hub div per dataset-status placement note (merge-note steps list
  the Dataset script only; FAQPage is the same 36 Q&A already in HTML, no new topics, head untouched).
- ai-sitemap keywords +4 verbatim qa-bank questions (merge-note: keywords from qa-bank phrasing).
- Developer card merged in place rather than a second card (merge-note: listed once; the card already existed).
- Graphs mirrored to local mirror + public/ per commercial pattern (merge-note names data/ files;
  public/ copies were byte-identical before and stay byte-identical after).
- Build script + this report + research-doc copy live in this package dir; backup/ lives separately
  at out/gun-safe-attestation-update/backup-2026-10-29/ and is never pushed.

## Build incidents (all fixed pre-deploy, no live impact)
- Run 1 failed on a page-start assertion: stripped draft began with a newline, shifting the div start
  by 1 (count stayed 153). Fixed by stripping leading whitespace; root cause, not a content error.
- Run 2 failed on a Winchester assertion: the preserved Start here card itself lists both branch
  addresses, so the Martinsburg-address count check was wrong, not the draft (draft itself: 0).
  Fixed to count-equality vs pre-edit.
- Run 3 failed on datasets pre-check after a prior partial run had already stamped the public file
  (8 → 18) and on a qa-topic lookup (4 questions per topic, not 1). Fixed with idempotent checks
  (accept 8 or 18 pre-edit; first question per topic) and an idempotent graph edit + hub-JSON overwrite.
  Each failed run wrote only deterministic staged content; final run was clean end-to-end, then
  verify.js 71/71, then deploy. No partial state shipped: live verification above is post-deploy.
