# Batch record — canonical repo-dir + ingest-tool repoint (2026-10-31)

Batch dir: `out/batch-repo-dir-canonical-2026-10-31/` (backup/, records/, work/).
Order: owner-directed 2026-10-31 ("fix this today, all data needs to be in the
proper folder, with the full data files"). Follows up the follow-up flagged in
`out/batch-gsc-evidence-ingest-2026-10-31/records/BATCH-RECORD.md`: the sealed
ingest tool's compiled-in DEFAULT_REPO_DIR pointed at the pre-Solution-A
mirror `out/batch-intent-rubric-v2-live/repo-dir`, which lacks the four
Solution A code files and halted that batch's reseal chain (safely, before
signing).

## Step 1 — Inventory of every repo-dir reference/default (live code)

| # | File | Reference | State |
|---|------|-----------|-------|
| 1 | `scripts/ingest-outcome-evidence.py:94` | `DEFAULT_REPO_DIR = <MACHINE>/out/batch-intent-rubric-v2-live/repo-dir` (default for `--repo-dir`, passed to digest-index + verify-provenance in its chain) | **STALE — the defect** |
| 2 | `out/batchP1-provenance/tools/digest-index.py:51` | `--repo-dir` is `required=True`, no default | Current (caller-supplied) |
| 3 | `out/batchP1-provenance/tools/verify-provenance.py:35` | `--repo-dir` is `required=True`, no default | Current (caller-supplied) |
| 4 | `out/batchP1-provenance/tools/sign-index.py`, `keygen.py` | No repo-dir argument at all (sign-index reads the key only from custody) | Current |
| 5 | Copies of digest-index.py / verify-provenance.py inside historical `out/*/repo-dir/` trees (batch-p2-certificate, batch-captions, batch-founding, batch-junk-removal, batch-naming, batch-phasef-www, batch-blog-foundation, deploy-work/push-machine, …) | These are sealed DISTRIBUTION payload copies inside per-batch mirrors, not live defaults; no batch tooling runs them by default | Historical — untouched |
| 6 | `out/batch-blog-foundation/work/seal.py` | Batch-local seal script; uses its OWN batch's repo-dir (`os.path.join(B, 'repo-dir')`) | Historical, self-referential — untouched |

Adjacent path assumptions checked, NOT repo-dir (left as-is, all current and
mutually consistent): `scripts/build-intent-rubric.js:97` WORK_DIR default
`out/batch-intent-rubric/work` (env-overridable via RUBRIC_WORK_DIR), read by
`scripts/ingest-outcome-evidence.py:255` and `verify.js:974` (generation
summary) — the generator's work dir, not a seal mirror. The ingest tool's
VENV_PY (`out/batch-naming/.venv/bin/python`) works and is not a repo-dir.

**Inventory count: 1 stale default (the ingest tool), 3 current canonical-tool
interfaces, the rest historical payload/batch-local copies.**

## Step 2 — Canonical folder

DECISION: promote to the stable standing path
**`~/workspace/the-flat-rate-machine/repo-dir/`** — a batch-named folder under
`out/` is exactly how the staleness happened; a standing path cannot be
orphaned by the next batch. Method: copied from
`out/batch-per-route-shell-live/work/repo-dir` (the mirror the current
470-distribution seal was built with); `cp -a` failed on ownership
preservation so a plain recursive copy was made and proven with `diff -r`:
**tree byte-identical, 22 files** (per-file SHA-256 list in
`records/canonical-folder-hashes.txt`).

ZERO-DIFF DIGEST PROOF (before any repointing): digest-index run with
`--repo-dir` = the new canonical folder against the then-sealed public index →
**470 distributions, gaps 0**, and a field-by-field comparison
(sha256 / byteSize / license / dateModified) against the sealed index:
**0 diffs**. The canonical folder reproduces the current seal exactly.

The stale folder `out/batch-intent-rubric-v2-live/repo-dir` remains on disk as
history; after this batch no live tool references it (grep of scripts/,
verify.js, and the canonical P1 tools for `batch-intent-rubric-v2-live`:
NONE).

