# Content note — Moving and Storage deep-data package (staged, deep program)

> SUPERSEDED 2026-10-29 (activation): the owner answered §8 Q1 YES and attested leased storage for any type of items (containers, household goods, machines including robotic arms). This note's "NO new page in this package" decision no longer applies — the activation package now stages content.md + meta.json + backlinks.md + activated schema.json in this same dir. See rubric.md and merge-note.md (both updated 2026-10-29) for the current state. The historical analysis below is preserved as the record.

Planned page (GATED — does not exist): `moving-and-storage`
Planned canonical: https://theflatratemovers.com/moving-and-storage/
Service node (STAGED, GATED): https://theflatratemovers.com/#service-moving-and-storage
Research doc: ~/workspace/theflatratemovers/moving-and-storage-deep-datasets-2026-10-29.md (D1–D8, full depth)
Staged: 2026-10-29. Status: STAGED — deploy blocked on research doc §8 Q1 (storage scope).

## What the site already says (verified live 2026-10-29)

- **About storage as a service: nothing.** No page, no slug, no product, no terms, no node. The 4 "storage" mentions on the live site are all negations inside container/transload content ("Transfer without storage"; freight passed "without storage"). They describe cross-docking, not a storage offer.
- **About vaults: gun safes, not storage.** All 59 "vault" mentions are SIR high-security safe & vault relocation content. Vaulted warehouse storage (wooden vaults holding household goods) is a different thing entirely and appears nowhere on the site.
- **About the move side: everything needed.** The residential page publishes the full move scope (houses and apartments, packing options, heavy pieces under SIR conditionally, one price in writing, FAQ section). Local-regional, long-distance, and packing pages cover the rest of the move side. The quote path (Short/Detailed toggle, film-only survey room, human-made estimate) is live and verified on the pattern.
- **About warehouse space: freight staging, not household storage.** The industrial-commercial page and the deploying warehouse-relocation page describe a warehouse floor for freight staging, transloading, and load-outs. That is a different category from holding a household between homes, and this package states the distinction everywhere rather than blurring it.
- **About PODS: handling only.** PODS handling exists as an industrial serviceType and a GBP product. No PODS-based household storage service is published.
- **About the query itself: #1 with nothing behind it.** "Moving and storage" sits at position 1.0 with 85 impressions, and "flat rate moving and storage" at 1.0 with 1 impression. The match today comes from the home page words and the Winchester GBP category label ("Moving and storage", added 2026-10-28; primary category still Moving service). A GBP category label is not a service page, and it is not treated as one here.

## What this package ADDS (nothing visible changes on the site itself)

1. **Full research + D1–D8 datasets** (research doc, not a light node file — see dataset-status.md): combined move-and-store operations, storage interval & access operations, storage taxonomy & item suitability, dispatch network & warehouse chain, commercial terms & cost drivers (domain-labeled), buyer personas & trigger events, protection / inventory / compliance, service areas / dispatch / quote path. Converted to Dataset JSON-LD at merge ONLY on Q1 yes.
2. **Gated Service node** `#service-moving-and-storage` (schema.json in this package dir) with serviceType "Moving and Storage", provider → Organization → both Places, areaServed via branch @ids, per-branch ratings only, url = the planned canonical. The staged description carries an explicit gate sentence that is replaced with attested terms at merge and never published as-is. The node goes into BOTH machine graphs ONLY on Q1 yes.
3. **Large rubric** (rubric.md in this package dir) with a full fact table, source + date per fact, and 13 named gaps — the storage gate first.
4. **Page-mechanism decision (below) and merge note** (merge-note.md) with the gate stated first and in full.

## Page-mechanism decision: NO new page in this package — with evidence

- A service page for moving-and-storage would assert the service exists. §8 Q1 has not answered whether it does. Staging page copy now would mean writing storage terms, facility details, or pricing from domain sources — inventing the service from research. That violates the never-light rule's core (full data means verified facts, not well-researched guesses) and the package's own gate.
- The residential precedent (node + datasets without a new page where the page already exists) does not transfer here, because here the SERVICE itself — not just the page — is unverified. The honest mechanism is therefore different: gated node + full datasets staged now; page staged later, from attested terms, only on Q1 yes.
- On Q1 yes, the follow-up package stages the moving-and-storage page (slug moving-and-storage) in one gated batch: content from attested terms, meta, backlinks, node activation (gate sentence replaced), datasets conversion, services.json + pages.json entries, llms/data/ai-sitemap additions, per-page JSON on the verified new-page serving path.
- On Q1 no, there is no page and no node, ever, until the answer changes — and the query stays served by the residential page, which is the honest outcome for a service the company does not offer. The research document remains as the record of what was not claimed and why.
- Therefore this package stages NO content.md, meta.json, or backlinks.md for a new page — deliberately. The depth work for the combined query is the D1–D8 datasets themselves, not page copy.

## Content gaps found on the site (named, not filled)

1. No storage service description anywhere (the gate).
2. No storage facility, location, or security description.
3. No storage terms, duration bands, or contract-form description.
4. No storage pricing, minimum, fee, or billing-period description.
5. No storage access or partial-retrieval description.
6. No storage valuation/coverage description.
7. No storage prohibited-items list.
8. No storage FAQ block (there is no storage page to hold one; the residential FAQ does not cover storage).
9. No storage image block — and no warehouse-floor photo may be captioned as household storage.
10. No storage cross-links (residential, senior, estate, local-regional pages do not link to a storage page, because none exists).
