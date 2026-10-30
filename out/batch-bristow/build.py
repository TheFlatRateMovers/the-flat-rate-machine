#!/usr/bin/env python3
"""Batch Bristow — add Bristow, VA (place-bristow-va) to the Winchester
branch footprint with full-site propagation. Owner ruling 2026-10-30.
Coordinates: map geocoding 2026-10-30 (38.73258, -77.54573), Prince
William County, ZIP 20136. NOT a GBP service area.
Every change is logged to changes.json. Backups under backup/."""
import json, re, os, shutil, hashlib, sys
from pathlib import Path

HOME = Path.home()
PUB = HOME / "workspace/the-flat-rate-movers-pages/public"
PAGES = HOME / "workspace/the-flat-rate-movers-pages"
MACH = HOME / "workspace/the-flat-rate-machine"
BATCH = MACH / "out/batch-bristow"
BK = BATCH / "backup"
TODAY = "2026-10-30"
LOG = []

def log(kind, target, detail):
    LOG.append({"kind": kind, "target": str(target), "detail": detail})
    print(f"[{kind}] {target}: {detail}")

def backup(path: Path, root: Path):
    rel = path.relative_to(root)
    dest = BK / root.name / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        shutil.copy2(path, dest)

def detect_indent(raw: bytes) -> int:
    m = re.search(rb"\n( +)\S", raw)
    return len(m.group(1)) if m else 2

def load_json(path: Path):
    raw = path.read_bytes()
    return json.loads(raw), detect_indent(raw), raw.endswith(b"\n")

def save_json(path: Path, obj, indent: int, trailing_nl: bool):
    out = json.dumps(obj, indent=indent, ensure_ascii=False).encode("utf-8")
    if trailing_nl:
        out += b"\n"
    path.write_bytes(out)

def restamp_dates(obj, counter):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "dateModified" and isinstance(v, str):
                if v != TODAY:
                    obj[k] = TODAY
                    counter[0] += 1
            else:
                restamp_dates(v, counter)
    elif isinstance(obj, list):
        for x in obj:
            restamp_dates(x, counter)

TEXT_SUBS = [
    ("Winchester (31)", "Winchester (32)"),
    ("Winchester 31", "Winchester 32"),
    ("52 GeoJSON", "53 GeoJSON"),
    ("52 service-area", "53 service-area"),
    ("52 features", "53 features"),
    ("52 areas", "53 areas"),
    ("52 places", "53 places"),
    ("31 areas", "32 areas"),
    ("15 extended", "16 extended"),
    ("extended 15", "extended 16"),
    ("Extended footprint (15 more)", "Extended footprint (16 more)"),
    ("31 cities", "32 cities"),
]

def text_subs(text: str):
    n = 0
    for a, b in TEXT_SUBS:
        c = text.count(a)
        if c:
            text = text.replace(a, b)
            n += c
    return text, n

WIN_MARKERS = ("South Riding", "Leesburg")
MAR_MARKERS = ("Inwood", "Hagerstown", "Shepherdstown", "Paw Paw",
               "Charles Town", "Hedgesville", "Berkeley Springs",
               "Romney", "Hancock", "Clear Spring", "Summit Point",
               "Harpers Ferry", "Kearneysville", "Bunker Hill")

def is_winchester_list(lst):
    if not isinstance(lst, list) or len(lst) != 31:
        return False
    strs = [x for x in lst if isinstance(x, str)]
    if not strs:
        return False
    if not any(any(m in s for m in WIN_MARKERS) for s in strs):
        return False
    if any(any(m in s for m in MAR_MARKERS) for s in strs):
        return False
    names = [s for s in strs]
    if not any(s.startswith("Berryville") or s.startswith("Woodstock") for s in names):
        return False
    return True

def insert_bristow(lst):
    strs = [x for x in lst if isinstance(x, str)]
    if strs == sorted(strs):  # alphabetical format
        for i, x in enumerate(lst):
            nm = x if isinstance(x, str) else (x.get("@id", "") if isinstance(x, dict) else "")
            if "berryville" in str(nm).lower():
                lst.insert(i + 1, "Bristow, VA")
                return "alpha"
    for i, x in enumerate(lst):  # branch-order format
        if isinstance(x, str) and x.startswith("Woodstock"):
            lst.insert(i + 1, "Bristow, VA")
            return "branch-order"
    return None

def walk_lists(obj, hits):
    if isinstance(obj, list):
        if is_winchester_list(obj):
            hits.append(obj)
        for x in obj:
            walk_lists(x, hits)
    elif isinstance(obj, dict):
        for v in obj.values():
            walk_lists(v, hits)

# ----------------------------------------------------------------------
# 1. GeoJSON — new Bristow feature after place-woodstock-va
# ----------------------------------------------------------------------
BRISTOW_FEATURE = {
    "type": "Feature",
    "id": "place-bristow-va",
    "geometry": {"type": "Point", "coordinates": [-77.54573, 38.73258]},
    "properties": {
        "id": "place-bristow-va",
        "name": "Bristow, VA",
        "type": "city",
        "source": "Company service footprint: Bristow assigned to the Winchester branch by owner ruling 2026-10-30 (closest branch); NOT a Google Business Profile service area. Coordinates via map geocoding 2026-10-30; branch coordinates via Places 2026-10-27.",
        "verified": "2026-10-30",
        "provider": "https://theflatratemovers.com/#organization",
        "citation": "https://theflatratemovers.com/service-area.geojson",
        "state": "VA",
        "county": "Prince William",
        "postal_code": "20136",
        "branch": "winchester",
        "gbp_service_area": False,
        "audiences": ["residential", "commercial", "industrial", "government", "military"],
        "services": ["residential-moving", "commercial-moving", "office-moving",
                     "industrial-offices", "government-moving", "military-moving",
                     "packing", "custom-crating", "ispm15-export-packing", "loading",
                     "transloading", "final-mile", "warehouse-distribution",
                     "commercial-relocation", "ffe-installation", "flexible-deployment",
                     "ocean-container", "pods", "restacking"],
        "rubric_score": 2,
        "rubric_note": "Score 2: coordinates verified by map geocoding 2026-10-30, but this is an expansion city added to the Winchester branch footprint by owner ruling 2026-10-30, not a GBP service area, and it has no dedicated page \u2014 so R3 visible-match and R4 source-check score 2. It is served as part of the Winchester branch footprint, not presented as a GBP area.",
    },
}

