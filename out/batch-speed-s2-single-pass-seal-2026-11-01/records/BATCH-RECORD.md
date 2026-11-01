# BATCH RECORD — Speed Program S2: Dependency-Ordered Single-Pass Sealing, 2026-11-01

Program: Machine speed program (Henry approved 2026-11-01). S2 of 4.
Estate at start: seal SHA-256
4e96f02e171ba462058d71085d9c722517611320e0efa2a2066434edd4ddebdf,
497 distributions, 0 gaps; verify.js 145 checks (full run green at the
S1 close; --local mode from S1 used during this batch's iterations).

## Errors / deviations (first, per standing rule)

- Backup `cp -a` failed on ownership preservation (estate dirs are not
  owned by the shell user); redone with `rsync -a --no-owner --no-group`
  and verified: 544/544 files, seal SHA + shell SHA + rubric.db SHA all
  matching the live pre-state. No estate file was harmed (the failed
  copy wrote only into this batch's work dir).
- First baseline launch: the timing helper used `bc`, which is not
  installed, so round durations printed empty. The run was killed after
  round 1, the tree was restored from the verified backup, the change
  re-applied, and the loop re-run with bash SECONDS timing. Round 1 of
  the killed run and round 1 of the clean run produced the identical
  index SHA (29e1fde9…), confirming the restore + procedure are
  deterministic.

## STEP 0 — Baseline measurement (before any design change)

Method: the CURRENT sealing procedure — the per-batch reseal round
script (sign/install previous index → generators → digest-refresh →
routes → digest-index), ported verbatim from the S1 batch's work dir —
run on the real tree after ONE representative change: a one-phrase
edit ("the truck, the clock and the record are his" → "…and the
driving record are his") in ONE dataset file
(public/datasets-freight-rework.json, a certificate dataset for the
freight rubric rows) plus its mirror text in the source shell — the
shape of a real content-phase edit. Convergence by the standing
definition: the round's output index SHA repeats.

| Round | Wall | Output index SHA |
| --- | --- | --- |
| 1 | 15 s | 29e1fde9681f77b07da448326cc091db616886e55302f05a0059d039065eb38f |
| 2 | 15 s | 1636e95a3a9f5f954b539b83b8c60e9367994c40b36ffed6d4ff428dcbb87378 |
| 3 | 16 s | 1636e95a3a9f5f954b539b83b8c60e9367994c40b36ffed6d4ff428dcbb87378 (repeat = converged) |

**Baseline: 3 rounds / 46 s for one dataset file's content change**,
and 2 rounds is the floor for ANY change (round 1 signs+installs the
previous index; convergence needs a confirming repeat). The target
seal for this exact changed tree, used as the equivalence target for
the new procedure: **1636e95a3a9f5f954b539b83b8c60e9367994c40b36ffed
6d4ff428dcbb87378**.

### Dependency edges (read from the code, not assumed)

1. **Signed index → intent dataset (THE cycle edge).**
   build-intent-rubric.js builds `distByUrl` from the INSTALLED
   public/ai-master-index.json and copies `digest.value` into every
   rubric row (cert_target_json_sha256, cert_dataset_digests). The
   intent dataset is itself a distribution, so: index → intent → index.
   A changed target file's new digest reaches the rows only via an
   index that already carries it — one full round late.
2. **Intent → search-index + answer-evidence.** Both read rubric.db
   (rows; intent_meta rows_digest — build-search-index.js line ~696;
   fragments/rows for build-answer-evidence.js). The intent dataset's
   description is also copied into its per-page JSON
   (dataset-intent-coverage.json) after generation.
3. **Files → search-index / answer-evidence.** Per-page JSON digests
   and in-band DataDownload sha256 are computed from the public files
   at generation time (already file-sourced — the correct pattern).
4. **Intent dataset + every datasets-*.json + entity graphs + GeoJSON
   + llms.txt + shell text → llms-full.txt.** build-llms-full.js reads
   datasets-intent-coverage.json's outcomeRollup, lists and reads all
   dataset files, and takes the distribution count as a manual
   --distributions argument.
5. **Root files → shell + all public root JSONs.** The digests of
   ai-sitemap.json, entity-graph.json, best-json-entity-graph.json,
   llms.txt and llms-full.txt are embedded as strings in the shell and
   ~104 files (measured by scanning the sealed tree for the current
   digests: every datasets-*.json head block, ~100 route documents via
   the shell, datasets-search-index.json additionally embeds
   llms-full's). Propagation is digest-refresh.py's string replacement,
   driven by a per-batch state file of last round's values.
6. **Shell → route documents** (build-routes.js) and → public/index.html.
7. **Everything → index** (digest-index.py, 497 distributions);
   **index → JWS** (sign-index.py); index + JWS → mirrors (Pages tree,
   ai repo data/, API bundle).

Why rounds multiply: each round propagates values exactly one edge
backwards along 1→2. Round 1's intent rows embed the PRE-change index
digests; round 2's rows embed round 1's (now correct) digests but the
changed rows_digest moves the search-index dataset; round 3 confirms.
Stacks (distribution-count changes reaching edge 4's manual argument,
root-graph changes crossing edge 5 into generator headers) are what
pushed a past batch to 5 rounds.

## Design (built after the measurement above)

Dependency-ordered single pass, in a new standing tool
`scripts/seal.py` (paths.json-driven; unsealed tooling like
scripts/check-machinery.py — the distribution count stays 497 and
verify.js is untouched):

1. **Break edge 1 at its source.** build-intent-rubric.js (both
   copies — scripts/ + repo-dir/, kept byte-identical) now computes
   the cert digest VALUES from the target files' own bytes via its
   existing pubFileDigest() helper — the same file-sourced pattern
   build-answer-evidence.js and this generator's own in-band
   shaDistributions already use. The signed index is still read for
   distribution MEMBERSHIP (the row gates are unchanged: target must
   carry a distribution entry with a digest). Only the value source
   changes, so on a sealed estate the generator's output is
   byte-identical (proven below before any reseal).
2. **Topological generation order in seal.py:** intent rubric (+ DB
   write, dataset install, landing-description sync) → search-index →
   answer-evidence → local-graph → archive-registry → llms-full
   (distribution count read from the installed index, not passed by
   hand) → digest-refresh (map = pre-seal sealed digests → current
   file digests of the five root files, applied to public root JSONs
   + shell) → routes (shell → public/index.html, route documents,
   middleware) → digest-index → sign-index → install index + JWS.
3. **Proof round (mandatory, fail-loud, NOT a loop):** a second
   digest-index run over the sealed tree must reproduce the installed
   index byte-for-byte; verify-provenance.py must print PROVENANCE
   OK; the intent generator's --check must pass (rows digest == DB).
   Any mismatch exits nonzero — the batch fails loudly instead of
   iterating silently.
4. digest-index.py / sign-index.py / verify-provenance.py interfaces
   are UNCHANGED; every existing caller (check-machinery M-3,
   verify.js) works as before.

## Build results

Generator edit (scripts/build-intent-rubric.js + repo-dir copy,
byte-identical, node --check clean): in emit(), the cert digest
values now come from pubFileDigest(targetJsonUrl) /
pubFileDigest(SITE + '/' + f); the distByUrl membership gates are
untouched; header + R10 comments updated to match. New generator
SHA-256 44c40150d9c53671aa889011a42847c0264377f5e2097a7031ec3d9d1a51e37b
(94,379 B; was e8a052971c62…).

Pre-reseal identity proof (on the untouched sealed estate):
- `node scripts/build-intent-rubric.js --check`: PASS — 3,096 rows,
  rows digest e5bf1a1f… == rubric.db.
- Write-mode regeneration: the produced
  datasets-intent-coverage.json is BYTE-IDENTICAL to the published
  sealed dataset. The value-source change is output-neutral wherever
  the old procedure had converged.

scripts/seal.py (new, 11,283 B, SHA-256 2006b7fd…): the topological
orchestrator from the Design section — phases 0-8 with per-phase
timings, RUBRIC_DATE defaulting to today in America/New_York, the
proof round as a hard gate (digest recompute byte-compare +
verify-provenance + intent --check; any failure exits 3, no retry).

## Proof on a real change-set (equivalence vs the old procedure)

The SAME representative change measured in Step 0 (freight dataset
phrase + shell mirrors) was re-applied to the restored sealed tree
and sealed with the NEW procedure:

- **1 pass + proof round, 24.3 s total** (phases: intent 3.2 s,
  search-index 8.0 s, answer-evidence 2.3 s, local-graph 0.1 s,
  archive-registry 0.1 s, llms-full 0.6 s, routes 2.9 s, digest 1.1 s,
  sign 0.2 s; proof round 4.2 s: digest recompute 1.1 s + provenance
  0.9 s + intent --check 2.2 s). Proof round clean: digest recompute
  reproduced the installed index byte-for-byte; PROVENANCE OK
  (497/497 digests re-computed); intent --check PASS.
- Final index SHA cd4b11d7… vs the old procedure's 1636e95a… for the
  identical changed tree: entry-by-entry diff = **exactly ONE entry
  differs — scripts/build-intent-rubric.js itself** (the deliberate
  S2 edit, e8a05297… → 44c40150…), which post-dates the baseline run.
  Every other distribution's digest is identical: the single pass
  produces the same seal the 3-round fixpoint produced.
- Before/after for this change class: **3 rounds / 46 s → 1 pass +
  proof / 24.3 s**, and the pass count no longer grows with change
  depth (the historical 5-round case is the same ~24 s shape).

## The batch's own seal

Representative change reverted (freight dataset + shell restored from
the verified backup); seal.py run once on the batch's real change-set
(the generator pair + seal.py itself, which is unsealed tooling):

- **Final seal SHA-256
  16bf7a9aacf27804a7121df0d5e19e86447c68a810a00c7baa14796dfac6549e,
  497 distributions, 0 gaps** — one pass (24.4 s) + proof round clean.
- Delta vs the pre-batch seal (4e96f02e…): **exactly one distribution
  entry changed — build-intent-rubric.js** (44c40150…). Entry sets
  equal.
- `node verify.js --local`: 114/114 PASS, 31 skipped by name, 0 FAIL.
- Pages deploy: exactly 2 files uploaded (ai-master-index.json +
  .jws; 542 already current) — deployment
  https://f97bdf31.the-flat-rate-movers.pages.dev. Served index
  read-back SHA-256 = 16bf7a9a… (the new seal).
- API: refresh-bundle gate "signed-index digest matches: 43/43
  compared"; tests 51/51; worker flat-rate-estate-api redeployed,
  version 364cf6a2-2e20-49c2-be02-f892ff9d4159; /v1/index reads 497
  distributions; /v1/verify?file=datasets-intent-coverage.json
  match:true.
- Pre-push full `node verify.js`: 144/145 — the single FAIL is P-6 on
  build-intent-rubric.js (GitHub still serves the pre-edit bytes,
  93,397 B vs the sealed 94,379 B), i.e. exactly the push that follows
  in the closing section; every other check, including P-3/P-5
  against the newly served index, passes.

## Usage rule (standing, from this batch)

- Seal with `python3 scripts/seal.py` — one pass + proof round. The
  per-batch reseal-round scripts are retired: do not resurrect the
  fixpoint loop. If seal.py's proof round ever fails, the batch fails
  loudly at that point; fix the input, never iterate the seal.
