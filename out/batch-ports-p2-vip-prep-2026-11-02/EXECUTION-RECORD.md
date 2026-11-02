# Ports P2 — EXECUTION RECORD (2026-11-02)

Executor: subagent session 67a9b269 (Ports P2 brief, incl. the era-derivation
fix and the Launch Protocol additions). Baseline at start: installed signed
index from the verdict-ingest reseal, 535 distributions.

**Final state: seal `472f5a1b` / 539 distributions, gaps 0, PROVENANCE OK.
Pages 229 · sitemap union 269 · services 30 · dataset files 40 · intent
rows 3,375. Full live verify 185/186 — the sole miss is P-6, closed in
substance by this record's pushes plus the two flagged parent web uploads
(§8). Local verify 145/145.**

---

## 1. Errors and defects (found and fixed inside the batch)

1. **Dataset serialization mismatch (prep note wrong for one file).** The
   prep's merge rule (indent 1 + trailing newline) does not match
   datasets-transloading-inland-port.json's true form (indent 2,
   ensure_ascii=False, NO trailing newline). The first merge reformatted the
   whole file. Fixed: restored byte-exact from the shell's verbatim embed
   (sha256 e06872c5…, 42,508 B = the signed-index digest), round-trip-tested
   the serialization, re-merged — diff = only the about-link + the appended
   port-entity node. Discipline applied to every later JSON write in the
   batch: round-trip before writing. (True forms recorded: hub per-page JSON
   indent 2 + NL; pages.json / ai-sitemap.json / graphs indent 1 + NL;
   ai-master-index.json indent 1, ensure_ascii=True + NL.)
2. **Hub FAQ staged form not present on the live page.** The staged hub
   blocks used a `<dl>` FAQ form the live hub does not carry; the hub spec's
   §2 sanctions matching the page's live form, so the 2 new FAQ pairs were
   appended in the live `<p class="sec-p">` form and the hub per-page JSON's
   FAQPage grew 7 → 9 byte-equal with the visible pairs.
3. **Seal pass 1 failed at phase 2** — build-answer-evidence: "no head-data
   jf for …/virginia-inland-port-3pl-project-support/". New pages require a
   head-data regeneration before sealing. Regenerated with a work copy of
   gen-head-data.js (ROOT redirected; slug map + spoke entry): 228 entries,
   0 problems, 0 image fallbacks; installed to Pages functions.
4. **Proof-round intent --check failed after seal pass 1** — the known
   one-generation digest cascade (phase-1 rows certify pre-seal index
   digests). Pass 2 sealed clean (519e9f60); the pattern repeated once more
   after the graph fix (81903105 → c5db2104). All documented, none waived.
5. **Six local-verify failures after the main seal (079b5e0c)** — all fixed
   in-batch, none waived:
   - services.json pageCounts: transloading 21 → 22 (spoke is a transloading
     page in pages.json). A1 later moved it 22 → 23 the same way.
   - Staged Phase-A copies (out/phase-a/ai-sitemap.json + llms.txt) updated
     227 → 228, then 228 → 229 for A1 (verify reads the staged copies).
   - verify.js §12 sqlite spawn hit the 1 MB default maxBuffer at 3,373
     rows (spawnSync ENOBUFS): harness fix — maxBuffer 64 MB, matching the
     §13 v2 block; both verify twins identical. Not a check weakening.
   - PS-4: the spoke URL added to llms.txt (service list + per-page JSON
     list lines).
   - **I-8 bad awaiting = 103 (the substantive one).** Root cause: outcome
     rows persisted from the batch-1 era carried `awaiting-observation`
     states written when their target pages had no presence in the evidence
     window; the parent's batch-2 import (2026-11-02 verdict ingest) later
     gave 103 of those pages presence in the window, and persisted awaiting
     states were never re-derived — a latent defect created by the import,
     first surfaced by this batch's full verify. Generator fix (both twins):
     persisted awaiting rows whose target now has window presence return to
     the unmeasured default; still-absent targets keep the status with the
     basis refreshed to the current evidence span. I-8 passes; verify's rule
     was NOT touched.
