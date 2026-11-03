#!/usr/bin/env python3
"""push-mirrors.py -- S3 git-push route (Speed Batch S3, correction 1).

Replaces the retired legacy transport (chunked `github push-files` calls +
browser web uploads for over-ceiling files) with: persistent local clones +
ONE commit / ONE push per repo per batch.

Repos:
  ai      TheFlatRateMovers/theflatratemovers-ai   clone ~/workspace/git-mirrors/ai
  machine TheFlatRateMovers/the-flat-rate-machine clone ~/workspace/git-mirrors/machine

Transports, in order:
  (a) `git push` when GH_PUSH_TOKEN is set in the environment. The token is
      supplied to git only through a temporary GIT_ASKPASS script that echoes
      the env var; it never appears in argv, files, or logs.
  (b) Connector one-shot: ONE `/opt/hatch/bin/github push-files` call per repo
      carrying the whole delta (NUL-delimited paths file with trailing NUL,
      --source-dir = a staging dir mirroring repo-relative paths).
      NOTE: push-files has no deletion semantics; if the delta contains a
      deletion and transport (a) is unavailable, the push for that repo is
      aborted and reported rather than silently dropping the deletion.

Safety gates:
  * GIST GUARD (ai only): data/entity-graph.json in the ai repo is a
    Gist-based copy, blob SHA cda897e61319a0f52172ef1365402e4d7179cddf. Its
    bytes DIFFER from the site's entity-graph.json. The path is excluded
    from every sync rule, and its blob SHA is asserted before and after
    any sync/push. Any mismatch aborts.
  * KEY GREP: every changed file is scanned for actual private-key
    material — PEM private-key headers and the signing key's filename
    (the Ed25519 private key lives only under
    ~/workspace/theflatratemovers/keys/). Any hit aborts. The patterns
    are assembled from fragments at runtime (see KEY_PATTERNS): this
    file necessarily names what it scans for, and assembling them
    keeps the scanner's own source from matching — a real key file
    contains the contiguous literals; this source never does. (First
    S3 close, 2026-11-03: the original bare-word markers aborted the
    machine push on this file itself — a fail-closed false positive,
    fixed by targeting key MATERIAL, not the words.)

Sync maps (see MAPS below) were derived from evidence, in this order:
  1. The two launch batches' work dirs (push-sets.json / push-sets-2.json /
     paths-*.txt under batch-launch-announcement-2026-11-03/work and
     batch-launch-gunsafe-2026-11-03/work) -- the authoritative per-batch
     repo-relative path <-> estate source pairs.
  2. Clone-parity tracked-set rules: for classes where EVERY tracked file
     in the clone is byte-identical to a namesake estate source today
     (verified 2026-11-03 at seal 9400e638), the rule syncs the tracked
     set, so a future batch's delta is exactly the tracked files whose
     sources changed. New files enter a tracked-set class only via an
     explicit launch-style pair (file/glob rule or --extra-map).
  Classes tested and REJECTED (parity-falsified, see report): machine
  out/** (40 tracked files differ from local out/, 8 sources missing --
  the clone's out/ is a snapshot, not a per-batch mirror).

Usage:
  push-mirrors.py --dry-run [--message MSG] [--repo ai|machine|all]
  push-mirrors.py --message MSG [--repo ...] [--extra-map REL=ABS_SRC ...]
  push-mirrors.py --print-map
Exit codes: 0 ok / NO-OP; 1 push or IO failure; 2 safety abort
(gist guard, key grep, clone divergence).
"""
import argparse, fnmatch, json, os, pathlib, shutil, subprocess, sys, tempfile

HOME = pathlib.Path.home()
PUB = HOME / "workspace/the-flat-rate-movers-pages/public"
MACH = HOME / "workspace/the-flat-rate-machine"
REPO_DIR = MACH / "repo-dir"

GIST_PATH = "data/entity-graph.json"
GIST_BLOB = "cda897e61319a0f52172ef1365402e4d7179cddf"
# Key-material patterns, assembled from fragments (see KEY GREP above).
_PK = b"PRIV" + b"ATE KEY"
KEY_PATTERNS = [
    b"-----BEGIN " + _PK + b"-----",
    b"-----BEGIN OPENSSH " + _PK + b"-----",
    b"-----BEGIN EC " + _PK + b"-----",
    b"-----BEGIN RSA " + _PK + b"-----",
    b"ed25519-signing" + b"-key",
]
GH_CLI = "/opt/hatch/bin/github"
OWNER = "TheFlatRateMovers"

