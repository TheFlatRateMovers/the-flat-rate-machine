# Batch record — Reliability build (D1–D5) (2026-10-31)

Batch dir: `out/batch-reliability-2026-10-31/` (backup/, records/, work/).
Order: owner order 2026-10-31 ("research the best ways to proceed then
proceed"), implemented EXACTLY per
`out/reliability-design-2026-10-31/DESIGN.md` §C (10 steps, in order).
Standing deploy-after-check authorization; a batch that fails any check
does NOT deploy (estate rule) — see the Deviation: step 10 did not run.

## Step 1 — Backup

`backup/` holds rubric.db (live, `~/workspace/theflatratemovers/rubric.db`),
public `ai-master-index.json` (SHA-256 `623ef9e2…`) + `.jws` (`df48a134…`),
`scripts/ingest-outcome-evidence.py` (`82089167…`), `verify.js`
(`e883eb1c…`). Pre-batch hashes in `records/pre-batch-hashes.txt`.

## Step 2 — Registry (D1) + tools cmp (D2 precondition)

`paths.json` created at the machine-repo root with the 10 design keys
(repo_dir, public_dir, rubric_db, tools_dir, venv_py, rubric_work_dir,
pages_dir, api_worker_dir, archive_dir, keys_dir — path only). All 10
values verified to exist (archive_dir created empty; the archive builder
fills it at step 9). `tools_dir` = the standing `repo-dir/` per D2.
cmp of the four P1 tools, `repo-dir/` copies vs
`out/batchP1-provenance/tools/`: **digest-index.py, sign-index.py,
verify-provenance.py, keygen.py — all byte-identical.** Repoint
precondition holds.

## Step 3 — Ingest tool edit (D1+D2+D3)

`scripts/ingest-outcome-evidence.py` rewritten per design:
- **D1:** registry loader anchored on `__file__` (repo root = parent of
  `scripts/`); precedence CLI flag > env (INGEST_DB, INGEST_PUBLIC_DIR,
  INGEST_REPO_DIR, INGEST_TOOLS_DIR, INGEST_VENV_PY,
  INGEST_RUBRIC_WORK_DIR) > registry > hard error (SystemExit 2, no
  compiled-in fallback). Removed: DEFAULT_DB, DEFAULT_PUB,
  DEFAULT_REPO_DIR, TOOLS, VENV_PY, the home-derived MACHINE constant,
  and every literal estate path in code, docstring, and printed text.
  Source scan after edit: no `out/batch-` string, no `expanduser`, no
  `~/workspace`, no module-level path-default assignments.
- **D2:** the seal chain now invokes the tools from registry
  `tools_dir` (the `repo-dir/` copies) and the interpreter from
  registry `venv_py` (declared; the venv itself stays in place).
- **D3:** (a) `dedupe_key` column = lowercase hex SHA-256 of the
  U+001F-joined identity (query_text, service_id, gate, state,
  evidence_source, evidence_ref-or-empty, observed_at; detail and
  recorded_at excluded); in-tool startup migration (column added only
  if absent, NULL keys backfilled, duplicates abort loudly);
  `CREATE UNIQUE INDEX idx_evidence_dedupe`; inserts are
  `INSERT OR IGNORE` with rowcount accounting; stats gain
  `evidence_skipped_duplicates`. Outcome-summary UPDATE now fires only
  when a gate changed or evidence was actually inserted for the row
  (a pure replay touches no summary, so the regenerated dataset is
  byte-stable). (b) Run ledger `intent_ingest_runs` (run_key =
  SHA-256 of the verdict file's raw bytes, verdicts_sha256, source,
  observed_at, started_at, db_committed_at, chain_completed_at,
  stats_json); checkpoint 1 written in the SAME transaction as the
  evidence append; checkpoint 2 set after the chain proves
  provenance. (c) Chain steps unchanged in nature (generator rebuild,
  dataset copy, digest, sign, prove — all overwrite-deterministic),
  now fed entirely by registry paths.
- `python3 -m py_compile` OK. New tool SHA-256 `ed01622a…`
  (15,785 → 21,578 B), mirrored byte-identical into
  `repo-dir/ingest-outcome-evidence.py` (cmp-verified).

## Step 4 — Migration rehearsal (scratch DB)

Tool `--no-chain` on a scratch copy of the live rubric.db with the
real verdict file (`records/rehearsal-run.log`): migration backfilled
**161** keys; **0** duplicates (161 distinct keys, 0 NULL);
replay stats: evidence_appended **0**, evidence_skipped_duplicates
**161**, rows_updated 0, gate_changes 0; evidence count still **161**.
Run-ledger row written with checkpoint 1 set, checkpoint 2 unset
(correct under --no-chain).

## Step 5 — Machinery checks (D4)

`scripts/check-machinery.py` written (stdlib only; emits the M-1..M-5
JSON map; its own source assembles the M-4 literals from parts so the
scan does not flag itself). verify.js gained §17 in the §14/§15
wrapper style: helper invoked once, results mapped to M-1..M-5,
helper failure fails all five with the error as detail. `node --check`
OK. verify.js mirrored byte-identical into `repo-dir/verify.js`
(cmp-verified; new SHA-256 `0f7e6a6a…`, 104,635 → 106,836 B).
Per the bootstrap rule, `check-machinery.py`,
`build-estate-archive.py`, and `paths.json` are NOT sealed
distributions.

## Step 6 — Acceptance: the incident, replayed safely (LIVE DB)

The tool ran on the live DB with today's real verdict file
(`out/batch-gsc-evidence-ingest-2026-10-31/work/verdicts-gsc-indexing-
pass-2026-10-31.json`), full chain, TWICE
(`records/acceptance-replay-1.log`, `records/acceptance-replay-2.log`):

- **Replay 1:** live migration backfilled 161 keys. Stats: appended
  **0**, skipped **161**, rows_updated 0, gate_changes 0. Chain
  completed: generator rowsDigest unchanged `671f2549…`, dataset
  republished byte-identical (163,716 B, SHA-256 `81752845…` — the
  pre-batch hash), digest 470 / gaps 0, signed (kid
  `theflatratemovers-2026-10-29-1`), **PROVENANCE OK (470 match)**.
  Evidence count after: **161**. Run ledger: one row, run_key
  `b458fb34…`, BOTH checkpoints set.
- **Replay 2:** identical stats (appended 0, skipped 161); migration
  backfilled 0 (already armed). Public index/JWS/dataset hashes after
  replay 2 == after replay 1, byte-for-byte (`fba8dc6c…` /
  `2b607380…` / `81752845…`). Evidence count after: **161**. Still
  exactly one run-ledger row.

Incident 2 is closed: a halted or completed ingest is now safely
re-runnable end-to-end, and a re-run is a verified no-op.

## Step 7 — Reseal (standalone proof)

digest-index + sign-index via registry `tools_dir`, then standalone
verify-provenance: **PROVENANCE OK (470 match, 0 mismatch, 0
unresolved)**. The standalone reseal output is byte-identical to the
chain's seal (index and JWS cmp-equal). Diff of the new sealed index
vs the pre-batch backup: **exactly 2 of 470 digests changed** —
`scripts/ingest-outcome-evidence.py` (`82089167…` → `ed01622a…`) and
`verify.js` (`e883eb1c…` → `0f7e6a6a…`). URL set identical, all
top-level fields identical, dataset digest unchanged.

## Step 8 — Gate: 109/110 (ONE failure — see Deviation)

`records/verify-gate.log`. §17 results: **M-1 PASS** (registry
resolves; venv imports cryptography; no tool path defaults), **M-2
PASS** (22/22 GitHub-main distributions match the sealed digests),
**M-3 PASS** (seal self-reproduces: 470 digests + sizes, gaps 0),
**M-5 PASS** (unique index present, 0 NULL keys over 161 rows, run
ledger exists). All 105 pre-existing checks PASS. **M-4 FAIL** —
sole failure of the suite.

## DEVIATION — M-4 cannot pass as designed; step 10 NOT run

M-4 as designed is a plain substring scan of `scripts/*.py`,
`scripts/*.js`, `verify.js` for three per-batch literals, expecting
zero hits. There is exactly **one hit**: `scripts/build-routes.js`
line 3, a header COMMENT recording where its design lives
(`out/batch-per-route-shell-live/records/DESIGN.md`) — a historical
provenance pointer of the same kind this batch record is, not a live
path default; nothing executes it.

The design conflicts with itself here, and no resolution exists
inside it:
- M-4 requires zero hits across `scripts/*.js`;
- §C's files-touched list does NOT include build-routes.js, and the
  reseal is required to change exactly 2 digests (achieved, step 7);
- build-routes.js is a sealed distribution — ANY edit to it,
  including deleting one comment line, changes a 3rd digest and
  touches a file the design lists as untouched.

Per the batch orders (deviations are stopped and stated, never
improvised around) and the estate rule (a batch that fails any check
does not deploy), **step 10 (Pages deploy, API refresh, GitHub
pushes) was NOT run.** The decision needed is the parent's/owner's,
one of: (a) re-express M-4 to exclude comment lines / historical
design-record references, with a dated verify-fix record (the
estate's stale-check precedent: rewrite stricter, never waive);
(b) amend the design to admit a comment-only edit of
`scripts/build-routes.js` + its `repo-dir/` mirror — the reseal then
changes exactly 3 digests; or (c) retire the literal from the M-4
list as an era premise. Once decided, the remaining motion is:
re-run the gate to 110/110, then step 10 exactly as designed (the
local state below is consistent and resumable as-is; the replays do
not need to be re-run — the ledger already holds both checkpoints).

**Resulting state, stated plainly:** the live site still serves the
PRE-batch sealed index (`623ef9e2…`); the local public tree carries
the resealed index (`fba8dc6c…`) + JWS, consistent with the local
repo-dir mirrors (all provenance checks green locally); the API
bundle still matches the live index and was not redeployed; GitHub
was not pushed (no pre-push key grep was needed); the live rubric.db
carries the D3 migration + both acceptance replays (evidence 161,
unchanged in content — no evidence row was altered or deleted).

## Step 9 — Archive (D5)

`scripts/build-estate-archive.py` written and run: inputs were only
paths.json + the sealed public index; resolution used digest-index's
exact rules. Result: **470 distributions, 470 matched**, exit 0,
0 unmatched, 470 unique archive paths, payload **68,615,056 bytes**
written under `out/estate-archive/files/`; `MANIFEST.json` records
index_sha256 `fba8dc6c…` (the current local seal), generated_at, and
per-file contentUrl / archive_path / sha256 / byteSize / match. The
archive is local machinery — not pushed, not sealed.

## Files touched (complete list)

- NEW: `paths.json`, `scripts/check-machinery.py`,
  `scripts/build-estate-archive.py`, `out/estate-archive/` (generated:
  files/ + MANIFEST.json), this batch record + logs.
- EDITED: `scripts/ingest-outcome-evidence.py`, `verify.js` (each
  with its `repo-dir/` mirror refreshed byte-identical).
- DB: live `rubric.db` — `dedupe_key` column + unique index
  `idx_evidence_dedupe` + `intent_ingest_runs` table (2 checkpoints
  on the one run row); no evidence row altered or deleted.
- REPUBLISHED locally (not deployed — see Deviation): public
  `ai-master-index.json` + `.jws` (exactly 2 digests changed).
- Untouched: every dataset (intent dataset byte-identical), every
  page and graph, the stale `out/` folders, the signing key, the
  live site, the API worker, and both GitHub repos.

## Continuation — M-4 decision + step 10 (2026-10-31, later session)

**Decision (parent, under the standing stale-check rule — rewrite the
check to test the intended property, never waive it):** option (a),
strict form. M-4 is re-expressed in `scripts/check-machinery.py` so
the stale-literal scan runs over EXECUTABLE lines only: comments
are blanked char-for-char before scanning (JS `//` and `/* */`,
Python `#`), across the same 21-file set, for the same three
literals. No literal retired, no filename special-cased, verify.js
unchanged. Dated record:
`out/verify-fix-2026-10-31-m4-executable-scan.md`.

**The re-expression, as built:** the stripper is string-aware —
string literals, template literals, and docstrings are copied
verbatim and stay scanned; `${ }` expressions are processed as
code with a frame stack for nested templates; regex literals are
consumed verbatim (escapes and `[...]` classes tracked; a `/`
opens a regex only where a term can start, never after an
operand). Regex tracking is load-bearing on this codebase
(`/^\//`-style bodies in build-routes.js, `/\//g` in
build-intent-rubric.js place an escaped slash directly before the
closing slash; a comment-stripper without it blanks executable
code on those lines — caught in testing, fixed before the gate).
Validation: 67 stripper assertions pass (literals planted in
comments hidden; literals planted in code, strings, docstrings,
templates still found; division never mistaken for regex);
byte-length and newline count preserved on all 21 real files;
raw scan still finds the one historical hit, executable scan
finds zero. Helper output: M-1..M-5 all PASS (M-4: "21 live
tooling files scanned (executable lines, comments stripped),
zero stale per-batch path literals").

**Sealed set untouched by the fix:** `check-machinery.py` is an
unsealed bootstrap file, so no reseal rode this edit; the public
index/JWS still hash to this batch's resealed pair
(`fba8dc6c…` / `2b607380…`), confirmed immediately before the
gate re-run.

**Gate re-run: 110/110 VERIFY OK** (full output:
`records/verify-gate-continuation.log`; §17 M-4 PASS with the new
detail text; all 105 pre-existing checks PASS unchanged).

**Step 10 — Pages deploy:** wrangler Pages deploy of the public
tree uploaded **exactly 2 files** (518 already uploaded):
`ai-master-index.json` + `ai-master-index.jws`. Deployment
https://45e8bc1b.the-flat-rate-movers.pages.dev. Served-byte
identity: live `https://theflatratemovers.com/ai-master-index.json`
SHA-256 `fba8dc6c…` and `.jws` SHA-256 `2b607380…` — byte-identical
to the sealed local pair. The live site now serves the reliability
seal (exactly 2 digests changed vs the pre-batch seal: the ingest
tool and verify.js).

**Step 10 — API cadence:** refresh-bundle gate passed —
`signed-index digest matches: 37/37 compared`; test suite
**34 passed, 0 failed**; worker redeployed, Current Version ID
`3aa000eb-f36a-4675-a929-efb1d486aecc`. Live: `/v1/index` = 470
distributions; `/v1/verify?file=datasets-intent-coverage.json`
match:true (live SHA-256 `81752845…` == signed digest);
`/v1/verify?file=ai-master-index.json` reports the live index
SHA-256 `fba8dc6c…` under kid `theflatratemovers-2026-10-29-1`.

**Step 9 restated (archive, from the first session):** the estate
archive stands at **470/470 distributions matched**, payload
**68,615,056 bytes** under `out/estate-archive/files/`, with
`MANIFEST.json` recording the seal it was proven against
(index_sha256 `fba8dc6c…` — the same seal this continuation
deployed).
