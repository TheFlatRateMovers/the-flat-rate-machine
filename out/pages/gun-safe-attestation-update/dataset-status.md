# Dataset status — gun-safe full-page hub update (STAGED, 2026-10-29)

## What ships in this batch (datasets file, updated in place)

File: `datasets-gun-safe-updated.json` in this package dir → deploys as `public/datasets-gun-safe.json`, REPLACING the live 8-node file in place. No new dataset file is created, no duplicate @id is introduced (18 nodes, 18 unique @ids, verified by script at build time).

- Existing 8 nodes (same @ids, same names, same CC BY 4.0 license, same creator org @id + 6 social sameAs, same temporalCoverage 2010/2026, same spatialCoverage two branch @ids, never merged): descriptions surgically updated where the old text contradicted this update — D1 operations (old "gated, omitted, not guessed" tail replaced with the published service practice paragraph), D2 weight-access (sub-band same-care + stairs up/down appended, old "gated" sentences replaced), D3 taxonomy (vault scope + standard classes updated, equipment taxonomy relabeled industry-standard background), D4 dispatch (Las Vegas published runs replace the old "gated corridor scope" sentence), D5 commercial-terms (flat-rate-in-writing replaces the old "gated sub-band pricing basis" sentence), D7 compliance (emptying always + re-anchoring on request + standard classes replace the old "gated and omitted" block), D8 areas-quote (quote-path practice + Winchester parity as branch update appended). D6 personas is unchanged except for the file-level update (its persona content already matches the LD audience depth; the deploy agent verifies, not rewrites, D6).
- New 10 service-detail nodes (new @ids `#dataset-gun-safe-service-*`, names "Gun Safe Service Detail: …", one per topic T1–T10): sub-band, emptying, stairs, equipment, anchoring, vault, classes, Winchester, long-distance, locksmith. Each carries keywords from real likely-search phrasing, about → #service-gun-safe, spatialCoverage two branch @ids, temporalCoverage 2010/2026, creator org + 6 sameAs, license CC BY 4.0, distribution (ai-sitemap, GeoJSON, hub page). No prices, no equipment inventory claim, no route or authority claim, no named client, no private detail in any node.
- dateModified: OMITTED from the 10 new nodes by design in this staged draft; the deploy agent stamps the deploy date on all 18 nodes at deploy time (and re-stamps the existing 8, whose staged copies retain their prior dateModified values only as placeholders for the deploy stamp — the deploy agent must overwrite, not preserve, a stale date). Verify at deploy: every node carries the deploy date, none carries a future or stale date.
- The 10 new node slugs were renamed during build from `attestation` to `service` (both @ids and names) as part of the wording correction: the word family "attest" appears ZERO times in this datasets file, verified by scan.

## Dataset/FAQ markup placement at deploy

- Page-level Dataset JSON-LD: the live hub div currently ends with an inline Dataset script (existing 8 nodes). The deploy agent replaces that script with the updated 18-node file content, same position (end of div `page-gunsafe`, before the closing div), so crawlers reading the page see the updated datasets on the crawled HTML page itself.
- FAQPage JSON-LD: `schema.json` in this package dir (Service + Organization + 2 Places + BreadcrumbList + FAQPage, 36 questions) is the staged schema for the hub; the deploy agent places the FAQPage block per the site's existing JSON-LD pattern (head graph is NOT touched — see merge-note).
- Developer-page card: add a "Gun Safe service detail" card to the Developer page dataset collection pointing at `datasets-gun-safe.json` + the hub page, in place (new card, not a duplicate of the existing gun-safe datasets card — the deploy agent merges the card text so the collection lists the updated file once).
- ARD catalog: unchanged in this batch (residential datasets are not in ARD either, per the established pattern; the deploy agent notes ARD as unchanged rather than silently adding a partial entry).

## Held / not shipped

- No light dataset-node file is staged or created (never-light rule). There is no `dataset-node.json` in this package dir, and none should be created from withdrawn formulations.
- No master Dataset node, no per-category node beyond the gun-safe file, no private-job detail, no named federal client, no contract/clearance/authorization claim.
- The hub per-page JSON (`gun-safe-movers.json`, 5 nodes) is a separate staged file in this package dir, not part of the datasets file; both ship in the same deploy batch.