# --- Sync maps -------------------------------------------------------------
# Rule kinds:
#   file:    (repo_rel, abs_source)                       [launch-evidenced]
#   glob:    (src_dir, pattern, dest_prefix)              forward glob from source
#   tracked: (dest_prefix, src_template, [exclude_globs]) sync only paths already
#            tracked in the clone under dest_prefix; src_template uses {rel}
#            (repo-relative path) or {base} (basename).
MAPS = {
    "ai": {
        "repo": "theflatratemovers-ai",
        "clone": HOME / "workspace/git-mirrors/ai",
        "rules": [
            # Launch-evidenced explicit pairs (push-sets.json, both launches).
            ("file", "ai-sitemap.json", PUB / "ai-sitemap.json"),
            ("file", "llms.txt", PUB / "llms.txt"),
            ("file", "llms-full.txt", PUB / "llms-full.txt"),
            ("file", "the-flat-rate-movers-data.txt", PUB / "the-flat-rate-movers-data.txt"),
            ("file", "data/ai-master-index.json", PUB / "ai-master-index.json"),
            ("file", "data/ai-master-index.jws", PUB / "ai-master-index.jws"),
            ("file", "data/best-json-entity-graph.json", PUB / "best-json-entity-graph.json"),
            # Launch-evidenced class rule: every datasets-*.json published in
            # PUB ships to ai data/ under its own name (38-41 files per launch,
            # incl. the oversize datasets-answer-evidence.json from
            # push-sets-2.json / flagged-ai.json). PUB set == clone set today.
            ("glob", PUB, "datasets-*.json", "data/"),
            # Clone-parity tracked sets (all byte-equal at seal 9400e638):
            # data/*.json from the PUB namesake (master index, best graph,
            # dataset-ports, verification reports); schemas/*.json from the
            # PUB-root namesake (per-page + dataset-node JSONs; the 5
            # *.schema.json files have no PUB namesake and are repo-native);
            # root *.json from the PUB namesake (ai-catalog.json).
            ("tracked", "data/", str(PUB / "{base}"), ["entity-graph.json", "datasets-*.json"]),
            ("tracked", "schemas/", str(PUB / "{base}"), ["*.schema.json"]),
            ("tracked", "", str(PUB / "{base}"), []),  # root: *.json only, filtered below
        ],
        # NEVER synced: the Gist copy (guarded), plus repo-native trees with
        # no estate namesake source (models/, protocols/, datasets/,
        # identity/, methodology/, terminology/, territory/,
        # signing-keys.json, data/*-full.json, data/footprint.json,
        # data/capabilities-matrix.json).
        "exclude": [GIST_PATH],
        "tracked_root_suffix": ".json",
    },
    "machine": {
        "repo": "the-flat-rate-machine",
        "clone": HOME / "workspace/git-mirrors/machine",
        "rules": [
            # Launch-evidenced explicit pairs (push-sets.json, both launches;
            # sources are the machine working tree / repo-dir staging).
            ("file", "code/pages-functions/_middleware.js", REPO_DIR / "_middleware.js"),
            ("file", "code/pages-functions/head-data.js", REPO_DIR / "head-data.js"),
            ("file", "code/site-shell/index.html", REPO_DIR / "index.html"),
            ("file", "verify.js", MACH / "verify.js"),
            ("file", "scripts/build-intent-rubric.js", MACH / "scripts/build-intent-rubric.js"),
            ("file", "scripts/route-assets/main.js", MACH / "scripts/route-assets/main.js"),
            ("file", "data/best-json-entity-graph.json", MACH / "data/best-json-entity-graph.json"),
            ("file", "data/entity-graph.json", MACH / "data/entity-graph.json"),
            ("file", "data/lastmod-ledger.json", MACH / "data/lastmod-ledger.json"),
            ("file", "data/news-formula.json", MACH / "data/news-formula.json"),
            ("file", "data/pages.json", MACH / "data/pages.json"),
            ("file", "data/services.json", MACH / "data/services.json"),
            # Clone-parity tracked sets (all byte-equal at seal 9400e638):
            # data/* from machine data/ namesake (adds corridors, locations,
            # ports, descriptions, panel-observations, service-area.geojson);
            # scripts/* from the same relative path in the machine tree;
            # code/* from repo-dir basenames (quote.js, src-index.js ->
            # api-worker, index.js -> quote-worker, index.html -> site-shell);
            # tools/* from repo-dir basenames (digest-index.py, sign-index.py,
            # keygen.py, ...). tools/build-jwks.py is excluded: its only
            # source is a past batch dir (out/batchP1-provenance/tools/).
            ("tracked", "data/", str(MACH / "data/{base}"), []),
            ("tracked", "scripts/", str(MACH / "{rel}"), []),
            ("tracked", "code/", str(REPO_DIR / "{base}"),
             ["code/pages-functions/_middleware.js", "code/pages-functions/head-data.js",
              "code/site-shell/index.html"]),
            ("tracked", "tools/", str(REPO_DIR / "{base}"), ["tools/build-jwks.py"]),
            ("file", "paths.json", MACH / "paths.json"),
            ("file", "DATA_MODEL.md", MACH / "DATA_MODEL.md"),
        ],
        # NOT synced: out/** (parity-falsified snapshot, see docstring),
        # LICENSE / README.md (repo-native; no machine-tree namesake source
        # for LICENSE, README differs).
        "exclude": [],
        "tracked_root_suffix": None,
    },
}


