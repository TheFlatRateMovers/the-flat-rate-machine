# A4 Install Prep — STEP 5 + §5 Gates Report (rig copy)

Date: 2026-11-23 (EST times UTC−5; all timestamps below UTC)
Scope: rig copy + staging only. **No production file was modified**
(production hashes re-verified at the end of this pass — see
"Production integrity"). No emitting builder run was started:
the heavy-run discipline (below) never cleared.

## Errors / blockers first

- [ ] **BLOCKER — production lane never freed.** A production seal
  was in flight when this pass began, and the lane then ran
  back-to-back for the entire pass: VF6 seal10 (14:01–~14:48) →
  GSC 09:40 EST pass (14:40–~15:00, copy-DB-safe but lane-active)
  → VF6 publish2 (14:57–~15:30, failed at deployment verify) →
  deployment verify re-runs ×3 (15:30–16:25, the third FAILED on
  CV-3) → AI-to-AI seal (16:24–19:17, killed by runtime restarts
  at ~15:46 and ~17:51 and supervisor-resumed both times) →
  verify --local (19:17–~19:35) → a further seal (19:36–~19:53,
  killed by another runtime restart) → seal relaunched again
  (pid 1752, running at last check 20:01). Per the binding
  heavy-run discipline (no census-scale run while a production
  seal/publish/verify holds the box; ≥2.5 GB free required —
  free memory oscillated 0.3–6.2 GB available, mostly <2.5 GB
  while the lane was active), **no census-scale gate run was
  started**. Gates 1, 2, 3, 4, 6 and the GREEN half of gate 5
  are therefore NOT RUN — lane-blocked, not failed. Everything
  that does not need a census-scale run was completed (below),
  and the rig is left fully prepped so the heavy phase can fire
  the moment the lane frees.
- [x] No other errors. Every light step below succeeded first try.

## Copy-execution mechanism — RESOLVED + PROVEN

- The A5 rig2 gates ran builders against a copy by **rewriting
  the copy's `paths.json` to the copy's own absolute paths**
  (verified in `a5-install/rig2/T/the-flat-rate-machine/paths.json`,
  every value re-pointed at the rig2 tree; rig2's builders then
  read the copy DB and wrote copy outputs with zero production
  contact). The A4 rig copy still carried production absolute
  paths (STEP2C R2) — this pass applied the rig2 mechanism to it.
- Applied: `install-rig/T/the-flat-rate-machine/paths.json` —
  all 14 values re-pointed from the three production roots to
  `install-rig/T/…`; assertion run: no production path remains.
- `build-intent-rubric.js` needs no paths.json: it resolves
  tree-relatively (sibling layout) with `RUBRIC_*` env overrides
  available — copy-safe by construction.
- **Read-only probe (proof, before any emitting run):**
  `node scripts/build-page-data.js` in the copy, before the
  stamps file existed, failed with
  `ENOENT: … open '/home/hatch/workspace/seal-test/suite-adopt/a4-slices/install-rig/T/the-flat-rate-machine/out/seal-work/stamps.json'`
  — the builder resolved its seat inside the copy, not
  production. Mechanism proven.
- Rig completion (inputs the subset copy lacked, copied in
  read-only from production, exactly as rig2's fuller tree had
  them): `theflatratemovers/blog-project/04-question-bank.md`
  (the intent builder's QB input — without it `generate()`
  throws), `out/batch-intent-rubric/work/gsc-verdicts-latest.json`
  (the search-index verdicts input; absence would change SI
  output vs the sealed baseline).
- Stamps: `out/seal-work/stamps.json` built in the copy by
  replicating seal.py's FB-3 logic byte-for-byte (ledger dm,
  news-manifest/prior-index dp, dataset files from the ledger):
  368 pages, 88 files, sealDate 2026-11-23 (== the sealed
  `page-data-scores.json` generatedAt in the copy).
- Oracle seat: production `build-intent-rubric.js` restored
  read-only into the copy as
  `scripts/build-intent-rubric-classic.js` —
  sha256 `a1f9effb5ff9a0b11bbf3b5243d7f19d7aa13c18c7a03165b774fdcc9eeab798`
  (== production, == the A1.5-proven build). The copy's modified
  seat: `bc74c9003483741d3391901da144eceb03ceb33aa92d11ecc6fde2b23321da05`.
- Baseline: sha256 manifest of all 756 watched outputs in the
  copy (10 AE files, 4 SI files, 736 per-page data.json/data.txt,
  page-data-scores.json, datasets-intent-coverage.json, 4
  intent-rows parts) at
  `install-rig/gates/baseline-hashes.txt`. Key hashes:
  AE main `b4ef43cd…` · SI main `4a575c2f…` · coverage
  `267a407b…` · page-data scores `bb6fa0cb…`.
- Plant/break tooling staged in `install-rig/gates/`:
  `plant-jf.py` (rig2's proven one-word jf plant, paths
  re-pointed), `plant-db.py` (duplicate-id + bad-target DB
  plants with restore), `run-gate.sh` (lane+memory header,
  `/usr/bin/time -v` peak RSS, NODE_OPTIONS heap 6144).

## Gate table (INSTALL-BRIEF §5)