## Step 3 — Repoint (the sealed tool edited + resealed in this same motion)

- `scripts/ingest-outcome-evidence.py` line 94:
  `DEFAULT_REPO_DIR = os.path.join(MACHINE, "repo-dir")` — the ONLY edit.
  `python3 -m py_compile` OK.
- The edited tool was copied byte-identically into the canonical mirror
  (`repo-dir/ingest-outcome-evidence.py`, cmp-verified). Tool SHA-256:
  `8d4858c73f7ccbe8baace52b24a0db3b0b2e109bfa94bb7dd354cee26d5bd8a8` →
  `82089167dcbdb402611fea71db36701bf9a523901ca49185bdac7904566d97bd`
  (byteSize 15,817 → 15,785).

## Step 4 — Proof end-to-end

(a) **The tool's own chain through its DEFAULT path**: ran
`python3 scripts/ingest-outcome-evidence.py work/verdicts-empty-proof.json`
(an indexing-kind file with an EMPTY verdicts list — writes nothing) with
**no `--repo-dir` flag**. The full chain executed through the new default:
generator (rowsDigest unchanged `671f2549…`), dataset republished
byte-identical (163,716 B, SHA-256 `8175284586…` — unchanged), digest-index
**470 distributions, gaps 0**, sign (kid `theflatratemovers-2026-10-29-1`),
verify-provenance **PROVENANCE OK**. Evidence-log safety: intent_outcome_
evidence row count **161 before and 161 after** — the proof run appended
nothing.
(b) **Digest diff of the reseal** (new public index vs pre-batch backup):
exactly **1 of 470 distributions changed** — the ingest tool itself
(digest field `8d4858c7…` → `82089167…`, byteSize 15,817 → 15,785). No
top-level field changed. New public index SHA-256
`623ef9e21ca0ae621d1729a4ac3a12fe75e3c47676e4c88bd1d83c47ee1183a3`;
new JWS SHA-256 `df48a134ca9acbff106e42e56186212cb13fc0984e96530ecea0555785d62e86`.
(c) **Standalone provenance re-run** (canonical P1 verify-provenance.py,
`--repo-dir` = canonical folder): **PROVENANCE OK (470 match, 0 mismatch,
0 unresolved)**.
(d) **verify.js full suite: 105/105 VERIFY OK** (post-reseal).
(e) **Cadence** (index bytes changed, so the full motion ran):
- Pages deploy (the-flat-rate-movers-pages): **exactly 2 files uploaded**
  (ai-master-index.json, ai-master-index.jws); deployment
  https://847e0ac2.the-flat-rate-movers.pages.dev. Live byte check: served
  index SHA-256 `623ef9e2…` and served JWS SHA-256 `df48a134…` both ==
  the sealed local copies.
- API worker: refresh-bundle gate **signed-index digest matches 37/37
  compared**; tests **34 passed, 0 failed**; redeployed — Current Version ID
  `d0c1829d-34c5-4743-b902-0584fd96ad03`. Live: /v1/index = 470
  distributions; /v1/verify?file=datasets-intent-coverage.json →
  match:true, source live.
- Pre-push key-content grep across all push paths: 0 hits (checked at push
  time; see completion report).

## Pushes (one per repo, back-to-back)

- theflatratemovers-ai: data/ai-master-index.json, data/ai-master-index.jws.
- the-flat-rate-machine: scripts/ingest-outcome-evidence.py + this batch's
  record files. (The canonical `repo-dir/` tree itself is local machinery —
  like every per-batch repo-dir before it, it is not pushed; the distributions'
  contentUrls resolve to the files' real repo paths, and the edited script is
  pushed at its real path.)
- HEADs + byte-identical read-backs are verified immediately after the pushes
  and carried in the batch's completion report to the parent agent.
- The gist-based ai-repo data/entity-graph.json is in NO push path.

## Not touched

No site content or pages; no dataset bytes (the intent dataset is
byte-identical); no rubric DB writes (evidence log 161 rows, unchanged);
no other tool's code; the stale v2-live folder left on disk as history,
unwired.
