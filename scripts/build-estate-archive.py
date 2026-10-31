#!/usr/bin/env python3
"""Build the estate archive (reliability design D5).

"Is everything there?" is answered by regeneration, never by
eyeballing. This script's ONLY inputs are the paths registry
(paths.json) and the sealed public index — never a hand-kept list.
For each distribution in the sealed index it resolves the bytes with
digest-index's exact rules (site URL -> public_dir, a route URL ->
its index.html; GitHub /main/ URL -> repo_dir/basename), writes them
under the archive's files/ tree at the contentUrl's path, verifies
SHA-256 + byteSize against the sealed digest per file, and writes
MANIFEST.json. Exit is nonzero unless every distribution matched.

The archive is local machinery, like repo-dir/: not pushed, not
sealed. It is proven BY its manifest against the seal, on the OCI
digest-verification model. Each run deletes and rebuilds files/
(deterministic, idempotent).
"""
import hashlib
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_PREFIX = "https://theflatratemovers.com/"


def resolve(url, public_dir, repo_dir):
    """digest-index's resolution rules, verbatim in effect."""
    if url.startswith(SITE_PREFIX):
        rel = url[len(SITE_PREFIX):]
        cand = os.path.join(public_dir, rel)
        if rel == "" or rel.endswith("/"):
            cand = os.path.join(cand, "index.html")
        return cand
    if "raw.githubusercontent.com" in url and "/main/" in url:
        rel = url.split("/main/", 1)[1]
        return os.path.join(repo_dir, os.path.basename(rel))
    return None


def archive_relpath(url):
    p = urlsplit(url).path.lstrip("/")
    if p == "" or p.endswith("/"):
        p += "index.html"
    return p


def main():
    reg_path = os.path.join(ROOT, "paths.json")
    if not os.path.isfile(reg_path):
        print("FATAL: paths registry missing: " + reg_path, file=sys.stderr)
        return 2
    with open(reg_path, encoding="utf-8") as f:
        reg = json.load(f)
    public_dir, repo_dir, archive_dir = reg["public_dir"], reg["repo_dir"], reg["archive_dir"]

    index_path = os.path.join(public_dir, "ai-master-index.json")
    with open(index_path, "rb") as f:
        index_bytes = f.read()
    index = json.loads(index_bytes.decode("utf-8"))
    index_sha256 = hashlib.sha256(index_bytes).hexdigest()

    files_dir = os.path.join(archive_dir, "files")
    if os.path.isdir(files_dir):
        shutil.rmtree(files_dir)
    os.makedirs(files_dir)

    records = []
    matched = 0
    total_bytes = 0
    for e in index.get("distribution", []):
        url = e.get("contentUrl", "")
        digest = e.get("digest") or {}
        src = resolve(url, public_dir, repo_dir)
        data = None
        if src and os.path.isfile(src):
            with open(src, "rb") as f:
                data = f.read()
        sha = hashlib.sha256(data).hexdigest() if data is not None else None
        size = len(data) if data is not None else None
        ok = (data is not None and sha == digest.get("value")
              and size == digest.get("byteSize"))
        rel = archive_relpath(url)
        if data is not None:
            dest = os.path.join(files_dir, rel)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, "wb") as f:
                f.write(data)
            total_bytes += size
        if ok:
            matched += 1
        records.append({"contentUrl": url,
                        "archive_path": "files/" + rel,
                        "sha256": sha,
                        "byteSize": size,
                        "match": ok})
    manifest = {"index_sha256": index_sha256,
                "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "distributions": len(records),
                "matched": matched,
                "files": records}
    with open(os.path.join(archive_dir, "MANIFEST.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=1)
        f.write("\n")
    print(json.dumps({"distributions": len(records), "matched": matched,
                      "total_bytes": total_bytes,
                      "manifest": os.path.join(archive_dir, "MANIFEST.json")}, indent=2))
    return 0 if matched == len(records) and records else 1


if __name__ == "__main__":
    sys.exit(main())
