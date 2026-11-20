#!/usr/bin/env python3
"""fingerprint.py — Component A3: content fingerprints (rig build).

Builds a content-addressed fingerprint store for a rig tree and,
given a store, emits the exact changed-slice manifest a future
seal consumes to rebuild only what changed (A-DESIGN §3).

Granularity, per the design's two projections:
  - EVERY regular file: whole-file SHA-256 (bytes are content
    until a projection proves a region unconsumed).
  - HTML files: block fingerprints for the regions content
    consumers actually read —
      * every <script type="application/ld+json"> block
        (key ld[<i>], label = first @id/@type), and
      * every page div <div id="page-..."> span, found by a
        balanced <div> depth scan (key div#<id>).
    Plus proj = the design's HTML projection hash (comments
    stripped, <style> bodies stripped, classic script elements
    removed whole — the beacon is a src-only classic tag, so
    body-stripping alone would keep its URL; consumers named
    in the design read no script element at all).
  - JSON files whose head carries "@graph" (and size <= 64 MiB):
    one block per @graph node, keyed by the node's @id
    (fallback node[<i>]; duplicate @ids get a #<n> suffix),
    hashed over the node's canonical serialization
    (sorted keys, compact) — so a byte change outside every
    node (a top-level seat) moves the file hash but no block.
  - Everything else (and oversized / non-@graph JSON): file
    level only. Symlinks are fingerprinted by target string,
    never followed. Directory set is recorded too, so an
    added/removed directory is visible even when empty.

Usage:
  fingerprint.py build  --root T --store a3-fingerprint-store.json
  fingerprint.py select --root T --store a3-fingerprint-store.json \
                        --out results/a3-select-<label>.json
select exits 0 when the change set is empty, 1 when it is not.
The store lives OUTSIDE the fingerprinted root (it must never
fingerprint itself).
"""
import argparse
import hashlib
import json
import os
import re
import sys
import time
from datetime import datetime, timezone

STORE_FORMAT = "a3-fingerprint-store/1"
SLICE_FORMAT = "a3-changed-slice/1"
SUBTREES = [
    "the-flat-rate-machine",
    "the-flat-rate-movers-pages",
    "the-flat-rate-movers-worker",
    "theflatratemovers",
]
JSON_BLOCK_MAX = 64 * 1024 * 1024
HTML_BLOCK_MAX = 64 * 1024 * 1024

LD_RE = re.compile(
    r'<script\b[^>]*\btype="application/ld\+json"[^>]*>(.*?)</script\s*>',
    re.DOTALL | re.IGNORECASE,
)
DIV_START_RE = re.compile(r'<div\b[^>]*\bid="(page-[^"]+)"[^>]*>', re.IGNORECASE)
DIV_TOKEN_RE = re.compile(r"<div\b|</div\s*>", re.IGNORECASE)
COMMENT_RE = re.compile(r"<!--.*?-->", re.DOTALL)
STYLE_RE = re.compile(r"(<style\b[^>]*>).*?(</style\s*>)", re.DOTALL | re.IGNORECASE)
SCRIPT_ANY_RE = re.compile(
    r"<script\b([^>]*)>(.*?)</script\s*>", re.DOTALL | re.IGNORECASE
)


def sha256_bytes(b):
    return hashlib.sha256(b).hexdigest()


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def html_projection(text):
    """A-DESIGN §3 HTML projection (rig implementation)."""
    text = COMMENT_RE.sub("", text)
    text = STYLE_RE.sub(lambda m: m.group(1) + m.group(2), text)

    def drop_classic(m):
        attrs = m.group(1)
        if "application/ld+json" in attrs:
            return m.group(0)
        return ""

    return SCRIPT_ANY_RE.sub(drop_classic, text)


