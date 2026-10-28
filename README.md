# Flat Rate Machine — Phase 0

**"Verified facts in, pages, graphs, and answers out — over and over."**

Phase 0 is the freeze: the Machine's datasets, migrated from the verified
live sources, provably identical to them. No generators yet, no pages
built, nothing published. If the data is wrong here, everything downstream
is wrong — so Phase 0 ends with a gate, not a deploy.

## What was migrated (2026-10-28)

| File | Contents | Provenance |
|---|---|---|
| `data/locations.json` | Company + Winchester + Martinsburg, distinct | Owner-verified facts, GBP checks 2026-10-28 |
| `data/services.json` | 18 services | Live head graph + pageMeta counts |
| `data/pages.json` | 126-page registry | **Live sitemap** (fetched) joined to pageMeta |
| `data/corridors.json` | I-81 live; I-66, I-70 gaps | Sitemap + head graph + verified area list |
| `data/service-area.geojson` | 52 features | Byte-for-byte copy of the verified file |
| `data/entity-graph.json` | Verified graph | Byte-for-byte copy (37 raw / 34 structural @ids) |
| `data/best-json-entity-graph.json` | Verified graph | Byte-for-byte copy (89 raw / 86 structural @ids) |

Schema for all nine datasets (including questions, assets, and media,
which Phase 0 defines but does not populate) is in `DATA_MODEL.md`.

## How to run it

```bash
cd ~/workspace/the-flat-rate-machine

# Re-run the migration (fetches the LIVE sitemap; fails loudly if the
# live source is unreachable — pages are never hand-typed).
node scripts/build-data.js

# Run the gate. Must print 43/43 and VERIFY OK before Phase 1.
node verify.js
```

`verify.js` (Node, no dependencies) checks, against freshly fetched live
data: 126 pages with exact set equality to the live sitemap, 0 hash URLs,
52 GeoJSON features, byte identity of the three copied files, both @id
counting methods, branch facts exact and never blended (names, hours,
ratings, addresses, service areas), 18 services with page counts matching
the registry, corridor gaps recorded as gaps, and guardrail scans (no
placeholders, no USDOT/MC numbers).

## Guardrails (non-negotiable)

- **No placeholders, ever.** A missing fact is a gap row, not a guess.
- **Branches never blended.** Winchester is The Flat Rate Movers;
  Martinsburg is Flat Rate Movers Martinsburg WV. Different names, hours,
  service areas, ratings — in every file, every time.
- **No invented ratings, prices, testimonials, licenses, or USDOT/MC
  numbers.** USDOT/MC status is unconfirmed and stays unpublished.
- **No auto-publish.** Nothing in Phase 0 (or any phase) publishes
  without the owner's approval of the batch.
- **Fix the data, never the checks.** A failing `verify.js` blocks
  generation until the data is corrected and re-verified.

## What Phase 1 does first

Phase 1 builds the generators, in this order, each output diffed against
the live equivalent and deployed to staging only:

1. **Graph Builder** — regenerate the entity graph from `data/` and diff
   it against the Phase 0 graph copies. The diff must be empty (or
   explained) before the builder is trusted.
2. **Sitemap Builder** — regenerate `sitemap.xml` from `pages.json` and
   diff against the live sitemap. Same rule.
3. **AI Visibility Builder** — regenerate `llms.txt`, `ai-sitemap`, and
   the ARD catalog from `data/`, diffed the same way.
4. **Title/Meta Builder** — deterministic titles and descriptions from
   verified facts only (templates, no AI drafting in v1).

Only after all four regenerate the live site byte-equivalently does
Phase 2 start (Planner + Gap Finder — first queue items are already
known: the I-66 and I-70 corridor gaps in `corridors.json`), then
Phase 3 (page builder through the rubric gate) and Phase 4 (measurement
loop + media builder).

## What Phase 0 deliberately does NOT do

- No live-site changes. No quote-form changes. No Cloudflare changes.
- No GitHub pushes, no repo creation. These are local files only.
- No questions.json, assets.json, or media.json — no verified bank file
  exists for them yet, and inventing one would break rule 1. Their
  schemas are defined in `DATA_MODEL.md` for the phases that populate
  them from real sources.
