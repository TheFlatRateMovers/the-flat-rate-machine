# Developer card patch — STAGED ONLY

Target: the Developer page card content inside `index.html`.

- Anchor div: `<div class="page" id="page-developer">`
- Page URL: https://theflatratemovers.com/developer/
- Apply-ready patch file: `patches/page-developer.md` (same replacement, with the exact-snippet
  format the deploy agent applies per div). This file is the readable full-card record.
- Status: STAGED ONLY. Nothing here has been applied to any live file.

## What the Developer card is

The Developer page ("Developer resources — the machine-readable site") is the page for
developers, search and AI systems, and technical partners. Its cards are: Live endpoints
(ai-sitemap.json, llms.txt, the-flat-rate-movers-data.txt — "the same verified facts in
three formats, kept in sync"), Entity graphs, Residential / Gun Safe / Commercial datasets,
On-page structured data, and Go deeper (Docs library, Entities index, Logistics Data Hub,
Entity Authority Layer). The violation is in the Entity graphs card only; the rest of the
card copy is audited-clean and is not changed.

## OLD — Entity graphs card, second sentence (exact)

```html
<a href="/entity-graph.json" target="_blank" rel="noopener"><b>entity-graph.json →</b></a> — the full entity graph: 37 chained @ids for the organization, both branches, services, corridors and protocols, with rubric scores and attestations.
```

## NEW — Entity graphs card, second sentence (exact)

```html
<a href="/entity-graph.json" target="_blank" rel="noopener"><b>entity-graph.json →</b></a> — the full entity graph: 37 chained @ids for the organization, both branches, services, corridors and protocols, with rubric scores and published source data.
```

## What changed, and what did not

- Changed: "attestations" → "published source data". The word is internal provenance and
  must not appear in customer-facing copy under the 2026-10-29 thought process.
- NOT changed: the counts "37 chained @ids" and "89 chained @ids" (best-json-entity-graph.json
  sentence, which follows this one and is untouched), the links, or any other Developer
  card. Those counts are flagged, not fixed, in PATCH-INDEX.md: llms.txt / data txt state
  89 / 141 for the same two graphs, so the graph area must reconcile the count statements
  before deploy. This patch invents no number.
- NOT changed: the branch facts in the Developer page footer (Winchester 116 W Piccadilly
  St Suite 11, Mon–Fri 8am–6pm, Sat 8am–4pm, Sun 9am–4pm; Martinsburg 736 Williamsport Pike
  Suite 2, Mon–Fri 9am–6pm, Sat 9am–4pm, Sun 9am–4pm; phone +1-540-422-2153;
  tagline "Guaranteed Flat Rate or Your Move is Free!"), which are correct and distinct.

## Related Developer-cluster patches (separate divs, separate files)

The Developer page links to a cluster of pages that carried the same internal-provenance
wording. Each has its own patch file; none of them is part of this Developer card file:

- `patches/page-entity-authority-layer.md` — intro ("with each fact attested to a named
  source and date" → "with each fact sourced and dated in our data files") and the
  "Attestation, not assertion" card (→ "Verified, not asserted"; "attested per branch" →
  "listed per branch"; figures Winchester 5.0/1, Martinsburg 4.7/6 unchanged, never merged).
- `patches/page-recursive-indexing-layer.md` — "with a new attestation, never in one format
  only" → "never in one format only".
- `patches/page-logistics-data-engineering-center.md` — "against attested facts only" →
  "against published facts only".
- `patches/page-entities.md` — "the attestation each fact carries" → "the source and
  verification date each fact carries".
- `patches/page-knowledge-entities.md` — "carrying only attested facts" → "carrying only
  published facts"; "Attestation" card heading → "Sources" (body unchanged).
- `patches/page-author-ratemoversgmail-com.md` — "Facts only from attested sources" →
  "Facts only from verified sources".
