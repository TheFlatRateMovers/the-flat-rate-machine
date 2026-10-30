# Batch NAMING — agency-naming sweep (2026-10-30)

Authorization (Henry, 2026-10-30 ~04:27 EDT, verbatim): "you can use any
company name that you want, dea, fbi, governement, military, private,
etc... please stop making things difficult." Supersedes the 2026-10-29
naming hold. Owner-stated basis (2026-10-29): the company "does moves
for the FBI, government, military, etc." Final item of the rulings
queue.

## The change
Where government/military copy spoke generically about who the company
serves, the owner-stated client base is now named at agency/organization
level, phrased as work performed: moves performed for the FBI, the DEA,
federal government agencies, the U.S. military (households), and
private-sector clients. Integrated into existing service descriptions,
audience passages and dataset descriptions — no client list bolted on,
no logos, no invented jobs/dates/locations.

## Boundary audit — every changed sentence (29 rules, old → new)
Insertions (naming added):
- R01 canonical #service-government description (head graph, home
  service listing, hub JSON, both graphs ×3 copies each, services.json,
  ai -full graphs): appended "The company performs moves for federal
  agencies, including the FBI and the DEA."
- R02 canonical #service-military description (same surfaces):
  "military households" → "U.S. military households".
- R03 military service sentence (branch pages' copy, pageMeta,
  head-data, branch JSONs, best graphs, ai-sitemap ×3, ai schemas):
  "Moving services for military households…" → "…for U.S. military
  households…" (29 replacements).
- R04 government branch short description (pageMeta, head-data,
  best graphs): inserted the R01 naming sentence before "Flat-rate
  moving from Winchester, VA and Martinsburg, WV."
- R05 government branch JSON Service descriptions (×2 + ai schemas):
  inserted "The company's government work includes moves performed for
  federal agencies, among them the FBI and the DEA." after the scope
  sentence.
- R06 hub WebPage description (military-government-moving.json):
  appended "The company performs moves for the FBI, the DEA and other
  federal agencies, for the U.S. military, and for private-sector
  clients."
- R07 government branch "Who it is for" + FAQ (×4 in shell): appended
  "— the company's government work includes moves performed for federal
  agencies, among them the FBI and the DEA."
- R08 military branch "Who it is for" + FAQ (×4): "U.S." inserted.
- R09 hub Government-offices card: inserted "— including moves
  performed for federal agencies such as the FBI and the DEA —".
- R10 hub "Who this is for" paragraph: appended "The company's work
  includes moves performed for the FBI, the DEA and other federal
  agencies, for U.S. military households, and for private-sector
  clients." after the county list.
- R11 HHG article lede (shell + article JSON) and R12 HHG WebPage
  description: appended "The company's work includes moves performed
  for the FBI, the DEA and other federal agencies."
- R13/R14 category page intro (shell) + CollectionPage description:
  appended "The company performs moves for the FBI, the DEA and other
  federal agencies, for U.S. military households, and for
  private-sector clients."
- R15 government dataset operations node: inserted "; the company's
  government work includes moves performed for federal agencies, among
  them the FBI and the DEA;" into the published scope.
- R18 government dataset personas node: audience now reads "government
  offices and public-sector clients — including federal agencies such
  as the FBI and the DEA — relocating in…".
- R20 military dataset operations node: "moves for service members"
  → "moves for U.S. service members".
- R21 military dataset operations node: appended ", and the company's
  wider government work includes moves performed for federal agencies,
  including the FBI and the DEA." to the HHG-article sentence.
- R23 llms.txt Government Moving entry: inserted the R01 naming
  sentence before the boundary sentence.
- R24 llms.txt Military Moving entry: "U.S." inserted (CD-M line).
- R25 data txt government update note: inserted the R05 naming
  sentence; R26 data txt military note: "U.S. military households".
- R27 best-graph hub service node (×3 copies): appended the R06 full
  naming sentence.
- R28 ai-sitemap (×3 copies) Government Moving description: "…public-
  sector relocations, including moves performed for federal agencies
  such as the FBI and the DEA."

Guard-clause revisions (the superseded hold's own wording — removed
because the sweep makes it false; all contract/clearance non-claims
untouched):
- R16 government dataset operations boundary: "…claim no contracts,
  no clearances and no discounts, and name no agency as a client." →
  "…claim no contracts, no clearances and no discounts."
- R17 government dataset terms node: dropped "; no agency is named as
  a client;" — the contracts/clearances/procurement non-claims stand.
- R18 personas framing: "no named person, office or agency appears
  anywhere in this dataset" → "no named person appears anywhere in
  this dataset; agencies appear at organization level only, as the
  company's client base."
- R19 government dataset compliance node: "no agency, at any level of
  government, is named as a client or as experience; no personal names
  are published." → "agencies are named at organization level only, as
  the company's client base; no personal names are published."