def html_blocks(text):
    blocks = {}
    for i, m in enumerate(LD_RE.finditer(text)):
        body = m.group(1)
        label = ""
        try:
            parsed = json.loads(body)
            node = parsed
            if isinstance(parsed, dict) and isinstance(parsed.get("@graph"), list):
                node = parsed["@graph"][0] if parsed["@graph"] else {}
            if isinstance(node, dict):
                label = node.get("@id") or node.get("@type") or ""
            elif isinstance(parsed, list) and parsed and isinstance(parsed[0], dict):
                label = parsed[0].get("@id") or parsed[0].get("@type") or ""
        except Exception:
            label = ""
        blocks[f"ld[{i}]"] = {
            "sha256": sha256_bytes(body.encode("utf-8")),
            "label": str(label)[:120],
            "span": [m.start(), m.end()],
        }
    # page divs: balanced depth scan from each start tag
    tokens = [(m.start(), m.group(0).lower().startswith("</")) for m in DIV_TOKEN_RE.finditer(text)]
    starts = list(DIV_START_RE.finditer(text))
    seen_ids = {}
    for m in starts:
        div_id = m.group(1)
        # find token index at/after m.start()
        lo, hi = 0, len(tokens)
        while lo < hi:
            mid = (lo + hi) // 2
            if tokens[mid][0] < m.start():
                lo = mid + 1
            else:
                hi = mid
        depth = 0
        end = len(text)
        for j in range(lo, len(tokens)):
            pos, is_close = tokens[j]
            if is_close:
                depth -= 1
                if depth == 0:
                    gt = text.find(">", pos)
                    end = gt + 1 if gt != -1 else len(text)
                    break
            else:
                depth += 1
        span_text = text[m.start():end]
        seen_ids[div_id] = seen_ids.get(div_id, 0) + 1
        key = f"div#{div_id}" if seen_ids[div_id] == 1 else f"div#{div_id}#{seen_ids[div_id]}"
        blocks[key] = {
            "sha256": sha256_bytes(span_text.encode("utf-8")),
            "label": div_id,
            "span": [m.start(), end],
        }
    return blocks


