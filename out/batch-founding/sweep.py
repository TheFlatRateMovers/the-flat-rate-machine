#!/usr/bin/env python3
"""Founding-date gap sweep: find every full Organization/MovingCompany/
LocalBusiness node representing The Flat Rate Movers LLC or its branches
that LACKS foundingDate. Sweeps site tree JSON files + index.html JSON-LD
embeds. Read-only."""
import json, os, re, sys
from pathlib import Path

ORG_TYPES = {"Organization", "MovingCompany", "LocalBusiness", "Corporation",
             "ProfessionalService", "HomeAndConstructionBusiness", "Store"}

def is_orgish(t):
    if isinstance(t, str):
        return t in ORG_TYPES
    if isinstance(t, list):
        return any(x in ORG_TYPES for x in t)
    return False

COMPANY_MARKERS = ("flat rate movers", "theflatratemovers", "flatratemovers")

def represents_company(node):
    for key in ("name", "legalName", "@id", "url"):
        v = node.get(key)
        if isinstance(v, str) and any(m in v.lower() for m in COMPANY_MARKERS):
            return True
    return False

def walk(node, path, hits, ctx):
    if isinstance(node, dict):
        if is_orgish(node.get("@type")):
            full = ("name" in node) or ("legalName" in node)
            ref_only = set(node.keys()) <= {"@id", "@type"}
            if represents_company(node):
                hits.append({
                    "ctx": ctx, "path": path,
                    "type": node.get("@type"),
                    "name": node.get("name"),
                    "id": node.get("@id"),
                    "has_foundingDate": "foundingDate" in node,
                    "ref_only": ref_only,
                    "keys": sorted(node.keys()),
                })
            elif full and not ref_only:
                # org node that does NOT self-identify as the company by name/id/url
                hits.append({
                    "ctx": ctx, "path": path, "type": node.get("@type"),
                    "name": node.get("name"), "id": node.get("@id"),
                    "has_foundingDate": "foundingDate" in node,
                    "ref_only": False, "keys": sorted(node.keys()),
                    "OTHER_ORG": True,
                })
        for k, v in node.items():
            walk(v, f"{path}.{k}", hits, ctx)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            walk(v, f"{path}[{i}]", hits, ctx)

def sweep_json_file(fp):
    hits = []
    try:
        data = json.loads(Path(fp).read_text())
    except Exception as e:
        return hits, f"PARSE-ERROR {e}"
    walk(data, "$", hits, str(fp))
    return hits, None

def main():
    site = Path.home() / "workspace/the-flat-rate-movers-pages/public"
    results = {}
    # all json files recursively
    for fp in sorted(site.rglob("*.json")):
        hits, err = sweep_json_file(fp)
        if err:
            results[str(fp.relative_to(site))] = {"error": err}
        elif hits:
            results[str(fp.relative_to(site))] = {"nodes": hits}
    # index.html embeds
    html = (site / "index.html").read_text()
    blocks = re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S)
    embed_hits = []
    for i, b in enumerate(blocks):
        try:
            data = json.loads(b)
        except Exception:
            continue
        h = []
        walk(data, "$", h, f"index.html embed[{i}]")
        for x in h:
            x["embed_index"] = i
            embed_hits.append(x)
    results["index.html"] = {"nodes": embed_hits, "embed_blocks": len(blocks)}
    out = Path.home() / "workspace/the-flat-rate-machine/out/batch-founding/sweep-site.json"
    out.write_text(json.dumps(results, indent=1))
    # summary
    gaps = {}
    for f, r in results.items():
        for n in r.get("nodes", []):
            if n.get("OTHER_ORG"):
                continue
            if not n["has_foundingDate"]:
                gaps.setdefault(f, []).append(n)
    print(f"files with company org nodes: {sum(1 for r in results.values() if r.get('nodes'))}")
    print(f"GAP files (company org node lacking foundingDate): {len(gaps)}")
    for f, ns in sorted(gaps.items()):
        print(f"  {f}: {len(ns)} node(s) lacking")
    other = [(f, n) for f, r in results.items() for n in r.get("nodes", []) if n.get("OTHER_ORG")]
    print(f"other-org full nodes (not company): {len(other)}")
    for f, n in other[:40]:
        print(f"  OTHER {f}: {n.get('name')} type={n.get('type')} founding={n['has_foundingDate']}")

if __name__ == "__main__":
    main()