- R22 military dataset compliance node: "no installation, unit or
  agency is named as a client or as experience." → "no installation or
  unit is named as a client or as experience, and no personal names
  are published."
- R23/R25 (above): the llms/data-txt clause ", and no agency is named
  as a client" removed; "No contracts, clearances, or discounts are
  claimed" stands.

## Hard boundaries held
- The branch-page line "No contracts, clearances, or discounts are
  claimed" is verbatim (×2 per government branch page, section + FAQ).
- No contract, clearance, GSA schedule, vendor-registration,
  endorsement or preferred-provider claim introduced anywhere; the
  military datasets' TSP/DPS/DP3/GHGC non-claims are byte-untouched.
- No personal names, no private client details, no invented jobs.
- No other facts changed: branch names/hours/ratings/areas, prices,
  founding data untouched. GBP untouched (out of scope).
- No "attested" wording in any published sentence.

## Dispositioned, not edited
- Government branch ledes ("…from The Flat Rate Movers, for government
  offices and public-sector clients.") — title-form audience lines;
  each page carries the naming in its includes/who/FAQ copy, its JSON
  and its served meta description instead.
- Hub head-data meta line — kept short by design; the hub's naming
  lives in its page copy, head graph and per-page JSON.
- HHG Article description (long form) — the WebPage description and
  the article lede carry the naming.
- ai answer-engine.json, authority-index.jsonld, ai-catalog.json,
  site all-pages.json/ai-catalog.json — carry no generic gov/mil
  client-base copy (zero target strings); org nodes reference the
  canonical #organization only.
- ai-repo hub/HHG/category schemas — do not exist (404 at HEAD);
  nothing fabricated.
- ai-repo data/entity-graph.json (gist-lineage) — NEVER overwritten;
  blob SHA re-confirmed cda897e61319a0f52172ef1365402e4d7179cddf.
- out/phase-a staged copies — §10 checks counts/names only; no count
  changed; left as staged snapshots.
- the-flat-rate-movers-data.txt is not a signed distribution (checked:
  absent from the index) — updated and pushed, outside the seal by
  design of the index.

## Mechanics + seal
- Exact-string rules with per-file count assertions (all matched),
  byte-delta confinement per file, JSON parse-diffs confined to
  description leaves, dataset embeds in the shell parse-equal to the
  edited dataset files (blocks 13/14/17), quote-form segment md5
  unchanged (4d8d49f05b22b129eac623a41370d9cb), router untouched (157).
- node --check: both executable inline scripts + head-data.js clean.
- Re-seal: repo files pushed FIRST (machine code copies, ai content,
  machine data), repo-dir assembled from the 16 sealed repo files at
  the new HEADs, digest-index re-run: 204 distributions, 0 gaps.
  Set-diff asserted: EXACTLY 15 digests changed (13 site files: both
  datasets, 7 gov/mil page JSONs, both graphs, ai-sitemap, llms.txt —
  data txt is not a distribution — plus the 2 repo code files:
  site-shell index.html, head-data.js); zero non-digest field changes.
  Re-signed from the custody key only (kid
  theflatratemovers-2026-10-29-1; canonical 88,063 B — this venv's jcs
  first proven byte-identical against the previously published JWS
  payload); pre-push key-material grep over all push paths = 0.

## Deploy + verification
- Pages deploy https://cedc075f.the-flat-rate-movers.pages.dev —
  wrangler reported "Uploaded 17 files" (15 changed + index pair).
- verify.js full run post-deploy: 83/83 PASS (P-3 188/188, P-6 16/16,
  P-2 signature valid, S-1 router/head coverage 157).
- Public-only provenance over live-fetched bytes: PROVENANCE OK —
  signature verified, 204 match / 0 mismatch / 0 unresolved.
- Live proof: /government-movers-winchester-va/ meta description
  serves the FBI/DEA sentence; /military-movers-winchester-va/ meta
  serves "U.S. military households"; hub serves its own title with the
  naming in body + JSON-LD; both datasets serve the naming + revised
  boundary sentences; the verbatim no-contracts line serves on both
  government branch pages. (First page fetches raced propagation and
  showed the prior shell; re-fetched after settle — naming confirmed.)
- Residual-clause sweep on edited surfaces: "name no agency as a
  client" / "no agency is named" / "no agency, at any level" /
  "no installation, unit or agency" = 0 everywhere.

## Repo HEADs
- machine: be00e818da7a -> 7bd728e8854f (code copies) -> eb0712d28f40
  (registry data sync); records push follows this file.
- ai: 65cd2da08305 -> f37de70ae7e3 (datasets, graphs, schemas,
  ai-sitemap, llms, data txt) -> 47ec3641c28b (resealed index pair).
  Read-backs at HEAD match the edited bytes.
