# Gun-Safe Cleanup Batch — Report (2026-10-29)

Scope: exactly four fixes found by Mira after the full-site redo deploy
(https://3c2178e5.the-flat-rate-movers.pages.dev). Nothing else changed.
Deploy URL: https://c2fbf499.the-flat-rate-movers.pages.dev (2 files uploaded:
public/index.html + public/datasets-gun-safe.json). Backups (never pushed):
out/gun-safe-cleanup-backup-2026-10-29/ (index.html + datasets-gun-safe.json).

## Fix 1 — #dataset-gun-safe-dispatch description
Removed sentence (verbatim): "This node refresh fixes the prior Martinsburg skew: both branches carry equal weight in the refreshed node."
Description now ends: "…Published long-distance safe runs include Winchester to Las Vegas."
All branch facts (names, addresses, hours, ratings 5.0/1 and 4.7/6, distinctness) verbatim.

## Fix 2 — #dataset-gun-safe-service-winchester
- name: "Gun Safe Service Detail: Winchester Page Parity Approved" → "Gun Safe Service Detail: Winchester Branch Coverage" (Article headline mirrored to match).
- description: removed "Winchester page today is 442 words; Martinsburg page is 1,083 words." and all batch language ("in this batch as a branch-page update, distinct from the hub update", "The update mirrors…", "No Martinsburg fact is copied onto the Winchester page."). New opening: "Winchester branch gun safe coverage matches Martinsburg depth, with Winchester-only facts: …" — every public fact kept (16 Google Business Profile areas, includes/for/serves/questions/sources/quote-card elements, distinct branch hours and ratings, likely-search questions).

## Fix 3 — #dataset-gun-safe-service-classes
- name: "Gun Safe Service Detail: Standard Safe Classes, Ambiguity Flagged" → "Gun Safe Service Detail: Standard Safe Classes".
- description VERIFIED by reading: RSC/B-rate/C-rate/TL-15/TL-30 appear only as industry-standard definitions; the job is scoped from the safe's label/manual. No company coverage claim for TL classes. Description unchanged, per brief.

## Fix 4 — head graph #service-residential
Added "url": "https://theflatratemovers.com/residential-moving/" (after provider, matching #service-commercial / #service-gun-safe pattern). Same @id; no other field changed. Head graph still 24 nodes.

All nodes: @id, @type, dateModified (2026-10-29), license, creator unchanged — proven by an intended-field diff in build-gun-safe-cleanup.py (only dispatch.description; winchester.name/headline/description; classes.name changed across all 18 nodes).

## Gate (pre-deploy, all passed)
- node --check on both inline scripts of edited index.html: OK (885 + 122,912 chars).
- node verify.js: 71/71 PASS, exit 0.
- Forbidden strings in datasets-gun-safe.json AND index.html: "Martinsburg skew" 0, "442 words" 0, "1,083 words" 0, "Parity Approved" 0, "Ambiguity Flagged" 0.
- Counts unchanged: pages 153, services 22 (ai-sitemap 22/153), sitemap 153 locs, dataset nodes 18 (Service 9 / Dataset 5 / Article 4).
- Hub dataset block pre-edit verified byte-equal to the backup file (minus trailing newline) before replacement.

## Live verification (custom domain, post-deploy, all passed)
- datasets-gun-safe.json: 200 + application/json, 18 nodes, types 9/5/4; the three nodes carry the new clean name/description text.
- Live index head #service-residential url == https://theflatratemovers.com/residential-moving/; head 24 nodes.
- Hub page markup dataset block parse-equal to the live dataset file: TRUE.
- Tagline present; "Get My Flat Rate Quote" present (373 mentions); "DESIGN 6" = 0; quote markers intact (heroQuote, quoteForm, hqWalk, qWalk).
- Sitemap 153. Forbidden strings 0 in live index and live file.
- No quote test posts sent.

## GitHub
- theflatratemovers-ai: data/datasets-gun-safe.json pushed (commit recorded in the batch handoff to Mira).
- the-flat-rate-machine: this report + build-gun-safe-cleanup.py + datasets-gun-safe.json (cleaned working copy) under out/gun-safe-cleanup-2026-10-29/.
- Gist graph data/entity-graph.json: 2,486 bytes before push; re-verified after (see handoff). Never touched.

## Deviations / incidents
None. No failed runs. The Article node's "headline" field was updated together with "name" (fix 2) because it carried the identical "Parity Approved" string and the gate requires that string at zero; headline mirrors name on this node by construction.
