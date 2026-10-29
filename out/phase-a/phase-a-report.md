# Phase A — Staged Infrastructure Repair — Report (2026-10-29)

**Status: STAGED ONLY. Nothing here is live.** No deploy, no GitHub push, no
DNS change, no quote test post, no paid service. The live site source
(`~/workspace/the-flat-rate-movers-pages/`) was verified untouched
(no file modified 2026-10-29). Everything below lands in
`~/workspace/the-flat-rate-machine/out/phase-a/` or in machine data/builders
for review. Live deployment happens only in a Henry-approved batch, with
one explicit tap per the standing deploy rule.

**Verification: `node verify.js` → 71/71 PASS** (was 43/43 on the old check
set). No check was weakened to force green: the old hardcoded @id totals
(89/86/141/138) were replaced, per the task, with registry-relative
coverage assertions (every services.json entry has a Service node in each
graph; @id counts are still printed as INFO and are unchanged: 89/86 and
141/138). Full output counts are in §8.

## 1. Files changed (exact paths)

### Machine data (edited in place; mirrors kept byte-identical)
- `~/workspace/the-flat-rate-machine/data/entity-graph.json` — serviceType
  backfilled on ALL 28 Service nodes (was 1/28, Gun Safe only). Each node's
  serviceType equals its own service name, matching the best graph's
  convention. Semantic content otherwise unchanged; @id counts unchanged.
- `~/workspace/theflatratemovers/entity-graph.json` — mirror synced,
  byte-identical to the machine copy (verify.js checks this).
- `~/workspace/theflatratemovers/rubric.db` — services table 9 → 27 rows:
  the 9 legacy page-anchored rows PRESERVED (edges reference them), plus
  18 canonical rows keyed `https://theflatratemovers.com/#<services.json id>`
  (name/description verbatim from services.json, provider = organization
  @id, url = the @id itself — page mapping lives in pages.json service
  refs), plus 18 attestation rows (claim, source = head JSON-LD graph in
  live site source, verified 2026-10-28, evidence = services.json id +
  pageCount). Backup before edit:
  `out/phase-a/rubric.db.backup-2026-10-29`.

### Builders (edited; all pass `node --check`)
- `~/workspace/the-flat-rate-machine/scripts/build-graph.js` — generated
  Service nodes now carry `serviceType: s.name`, so future regeneration
  cannot drop the backfill.
- `~/workspace/the-flat-rate-machine/scripts/build-ai.js` — generated
  ai-sitemap now emits: services = all services.json entries, hasPart =
  all pages.json entries, keywords = all service names, a factual
  description composed from data/ (counts, branches distinct, founding —
  NOT copied live prose), areaServedByBranch derived from the GeoJSON
  branch property (31/35 incl. shared), and mainEntity WebSite +
  sitemap.xml. Gap notes updated (hasPart/keywords/mainEntity resolved;
  the old "mainEntity points to sitemap_index.xml" note was stale — live
  was fixed 2026-10-28 and verified 2026-10-29).
- `~/workspace/the-flat-rate-machine/scripts/build-datasets.js` (NEW) —
  deterministic builder for the master + 18 per-category Dataset drafts
  from `datasets-research-and-formulation-2026-10-29.md`.
- `~/workspace/the-flat-rate-machine/scripts/build-datasets-ocean.js`
  (NEW) — deterministic builder for the D1–D8 ocean Dataset drafts from
  `ocean-container-datasets-2026-10-29.md` §6.
- `~/workspace/the-flat-rate-machine/verify.js` — extended 43 → 71 checks:
  registry-relative counts (services count field, pages count, geo vs
  live GeoJSON), service-@id coverage, serviceType coverage, ai-sitemap
  parity, llms coverage, FAQ validity, Dataset validity (CC BY, master
  §3 conformance, per-category shape/status, ocean D1–D8 shape/gating),
  live .json content-type proof, rubric DB canonical/attestation counts.
  Footer wording updated ("VERIFY FAILED — fix the data, not the checks").

### Regenerated staged output (out/ root, overwritten by builder runs)
- `out/entity-graph.generated.json`, `out/graph.diff.json`,
  `out/llms.generated.txt`, `out/ai-sitemap.generated.json`,
  `out/ard.generated.json`, `out/ai.diff.json`.

### Staged Phase A set (out/phase-a/ — the review set)
- `ai-sitemap.json` — services 18, hasPart 150, keywords 18,
  areaServedByBranch 31/35, mainEntity WebSite. (Live file still has
  services 6 / hasPart 41 / keywords 11 until the deploy batch.)
