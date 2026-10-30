#!/usr/bin/env python3
"""Add foundingDate 2010-06 to every gap node (per GAP-LIST.md).
Parse-edit-dump only where the file round-trips byte-identically;
a recursive differ asserts the sole change is added foundingDate keys."""
import json, sys
from pathlib import Path

STAGE = Path.home() / "workspace/the-flat-rate-machine/out/batch-founding"
ORG_TYPES = {"Organization", "MovingCompany", "LocalBusiness", "Corporation",
             "ProfessionalService", "HomeAndConstructionBusiness", "Store"}
MARKERS = ("flat rate movers", "theflatratemovers", "flatratemovers")

def is_orgish(t):
    if isinstance(t, str): return t in ORG_TYPES
    if isinstance(t, list): return any(x in ORG_TYPES for x in t)
    return False

def is_company(node):
    for k in ("name", "legalName", "@id", "url"):
        v = node.get(k)
        if isinstance(v, str) and any(m in v.lower() for m in MARKERS):
            return True
    return False

def insert_after_name(node):
    out = {}
    done = False
    for k, v in node.items():
        out[k] = v
        if k == "name" and not done:
            out["foundingDate"] = "2010-06"; done = True
    if not done:
        # no name key: insert after @type/@id block
        out2 = {}
        keys = list(out.keys())
        pos = 0
        for i, k in enumerate(keys):
            if k in ("@context", "@type", "@id"): pos = i + 1
        items = list(out.items())
        items.insert(pos, ("foundingDate", "2010-06"))
        out = dict(items)
    return out

def fix(node, counter):
    if isinstance(node, dict):
        if is_orgish(node.get("@type")) and is_company(node) and "foundingDate" not in node:
            node = insert_after_name(node)
            counter[0] += 1
        return {k: fix(v, counter) for k, v in node.items()}
    if isinstance(node, list):
        return [fix(v, counter) for v in node]
    return node

def diffs(a, b, path="$", acc=None):
    if acc is None: acc = []
    if isinstance(a, dict) and isinstance(b, dict):
        for k in a:
            if k not in b: acc.append(f"REMOVED {path}.{k}")
            else: diffs(a[k], b[k], f"{path}.{k}", acc)
        for k in b:
            if k not in a: acc.append(f"ADDED {path}.{k} = {b[k]!r}")
    elif isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b): acc.append(f"LEN {path}: {len(a)} -> {len(b)}")
        else:
            for i, (x, y) in enumerate(zip(a, b)): diffs(x, y, f"{path}[{i}]", acc)
    elif a != b:
        acc.append(f"CHANGED {path}: {a!r} -> {b!r}")
    return acc

def detect_format(raw: bytes, doc):
    for ind in (1, 2, 3, 4, None):
        for ensure in (False, True):
            try:
                out = json.dumps(doc, indent=ind, ensure_ascii=ensure).encode()
            except Exception:
                continue
            if out == raw: return (ind, ensure, b"")
            if out + b"\n" == raw: return (ind, ensure, b"\n")
    return None

def edit_file(fp: Path, expect: int):
    raw = fp.read_bytes()
    doc = json.loads(raw)
    fmt = detect_format(raw, doc)
    if fmt is None:
        return {"file": str(fp), "error": "no byte-exact round-trip format"}
    ind, ensure, suffix = fmt
    counter = [0]
    new = fix(doc, counter)
    d = diffs(doc, new)
    bad = [x for x in d if not (x.startswith("ADDED") and ".foundingDate = '2010-06'" in x)]
    if counter[0] != expect or len(d) != expect or bad:
        return {"file": str(fp), "error": f"assert failed: fixed={counter[0]} expect={expect} diffs={len(d)} bad={bad[:3]}"}
    out = json.dumps(new, indent=ind, ensure_ascii=ensure).encode() + suffix
    fp.write_bytes(out)
    return {"file": str(fp), "fixed": counter[0], "format": f"indent={ind} ensure={ensure}"}

if __name__ == "__main__":
    mode = sys.argv[1]
    log = []
    if mode == "datasets":
        site = Path.home() / "workspace/the-flat-rate-movers-pages/public"
        names = ["crating","final-mile","government","industrial-commercial",
                 "industrial-offices","ispm15","military","ocean-container",
                 "piano-antique","residential","route81","transloading"]
        for n in names:
            log.append(edit_file(site / f"datasets-{n}.json", 8))
    elif mode == "pagejsons":
        site = Path.home() / "workspace/the-flat-rate-movers-pages/public"
        s = json.load(open(STAGE / "sweep-site.json"))
        for f, r in s.items():
            if f in ("index.html", "ai-master-index.json") or f.startswith("datasets-"): continue
            lk = [n for n in r.get("nodes", []) if not n["has_foundingDate"] and not n.get("OTHER_ORG")]
            if lk: log.append(edit_file(site / f, len(lk)))
    elif mode == "index":
        site = Path.home() / "workspace/the-flat-rate-movers-pages/public"
        log.append(edit_file(site / "ai-master-index.json", 2))
    elif mode == "aifiles":
        s = json.load(open(STAGE / "sweep-ai.json"))
        for f, nodes in s.items():
            if f.startswith("data/datasets-") or f == "data/ai-master-index.json": continue
            if f == "data/entity-graph.json": continue  # gist — never overwritten
            lk = [n for n in nodes if not n["has_foundingDate"] and not n.get("OTHER_ORG") and not n["ref_only"]]
            if lk: log.append(edit_file(STAGE / "ai-fetch" / f, len(lk)))
    print(json.dumps(log, indent=1))
    errs = [x for x in log if "error" in x]
    print("FILES:", len(log), "ERRORS:", len(errs), "NODES FIXED:", sum(x.get("fixed", 0) for x in log))