| # | Gate | Verdict |
|---|---|---|
| 1 | Classic `--check` baseline (oracle healthy) | **NOT RUN — lane-blocked** (AE --check is the ~2,995 s census class; intent --check peaks ~4.78 GB) |
| 2 | Cold sliced build == classic, byte-identical, every output (AE/SI/PD/coverage) | **NOT RUN — lane-blocked** |
| 3 | Three plant shapes, sliced vs classic control | **NOT RUN — lane-blocked** (plants staged + ready) |
| 4 | Breaks: uncovered / double-claim / undeclared drift fail loud, outputs untouched | **NOT RUN — lane-blocked** (plant forms designed against the real driver code — SI throws `A4-DOUBLE-CLAIM` / `A4-CHANGESET-MISMATCH` / `A4-UNCOVERED`, PD throws `A4-DOUBLE-CLAIM` on duplicate registry URL, AE fingerprint throws on a jf-less planted target; scripts staged) |
| 5 | A1.6 gate break tests (§3) | **PARTIAL:** pre-state recorded (below); break tests + GREEN re-run **NOT RUN** — they require the gate 2–4 proof hashes first, and the check's item-6 dry slice-map build is a census DB aggregate that was not started under the lane discipline |
| 6 | A1.5 re-proof for modified `build-intent-rubric.js` (bc74c900…) | **NOT RUN — lane-blocked** (harness read: rig3 A/B pattern — control a1f9effb oracle seated in the copy, modified builder as windowed arm, outputs sql/rows/coverage + DB meta + peak ≤3.0 GB bound; three intent full runs needed, each census-scale) |

## Gate 5 pre-state (recorded 13:58–14:00 UTC, before the lane filled)

Targeted `predict.check_slice_builds(copy)` (import + direct
call, as STEP2C did; full predict not run):
**RED — 22 violations, all expected classes, no others**
(log: `install-rig/gates/logs/g5-a16-prerecord.log`):
- 12 proof violations (per builder × 4: driver_sha256 /
  outputs_byte_identical / record all `TO-BE-RECORDED`)
- 10 seal-marker violations (AE/SI/PD ×3 + coverage ×1 —
  the staged patch is unapplied, by design)
- Items 1, 2, 4, 6 PASS (registry loads, sliced seats exist
  twin-identical, classic fallbacks hash-match, dry slice-map
  build partition- + coverage-clean: AE 368 / SI 368 / PD 368 /
  coverage 34). Runtime ~111 s wall on the throttled box.

`slice-builds.json` proof hashes were **not** updated — they
record only after gates 2–4 pass, per the tasking. The seal
marker patch was **not** applied to the copy's seal.py — it
belongs to the same post-gates step.

## Lane / memory discipline log (all UTC)

- 13:52 pass start: no seal process; memory available 1.48 GB
  (<2.5 GB floor) — light prep only.
- 14:01 VF6 seal10 started (pid 2265). GSC pass 14:40–~15:00.
- 14:48 seal10 done; 14:57 VF6 publish2 started; failed at
  deployment verify ~15:30; manual verify re-runs to 16:25
  (verify-deployment3 FAILED, CV-3).
- 16:24 AI-to-AI seal started; runtime restarts ~15:46 and
  ~17:51 killed it mid-flight; supervisor relaunched it
  (pid 1764, elapsed 1:15:46 at 19:08); finished ~19:17.
- 19:17–19:35 verify --local; 19:36 a further seal started,
  killed by a runtime restart ~19:53; relaunched (pid 1752)
  and still running at the last check, 20:01 (memory available
  0.67 GB at that check).
- Re-checks ran every ~10 min throughout (~35 samples);
  at no point did "lane clear AND ≥2.5 GB free" hold together.

## Production integrity

- Production hashes (read-only reads): `build-intent-rubric.js`
  `a1f9effb…` at pass start == pass end — unchanged.
  `seal.py` (`473fa20f…` → `d0b67dc6…`) and `predict.py`
  (`4cf85f85…` → `eea9ae07…`) **changed during the pass — by
  the production lane's own batches** (the AI-to-AI close's
  machinery edits, made while only lane processes were
  running); this pass never wrote to production (see next
  bullet). One consequence: the staged seal marker patch was
  anchored on `473fa20f…` and must be re-anchored by the
  install batch before applying, per INSTALL-BRIEF §4 step 2's
  standing rule.
- All writes were inside
  `~/workspace/seal-test/suite-adopt/a4-slices/install-rig/`
  (paths.json rewrite, oracle seat, stamps, rig-completion
  inputs, gates/ tooling + logs, this report). The copy's
  rubric.db was opened read-only (one SELECT) — no plant was
  inserted; plants remain staged scripts only.

## Ready-to-fire heavy phase (for the install lane, in order)

1. Gate 1: AE classic `--check`, SI classic `--check`, intent
   oracle `--check` (`build-intent-rubric-classic.js`), PD
   classic emit vs baseline hashes (PD has no --check).
2. Gate 2: clear `out/seal-state/{ae,si,pd}-cache` +
   `coverage-slices`; sliced AE/SI/PD emits vs baseline;
   intent A4_CLASSIC=1 full run → coverage doc; sliced cold
   full run → coverage doc byte-compare (+ sql/rows compare).