def json_blocks(raw):
    """@graph node blocks, or None when the file is not block-shaped."""
    if len(raw) > JSON_BLOCK_MAX:
        return None
    if b'"@graph"' not in raw[:8192]:
        return None
    try:
        parsed = json.loads(raw.decode("utf-8"))
    except Exception:
        return None
    if not isinstance(parsed, dict) or not isinstance(parsed.get("@graph"), list):
        return None
    blocks = {}
    seen = {}
    for i, node in enumerate(parsed["@graph"]):
        key = None
        if isinstance(node, dict):
            key = node.get("@id")
        if not key:
            key = f"node[{i}]"
        seen[key] = seen.get(key, 0) + 1
        if seen[key] > 1:
            key = f"{key}#{seen[key]}"
        canon = json.dumps(node, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
        blocks[key] = {"sha256": sha256_bytes(canon.encode("utf-8")), "label": str(key)[:120]}
    return blocks


def fingerprint_file(full_path):
    """Return the store entry for one regular file."""
    size = os.path.getsize(full_path)
    entry = {"sha256": sha256_file(full_path), "size": size}
    lower = full_path.lower()
    try:
        if lower.endswith(".json") and size <= JSON_BLOCK_MAX:
            with open(full_path, "rb") as f:
                raw = f.read()
            blocks = json_blocks(raw)
            if blocks is not None:
                entry["blocks"] = blocks
        elif lower.endswith((".html", ".htm")) and size <= HTML_BLOCK_MAX:
            with open(full_path, "rb") as f:
                raw = f.read()
            text = raw.decode("utf-8", errors="replace")
            entry["blocks"] = html_blocks(text)
            entry["proj"] = sha256_bytes(html_projection(text).encode("utf-8"))
    except Exception as exc:  # unreadable mid-walk: record, keep file hash only
        entry["block_error"] = str(exc)[:120]
    return entry


def walk_tree(root):
    """Yield (files_dict, dirs_set) for the estate subtrees under root."""
    files = {}
    dirs = set()
    for sub in SUBTREES:
        base = os.path.join(root, sub)
        if not os.path.isdir(base):
            continue
        for dirpath, dirnames, filenames in os.walk(base, followlinks=False):
            rel_dir = os.path.relpath(dirpath, root)
            dirs.add(rel_dir)
            keep = []
            for d in dirnames:
                full = os.path.join(dirpath, d)
                rel = os.path.join(rel_dir, d)
                if os.path.islink(full):
                    files[rel] = {"kind": "link", "target": os.readlink(full)}
                else:
                    keep.append(d)
            dirnames[:] = keep
            for name in filenames:
                full = os.path.join(dirpath, name)
                rel = os.path.join(rel_dir, name)
                if os.path.islink(full):
                    files[rel] = {"kind": "link", "target": os.readlink(full)}
                else:
                    entry = fingerprint_file(full)
                    entry["kind"] = "file"
                    files[rel] = entry
    return files, dirs


def build_store(root):
    t0 = time.perf_counter()
    files, dirs = walk_tree(root)
    store = {
        "format": STORE_FORMAT,
        "created_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "root_name": os.path.basename(os.path.abspath(root)),
        "subtrees": SUBTREES,
        "files": files,
        "dirs": sorted(dirs),
        "build_seconds": round(time.perf_counter() - t0, 2),
    }
    return store


def diff_block_maps(old, new):
    old = old or {}
    new = new or {}
    return {
        "added": sorted(set(new) - set(old)),
        "removed": sorted(set(old) - set(new)),
        "changed": sorted(
            k for k in set(old) & set(new) if old[k]["sha256"] != new[k]["sha256"]
        ),
    }


def select_changes(root, store):
    t0 = time.perf_counter()
    files, dirs = walk_tree(root)
    old_files = store["files"]
    added = sorted(set(files) - set(old_files))
    removed = sorted(set(old_files) - set(files))
    changed = []
    blocks_changed_total = 0
    for rel in sorted(set(files) & set(old_files)):
        old, new = old_files[rel], files[rel]
        if old.get("kind") != new.get("kind"):
            changed.append({"path": rel, "kind_change": [old.get("kind"), new.get("kind")]})
            continue
        if new["kind"] == "link":
            if old.get("target") != new.get("target"):
                changed.append({"path": rel, "link_target": [old.get("target"), new.get("target")]})
            continue
        if old["sha256"] != new["sha256"]:
            bd = diff_block_maps(old.get("blocks"), new.get("blocks"))
            n_block_changes = len(bd["added"]) + len(bd["removed"]) + len(bd["changed"])
            blocks_changed_total += n_block_changes
            item = {"path": rel, "blocks": bd, "outside_blocks": n_block_changes == 0}
            if old.get("proj") or new.get("proj"):
                item["proj_changed"] = old.get("proj") != new.get("proj")
            changed.append(item)
    old_dirs = set(store["dirs"])
    result = {
        "format": SLICE_FORMAT,
        "root_name": os.path.basename(os.path.abspath(root)),
        "store_created_utc": store["created_utc"],
        "summary": {
            "added": len(added),
            "removed": len(removed),
            "changed": len(changed),
            "dirs_added": len(dirs - old_dirs),
            "dirs_removed": len(old_dirs - dirs),
            "blocks_changed": blocks_changed_total,
        },
        "added": added,
        "removed": removed,
        "changed": changed,
        "dirs_added": sorted(dirs - old_dirs),
        "dirs_removed": sorted(old_dirs - dirs),
        "select_seconds": round(time.perf_counter() - t0, 2),
    }
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["build", "select"])
    ap.add_argument("--root", required=True)
    ap.add_argument("--store", required=True)
    ap.add_argument("--out")
    args = ap.parse_args()

    if args.cmd == "build":
        store = build_store(args.root)
        with open(args.store, "w", encoding="utf-8") as f:
            json.dump(store, f, indent=1, sort_keys=True)
        n_blocks = sum(len(e.get("blocks", {})) for e in store["files"].values())
        print(
            f"store built: {len(store['files'])} files, {len(store['dirs'])} dirs, "
            f"{n_blocks} blocks, {store['build_seconds']}s -> {args.store}"
        )
        return 0

    with open(args.store, encoding="utf-8") as f:
        store = json.load(f)
    result = select_changes(args.root, store)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=1)
    s = result["summary"]
    print(
        f"changed-slice: +{s['added']} -{s['removed']} ~{s['changed']} files, "
        f"{s['blocks_changed']} blocks, dirs +{s['dirs_added']} -{s['dirs_removed']}, "
        f"{result['select_seconds']}s"
    )
    empty = (
        s["added"] == 0 and s["removed"] == 0 and s["changed"] == 0
        and s["dirs_added"] == 0 and s["dirs_removed"] == 0
    )
    return 0 if empty else 1


if __name__ == "__main__":
    sys.exit(main())
