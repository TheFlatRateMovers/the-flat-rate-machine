#!/usr/bin/env python3
"""Complete the AI master index: fill license + dateModified on every
distribution entry FROM REAL SOURCES ONLY, and attach a SHA-256 digest
computed over the actual bytes each contentUrl serves.

Fill rules (recorded per field in the audit; nothing is invented):
  license      <- the target file's own declared license if it has one,
                  else the index's own top-level license (the index is the
                  Dataset; its license covers its distributions).
  dateModified <- the target file's own declared dateModified (top level,
                  _machineNotes, or a Dataset node), else the index's own
                  top-level dateModified (the date this listing was stamped).
  digest       <- sha256 + byteSize over resolved bytes:
                  theflatratemovers.com/<p>      -> <public-dir>/<p>
                  raw.githubusercontent .../main/<p> -> <repo-dir>/<basename>
An entry that cannot be resolved or filled is reported as a GAP, never patched over.
"""
import argparse
import hashlib
import json
import os
import sys


def find_declared(doc, key):
    """Search a parsed JSON doc for a declared value: top level, then
    _machineNotes, then any @graph node (Dataset nodes preferred)."""
    if isinstance(doc, dict):
        if key in doc and isinstance(doc[key], str):
            return doc[key], "file-top-level"
        mn = doc.get("_machineNotes")
        if isinstance(mn, dict) and isinstance(mn.get(key), str):
            return mn[key], "file-_machineNotes"
        graph = doc.get("@graph")
        if isinstance(graph, list):
            for node in graph:
                if isinstance(node, dict) and isinstance(node.get(key), str):
                    t = str(node.get("@type", ""))
                    if "Dataset" in t or key == "dateModified":
                        return node[key], "file-dataset-node"
            for node in graph:
                if isinstance(node, dict) and isinstance(node.get(key), str):
                    return node[key], "file-graph-node"
    return None, None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--index", required=True)
    ap.add_argument("--public-dir", required=True)
    ap.add_argument("--repo-dir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--audit", required=True)
    args = ap.parse_args()

    with open(args.index) as f:
        index = json.load(f)
    top_license = index.get("license")
    top_dm = index.get("dateModified")

    audit = {"entries": [], "gaps": [], "totals": {}}
    filled = {"license": 0, "dateModified": 0, "digest": 0}

    for entry in index.get("distribution", []):
        name = entry.get("name")
        url = entry.get("contentUrl", "")
        rec = {"name": name, "contentUrl": url, "sources": {}}
        path = None
        if url.startswith("https://theflatratemovers.com/"):
            rel = url[len("https://theflatratemovers.com/"):]
            cand = os.path.join(args.public_dir, rel)
            if os.path.isfile(cand):
                path, rec["resolved"] = cand, f"public/{rel}"
        elif "raw.githubusercontent.com" in url and "/main/" in url:
            rel = url.split("/main/", 1)[1]
            cand = os.path.join(args.repo_dir, os.path.basename(rel))
            if os.path.isfile(cand):
                path, rec["resolved"] = cand, f"ai-repo/{rel}@HEAD"
        if not path:
            rec["error"] = "unresolvable contentUrl"
            audit["gaps"].append(rec)
            audit["entries"].append(rec)
            continue
        with open(path, "rb") as f:
            data = f.read()
        digest = {
            "algorithm": "SHA-256",
            "value": hashlib.sha256(data).hexdigest(),
            "byteSize": len(data),
        }
        entry["digest"] = digest
        filled["digest"] += 1
        rec["digest"] = digest

        doc = None
        try:
            doc = json.loads(data.decode("utf-8"))
        except Exception:
            doc = None
        for field, topval in (("license", top_license), ("dateModified", top_dm)):
            if entry.get(field):
                rec["sources"][field] = "already-present"
                filled[field] += 1
                continue
            val, src = find_declared(doc, field) if doc is not None else (None, None)
            if val is None and topval:
                val, src = topval, "index-top-level"
            if val is None:
                rec.setdefault("missing", []).append(field)
                audit["gaps"].append({"name": name, "missing": field})
            else:
                entry[field] = val
                rec["sources"][field] = src
                filled[field] += 1
        audit["entries"].append(rec)

    audit["totals"] = {
        "distributions": len(index.get("distribution", [])),
        **filled,
        "gaps": len(audit["gaps"]),
    }
    with open(args.out, "w") as f:
        json.dump(index, f, indent=1)
        f.write("\n")
    with open(args.audit, "w") as f:
        json.dump(audit, f, indent=2)
        f.write("\n")
    print(json.dumps(audit["totals"], indent=2))
    return 0 if not audit["gaps"] else 2


if __name__ == "__main__":
    sys.exit(main())