3. Gate 6 (same runs, reordered): oracle full run (control)
   vs modified A4_CLASSIC run (windowed arm) — sql/rows/
   coverage byte-identical, DB meta equal, peak RSS ≤3.0 GB;
   record into the copy's `windowed-builds.json` + an A1.5
   re-proof record at `out/a4-gates-2026-11-23/` in the copy.
4. Gate 3: `plant-jf.py --plant` → sliced maintains (expect
   AE rebuilt=1) + classic controls; dataset-file plant;
   one-byte driver-edit plant (cold rebuild of that driver
   only); restore byte-exact after each.
5. Gate 4: `plant-db.py --dup-id` → SI sliced must throw
   A4-DOUBLE-CLAIM, outputs hash-untouched; `--bad-target` →
   AE sliced must throw (no jf), outputs untouched; SI cache
   agg tamper → A4-CHANGESET-MISMATCH; PD duplicate-URL
   pages.json plant → A4-DOUBLE-CLAIM; PUB output drift plant
   → classic --check FAIL, no writes. Restore after each.
6. Gate 5: record real proof hashes in the copy's
   `slice-builds.json` (record path →
   `out/a4-gates-2026-11-23/GATES-REPORT.md` inside the copy),
   apply `install-stage/seal-py-a4-markers.patch` to the
   copy's seal.py, re-run A1.6 → GREEN; then the four break
   tests (one-byte driver edit → RED; duplicate-URL pages.json
   → item-6 RED; remove one seal marker → RED; restore →
   GREEN).

---

## HEAVY PHASE — RESULTS (2026-11-23/24, heavy-phase lane)

**Verdict: STOPPED AT GATE 1 — genuine gate failure, rig-input class
(not a driver defect). Gates 2–6 NOT RUN. No proof hashes recorded,
seal patch NOT applied. The copy is restored to its exact baseline
state (all 756 baseline hashes verify OK after the one diagnostic
emit was rolled back). Zero production contact: no production file
was read or written by this phase (one directory *listing* of a
production out/ dir, no file read).**

### Timeline / lane discipline

- 19:31 EST start. Lane initially clear but memory available
  1.3–1.9 GB (< 2.5 GB floor) — waited. A production seal
  (ranking-fix batch) took the lane ~19:33 EST and held it,
  supervisor-relaunched across runtime restarts at ~20:55 and
  ~22:53 EST, until 00:01 EST (05:01 UTC), when the waiter
  confirmed lane CLEAR + 6,292 MB available twice, 60 s apart.
- All runs below ran under `gates/run-gate.sh` (lane + memory
  header logged per run; NODE_OPTIONS=--max-old-space-size=6144).
  Tooling fix inside the rig only: `/usr/bin/time` does not exist
  on this box, so run-gate.sh now falls back to a Python
  rusage(RUSAGE_CHILDREN) peak-RSS wrapper (the prep lane had
  never actually executed run-gate.sh).

### Re-base swap (coordinator instruction, applied BEFORE any intent run)

- `scripts/build-intent-rubric-classic.js` :=
  `gates/rebase/build-intent-rubric-classic-r55.js` —
  sha256 `569c894fb1740c3b6a21dd7070d12952820ffc47394283f9cabaf1f661c47940` ✓
- `scripts/build-intent-rubric.js` :=
  `gates/rebase/build-intent-rubric-sliced-r55.js` —
  sha256 `3dc6ecf912970a44d84892141c4b5bd9787d4d7d211885c54c612f2e974d917d` ✓
- `repo-dir/build-intent-rubric.js` := same sliced-r55 file —
  sha256 `3dc6ecf9…` ✓, twin-identical (`cmp` clean)
- Staged files verified before swap: hashes as named, both
  `node --check` OK, `R55_OWNER` present in both, `coverageSlices`
  present only in the sliced file. Old pairing (a1f9effb /
  bc74c900) preserved at `gates/backup/old-pairing/`.
- Consequence for gate 5/6 recording (not yet done): the copy's
  `slice-builds.json` coverage classic-fallback sha still names
  bc74c900 and `windowed-builds.json` still names the a1f9effb
  pair — both must be re-recorded against 569c894f / 3dc6ecf9
  when gates 2–4 pass.

### Gate 1 — PARTIAL PASS, then FAIL

| Sub-run | Result |
|---|---|
| AE classic `--check` | **PASS** — all 10 AE outputs "regenerates byte-identical" (main 10,534,960 B; 9 question splits ~19.24 MB each); wall 61.7 s; peak RSS 2,036,712 KB (~2.04 GB). Log: `gates/logs/g1-ae-classic-check.log` |
| SI classic `--check` | **FAIL** — `CHECK FAIL: datasets-search-index.json differs from regeneration`; wall 23.0 s; peak RSS 1,064,128 KB. Log: `gates/logs/g1-si-classic-check.log` |
| Intent oracle `--check` (r55 classic seat) | **NOT RUNNABLE** — aborts in 5.1 s: `R43 FAIL — staged bank missing: …/T/the-flat-rate-machine/out/batch-ports-full-2026-11-15/external-bank-staged.jsonl`. Log: `gates/logs/g1-intent-oracle-check.log` |
| PD classic emit vs baseline | **NOT RUN** — stopped on the gate-1 failures per discipline (same date-skew risk identified: PD takes dm from stamps/ledger, see root cause) |