6. **API service-derivation conflict (spec-internal).** Propagation spec §3
   put the spoke Service node in both graphs; the API derives /v1/services
   from graph Service nodes, which made the count 31 against the estate's
   registered 30 (API test pins 30; the same spec's counts line reads
   "services 30 (unchanged — #31/#32 register in P4)"). Resolved for the
   registered-services invariant: the node was removed from all 6 graph
   copies; it remains in the spoke's per-page JSON and head. **P4 remainder:
   when service #32 (3PL Support Services) registers, add
   `#service-virginia-inland-port-3pl-project-support` to both graphs + all
   copies in that batch.** Two extra seals + redeploy absorbed in-batch.
   Side finding: the spec's "VIP Place node … estatePages-derived links"
   line — the graph VIP Place node (P1's
   `/datasets/ports/#port-virginia-inland-port`) carries no such links;
   nothing to extend. The `#dataset-inland-port-port-entity` node belongs to
   the dataset file + hub JSON only, per prep §5 — that is where it lives.
7. **DC-2 embed staleness after the fix seals.** The intent + search-index
   landing embeds went stale twice more as the intent file regenerated;
   re-synced with the P1 audit tool (final state 76/76 fresh) and re-sealed.
8. **A1 div placement.** The A1 div was first inserted after W1-02's div
   span — W1-02 is the LAST page div, so the insert landed after `</html>`
   and build-routes failed on non-chrome residue. Relocated to immediately
   after W1-02's div, before the footer chrome. Seal then passed one-pass.
9. **A1 missing from the news sitemap.** build-news-sitemap is
   ledger-driven (a post appears iff its ledger row status reads
   "published"). The A1 ledger row was written (blog-project/ledger.csv,
   id A1), then re-sealed; the post now appears in news-sitemap.xml.
10. **NF-2 author-page link.** The full live verify flagged that
    /author/henry-pitts-jr/ did not link the new post. A1 added newest-first
    to the author page's published set; re-sealed; NF-2 passes.
11. **Runtime interruption.** One chained exec (API tests + deploy) was cut
    by a service restart. State was checked before any retry: tests re-ran
    clean (61/61), the live API still served the old bundle (deploy had not
    landed), and the deploy was re-run as its own call — exit 0, version
    ad4fa124. No step was repeated blindly; no pipe-masked exit codes (the
    2026-11-02 verdict-ingest lesson) — deploys ran unchained from tests.

## 2. Era-derivation fix (brief addition 1) — evidence

- build-intent-rubric.js + repo-dir twin (byte-identical, node --check OK):
  `eraForWindow(windowStart, windowEnd)` against the 2026-10-29 cutover
  (end ≤ 2026-10-28 → 'pre-rebuild'; start ≥ 2026-10-29 → 'current';
  straddling → 'transition'), applied per-observation at insert, to the
  evidence-span meta, and to the D8 basis text; schema default era changed
  to 'transition'; D6 description now describes both exports.
- Second defect found inside the fix: emitSql never dropped
  intent_row_gsc_evidence, so INSERT OR IGNORE preserved stale eras across
  regenerations. `DROP TABLE IF EXISTS intent_row_gsc_evidence;` added with
  a dated comment (both twins).
- rubric.db after regeneration: batch 1 (2026-07-29 → 2026-10-28)
  'pre-rebuild' ×104; batch 2 (2026-10-04 → 2026-10-31) 'transition' ×101;
  evidence rows 205; meta evidence_era 'transition', evidence_window
  2026-07-29 / 2026-10-31.
- verify.js re-expressions (both twins): I-6 derives the expected era/window
  from the observed span in-check; I-7 counts rows whose era disagrees with
  the SQL CASE derivation from their own import windows. I-6 PASS, I-7 PASS
  in the closing runs.