- `llms.txt` — names all 18 services; sitemap clause states 150 clean
  canonical URLs. (Live llms.txt/data txt current-state clauses already
  said 150 — verified, not re-edited; the two remaining "126" mentions in
  live llms.txt are deliberate history lines, preserved per the Oct 28
  decision, plus the "116 W Piccadilly" address.)
- `ard.json` — regenerated ARD catalog.
- `entity-graph.json` (backfilled copy), `best-json-entity-graph.json`
  (verified copy — already 32/32 typed, no change needed),
  `entity-graph.generated.json` (18 Service nodes, all typed).
- `faq-schema.json` — see §2.
- `dataset-developer.json` — master Dataset, see §3.
- `datasets-per-category.json` + `datasets-manifest.json` — see §3.
- `datasets-ocean-container.json` + `datasets-ocean-manifest.json` — see §4.
- `track-sl-investigation.md` — see §5.
- `rubric.db.backup-2026-10-29` — pre-edit rubric backup.

## 2. FAQPage schema (staged)
The live head graph injects FAQPage ONLY for `#/faq`, and only 6 of its 9
visible questions. The staged file completes it and adds the two other
pages with visible Q&A sections — answers are verbatim visible page text
(markup stripped, entities decoded), never invented:
- `#/faq` — 9 questions (the 6 in schema + the 3 missing: "Short or
  Detailed quote?", "Do you pack and crate?", "Do you move offices and
  industrial sites?"). The 6 existing schema answers differ slightly in
  wording from visible text; the staged file uses visible wording
  throughout (graph must match visible content).
- `#/local-regional-moving` — 4 questions (price flat for short local
  move; which base serves; gun safe/piano/medical device; how to get
  the quote).
- `#/industrial-offices-moving` — 4 questions (different from standard
  office move; heavy equipment in office area; alongside warehouse/project
  work; how to get the quote).
Total: 3 pages, 17 questions, all with non-empty answers. The
"How heavy is heavy?" heading on the heavy page is an interactive slider
heading, not a Q&A — excluded. No other page carries a visible FAQ
section (h2/h3/h4/h5 scan of the whole file).

## 3. Dataset drafts — master + 18 per-category (CC BY 4.0)
Per `datasets-research-and-formulation-2026-10-29.md`. License on every
node: **CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)**,
attribution "The Flat Rate Movers, https://theflatratemovers.com/".
Creator on every node: the organization @id with the 6 verified social
sameAs links. temporalCoverage `2010/2026` on every node. spatialCoverage
is the two branch @ids on every node, never a merged list. Descriptions
are 50–5000 chars; keywords are exactly the doc's GSC/SERP lists.
- **Master** (`dataset-developer.json`): name, description (1181 chars),
  and 11 keywords verbatim from doc §3; distribution = the 4 machine
  files (ai-sitemap, GeoJSON, entity graph, best graph). Replaces the
  earlier draft that carried a flagged license TODO — the TODO is gone
  because the decision now exists (verify.js FAILS if a TODO reappears).