### SI failure — precise diagnosis (diagnostic emit, then byte-exact restore)

A classic SI emit was run once for diagnosis
(`gates/logs/g1-si-classic-emit-diag.log`, exit 0, 23.5 s), the
regeneration diffed semantically against the baseline, and all
four SI outputs were then restored byte-exact from
`gates/backup/si-baseline/` (post-restore: 756/756 baseline
hashes OK).

- The 3 cluster files regenerate **byte-identical**.
- The main file's ONLY differences: the 368
  `@graph[4]/urlSupply[].lastmod` values. Baseline (sealed):
  per-page mix of 2026-11-21 / 2026-11-22. Regeneration:
  2026-11-23 for all 368. No other key differs anywhere in the
  document.
- Root cause — the copy's date inputs were advanced past its
  sealed outputs: SI takes urlSupply lastmod from
  `data/pages.json` (`lastmod: p.lastmod`), and the copy's
  registry carries `2026-11-23` for **all 368 pages**; the copy's
  lastmod ledger likewise sits at 2026-11-23 for 442/456 URLs
  and the prep-built stamps carry dm 2026-11-23 for all 368
  pages. The Nov-23 production batches advanced the
  registry/ledger estate-wide after the SI output in the copy
  was sealed (with its 2026-11-21/22 per-page dates). The
  classic builder is healthy; the rig's input set no longer
  regenerates its own sealed baseline. AE is unaffected (its
  --check passed on the same tree).

### Intent failure — precise diagnosis

The intent builder (both pairings — the missing-input check sits
in `generate()`, ahead of any pairing-specific code) requires
`out/batch-ports-full-2026-11-15/external-bank-staged.jsonl`
(the R43 staged bank). The rig copy was built under the rig2
rule (no `out/` carried over); prep restored two such inputs
(QB file, GSC verdicts) but not this one. The file exists in
production (directory listing only). Per this phase's binding
rule — no production reads; stop and report if a production file
is needed — it was NOT copied in.

### What is needed to re-fire (coordinator ruling)

1. Copy `out/batch-ports-full-2026-11-15/external-bank-staged.jsonl`
   into the rig copy (and sweep for any other `out/` inputs the
   intent builder opens — R43 is the first, may not be the last).
2. Rule on the SI/PD date skew: either (a) re-baseline the rig —
   regenerate the baseline manifest from classic emits on the
   copy's current inputs, making gate 2's sliced-vs-classic
   comparison the operative proof (the A4 question is sliced ==
   classic on identical inputs, which the skew does not touch);
   or (b) restore per-page 2026-11-21/22 lastmod values into the
   copy's registry/ledger/stamps from the sealed baseline's own
   urlSupply record. Option (a) is the smaller, cleaner ruling.
3. After those, the phase re-fires at gate 1 (AE already proven;
   SI --check, intent --check, PD emit remain) and proceeds
   through gates 2–6 as briefed, with gate 5/6 records naming
   the r55 pair (569c894f oracle / 3dc6ecf9 sliced).

### State left behind

- Copy outputs: at baseline, 756/756 hashes OK (verified after
  restore, 05:0x UTC).
- Copy seats: intent pairing = r55 pair (per coordinator);
  AE/SI/PD drivers, seal.py, predict.py, slice-builds.json,
  windowed-builds.json untouched (pristine hashes in
  `gates/evidence/pristine-script-hashes.txt`; swap hashes in
  `gates/evidence/rebase-swap-hashes.txt`).
- No caches were built (no sliced run started); no plants were
  made; the copy's rubric.db was never written (the intent
  --check abort precedes writeDb; plant-db.py never ran).
- Logs: `gates/logs/g1-*.log` (4 files).

---

## HEAVY PHASE — RE-FIRE RESULTS (2026-11-24, re-fire lane)

**Verdict: STOPPED AT GATE 2 (intent arm) / GATE 6 — GENUINE DRIVER
DEFECT in the re-based sliced intent builder (3dc6ecf9…). Gates 2
AE/SI/PD PASS. Gates 3, 4, 5 NOT RUN (they stand behind the intent
proof). No proof hashes recorded; seal patch NOT applied; no driver
fix improvised. Copy left clean: rubric.db restored to the pristine
snapshot (518,217 rows), all 756 re-baselined output hashes verify
OK, no plants outstanding, zero production writes (one ruling-1
input restore + production reads for hash verification only).**

### The defect (gate 2 intent / gate 6 — FAIL)

- Both modified-builder arms (A4_CLASSIC=1 and sliced cold) crash at
  the same line after writeDb + pack + rows-stream complete:
  `ReferenceError: A4_CLASSIC is not defined` at
  `scripts/build-intent-rubric.js:8652` in `main()`
  (logs: `gates/logs/arm-modclassic.log`, `gates/logs/arm-sliced.log`).