- API test: KNOWN_EVIDENCE_BATCHES batch 2 → era 'transition' (batch 1
  unchanged); distribution-count pin re-expressed twice in the same motion
  class (535 → 537 P2; 537 → 539 A1). API suite 61/61 at both closes.

## 3. P2 main motion — what shipped

- Hub /virginia-inland-port-transloading/ deepened: port-entity block,
  Winchester binding block, project-support section, 3PL section; hub
  per-page JSON += the port Place node + FAQPage 7 → 9; Related chips gain
  the spoke (first) and, in the A1 motion, the article.
- NEW spoke /virginia-inland-port-3pl-project-support/ (per-page JSON 7,688 B,
  sha256 e3d53f6c…; 7 nodes; 3-level breadcrumb; router + pageMeta + head-data
  228 entries).
- Datasets: datasets-transloading-inland-port.json += port-entity Place node
  (geo 38.9878, −78.17829; FTZ 20 Site 7 formulation; binding Winchester
  ~23 mi / 0:30 vs Martinsburg ~43 / 0:51; "about 160 acres") + operations
  about-link; landing node inventory 8 → 9. datasets-ports.json regenerated
  from data/ports.json (VIP estatePages += spoke; coverage cell treatment
  note "spoke live (batch P2)"; lastVerified 2026-11-02).
- Registries/propagation: pages.json 227 → 228; ai-sitemap 228 + spoke;
  graphs (Place node already P1-present; spoke page identity via registries
  + head graph); data txt spoke line + P2 log entry; llms.txt spoke lines +
  figures (537 distributions, 187 per-page JSONs, 228 pages); llms-full
  regenerated by the seal.
- Rubric: 14 VIP rows re-targeted to the hub, 1 to the spoke, +10 new rows
  (7 spoke navigational-local, 'who provides 3pl support…' ai-question to
  the spoke, 2 hub project-management rows); rows 3,360 → 3,373. No re-key
  (P4 re-keys at registration).
- Homepage launch-protocol link: spoke card FIRST in "Every core job has its
  own page" (in-seal).
- Seals: bc60507c (pass 1, proof fail) → 519e9f60 → 079b5e0c (main) →
  873b58bd → c5db2104 → **fd61978b (P2 final, 537)**.
- Deploys: Pages c8efba64 then c2b07ad7; API refresh 45/45 digest matches,
  tests 61/61, worker ad4fa124; /v1/index 537, /v1/services 30,
  /v1/datasets 40; /v1/verify match:true for the spoke JSON.
- Live checks: spoke + hub + both dataset landings 200 with own content;
  spoke JSON 200 application/json; sitemap pages section 175 locs (union
  268), spoke present; quote-form md5 == W-2 pin (inside verify).
- Verify: local 145/145; full live 185/186 (sole P-6, pre-push state).
- Pulse (seal mode, state baseline advanced): main host 114 URLs → HTTP
  200; API host 12 URLs → HTTP 200 (receipts out/pulse/receipts.ndjson,
  2026-11-02T22:15Z). The 114-URL set is the diff since the Pulse-batch
  baseline and includes the verdict-ingest changes. WebSub NOT fired (no
  feed change in the main motion, per spec).
- Pushes (ai repo): d8b94eb5 (44 files, 3,224,748 B: root 4, data/ 38,
  schemas/ 2 incl. the new spoke JSON + the changed hub JSON) and b2c76d29
  (data/datasets-search-index.json). Gist guard verified before AND after:
  ai data/entity-graph.json blob SHA cda897e61319a0f52172ef1365402e4d7179cddf
  unchanged — the file was excluded from the push set, as always.

## 4. Article A1 motion — what shipped

- /who-unloads-containers-at-the-virginia-inland-port/ LIVE: "Transloading at
  the Virginia Inland Port: the support layer behind the rail ramps", guide
  lane, ~1,785 words, 5 FAQ entities byte-equal (visible ↔ JSON-LD), 5
  sources, mid-article CTA card + closing "Get your flat rate" block.
