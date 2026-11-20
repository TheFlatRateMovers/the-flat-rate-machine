#!/usr/bin/env bash
# Estate offload proof — runs on the GitHub Actions runner.
#
# Executes the PROVEN A3 component (ci/fingerprint.py, byte-identical
# to seal-test/suite-a/fingerprint.py, A3-VERDICT PASS 2026-11-20)
# over the tracked tree content of this repo (git archive of HEAD —
# the exact bytes push-mirrors keeps in parity), then a baseline
# select (bar: +0 -0 ~0, exit 0), plus node --check syntax sanity on
# the two gate scripts the repo carries. Every step is timed and the
# results land in ci-results/, which the workflow commits back to
# this branch and uploads as an artifact — results return over git,
# no API token needed.
set -u
cd "$(dirname "$0")/.."
ROOT="$PWD"
RES="$ROOT/ci-results"
mkdir -p "$RES"
TREE="$(mktemp -d)/tree"
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
python3 ci/fingerprint.py build --root "$TREE" --store "$RES/fingerprint-store.json" \
  > "$RES/fingerprint-build.log" 2>&1
rc_build=$?
t1=$(date +%s)
python3 ci/fingerprint.py select --root "$TREE" --store "$RES/fingerprint-store.json" \
  --out "$RES/select-baseline.json" > "$RES/fingerprint-select.log" 2>&1
rc_select=$?
t2=$(date +%s)
node --check verify.js; rc_vjs=$?
node --check scripts/check-twins.js; rc_tw=$?
t3=$(date +%s)

python3 - "$RES/results.json" "$rc_build" "$rc_select" "$rc_vjs" "$rc_tw" \
  "$((t1-t0))" "$((t2-t1))" "$((t3-t0))" <<'PY'
import json, sys
out = sys.argv[1]
rcb, rcs, rcv, rct = (int(x) for x in sys.argv[2:6])
db, ds, dt = (int(x) for x in sys.argv[6:9])
json.dump({
  "proof": "A3 fingerprint build+select over tracked tree content (git archive of HEAD)",
  "fingerprint_build_seconds": db,
  "fingerprint_select_seconds": ds,
  "total_seconds": dt,
  "exit_codes": {
    "fingerprint_build": rcb,
    "fingerprint_select_baseline": rcs,
    "node_check_verify_js": rcv,
    "node_check_check_twins_js": rct
  },
  "green": rcb == 0 and rcs == 0 and rcv == 0 and rct == 0
}, open(out, "w"), indent=1)
PY
cat "$RES/results.json"
# The step itself fails only if the measured components failed.
[ "$rc_build" = 0 ] && [ "$rc_select" = 0 ] && [ "$rc_vjs" = 0 ] && [ "$rc_tw" = 0 ]