def fix_geojson(path: Path, root: Path):
    backup(path, root)
    doc, ind, nl = load_json(path)
    ids = [f["properties"]["id"] for f in doc["features"]]
    assert "place-bristow-va" not in ids
    wi = ids.index("place-woodstock-va")
    doc["features"].insert(wi + 1, json.loads(json.dumps(BRISTOW_FEATURE)))
    doc["version"] = TODAY
    doc["dateModified"] = TODAY
    save_json(path, doc, ind, nl)
    log("geojson", path, f"feature inserted after place-woodstock-va; features {len(ids)} -> {len(doc['features'])}; version/dateModified -> {TODAY}")

# ----------------------------------------------------------------------
# 2. Route81 coverage transform (shared by file + embeds)
# ----------------------------------------------------------------------
def bristow_listitem():
    return {
        "@type": "ListItem",
        "position": 0,  # renumbered by caller
        "item": {
            "@type": "Place",
            "name": "Bristow, VA",
            "identifier": "place-bristow-va",
            "additionalProperty": [
                {"@type": "PropertyValue", "name": "footprintFeature", "value": "place-bristow-va"},
                {"@type": "PropertyValue", "name": "servedByBranch", "value": "winchester"},
                {"@type": "PropertyValue", "name": "source", "value": "Extended footprint \u2014 service-area.geojson feature branch properties (verified 2026-10-30)"},
            ],
            "postalCode": "20136",
            "address": {"@type": "PostalAddress", "addressRegion": "VA", "addressCountry": "US"},
        },
    }

def fix_route81_graph(graph):
    """graph: parsed @graph list. Returns True if coverage node changed."""
    changed = False
    for node in graph:
        if isinstance(node, dict) and str(node.get("@id", "")).endswith("#dataset-route81-coverage"):
            el = node["containsPlace"]["itemListElement"]
            assert not any(e["item"].get("identifier") == "place-bristow-va" for e in el)
            idx = None
            for i, e in enumerate(el):
                props = {p["name"]: p["value"] for p in e["item"]["additionalProperty"]}
                if e["item"].get("identifier") == "place-woodstock-va" and props.get("servedByBranch") == "winchester":
                    idx = i
                    break
            assert idx is not None, "woodstock winchester entry not found"
            el.insert(idx + 1, bristow_listitem())
            for i, e in enumerate(el):
                e["position"] = i + 1
            changed = True
    return changed

# ----------------------------------------------------------------------
# 3. Structural + text pass over every site JSON
# ----------------------------------------------------------------------
def fix_site_json(path: Path):
    backup(path, PUB)
    raw = path.read_bytes()
    _, tcount = text_subs(raw.decode("utf-8"))  # probe only
    doc, ind, nl = load_json(path)
    changed = []
    # route81 coverage first (datasets-route81.json)
    if path.name == "datasets-route81.json":
        if fix_route81_graph(doc["@graph"]):
            changed.append("route81 coverage +Bristow (67 entries, renumbered)")
    hits = []
    walk_lists(doc, hits)
    modes = []
    for lst in hits:
        m = insert_bristow(lst)
        assert m, f"classified list but no insertion point in {path}"
        modes.append(m)
    if modes:
        changed.append(f"winchester footprint lists +Bristow x{len(modes)} ({','.join(modes)})")
    if changed or tcount:
        c = [0]
        restamp_dates(doc, c)
        if c[0]:
            changed.append(f"dateModified restamped x{c[0]}")
        save_json(path, doc, ind, nl)
        text2, n = text_subs(path.read_bytes().decode("utf-8"))
        assert n == tcount, f"text-sub count drift in {path}: probe {tcount} vs final {n}"
        if n:
            path.write_bytes(text2.encode("utf-8"))
            changed.append(f"count phrases updated x{n}")
    if changed:
        log("json", path.relative_to(PUB), "; ".join(changed))
    return bool(changed)

def main():
    BK.mkdir(parents=True, exist_ok=True)
    # --- geojson: site + machine data copy (byte-identical pair) ---
    fix_geojson(PUB / "service-area.geojson", PUB)
    mach_geo = MACH / "data/service-area.geojson"
    fix_geojson(mach_geo, MACH)
    assert (PUB / "service-area.geojson").read_bytes() == mach_geo.read_bytes(), "geojson copies diverged"
    log("geojson", "pair-check", "site == machine data copy (byte-identical)")

    # --- all site JSONs (root + .well-known) ---
    changed_files = []
    for path in sorted(PUB.glob("*.json")) + sorted((PUB / ".well-known").glob("*.json")):
        if path.name in ("ai-master-index.json", "ai-master-index.jws"):
            continue
        if fix_site_json(path):
            changed_files.append(path.name)
    log("json-summary", "site", f"{len(changed_files)} files changed: {', '.join(changed_files)}")

    (BATCH / "changes-part1.json").write_text(json.dumps(LOG, indent=1), encoding="utf-8")
    (BATCH / "changed-site-jsons.json").write_text(json.dumps(changed_files, indent=1), encoding="utf-8")

if __name__ == "__main__":
    main()