- Root cause, read from the file: the A4 slicing block (header
  comment, `const A4_CLASSIC = …` at line 7974, cache consts, and
  the helper functions incl. `coverageSlices` at 8085) was inserted
  INTO the body of `datasetAggregates()` — after its window-loop
  prologue (~line 7950), before its body resumes. The const and
  `coverageSlices` are therefore scoped inside `datasetAggregates`,
  invisible to `main()`. The file parses (`node --check` clean —
  nested function declarations are legal), so the defect only fires
  at runtime, on the first execution of the sliced seat. The
  modified builder can NEVER emit the coverage document, in either
  mode. Fix = re-derive the sliced pair with the block anchored at
  module top level (coordinator's fix cycle; not improvised here).
- What DID prove, before the crash (both arms, DB snapshot restored
  first): the writeDb path is byte-identical to the oracle —
  `intent-rubric.sql` f95e5db4…, `intent-rows.json` 2ec2658a…,
  intent-rows parts 59adbdfa… / b516b2b1… / f9f451bd… / 737ee693…,
  DB meta fully equal (518,203 rows generated, rows_digest
  eac69c6b…, outcome_digest 96c8f5ef…). The chain's coverage
  compares are INVALID and are not claimed: the coverage file on
  disk was the oracle arm's (the modified arms crashed before
  writing it). Coverage A/B is UNPROVEN.
- Arm numbers: oracle full run exit 0, 1,045.2 s, peak RSS
  2,615,796 KB (2.62 GB); modclassic exit 1 (crash), 600.2 s, peak
  2,615,684 KB; sliced cold exit 1 (crash), 595.3 s, peak
  2,882,148 KB (2.88 GB — under the 3.0 GB bound, but the run
  failed, so gate 6 records NO proof).

### Re-baseline (coordinator ruling 2 — DONE)

- Sealed manifest preserved at `gates/baseline-hashes-sealed.txt`.
- DB snapshot taken before any full run:
  `gates/rebase/rubric-pristine.db` (sqlite3 .backup; 518,217 rows,
  29 meta keys); restored before every intent arm.
- Classic emits on current inputs: SI classic exit 0 (23.5 s class;
  re-mint run 159.5 s under load, peak 1,179,800 KB), PD classic
  exit 0 (456.5 s, peak 854,544 KB; all 737 PD outputs regenerated
  byte-identical to sealed), intent oracle full run (above).
- New manifest `gates/baseline-hashes.txt` (header records the
  re-baseline + reason): only 5 entries changed vs sealed — SI main
  + the 4 intent-rows parts. AE entries stayed sealed at mint time
  (gate-1 AE PASS banked: 10/10 byte-identical, 61.7 s, peak
  2,036,712 KB), then AE/SI/PD entries were re-minted from the
  gate-2 back-to-back classic emits (see below) with update notes
  in the header. Final state: `cmp-baseline.sh` = 756 OK, 0 FAILED.
- Input restore (ruling 1, logged in `gates/logs/restores.log`):
  `out/rubric-depth-bank-2026-11-21/staged-offered.jsonl` copied
  from production (read-only) after the oracle's first abort named
  it missing. (The six out/ dirs + R43 bank from the coordinator's
  pre-restore were already present.)

### Gate 2 — AE/SI/PD PASS (back-to-back, identical inputs)

Method note: first cold sliced emits (chain2: SI 153.0 s / peak
1,316,004 KB; AE 44.4 s / 1,621,500 KB; PD 654.6 s / 1,527,376 KB;
all rebuilt=368 cold) differed from the sealed/earlier baselines —
traced to input movement between emits (intent-rows parts, SI/AE
outputs), NOT driver divergence. Operative proof run back-to-back
with no intervening emit:
- AE: sliced == classic, all 10 outputs byte-identical (main
  3e5efaa6…). Classic emit 159.0 s, peak 1,859,828 KB.
- SI: sliced == classic, all 4 outputs byte-identical (main
  e6254f29…, clusters 39a29d4d… / 7cb626fe… / 7f044af5…). Sliced
  B2B 162.8 s, peak 1,214,248 KB; classic 159.5 s, peak 1,179,800 KB.
  NOTE: this PASS is against the OLD SI pair (classic e2b04a77…) —
  see the SI re-base item below; the SI arm must be re-run against
  the new pair in the fix cycle.
- PD: sliced == classic on all outputs (734/736 + scores matched
  the baseline directly; the 2 drift pages — gun-safe Norfolk +
  Virginia Beach, 4 files — proved byte-identical B2B, classic
  329d5970…/b4ebc14a… and fcb77f50…/4a3bc756…; scores bb6fa0cb… ==
  sealed). PD classic B2B emit exit 0 (~594 s under load).

### Gate 1 disposition (per ruling 2)

AE PASS (banked, above). SI oracle health = prior diagnostic diff
(only the 368 urlSupply lastmod values) + successful re-baseline
emits. PD gate 1 = classic emit succeeding (byte-identical to
sealed). Intent oracle --check superseded by the gate 2/6 A/B full
runs — oracle arm completed exit 0; the modified arms are the
failure recorded above.

### Lane / OOM history (for the record)

