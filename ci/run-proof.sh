#!/usr/bin/env bash
# Estate offload proof — runs on the GitHub Actions runner.
#
# Executes the PROVEN A3 component (ci/fingerprint.py, byte-identical
# to seal-test/suite-a/fingerprint.py, A3-VERDICT PASS 2026-11-20)
# over the tracked tree content of this repo, then a baseline select
# (bar: +0 -0 ~0, exit 0), plus node --check syntax sanity on the two
# gate scripts the repo carries.
#
# fingerprint.py roots at a WORKSPACE and walks its four estate
# subtrees; this repo is the the-flat-rate-machine subtree, so the
# checkout is staged in that shape (git archive of HEAD — the exact
# bytes push-mirrors keeps in parity). The other three subtrees are
# not in this repo and are absent on the runner; the store records
# exactly what was walked, and this script FAILS if the build
# fingerprinted zero files (a hollow green is not a proof).
#
# Results land in ci-results/, which the workflow commits back to
# this branch and uploads as an artifact — results return over git,
# no API token needed.
set -u
cd "$(dirname "$0")/.."
ROOT="$PWD"
RES="$ROOT/ci-results"
mkdir -p "$RES"
WS="$(mktemp -d)/ws"
TREE="$WS/the-flat-rate-machine"
mkdir -p "$TREE"
git archive HEAD | tar -x -C "$TREE"

{
  echo "utc: $(date -u +%FT%TZ)"
  echo "nproc: $(nproc)"
  grep -m1 "model name" /proc/cpuinfo || true
  free -m | head -2 || true
  echo "node: $(node --version 2>/dev/null || echo none)"
  echo "python: $(python3 --version 2>&1)"
  echo "files_in_tree: $(find "$TREE" -type f | wc -l | tr -d ' ')"
  echo "tree_bytes: $(du -sb "$TREE" | cut -f1)"
} > "$RES/runner-facts.txt" 2>&1

t0=$(date +%s)
python3 ci/fingerprint.py build --root "$WS" --store "$RES/fingerprint-store.json" \
  > "$RES/fingerprint-build.log" 2>&1
rc_build=$?
t1=$(date +%s)
python3 ci/fingerprint.py select --root "$WS" --store "$RES/fingerprint-store.json" \
  --out "$RES/select-baseline.json" > "$RES/fingerprint-select.log" 2>&1
rc_select=$?
t2=$(date +%s)
node --check verify.js; rc_vjs=$?
node --check scripts/check-twins.js; rc_tw=$?
t3=$(date +%s)

python3 - "$RES/results.json" "$RES/fingerprint-store.json" \
  "$rc_build" "$rc_select" "$rc_vjs" "$rc_tw" \
  "$((t1-t0))" "$((t2-t1))" "$((t3-t0))" <<'PY'
import json, sys
out, store_path = sys.argv[1], sys.argv[2]
rcb, rcs, rcv, rct = (int(x) for x in sys.argv[3:7])
db, ds, dt = (int(x) for x in sys.argv[7:10])
try:
    store = json.load(open(store_path))
    nfiles = len(store.get("files", {}))
    nblocks = sum(len(f.get("blocks", {})) for f in store.get("files", {}).values())
except Exception:
    nfiles, nblocks = -1, -1
json.dump({
  "proof": "A3 fingerprint build+select over the machine repo's tracked content, staged as the the-flat-rate-machine workspace subtree (git archive of HEAD)",
  "files_fingerprinted": nfiles,
  "blocks_fingerprinted": nblocks,
  "fingerprint_build_seconds": db,
  "fingerprint_select_seconds": ds,
  "total_seconds": dt,
  "exit_codes": {
    "fingerprint_build": rcb,
    "fingerprint_select_baseline": rcs,
    "node_check_verify_js": rcv,
    "node_check_check_twins_js": rct
  },
  "green": rcb == 0 and rcs == 0 and rcv == 0 and rct == 0 and nfiles > 0
}, open(out, "w"), indent=1)
PY
cat "$RES/results.json"
# The step itself fails unless the components passed AND the build
# actually fingerprinted files.
[ "$rc_build" = 0 ] && [ "$rc_select" = 0 ] && [ "$rc_vjs" = 0 ] && [ "$rc_tw" = 0 ] \
  && python3 -c "import json,sys; sys.exit(0 if json.load(open('$RES/results.json'))['files_fingerprinted'] > 0 else 1)"