- **Per-category** (`datasets-per-category.json`, 18 nodes):
  10 READY (page(s) already live; sameAs = registry URL(s) only):
  IT relocation, ISPM 15/crating, office, packing, transloading,
  gun-safe, commercial, local/residential, long-distance,
  military/government.
  8 STAGED (no dedicated page yet; NO sameAs — assigned when the page is
  built, node ships with that page's batch, never before): senior,
  industrial relocation, warehouse relocation, medical, cryogenic, FF&E,
  workforce deployment, junk removal.
  Distribution per node = 4 machine files + any per-page schema JSON
  that actually exists on disk for its pages (old pages without a real
  JSON file contribute none — see §4 trap rule).
  Five descriptions (commercial, local/residential, long-distance,
  military/government, junk) are formulated from the doc's dataset lines
  using only verified company facts; the other thirteen are verbatim
  from doc §4. Derivation notes are in the manifest.
- **Deliberately OUT (attestation questions, never claimed):** the senior
  single-provider / no-subcontractor sentence; medical device classes,
  facility types, procedures; cryogenic item classes, procedures;
  military/government contracts, clearances, discounts. No USDOT/MC, no
  license details, no invented prices anywhere.
- **dateModified caveat:** all dataset drafts carry `2026-10-29`, which
  is the DRAFT date. It must be re-stamped to the actual deploy date at
  deploy time (recorded in the manifest, not hidden).

## 4. Ocean container datasets D1–D8 (CC BY 4.0)
Per `ocean-container-datasets-2026-10-29.md` §6. 8 nodes, 6 READY + 2
STAGED (D3 taxonomy, D5 commercial terms — both ship only with their
Phase D pages). Every node: CC BY 4.0, creator org @id, doc §6 keywords,
temporalCoverage 2010/2026, spatialCoverage = 2 branch @ids,
about → the relevant Service @id(s), distribution = 4 machine files +
  real per-page JSONs only.
- D1 container operations (3 container pages, ready — distribution has
  NO per-page JSONs because those pages have none; see trap rule).
- D2 transload/cross-dock/decon (4 pages incl. docs + Martinsburg page).
- D3 taxonomy (staged; typical values only, "CSC plate on each box
  governs"; NO type claimed as company-handled beyond general handling
  already published).
- D4 port chain/corridors (2 port pages; rail leg domain-only).
- D5 commercial terms (staged; NO standalone-container rate — the
  industrial CWT schedule is cited ONLY as the industrial-commercial
  schedule, never extended to standalone unloads).
- D6 personas/triggers (emergency + industrial pages).
- D7 compliance/access (emergency + ISPM/crating pages; TWIC labor
  published, TWIC-card credential NOT claimed).
- D8 areas/dispatch/quote (Martinsburg transloading + industrial pages;
  survey-room vs job-details-route distinction stated, not conflated).

### The three corrections (applied, verified, in the ocean manifest)
1. **Old container pages have NO standalone per-page JSON.** Verified
   live 2026-10-29: `.../container-loading-unloading-services-port-transload-virginia.json`
   returns HTTP 200 but Content-Type `text/html` (~1MB index.html) — the
   SPA fallback. Status 200 does NOT prove a JSON file exists. By
   contrast, `.../transloading-movers-martinsburg-wv.json` returns
   `application/json` (5,267 bytes) — a real file. Distribution lists
   therefore include per-page JSONs ONLY where a real file exists on
   disk. verify.js now proves both content-types live (the fallback
   check is EXPECTED to flip when Phase D adds real JSONs — a flip is
   good news, and D-node distributions must then be regenerated).
2. **TWIC coverage EXISTS — do not report it as missing.** Verified by
   grep 2026-10-29: 15 lowercase `twic` mentions site-wide, including
   the emergency page slug (`page-emergency-port-container-recovery-twic-labor-virginia`).
   Only TWIC-card credential detail is gated (attestation question Q2).
   D7 states this exactly: published text/slug + credential NOT claimed.
3. **Gated fields omitted, never guessed — and stated as omitted in
   D3/D4/D5/D7 so the boundary is auditable:** NO Port of Virginia
   terminal names (NIT/VIG/PMT/RMT), NO bonded/FTZ claim, NO customs
   brokerage, NO reefer/cold-chain capability, NO drayage fleet or
   chassis ownership, NO standalone-container rate, NO container type
   claimed as handled beyond general handling. All are attestation
   questions (§8 of the ocean doc) and stay omitted until Henry attests
   them. Builder and verify guards scan for these claim patterns with
   negation sentences excluded (so "X is not claimed" can never trip
   the guard — the guard catches real claims, not boundaries).

## 5. track.sl investigation (read-only; fix needs Henry's tap)
- **DNS (Cloudflare API, read-only):** `track.sl.theflatratemovers.com`
  is a CNAME → `track.m2.sendlayer.net`, DNS-only, TTL auto.
  Public resolution: SendLayer's tracking host at `198.18.234.73`.
- **What serves it:** SendLayer's server (Caddy). HTTPS `/` → 302 to
  `/app/user/` (SendLayer app login); HTTPS `/robots.txt` → 403, 0 bytes
  (SendLayer refuses robots.txt — exactly the GSC 4xx from Aug 23);
  HTTP `/` → 301 to HTTPS. The host is alive; Henry does not control it.
- **References:** NONE in the live site source, machine, workers, or
  survey projects. The quote form does not use SendLayer (Cloudflare
  Worker route). SendLayer may still serve the WordPress fallback or be
  dormant — not determinable from public data, not guessed.
- **Siblings (SendLayer setup intact in DNS):** `sl` → `sl.m2-use1.sendlayer.net`,
  `_dmarc.sl` → `_dmarc.m2.sendlayer.net`, TXT verification record.
- **Recommendation (NOT done — needs Henry's tap):** if SendLayer is
  retired, delete the `track.sl` CNAME (and the other three `sl.*`
  records if the whole setup is retired) and the GSC row disappears with
  the hostname. If SendLayer is still used for any sending, leave it —
  the GSC row is cosmetic for a tracking host that must never be
  indexed. "Serve a valid robots.txt there" is NOT directly possible:
  the hostname is a DNS-only CNAME to SendLayer's server, so no
  Cloudflare rule or Pages file can answer for it.
- **Explicitly NOT broken (verify-only):** the 4 live robots.txt
  variants (root/www × http/https, 75 bytes, fetched Oct 28) are correct
  — verified live 2026-10-29 (`Allow: /` + sitemap pointer). The
  1,589-byte row (http://www, Sep 29) is a historical WordPress-era
  fetch, not a current file; it ages out on its own. Do NOT "fix" it by
  re-serving the old file.

## 6. What was deliberately NOT done (and why)
- **No live edits of any kind.** Live index.html, robots.txt, live
  ai-sitemap, live llms.txt, live data txt, live graphs, live per-page
  JSONs — all untouched. Staged files deploy only in a Henry-approved
  batch (the staged ai-sitemap still differs from live: services 18 vs
  6, hasPart 150 vs 41 — that gap closes at deploy, not before).
- **No new-category pages, nodes, or content.** Senior, industrial
  relocation, warehouse relocation, IT relocation (dedicated page),
  medical, cryogenic, FF&E, workforce, combined crating, Winchester
  crating/transloading/packing pages remain Phases B–D. Dataset nodes
  for unbuilt pages are marked staged and carry no sameAs.
- **No deploys, no GitHub pushes, no DNS changes, no GSC actions beyond
  reads, no quote test posts, no paid services.**
- **No invented data.** No ratings, prices, counts, credentials,
  USDOT/MC numbers, service areas, or licenses beyond verified sources.
  Winchester and Martinsburg facts never blended (names, hours, areas,
  ratings distinct in every file).
- **Entity-graph residential pattern gap (reported, not hidden):**
  `service-residential` is the only services.json entry covered in
  entity-graph.json via a page-slug @id only (no `#service-residential`
  fragment node); the other 17 have fragment nodes. verify.js prints
  this as INFO. Adding a fragment node is a graph-structure change for
  the deploy batch to approve — it was NOT snuck into the backfill.
- **Live ai-sitemap creator email/sameAs/openingHours not reproduced**
  in the staged file: email/sameAs are not in any dataset, and
  company-level openingHours are deliberately omitted because the
  branches differ (reproducing the live Winchester-only value would
  blend branches). Documented in the builder gaps.
- **Dataset dateModified is the draft date (2026-10-29)** and must be
  re-stamped to the deploy date at deploy time.
- **Dataset license (CC BY 4.0) ships only with Henry's batch
  approval.** He may change it at approval time; until then it is
  decided, not blank. Proprietary carve-out holds: SIR/KIM-GS method
  internals, book content, and non-public business data are NOT in any
  dataset.

## 7. What the parent still needs from Henry (decisions, not work)
1. **Phase A deploy batch approval** (staged → live + GitHub ai/machine
   pushes in one batch, with live verification of all changed URLs).
2. **track.sl:** is SendLayer retired (delete the CNAME) or still used
   (leave it)? See §5.
3. **Dataset license confirmation at batch approval** (CC BY 4.0 as
   drafted, or a different license — his call at approval time).
4. **Dataset dateModified re-stamp** happens automatically at deploy
   (draft date → deploy date); no decision needed, just noted.
5. **Attestation questions** (research doc §4 + ocean doc §8): senior
   single-provider claim; medical/cryogenic specifics; TWIC cards;
   container pricing basis for standalone unloads; drayage/chassis;
   reefer; bonded/FTZ; equipment deployed; flat-rack/OOG scope;
   container types handled; Winchester transloading page approval.
   Nothing ships on these until he answers.

## 8. verify.js result (honest, full)
Run: `cd ~/workspace/the-flat-rate-machine && node verify.js`
**71/71 PASS, exit 0.** Breakdown: registry/live parity (pages 150 =
live sitemap 150, geo 52 = live geo 52, byte-identity on all 3 mirrored
files); branches distinct (names, hours, areas 16/14, ratings 5.0/1 and
4.7/6, founding 2010-06); services count field = 18, pageCounts
recomputed match, all page service refs resolve; corridors I-81/I-66/I-70
live; service-@id coverage 18/18 in both graphs; serviceType 28/28 and
32/32; staged ai-sitemap 18 services / 150 hasPart / 150 registry URLs /
18 names / 18 keywords; staged llms names all 18 + states 150; staged FAQ
3 pages / 17 questions valid; master Dataset valid + CC BY + §3 name and
keywords + description 1181 chars; per-category 18 nodes valid + manifest
10 ready / 8 staged + status/sameAs agreement + banned-scan clean;
ocean 8 nodes valid + manifest 6 ready / 2 staged + gating sentences +
claim-scan clean + 3 corrections recorded; live .json content-types
(old container = text/html fallback, Martinsburg transloading =
application/json); rubric canonical 18 + attestations 18; guardrails
(no placeholders, no USDOT/MC). INFO lines (not failures): @id counts
89/86 and 141/138 unchanged by the backfill; residential fragment gap
(§6). No failing checks. Nothing was weakened: every replaced check was
replaced with a strictly stronger relational check, and the replacements
are documented in §1 and in verify.js comments.