Five oracle attempts were OOM-killed (exit 247) during the pack
phase on 2026-11-24 between 05:17 and 13:15 UTC — every one
collided with a production seal (re)starting mid-run under the
ranking-fix seal-supervisor (node 2.6 GB + pack ~2.1 GB +
production intent node ~2.4 GB > box). The oracle arm finally
completed at 15:23–15:40 UTC in a clean window. After the
coordinator's 16:04 EST lane-cleared update (ranking-fix
TERMINALLY CLOSED 16:00:13 EST), the remaining arms ran
back-to-back with lane CLEAR in every run-gate header.

### NOT DONE — for the fix cycle (in order)

1. Intent driver fix: re-derive the sliced pair (569c894f classic /
   3dc6ecf9 sliced seats) with the A4 block at module top level;
   re-run gate 2 intent arms + gate 6 (oracle vs A4_CLASSIC A/B,
   coverage byte-compare, DB meta, peak ≤3.0 GB) and record
   windowed-builds.json + the A1.5 re-proof record under the copy's
   out/a4-gates-2026-11-23/ — all naming the CURRENT pair.
2. SI re-base (coordinator update 2, received after the SI PASS):
   production SI classic is now 78f7fd4d… (one prose line, 789:
   "Google rating 5.0 from 2 reviews" → "5.0 from 3 reviews"). Copy
   seats still carry e2b04a77… — NOT yet re-based (the phase
   stopped at the intent failure first). Fix cycle must: copy the
   production classic into both copy seats, re-derive the sliced
   SI driver (anchors asserted; diff vs staged sliced = that one
   line only), re-mint the SI baseline from the new classic,
   re-run the SI gate-2 arm, and run the SI plant/break tests
   against the new pair. Gate-5 SI proof must name classic
   78f7fd4d… + the new sliced sha.
3. Gates 3, 4, 5 as briefed (plants staged: gates/plant-jf.py,
   gates/plant-db.py; seal patch at ../install-stage/
   seal-py-a4-markers.patch, unapplied; slice-builds.json proofs
   still TO-BE-RECORDED; windowed-builds.json still names the old
   a1f9effb pair).
4. Gate-5 targeted check pre-state stands from prep (RED, 22
   violations, expected classes only).

### State left behind

- Copy outputs: 756/756 re-baselined hashes OK.
- Copy rubric.db: pristine snapshot restored (518,217 rows).
- Copy seats: intent pair = r55 pair (569c894f / 3dc6ecf9, the
  defect is IN 3dc6ecf9); SI pair = old pair (e2b04a77 classic /
  32478b9b sliced) pending re-base; AE/PD drivers, seal.py,
  predict.py, slice-builds.json, windowed-builds.json untouched.
- Slice caches exist from the cold runs (ae/si/pd-cache under
  out/seal-state/); coverage-slices cache was cleared before the
  sliced arm and never repopulated (crash preceded the emit).
- Logs: gates/logs/rb-*.log, g2-*.log, arm-*.log, restores.log;
  arm captures: gates/arms/intent-{oracle,modclassic,sliced}.txt
  (modclassic/sliced captures are genuine for sql/rows/parts/meta,
  stale-oracle for the coverage file — see defect note).

---

## FIX CYCLE RESULTS (2026-11-24/25, fix-cycle lane)

**Verdict: GATES 2–6 COMPLETE on the rig copy. The driver defect is
repaired at the source (re-derived builder, new sha below); gate 2
intent + gate 6 PASS with full byte-identity; SI pair re-based and
re-proven; gate 3 PASS (all three plant shapes); gate 4 PASS with
two brief-expectation corrections documented at G4.1/G4.2 (the
oracle itself does not behave as the prep-lane plant design
assumed — sliced == classic in both cases, no driver defect);
gate 5 PASS (proofs recorded, seal patch applied clean, A1.6
targeted check GREEN, four break tests RED→GREEN). Final state:
copy DB byte-identical to the pristine snapshot, baseline manifest
756/756 OK (SI main re-minted for the re-base; AE entries re-minted
back to sealed — see gate 4 note), no plants outstanding, ZERO
production writes (production read only as the source of the two
classic files; hashes re-verified unchanged at the end).**

### NEW SHAS (the coordinator's production flip depends on these)

- **Sliced intent builder (NEW): sha256
  `1fc86efc85ced24b90872ca3bd3f6de6585c2e2a9b6ad2126bfd774c9ff269e6`**
  (replaces defective 3dc6ecf9…; classic pair seat 569c894f…)
- **Sliced SI driver (NEW): sha256
  `148255866be4678b79381ab8c2352c3657c39fee56f5b02167b54cb85748f9c6`**
  (classic pair seat 78f7fd4d…; replaces 32478b9b…)

### 1. Defect repair — re-derived sliced intent builder

- Re-derived from production's CURRENT classic
  `/home/hatch/workspace/the-flat-rate-machine/scripts/build-intent-rubric.js`
  (sha256 569c894f…, read-only). The defective 3dc6ecf9 file proved
  to be exactly classic + the 3 saved patch hunks (difflib: one
  202-line insert inside datasetAggregates(), one call-site delete,
  one 15-line call-site insert — nothing else), so the re-derivation
  re-applied the identical block + call sites with the block
  anchored at MODULE TOP LEVEL, immediately before the
  datasetAggregates comment block (classic line 7931).