def run(cmd, cwd=None, env=None, capture=True):
    return subprocess.run(cmd, cwd=cwd, env=env, text=True,
                          capture_output=capture)


def git(clone, *args, env=None):
    return run(["git", "-C", str(clone), *args], env=env)


def head_sha(clone):
    return git(clone, "rev-parse", "HEAD").stdout.strip()


def blob_sha(clone, refpath):
    r = git(clone, "rev-parse", f"HEAD:{refpath}")
    return r.stdout.strip() if r.returncode == 0 else None


def worktree_blob_sha(clone, rel):
    p = clone / rel
    if not p.exists():
        return None
    return run(["git", "hash-object", str(p)]).stdout.strip()


def gist_assert(clone, stage):
    b = blob_sha(clone, GIST_PATH)
    w = worktree_blob_sha(clone, GIST_PATH)
    ok = (b == GIST_BLOB and w == GIST_BLOB)
    print(f"  gist-guard [{stage}]: HEAD blob={b} worktree blob={w} "
          f"expected={GIST_BLOB} -> {'OK' if ok else 'FAIL'}")
    if not ok:
        print("ABORT: gist guard failed for ai data/entity-graph.json", file=sys.stderr)
        sys.exit(2)
    return ok


def tracked_files(clone):
    r = git(clone, "ls-files")
    return r.stdout.splitlines() if r.returncode == 0 else []


def resolve_pairs(spec, clone, extra_maps):
    """Return ordered {repo_rel: abs_source_path} for this repo."""
    pairs = {}
    tracked = None
    for rule in spec["rules"]:
        kind = rule[0]
        if kind == "file":
            pairs[rule[1]] = pathlib.Path(rule[2])
        elif kind == "glob":
            _, src_dir, pattern, dest_prefix = rule
            for src in sorted(pathlib.Path(src_dir).glob(pattern)):
                pairs[dest_prefix + src.name] = src
        elif kind == "tracked":
            _, prefix, template, excludes = rule
            if tracked is None:
                tracked = tracked_files(clone)
            for rel in tracked:
                if prefix and not rel.startswith(prefix):
                    continue
                if not prefix:  # repo root only, optional suffix filter
                    if "/" in rel:
                        continue
                    suf = spec.get("tracked_root_suffix")
                    if suf and not rel.endswith(suf):
                        continue
                if any(fnmatch.fnmatch(rel, e) or fnmatch.fnmatch(pathlib.Path(rel).name, e)
                       for e in excludes):
                    continue
                src = pathlib.Path(template.format(rel=rel, base=pathlib.Path(rel).name))
                if src.exists():
                    pairs[rel] = src
                # tracked file with no source: left alone (repo-native or a
                # class this map does not claim); vanished-source deletions
                # are detected only for file/glob pairs and claimed classes.
    for rel, src in extra_maps:
        pairs[rel] = pathlib.Path(src)
    for rel in spec["exclude"]:
        pairs.pop(rel, None)
    return pairs


