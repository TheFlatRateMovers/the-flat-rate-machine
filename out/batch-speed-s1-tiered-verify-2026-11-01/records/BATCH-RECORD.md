# BATCH RECORD — Speed Program S1: Tiered Verification, 2026-11-01

Program: Machine speed program (Henry approved 2026-11-01 — fixes that
create speed and free time/space ARE the solution). S1 of 4, in payoff
order. Estate at start: seal 9852fdae…, 497 distributions, 212 pages,
29 services, suite 145 checks (parent run 145/145, 2026-11-01 ~17:02 EST).

## STEP 0 — Baseline measurement (before any design decision)

Method: the unmodified full suite run under a per-line timestamp
wrapper (gap before each output line attributed to that check),
2026-11-01. Run green: 145/145 PASS, exit 0.

- **Full run wall time: 128,781 ms (2m 08.8s).**
- **P-3 (all site-served distribution digests vs live bytes): 77,552 ms
  — 60.2% of the run.** 470 sequential live fetches.
- **P-6 (repo-served digests vs GitHub raw): 11,716 ms — 9.1%.** 27
  fetches incl. the 23 MB site shell.
- Provenance family P-1..P-6 total: 89,752 ms (69.7%).
- The 31 live-only checks (classification below) account for
  **97,784 ms (75.9%)** of attributed check time.
- The 114 disk-evidence checks account for 30,810 ms (23.9%); the
  largest local costs are generator byte-identity re-runs (SI-2
  9,326 ms; AE-2 3,192 ms; CP-5 2,110 ms; I-1 1,231 ms), the machinery
  helper (4,213 ms at M-1), and corpus scans (DC 3,014 ms; D-2
  2,232 ms; PS 3,302 ms).
- Conclusion: waiting on the network is ~3/4 of every iteration's
  verify cost. A local tier that runs the 114 disk checks and skips
  the 31 live checks by name should cut an iteration's verify to
  roughly a quarter of the full run, with the full run kept as the
  only closing gate.

## Classification of the 145 checks (by evidence, read from the code)

LIVE-ONLY (31) — evidence is the served estate; skipped by name in
--local mode:
§2 live sitemap fetched; every pages.json URL is in the live sitemap;
every live sitemap URL is a registry page or a published dataset file;
live sitemap URL count matches registry + dataset files ·
§3 data service-area.geojson matches live GeoJSON ·
§10 old container .json content-type proof; Martinsburg transloading
.json content-type proof ·
P-1, P-2, P-3, P-4, P-5, P-6 (served JWKS / served signed index /
served bytes; P-5 mixes the served index with the local file listing,
so it is live by the no-split rule) ·
S-3, S-4, S-5 (served route heads, served sitemap, served robots.txt) ·
I-3, I-5 (served signed index; live dataset document) ·
D-1 (served signed index), D-5 (live dataset + landing) ·
W-1..W-5 (served home + quote documents) ·
L-1..L-4 (served llms-full.txt / llms.txt / served index) ·
SI-3, AE-3 (served signed index digests).

LOCAL (114) — evidence entirely on disk: §§1, 3(first), 4–8, 10
(staged + rubric.db), 12 (S-1, S-2, S-6), 13 (I-1, I-2, I-4), 13c I-10,
13b I-6..I-9, 14 (D-2, D-3, D-4), 17 M-1..M-5, 18 (SI-1, SI-2, SI-4),
19 (AE-1, AE-2, AE-4), 20 LG-1..LG-4, 21 DC-1..DC-5, 22 CP-1..CP-5,
23 AR-1..AR-7, 24 PS-1..PS-4, 9 guardrails. All generator --check
re-runs used by these checks were grep-verified to make no network
calls (the one https string in build-crawl-presence.js is a baked
data literal, the recorded signal observation).

Accounting identity the build must prove: 145 = 114 run + 31 skipped.

## Design

`node verify.js --local`:
- A `LOCAL` flag + `skipLive(name)` helper beside `check()`. Skipped
  checks print `SKIP  <name> — live-only …` and are counted; they
  never enter the pass/fail results.
- Each live fetch site is guarded so no network call executes in
  local mode: whole-section guards for §§11/15/16 (uniformly live),
  block guards for §2, §3, §10, §12 S-4/S-5, and fetch-null + check
  guards for §12 S-3, §13 I-3/I-5, §14 D-1/D-5, §18 SI-3, §19 AE-3.
- No check is weakened, deleted, re-scoped, or renumbered; no check's
  logic is split — a check that mixes local and live evidence is
  classified live whole. Full mode's code paths and its 145-check
  count are byte-for-byte the same behavior; the summary block prints
  the original full-mode text when not in local mode.
- Local-mode summary states the run/skipped accounting and, in plain
  words, that local mode is NOT the closing gate.

## Usage rule (for every future batch)

Build iterations run `node verify.js --local`. A batch closes only on
a full `node verify.js` run, green, plus the parent's own full run.
Local green never closes anything.

## Build results

Implementation (verify.js only; both copies — root + repo-dir —
kept byte-identical, new SHA-256 abe8eea3…, 182,156 B):
- Header documents the --local tier; a `LOCAL` flag + `skipLive()`
  helper sits beside `check()`. Guards: whole-section for §§11/15/16;
  block guards for §2, §3, §10, §12 S-4/S-5; fetch-null + check
  guards for §12 S-3, §13 I-3/I-5, §14 D-1/D-5, §18 SI-3, §19 AE-3.
- Structural audit of the edit: `check('` call count identical
  before/after (167 = 145 checks + fallback evaluations); skipLive
  call sites = 31; node --check clean.
- One edit initially landed in the wrong block (§2's try matched the
  S-4 pattern): caught on immediate re-read, removed from §2 and
  re-applied at S-4 with its comment line as context; syntax and the
  §2/S-4 regions re-verified before proceeding.

Proof:
- (a) `node verify.js --local` on the sealed estate: exit 0,
  **114 PASS, 31 SKIP, 0 FAIL**. The SKIP list and the PASS list were
  machine-compared against the Step 0 baseline census: both match
  name-for-name, in order. 145 = 114 run + 31 skipped.
- (b) Local-mode wall time: **35,122 ms** vs the 128,781 ms baseline
  — 3.7× faster per iteration (the local checks' attributed baseline
  was 30,810 ms; the delta is startup + the machinery helper).
- (c) The batch closes on a full run — see the closing section below.

Reseal (digest → sign, the standing loop): fixpoint in two identical
rounds — **final seal SHA-256
4e96f02e171ba462058d71085d9c722517611320e0efa2a2066434edd4ddebdf,
497 distributions, 0 gaps**. The ONLY entry changed vs the pre-batch
seal (9852fdae…) is verify.js itself (abe8eea3…, 182,156 B): no
dataset, route document, or root file moved. Deploy-tree delta is
exactly ai-master-index.json + ai-master-index.jws (installed into
public/ by the loop); no route document changed.

Pages deploy + API refresh/redeploy + pushes + the closing full run
are recorded in the closing section below.