- Mechanical verification before any long run: (a) `node --check`
  OK; (b) `const A4_CLASSIC` at column 0 (line 7956),
  `function coverageSlices` at column 0 (line 8067); (c) diff vs
  the 569c894f classic = ONLY the 3 slicing hunks (block insert /
  one-line delete / call-site insert), R55_OWNER present (grep
  count 2); diff vs the defective file = pure block relocation.
  (d) Smoke = the gate arms themselves: the A4_CLASSIC arm (the
  exact code path that threw) completed exit 0 — see §2.
- Staged at `gates/rebase/build-intent-rubric-sliced-r55-fixed.js`.

### 2. Seats

- Copy `scripts/build-intent-rubric.js` + `repo-dir/build-intent-rubric.js`
  := 1fc86efc…, `cmp` clean. Oracle seat
  `scripts/build-intent-rubric-classic.js` untouched (569c894f…).

### 3. Gate 2 (intent arms) + Gate 6 — PASS

Pristine DB snapshot restored before EVERY arm; runs under
gates/run-gate.sh, NODE_OPTIONS heap 6144, lane CLEAR in every
header. (One runtime restart killed the first sliced-cold attempt
mid-run; only that arm was re-run, from its start state.)

| Arm | Exit | Wall | Peak RSS |
|---|---|---|---|
| oracle classic 569c894f (banked, re-fire) | 0 | 1045.2 s | 2,615,796 KB |
| modified A4_CLASSIC=1 (1fc86efc) | 0 | 1019.5 s | 2,615,492 KB (2.62 GB) |
| modified sliced, cold (1fc86efc) | 0 | 1489.8 s | 2,584,960 KB (2.58 GB) |

- sql f95e5db4… / rows 2ec2658a… / parts 59adbdfa… / b516b2b1… /
  f9f451bd… / 737ee693… byte-identical across all three arms;
  DB meta fully equal (518,203 generated rows, rows_digest
  eac69c6b…, outcome_digest 96c8f5ef…); coverage byte-identical
  across all three (single hash b44599b3…); sliced arm log:
  `A4-COVERAGE-SLICES: cached=0 rebuilt=34`. Peak bound 3.0 GB:
  PASS both modified arms. The ReferenceError is gone.
- Gate 6 recorded: copy `scripts/windowed-builds.json` proof now
  names the CURRENT pair (classic 569c894f… / sliced 1fc86efc…)
  with the A/B hashes + meta + peaks; A1.5 re-proof record at the
  copy's `out/a4-gates-2026-11-23/A15-REPROOF.md`.

### 4. SI re-base — DONE