def compute_delta(spec, clone, pairs):
    """changed = [(rel, src, size, kind)] kind in add|modify|delete."""
    changed, missing_src = [], []
    for rel, src in sorted(pairs.items()):
        dest = clone / rel
        if not src.exists():
            if dest.exists():
                changed.append((rel, None, 0, "delete"))
                missing_src.append(rel)
            continue
        data = src.read_bytes()
        if not dest.exists():
            changed.append((rel, src, len(data), "add"))
        elif dest.read_bytes() != data:
            changed.append((rel, src, len(data), "modify"))
    return changed, missing_src


def key_grep(changed):
    hits = []
    for rel, src, _size, kind in changed:
        if kind == "delete" or src is None:
            continue
        data = pathlib.Path(src).read_bytes()
        for marker in KEY_PATTERNS:
            if marker in data:
                hits.append((rel, marker.decode()))
    print(f"  key-grep: scanned {sum(1 for c in changed if c[3] != 'delete')} changed files, "
          f"{len(KEY_PATTERNS)} key-material patterns -> "
          f"{'CLEAN' if not hits else 'HITS: ' + str(hits)}")
    if hits:
        print("ABORT: private-key material in delta", file=sys.stderr)
        sys.exit(2)
    return hits


def fetch_ff(clone, dry_run, env):
    """Fetch and fast-forward-only update. Returns status string."""
    r = git(clone, "fetch", "origin", "main", env=env)
    if r.returncode != 0:
        msg = (r.stderr or "").strip().splitlines()[-1:] or ["fetch failed"]
        print(f"  fetch: FAILED ({msg[0]}) -- continuing on local refs")
        return "fetch-failed"
    local = head_sha(clone)
    remote_r = git(clone, "rev-parse", "origin/main")
    if remote_r.returncode != 0:
        return "no-remote-ref"
    remote = remote_r.stdout.strip()
    if local == remote:
        return "up-to-date"
    ahead = git(clone, "merge-base", "--is-ancestor", remote, local)
    if ahead.returncode == 0:  # local strictly ahead: pending commit(s)
        return "ahead"
    anc = git(clone, "merge-base", "--is-ancestor", local, remote)
    if anc.returncode == 0:  # local strictly behind: ff possible
        if dry_run:
            print(f"  fetch: clone behind origin/main ({local[:8]} -> {remote[:8]}); "
                  "dry-run does not fast-forward")
            return "behind"
        git(clone, "merge", "--ff-only", "origin/main")
        return "fast-forwarded"
    print(f"ABORT: clone diverges from origin/main (local {local}, remote {remote})",
          file=sys.stderr)
    sys.exit(2)


def askpass_env():
    """Env for git push with GH_PUSH_TOKEN via a temporary askpass script."""
    fd, path = tempfile.mkstemp(prefix="askpass-", text=True)
    with os.fdopen(fd, "w") as f:
        f.write("#!/bin/sh\ncase \"$1\" in\n  *sername*) printf 'x-access-token' ;;\n"
                "  *) printf '%s' \"$GH_PUSH_TOKEN\" ;;\nesac\n")
    os.chmod(path, 0o700)
    env = dict(os.environ, GIT_ASKPASS=path, GIT_TERMINAL_PROMPT="0")
    return env, path


def push_git(clone):
    env, ask = askpass_env()
    try:
        r = git(clone, "push", "origin", "main", env=env)
    finally:
        os.unlink(ask)
    print("  push (git, transport a):", "OK" if r.returncode == 0 else "FAILED")
    if r.returncode != 0:
        print((r.stderr or "")[-2000:], file=sys.stderr)
    return r.returncode == 0


