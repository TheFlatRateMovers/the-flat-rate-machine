# SIR Heavy Asset Relocation deep refresh — deploy batch report (2026-10-29)

Refresh batch (no new page, no new service): the sir-heavy-deep package merged
into the live authority data. Counts unchanged: pages 155, services 23,
sitemap 155. Deploy: https://bf41891e.the-flat-rate-movers.pages.dev
Build script: out/sir-heavy-batch/build-sir-heavy-batch.py (backups in
out/sir-heavy-batch/backup-2026-10-29/ + the mandated DB backup
~/workspace/theflatratemovers/rubric.db.backup-2026-10-29-sir-heavy-batch).
Rubric DB edited in place (backup first), never replaced.

SIR is a METHOD, not an asset category: this package builds the method's
node and datasets. Gun-safe, piano-antique, medical, and cryogenic claims
are NOT duplicated anywhere in this batch — the datasets cross-reference
those categories only.

## Reconciliation (merge-note steps vs live state found)

| # | Merge-note step | Disposition |
|---|---|---|
| 1 | Entity splice (§3): upgrade the Martinsburg-skewed fragment (35 flat strings + Martinsburg url) to the canonical hub node + Place chain | (c) corrected from stale note. The skew was already fixed by the full-site redo: the live entity node already carried the registry name, provider #organization, and the branch Place chain. Remaining work: url ADDED (it was absent) + the 212-char redo description replaced by the 637-char package description. Exactly 1 node changed; the node now equals the canonical package node on all 8 content keys. |
| 2 | Head completion (§3): thin head node (serviceType "Heavy asset relocation", no url/areaServed) upgraded to the full chain | (c) partially stale. The live head node already carried the registry name/serviceType "SIR Heavy Asset Relocation (KIM-GS Protocol)" + the Place chain (redo). Remaining work: url inserted after "provider" + package description. Exactly 1 of 25 head nodes changed. |
| 3 | Best graph (§3): ADD the missing fragment | (a) done as written. Verified zero #service-sir-heavy fragments pre-build (only the page-scoped Martinsburg node); canonical node appended; best graph 81 → 82 nodes. All three copies (public / machine data/ / flat mirror) byte-identical after each write. |
| 4 | Fragment url decision (§3, flagged): url MOVES from the Martinsburg branch page to the method hub | EXECUTED as flagged, in all three graphs. The canonical node is the method's node; its url is now https://theflatratemovers.com/heavy/ everywhere. Not silent — recorded here and in llms.txt, the data txt, and the DB. |
| 5 | Hub per-page JSON (§6): deploy via the verified new-page JSON path, or record as follow-up | Follow-up, recorded — the package's own §7/§9 disposition. No heavy.json exists; the datasets mechanism for a hub without a per-page file is the datasets file + the identical @graph embedded in the hub div + the Developer card (packing precedent). The Martinsburg branch per-page file exists and is treated in row 6. |
| 6 | Martinsburg per-page JSON: (not a merge-note edit target; read at merge time per batch practice) | (b) verified, deliberately unchanged. Its Service node is branch-scoped (provider #martinsburg, areaServed [#martinsburg], url = the Martinsburg branch page) — the branch page's own record, NOT the canonical graph node; the expanded LocalBusiness node (35 areas) is intact; its description carries no gated content. File byte-identical before/after and live (md5 a6b802d221b4334864c90c6e6f7988e4 at every state). |
| 7 | services.json (§1): verify service-sir-heavy exists; do NOT add | (b) verified; not hand-edited (builder-alignment follow-up, residential/packing precedent). Entry exists with the registry name; pageCount recomputes to exactly 14 from pages.json. Live surfaces (head/entity/best/ai-sitemap/DB) carry the canonical description. |
| 8 | pages.json (§2): verify the 14 service-sir-heavy entries; do NOT add | (b) already satisfied: 155 rows, exactly 14 carry service-sir-heavy (hub, Martinsburg branch, 2 protocol, technical-rigging-standards, industrial hub, LD high-mass, calibration, vault dual, 2 category indexes, 2 method articles, + the second rigging/standards row per the registry list). No change. |
| 9 | Rubric DB rows (§4) | Service row: (a) exists — description updated in place 212 → 637 chars. Attestation groups (a) branch facts Winchester, (b) branch facts Martinsburg, (c) GBP areas + footprint 31/35: (b) already covered by existing rows (incl. the 2026-10-27 SIR/KIM-GS band + L/360 row and the GBP/footprint rows from prior batches) — no duplicates added. Groups (d) method facts, (e) graph defect + fix, (f) certification silence + wording gate, plus the merge-time-read record: (a) added as 4 rows — attestation 111 → 115. Edge rows proposed in §4: (c) NOT added — the standing rule holds (the edge table carries ZERO fragment-service edges; verified 0 rows reference a #service- fragment) and matches the packing precedent. opening_hours rows: (b) verified distinct, none added. service_area rows: (b) GBP + extended footprint rows already present (66), none added. rubric_check row proposed in §4: (c) NOT added — rubric_check is the 7-row R1–R7 checks catalog (packing precedent); the package's scores (R1–R5 = 3, R6 = 3, R7 = 2) are recorded in this report and the package's rubric.md instead. |
| 10 | ARD / ai-catalog (§5): refresh the SIR Dataset entry if the builder supports per-category entries | Left unchanged, noted (not silently dropped): ai-catalog.json carries NO per-category dataset entries for any refreshed category (datasets-packing count in it is 0, as is every other batch's file) — there is no hand-maintained per-category entry to refresh; the catalog is builder-generated in a separate pass. |
| 11 | Phase E visible-copy depth (content-note brief a–f) | NOT executed — the brief is staged guidance downstream of this merge, and its moving parts are gated: (d) Winchester parity on §8 Q7, (f) equipment section on §8 Q4. No visible SIR copy changed in this batch. |

## §8 gate dispositions (all ten — UNCLAIMED, explicit non-claims only)

| Q | Subject | Disposition |
|---|---|---|
| Q1 | Below-band handling (assets under 1,500 lbs) | UNCLAIMED — D1 and D3 record that no sub-band handling rule is published and none is claimed. (The gun-safe category's own sub-band wording belongs to that category and is not imported.) |
| Q2 | Above-band handling (assets over 3,500 lbs) | UNCLAIMED — D3: no maximum, refusal, or special-handling rule published; none claimed. |
| Q3 | Certification / credential wording (THE WORDING GATE) | UNCLAIMED — no certification, credential, or accreditation claim appears in any new content; the word "certified" appears in NO new block (the file's two pre-existing occurrences are domain-education "certified scales" text inside the long-distance datasets — index-wide count unchanged at 2, never a company claim). Off-site "Certified" language not imported. |
| Q4 | Equipment actually deployed | UNCLAIMED — published wording stays "dollies, straps and equipment" + warehouse forklift/track loader (photo caption). The domain rigging inventory (stair climbers, gantries, hoists, cranes, air bearings, cribbing) appears in D7 labeled domain reference only, never as deployment. |
| Q5 | Structural-engineer involvement | UNCLAIMED — D2 and D7 record engineer involvement as not published and not claimed; domain consultation guidance labeled domain. |
| Q6 | Medical / cryogenic specifics | UNCLAIMED — D3 lists the classes as published asset classes only; handling specifics stay with their own categories. |
| Q7 | Winchester branch SIR page | NOT CREATED — no page built; D4 and D8 record the asymmetry (Martinsburg full-format page exists; Winchester none) as a gap. |
| Q8 | Valuation offering for high-mass assets | UNCLAIMED — D5 explains the FMCSA domain forms only (Full Value Protection with the $6-per-pound minimum declared value; Released Value Protection at $0.60 per pound per article, signed waiver), labeled domain exactly as the long-distance datasets carry them, and states no company valuation offering is published or claimed. Valuation is never called insurance. |
| Q9 | Crew-size rules / minimum job size | UNCLAIMED — D1 and D5 state no crew-size rule or minimum is published or claimed. |
| Q10 | Publishable method surface | CONFIRMED AS THE PACKAGE DIRECTS — the 6 published steps are treated as the complete publishable surface in D1; KIM-GS internal calculations, models, and formulas are published nowhere in this batch (proprietary carve-out). |

## Retype mapping — datasets-sir-heavy.json (NEW, 8 nodes)

D1 → **Service** (SIR method operations) · D2 → **Dataset** (asset & structure
assessment operations) · D3 → **Dataset** (high-mass asset taxonomy) ·
D4 → **Dataset** (dispatch network & corridor chain) · D5 → **Article**
(commercial terms & cost drivers) · D6 → **Article** (buyer personas &
trigger events) · D7 → **Service** (floor, protection & handling
compliance) · D8 → **Dataset** (service areas, dispatch & quote path).
Split **4 Dataset / 2 Service / 2 Article** — the senior/warehouse/IT/
transloading family shape. No FAQPage (the hub FAQ is visible page copy;
the package carries no discrete Q&A dataset to publish). Dataset nodes
CC BY 4.0, temporalCoverage 2010/2026, dateModified 2026-10-29; the
identical @graph is embedded in the Heavy Asset Authority hub div.

## Counts before → after

Pages 155 → 155 · services 23 → 23 · sitemap 155 → 155 · head graph 25 → 25
(1 node changed) · entity graph 33 → 33 (1 node changed) · **best graph
81 → 82** (canonical node added) · public JSON files **55 → 56**
(+ datasets-sir-heavy.json) · ai-sitemap keywords **72 → 77** (+5 canonical
D1 forms — sir, kim-gs, heavy asset moving, high-mass relocation, floor
deflection l/360; "gun safe movers" was already present and was not
duplicated) · rubric DB: service 32, attestation **111 → 115**, edge 40,
opening_hours 14, service_area 66, rubric_check 7; integrity ok ·
index.html content ld+json blocks 15 → 16 (hub datasets block added; the
empty #page-jsonld runtime placeholder is unchanged and is not a content
block).

## Form preservation (the settled quote form, rebuilt twice today)

The full assertion suite ran pre-build and post-build on the local file
and again post-deploy on the served file — PASS at every state: the
Contact block (qName/qPhone/qEmail/qReach) sits in the always-visible
.contact-fields section before #detailedFields; required attributes on
exactly qFrom/qTo/qName/qPhone/qEmail (never on qReach or the dates);
qDate/qDateEnd remain optional inside #detailedFields; #quoteForm carries
novalidate; #qError role=alert present; .field-missing CSS present;
touched-tracking (touchedSel/selVal/accessString/pickText) present;
pickList yields '' for empty groups. This batch touched no form region,
no toggle code, no payload builder, and no Worker code.

## Gate (pre-deploy, all green)

node --check on BOTH executable inline scripts (885 + 126,630 chars) rc=0 ·
all 16 content ld+json blocks parse · hub in-div block parse-equal to
datasets-sir-heavy.json · **verify.js 71/71** · router audit clean pre- and
post-build (pageMeta 155 keys == router array 155 entries, sets exactly
equal) · form assertions PASS pre/post · forbidden scans: new blocks clean
(no "attest", no "certified"/"Certified", no Spearman / Around Town /
DESIGN 6 / Bristow / subcontract, no bare "flat quote", no USDOT/MC
patterns; the only dollar figures anywhere in new content are the FMCSA
domain pair $6 / $0.60, inside the terms dataset only); index-wide deltas
vs backup all zero. No quote test posted; no Search Console work.

## Live verification (post-deploy, no sampling — all PASS)

datasets-sir-heavy.json 200 + application/json, 8 nodes, split 4/2/2, all
dateModified 2026-10-29, Datasets CC BY 4.0 · live entity 33 / best 82,
exactly one canonical SIR node each (hub url, 637-char description),
Place chain 31/35 · live head node canonical (url + description identical)
· hub in-div block parse-equal to the datasets file · ai-sitemap live
23/155/77 with the canonical SIR description · sitemap 155 · llms
dedicated Heavy Asset Authority line (hub url) + dated entry live · data
txt dated entry live · Developer "SIR Heavy data" card live · Martinsburg
per-page JSON byte-identical to its pre-build state · form preservation
PASS on the served file · router audit clean on the served file · route
proofs 200 for /heavy/, /videos/, /moving-and-storage/,
/warehouse-relocation/, the IT page, /transloading-winchester-va/, the
packing hub, and the Martinsburg SIR branch page · **regression sweep of
ALL 56 public JSON files: 200 + application/json + valid JSON, zero
exceptions** · tagline + CTA live (CTA count 391 → 392, the +1 being the
D8 dataset's own quotation of the CTA string inside the new hub block),
DESIGN 6 = 0.

## GitHub (before this batch)

ai repo HEAD 0aa1719df93d5e61e5404283b55320aa2a7873cb · machine repo HEAD
d8d87a7beb4544a6fcff76997c9bea3439aa76f4 · gist graph data/entity-graph.json
SHA cda897e61319a0f52172ef1365402e4d7179cddf (2,486 B) — verified before
the push; this batch does not touch that file. After-state hashes are in
the batch handoff.

**Indexing target (recorded only, not submitted):**
https://theflatratemovers.com/heavy/

## Incidents

None. Three reported adaptations of the packing-batch template, each
forced by live state and recorded above: (1) the hub div does not end in
"</section>" — the datasets block was inserted as the page div's last
child before its closing tag, same placement semantics as the packing
hub; (2) llms.txt's SIR services-list entry already existed as a thin
line pointing at the site root — it was refreshed IN PLACE (title kept,
url corrected to the hub, full canonical text) rather than duplicated
with a second inserted line, matching the merge-note's "refresh, don't
duplicate" and the ai-sitemap treatment; (3) the certification-silence
record is worded by claim, not by a zero file count, because the live
file legitimately contains two domain-education occurrences of the term
inside the long-distance datasets (scale weights) — the batch adds none
and the index-wide count is unchanged.