- Production `build-search-index.js` (78f7fd4d…) copied into the
  copy's BOTH classic seats. Confirmed one-line diff vs the old
  classic e2b04a77… (line 789 — the line carries both value
  changes: Winchester Sat 9-4 and "Google rating 5.0 from 3
  reviews").
- Sliced SI re-derived with `install-stage/a4-make-driver-si.py`
  (anchors asserted, exit 0): NEW sha 148255866b…; diff vs the
  prior sliced 32478b9b… = that same one line only; node --check
  OK; both seats twin-identical.
- Baseline re-minted from the new classic on current inputs
  (218.7 s, peak 1,153,212 KB): SI main ee77639f… (was e6254f29…),
  clusters unchanged (39a29d4d… / 7cb626fe… / 7f044af5…); manifest
  updated with a dated note.
- Gate-2 SI arm re-run against the NEW pair: sliced cold
  (si-cache cleared) exit 0, 211.4 s, peak 1,293,768 KB — all 4
  outputs byte-identical to the new classic baseline.

### 5. Gate 3 (plants) — PASS

All plants restored byte-exact after each phase; every phase ends
at baseline 756/756 OK (after the post-restore regeneration
described below).

(a) jf plant (one FAQ word in gun-safe-movers.json):
- AE sliced rebuilt=1 · SI sliced rebuilt=1 · PD sliced rebuilt=1 ·
  coverage cached=33 rebuilt=1 — only the planted page's / service's
  slices, everywhere.
- Classic controls agree: AE / SI / PD / coverage sliced==classic
  byte-identical on the planted tree (coverage planted-tree hash
  cd7a70a5… both arms).
- PD confinement: on the planted tree only
  `./gun-safe-movers/data.json` + `data.txt` differ from baseline.
(b) dataset-file plant (one word in datasets-ispm15.json, cited by
  exactly one service):
- Coverage cached=33 rebuilt=1 (service-ispm15 only), sliced==classic.
- AE rebuilt=54 (every page whose fingerprint cites that dataset
  digest), sliced==classic. PD rebuilt=21, sliced==classic, and
  ZERO PD output files changed content (rebuilds were
  fingerprint-only). SI rebuilt=0 and SI outputs == baseline
  (dataset files are not SI inputs — as designed).
(c) one-byte driver-edit plant (comment line appended to the SI
  sliced driver): SI cold-rebuilt all 368 of ITS slices only;
  AE / PD maintains rebuilt=0. Driver restored byte-exact
  (148255866b…); a post-restore SI run re-pinned the cache meta
  (rebuilt=368, outputs baseline).
- Restoration note (both (a) and (b)): jf/dataset content feeds
  row generation (page-derived rows / cert dataset digests), so
  after each plant restore the tree was returned to baseline by
  restoring the pristine DB + one unplanted intent sliced run
  (regeneration capture == oracle capture, diff-clean) + sliced
  maintains. Final cmp after each phase: 756 OK.

### 6. Gate 4 (breaks) — PASS with two documented corrections

Outputs hash-untouched in every sub-test; restores verified.
- G4.3 SI cache agg tamper (one cache file's agg.nRows +1) →
  `A4-CHANGESET-MISMATCH` thrown, exit 1, outputs untouched. PASS.
- G4.4 duplicate-URL pages.json plant → PD sliced throws
  `A4-DOUBLE-CLAIM: registry URL claimed by two page-data slices`,
  exit 1, outputs untouched. PASS.
- G4.5 PUB output drift (one byte appended to
  datasets-search-index.json) → SI classic `--check` FAIL, exit 1
  ("differs from regeneration"); the drifted file's hash was
  identical before and after the check (no writes); restored →
  CHECK OK. PASS.
- G4.1 dup-id → SI A4-DOUBLE-CLAIM: **the prep-designed plant is
  schema-impossible.** `plant-db.py --dup-id` fails at INSERT with
  `UNIQUE constraint failed: intent_query.id` — id is the table's
  PRIMARY KEY, so the double-claim precondition (one row id under
  two targets) cannot exist in the table; the guard itself is
  present in the driver (build-search-index-sliced.js line 608)
  and the SI fail-loud family is proven live by G4.3. Recorded as
  a brief/plant-design correction, not a driver defect.
- G4.2 bad-target → AE throws: **the oracle does not throw
  either.** The staged plant also failed as designed
  (UNIQUE(query_text, service_id)); re-planted schema-validly
  (new id 990000001, unique query_text, target
  no-such-page-a4plant): AE sliced absorbed the row as a 369th
  slice (rebuilt=285 — the new slice moves shared fingerprint
  components) and emitted; the AE CLASSIC on the same planted DB
  produced byte-identical output on all 10 files (the row's
  target_json carries its own page data, so no registry page is
  needed). Sliced == classic: the gate expectation was a
  prep-lane assumption, not oracle behavior. Not a defect.
- Gate-4 cleanup note: the gate-2 B2B AE baseline re-mint proved
  to have been taken on a transient DB generation state; with the
  DB at the pristine-snapshot generation, fresh classic AND
  sliced AE emits both reproduce the SEALED AE hashes
  (main b4ef43cd…). AE manifest entries were re-minted back to
  the sealed values with a dated header note; final manifest
  verify 756/756 OK.

### 7. Gate 5 — PASS

- Real proof hashes recorded in the copy's
  `scripts/slice-builds.json` for all 4 builders (each re-verified
  against the copy seats before writing): intent pair
  569c894f… / 1fc86efc…, SI pair 78f7fd4d… / 148255866b…, AE
  f7fb5895… / 0f13286b…, PD baca40e8… / 8c128347…; every proof's
  record path = `out/a4-gates-2026-11-23/GATES-REPORT.md` inside
  the copy (this report copied there; the A15-REPROOF.md record
  sits beside it).
- `install-stage/seal-py-a4-markers.patch` applied CLEAN to the
  copy's seal.py (the copy's seal.py was exactly the patch's
  anchor sha 473fa20f…; patched sha e7cb1bc9…).
- Targeted `predict.check_slice_builds(copy)`: **GREEN (pass)** —
  "4 governed sliced builder(s) proven + twin-identical +
  fallback-intact + seal-invoked … slice map dry build:
  answer-evidence 368, coverage 34, page-data 368, search-index
  368; partition + coverage clean over 368 pages / 34 services".
- Four break tests: one-byte SI driver edit → RED (1 violation);
  duplicate-URL pages.json → RED (8 violations, slice-map family);
  one seal marker removed → RED (1 violation); restore → GREEN.

### 8. Final state

- Copy rubric.db: byte-identical to `gates/rebase/rubric-pristine.db`
  (518,217 rows) — cmp verified.
- Baseline manifest: 756/756 OK (SI main re-minted ee77639f… for
  the re-base; AE entries at sealed hashes; header notes record
  both).
- No plants outstanding (jf, dataset file, pages.json, SI cache
  file, PUB drift file, DB rows — all restored byte-exact and
  verified; the one stray AE cache slice for the planted fake URL
  was removed).
- Copy seats: intent 569c894f… classic / 1fc86efc… sliced (both
  seats); SI 78f7fd4d… / 148255866b… (both seats); AE / PD pairs
  untouched; seal.py patched e7cb1bc9…; slice-builds.json +
  windowed-builds.json records updated.
- Production: ZERO writes. The two classic source files were read
  only; production hashes re-verified at the end unchanged
  (build-intent-rubric.js 569c894f…, build-search-index.js
  78f7fd4d…).
- Logs: gates/logs/fix-*.log, arm-modclassic.log (21:24 section),
  arm-sliced2.log, g3a/g3b/g3c/g4 results + per-run logs;
  captures in gates/arms/.