def push_connector(spec, changed, message):
    """One push-files call carrying the whole delta via a staging dir."""
    staging = pathlib.Path(tempfile.mkdtemp(prefix="push-staging-"))
    paths = []
    for rel, src, _s, _k in changed:
        dst = staging / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dst)
        paths.append(rel)
    paths_file = staging / ".paths-nul"
    paths_file.write_bytes(("\0".join(sorted(paths)) + "\0").encode())
    r = run([GH_CLI, "push-files", "--owner", OWNER, "--repo", spec["repo"],
             "--branch", "main", "--message", message,
             "--source-dir", str(staging), "--paths-file", str(paths_file)],
            capture=True)
    print("  push (connector one-shot, transport b):",
          "OK" if r.returncode == 0 else "FAILED")
    if r.returncode != 0:
        print(((r.stdout or "") + (r.stderr or ""))[-2000:], file=sys.stderr)
    return r.returncode == 0


def reconcile_clone(clone):
    """After a transport-(b) push the server holds its OWN commit for
    the same tree (different SHA/parent). Fetch, prove the remote tree
    identical to the local HEAD tree, then reset the clone onto
    origin/main so the next run fast-forwards cleanly. A tree mismatch
    aborts — the push did not land as expected. (Found at the S3 close:
    without this, every (b) push left the clone 'diverged' for the
    next run's fetch_ff.)"""
    git(clone, "fetch", "origin", "main")
    lt = git(clone, "rev-parse", "HEAD^{tree}").stdout.strip()
    rt_r = git(clone, "rev-parse", "origin/main^{tree}")
    if rt_r.returncode != 0:
        print("ABORT: cannot read origin/main tree after push",
              file=sys.stderr)
        sys.exit(2)
    if lt != rt_r.stdout.strip():
        print(f"ABORT: post-push tree mismatch (local {lt}, "
              f"remote {rt_r.stdout.strip()})", file=sys.stderr)
        sys.exit(2)
    git(clone, "reset", "--hard", "origin/main")
    print(f"  reconciled: clone reset to origin/main {head_sha(clone)} "
          f"(trees identical)")
    return True