- News Formula at publish: byline line under the H1 with the TRUE recorded
  instant **2026-11-02T17:16:59-05:00** (N-2/N-7; one instant across byline,
  BlogPosting schema, news sitemap, feed); author chain to
  /author/henry-pitts-jr/ (N-4) + the author page now links the post (NF-2);
  manifest entry appended to data/news-formula.json with image
  **owner-photo-needed (VIP terminal)** (N-8, W1-01 flag form; no
  logo/stock/substitute); ledger row A1 written.
- Per-page JSON built in the W1-01 form (7 nodes: BlogPosting, Service,
  Organization, both branch Places, FAQPage, BreadcrumbList).
- Reciprocals in the same seal: hub + spoke + W1-01 chips gain the article;
  blog hub card, all-pages chip, sitemap-page row; homepage "Latest article"
  line created in the Browse everything section (the rotating slot did not
  exist before this motion — executor's protocol-compliant addition);
  ports.json VIP estatePages += article URL + build-ports re-run.
- Counts: pages 228 → 229; sitemap union 268 → 269; distributions 537 → 539;
  intent rows 3,373 → 3,375 (2 page-derived rows target the article);
  services 30; datasets 40.
- Seals: e198285d → bbe44288 → 59bc88fb → d0a0e426 → **472f5a1b (final,
  539)**. Verify re-expressions in the same motion (P-5 228/537 → 229/539;
  D-2 route documents 228 → 229, shell Dataset count 372 stands — the
  article's graph carries no Dataset node).
- Deploys: Pages 4c877af5 + two fix redeploys; live checks: article 200 with
  byline, article JSON 200 application/json, feed.xml carries the post,
  news-sitemap.xml carries the post.
- WebSub: feed.xml → HTTP 204; updates.xml → HTTP 204 (fired after the
  feed-changing deploy was verified live; log:
  out/batch-ports-p2-vip-prep-2026-11-02/websub-pings.log).
- API: refresh (intent 3,375; services 30), tests 61/61, worker 16b5def8;
  /v1/index 539; /v1/verify match:true for the article JSON.
- Verify: local 145/145; full live 185/186 (sole P-6).
- Pushes: see §7 addendum (executed at close, after this record's first
  writing — the record rides the machine push).

## 5. Launch Protocol — timings and the parent's browser steps

In-seal homepage links: spoke card (P2 seal) ✓; A1 Latest-article line (A1
seal) ✓. IndexNow via Pulse at both closes ✓ (A1 set: §7 addendum). WebSub
at A1 close ✓.

**PARENT BROWSER STEPS (executor has no browser tools — exact asks):**
1. **GSC Request Indexing (same-day, quota counts against Nov 2):**
   - https://theflatratemovers.com/virginia-inland-port-3pl-project-support/
     (live since the P2 deploys, first c8efba64, final c2b07ad7 —
     2026-11-02 afternoon EST)
   - https://theflatratemovers.com/who-unloads-containers-at-the-virginia-inland-port/
     (live since the A1 deploys, first 4c877af5 — 2026-11-02 ~17:5x EST;
     final content seal 472f5a1b deployed after)
   The deepened hub URL may also be requested if quota allows.
2. **Same-evening URL Inspection re-check** for both URLs; record
   time-to-index IN HOURS from the deploy times above. If not yet indexed,
   record the state + elapsed hours — the Nov 3 census pass picks both up
   regardless (they are in the sitemap union).
3. **GBP (standing grant, browser step):** Winchester profile ONLY — add the
   custom service with the exact name **Virginia Inland Port transloading
   support**. F1 baseline: Winchester 75 service entries (2026-11-02,
   gbp-f1-enumeration-2026-11-02.md — re-derive the live baseline first; the
   Nov 3 publication check may have moved pending states). Record
   before/after counts + the new service's state (pending review is
   normal). NEVER resubmit an existing pending item. Martinsburg: nothing
   in P2. NOT in P2: the §7.6 Winchester product (P5) and the generic
   Logistics Project Management / 3PL Support Services GBP adds (P4).

## 6. P4 remainders (recorded, not done)

- Register services #31 Logistics Project Management + #32 3PL Support
  Services; re-key the spoke's rubric family to service-3pl-support-services
  (prep note in rubric/rubric-edits.md); add the spoke Service node to both
  graphs + copies at registration; reciprocal links from the new service
  hubs; generic PM/3PL GBP services; /transloading/ ports section and
  /port-logistics/ program hub remain future-batch items.

## 7. Push addendum (filled at close)

- **AI repo (A1 motion):** ca900f85 (41 files, 3,080,004 B: ai-sitemap, llms
  pair, data txt, index + JWS, 35 dataset files refreshed by the digest
  cascade, schemas/who-unloads-containers-at-the-virginia-inland-port.json
  NEW) and 4151fb37 (data/datasets-search-index.json, 1,966,918 B; repo head
  after both pushes). datasets-answer-evidence.json excluded — flagged for
  parent web upload (§8). Gist guard re-verified after all pushes:
  data/entity-graph.json still cda897e61319a0f52172ef1365402e4d7179cddf.
- **Machine repo (both motions):** 98e473c8 (8 files, 1,265,225 B:
  verify.js, data/pages.json, data/ports.json, data/services.json,
  data/news-formula.json, scripts/build-intent-rubric.js,
  code/pages-functions/head-data.js, and this record). The site shell is
  excluded — flagged for parent web upload (§8).
- **Pulse (A1 close, seal mode):** main host 270 URLs → HTTP 200 (the A1
  article carried as "added", accepted; the wide set is the seal-diff across
  the A1 seal generations — every route document re-digested as llms/graph
  digests rolled); API host 12 URLs → HTTP 200. Receipts
  2026-11-02T22:47Z in out/pulse/receipts.ndjson; state advanced to seal
  472f5a1b.
- **P-6 status:** every repo-served distribution now matches the live
  served bytes except the two flagged web uploads in §8 (shell +
  answer-evidence), which close P-6 in substance on the parent's raw-fetch
  SHA-256 proof, per the standing pattern of every 2026-11-02 batch.

## 8. Flagged for parent web upload (over the push ceiling)

1. **Site shell** — local: `~/workspace/the-flat-rate-machine/repo-dir/index.html`
   - sha256 `e83602a6d4e29b8241c7df58048423912971544c61489dfdd14883426725d70c`
   - 25,164,293 bytes
   - Destination: GitHub repo `TheFlatRateMovers/the-flat-rate-machine`,
     path `code/site-shell/index.html` (web upload, as in every prior batch;
     closes P-6's shell leg on raw-fetch SHA-256 proof).
2. **Answer-evidence dataset** — local:
   `~/workspace/the-flat-rate-movers-pages/public/datasets-answer-evidence.json`
   - sha256 `7c858d35338f3d51d6dc9007fd023beb042c3b4e2d52fc095bdd3f2b1fe93e03`
   - 8,273,783 bytes
   - Destination: GitHub repo `TheFlatRateMovers/theflatratemovers-ai`,
     path `data/datasets-answer-evidence.json` (web upload; closes P-6's
     remaining leg).

## 9. Notes

- The `~/workspace/theflatratemovers/the-flat-rate-movers-data.txt` copy is
  stale (598 lines) against the live PUB copy (624+ lines); the batch edited
  the PUB copy, as P1 did. Reconciling the duplicate is not P2 scope.
- Machine-repo data/ graph copies were NOT pushed: their blob SHAs already
  equal the remote (the known G4 working-snapshot state — the machine-side
  best graph lags PUB by 3 Service nodes: final-mile, piano-antique,
  route81; rides the separate G4 refresh, not this batch).
- Henry-only questions raised by this batch: NONE.