def process_repo(name, spec, args, extra_maps):
    clone = spec["clone"]
    print(f"== {name} ({OWNER}/{spec['repo']}) clone={clone}")
    print(f"  HEAD before: {head_sha(clone)}")
    is_ai = name == "ai"
    if is_ai:
        gist_assert(clone, "pre-sync")
    token = os.environ.get("GH_PUSH_TOKEN")
    transport = "a (git push, GH_PUSH_TOKEN)" if token else "b (connector push-files one-shot)"
    if not args.no_fetch:
        env = None
        ask = None
        if token:
            env, ask = askpass_env()
        try:
            fetch_ff(clone, args.dry_run, env)
        finally:
            if ask:
                os.unlink(ask)
    # Crash recovery (S3 close, 2026-11-03): a run that dies between
    # commit and push leaves the clone strictly ahead of origin/main.
    # If the estate sources still match the committed worktree exactly
    # (an empty fresh delta), push the pending commit — never report a
    # false NO-OP over an unpushed commit. A fresh delta on top of a
    # pending commit is a mixed state and aborts.
    pend_r = git(clone, "rev-list", "--count", "origin/main..HEAD")
    n_pending = int(pend_r.stdout.strip() or 0) \
        if pend_r.returncode == 0 else 0
    if n_pending and not args.dry_run:
        pairs0 = resolve_pairs(spec, clone, extra_maps)
        changed0, _ = compute_delta(spec, clone, pairs0)
        if changed0:
            print("ABORT: pending unpushed commit(s) AND a fresh "
                  "delta — mixed state, resolve manually",
                  file=sys.stderr)
            sys.exit(2)
        print(f"  recovery: {n_pending} pending commit(s), sources "
              f"match the committed tree; pushing the pending commit")
        diff = git(clone, "diff", "--name-status", "origin/main",
                   "HEAD")
        changed_p = []
        for line in diff.stdout.strip().splitlines():
            if not line.strip():
                continue
            kind, rel = line.split("\t", 1)
            if kind.startswith("D"):
                print("ABORT: pending commit contains deletions, "
                      "which transport (b) cannot express",
                      file=sys.stderr)
                sys.exit(2)
            p = clone / rel
            changed_p.append((rel, str(p), p.stat().st_size,
                              "add" if kind.startswith("A")
                              else "modify"))
        key_grep(changed_p)
        if is_ai and any(c[0] == GIST_PATH for c in changed_p):
            print("ABORT: gist path in pending commit", file=sys.stderr)
            sys.exit(2)
        if token:
            ok = push_git(clone)
        else:
            ok = push_connector(spec, changed_p, args.message)
            if ok:
                ok = reconcile_clone(clone)
        print(f"  transport used: {transport}")
        return 0 if ok else 1
    if n_pending and args.dry_run:
        print(f"  note: {n_pending} pending unpushed commit(s) in clone")
    pairs = resolve_pairs(spec, clone, extra_maps)
    changed, missing_src = compute_delta(spec, clone, pairs)
    for rel in missing_src:
        print(f"  REPORT: mapped source vanished, deletion staged: {rel}")
    total = sum(c[2] for c in changed)
    if args.dry_run:
        print(f"  transport that WOULD be used: {transport}")
    key_grep(changed)
    if is_ai and any(c[0] == GIST_PATH for c in changed):
        print("ABORT: gist path entered the delta", file=sys.stderr)
        sys.exit(2)
    if not changed:
        print(f"  NO-OP: 0 files changed ({len(pairs)} mapped paths checked)")
        if is_ai:
            gist_assert(clone, "post-check")
        return 0
    print(f"  delta: {len(changed)} files, {total} bytes")
    for rel, _s, size, kind in changed:
        print(f"    {kind:6s} {size:>10d}  {rel}")
    if args.dry_run:
        print("  dry-run: no sync, commit, or push performed")
        return 0
    # Sync byte copies into the working tree; stage deletions.
    for rel, src, _s, kind in changed:
        dest = clone / rel
        if kind == "delete":
            dest.unlink()
        else:
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, dest)
    if is_ai:
        gist_assert(clone, "post-sync")
    git(clone, "add", "--", *[c[0] for c in changed])
    ident = []
    if git(clone, "config", "user.email").returncode != 0:
        ident = ["-c", "user.name=The Flat Rate Movers",
                 "-c", "user.email=ratemovers@gmail.com"]
    r = run(["git", "-C", str(clone), *ident, "commit", "--message", args.message])
    if r.returncode != 0:
        print("commit FAILED\n" + (r.stdout or "") + (r.stderr or ""), file=sys.stderr)
        return 1
    print(f"  commit: {head_sha(clone)} (one commit, {len(changed)} files)")
    deletions = [c for c in changed if c[3] == "delete"]
    if token:
        ok = push_git(clone)
    elif deletions:
        print("  push SKIPPED: delta contains deletions, which connector "
              "push-files cannot express; use transport (a). Deletions are "
              "committed locally and reported here.", file=sys.stderr)
        ok = False
    else:
        ok = push_connector(spec, changed, args.message)
        if ok:
            ok = reconcile_clone(clone)
    if is_ai and ok and token:
        gist_assert(clone, "post-push")
    print(f"  transport used: {transport}")
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--message", default="Mirror sync")
    ap.add_argument("--repo", choices=["ai", "machine", "all"], default="all")
    ap.add_argument("--no-fetch", action="store_true",
                    help="skip fetch/ff update (offline diagnosis)")
    ap.add_argument("--extra-map", action="append", default=[],
                    metavar="REL=ABS_SRC",
                    help="explicit additional pair for the selected repo "
                         "(e.g. a new post's schemas/<slug>.json)")
    ap.add_argument("--print-map", action="store_true")
    args = ap.parse_args()
    if args.print_map:
        out = {}
        for name, spec in MAPS.items():
            out[name] = {"repo": f"{OWNER}/{spec['repo']}", "clone": str(spec["clone"]),
                         "exclude": spec["exclude"],
                         "rules": [[str(x) for x in r] for r in spec["rules"]]}
        print(json.dumps(out, indent=1))
        return 0
    extra = []
    for item in args.extra_map:
        rel, _, src = item.partition("=")
        if not src:
            ap.error(f"--extra-map needs REL=ABS_SRC, got {item!r}")
        extra.append((rel, src))
    names = ["ai", "machine"] if args.repo == "all" else [args.repo]
    rc = 0
    for name in names:
        rc = process_repo(name, MAPS[name], args, extra) or rc
    return rc


if __name__ == "__main__":
    sys.exit(main())
