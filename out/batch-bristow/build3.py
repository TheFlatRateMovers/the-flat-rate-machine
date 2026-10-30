#!/usr/bin/env python3
"""Batch Bristow part 3 — machine repo data mirrors, phase-a staged
copies, ai-repo footprint.json staging, rubric DB update."""
import json, re, shutil, sqlite3, sys
from pathlib import Path

HOME = Path.home()
PUB = HOME / "workspace/the-flat-rate-movers-pages/public"
MACH = HOME / "workspace/the-flat-rate-machine"
BATCH = MACH / "out/batch-bristow"
BK = BATCH / "backup"
TODAY = "2026-10-30"
LOG = []
sys.path.insert(0, str(BATCH))
from build import text_subs, walk_lists, insert_bristow, restamp_dates, load_json, save_json

def log(kind, target, detail):
    LOG.append({"kind": kind, "target": str(target), "detail": detail})
    print(f"[{kind}] {target}: {detail}")

def backup_to(path: Path, tag: str):
    dest = BK / tag / path.name
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        shutil.copy2(path, dest)

def fix_json_file(path: Path, tag: str):
    backup_to(path, tag)
    raw = path.read_bytes()
    _, tcount = text_subs(raw.decode("utf-8"))
    doc, ind, nl = load_json(path)
    hits = []
    walk_lists(doc, hits)
    modes = []
    for lst in hits:
        m = insert_bristow(lst)
        assert m, f"no insertion point in {path}"
        modes.append(m)
    changed = []
    if modes:
        changed.append(f"winchester lists +Bristow x{len(modes)} ({','.join(modes)})")
    if changed or tcount:
        c = [0]
        restamp_dates(doc, c)
        if c[0]:
            changed.append(f"dateModified restamped x{c[0]}")
        save_json(path, doc, ind, nl)
        text2, n = text_subs(path.read_bytes().decode("utf-8"))
        assert n == tcount, f"text drift {path}: {tcount} vs {n}"
        if n:
            path.write_bytes(text2.encode("utf-8"))
            changed.append(f"count phrases x{n}")
    if changed:
        log("fix", f"{tag}/{path.name}", "; ".join(changed))
    else:
        log("fix", f"{tag}/{path.name}", "no changes (verified)")
    return bool(changed)

# --- A. machine repo data mirrors ---
for name in ("entity-graph.json", "best-json-entity-graph.json"):
    fix_json_file(MACH / "data" / name, "machine-data")

# --- B. phase-a staged copies ---
PA = MACH / "out/phase-a"
for name in ("ai-sitemap.json", "entity-graph.json", "best-json-entity-graph.json"):
    fix_json_file(PA / name, "phase-a")
# phase-a llms.txt + ard.json: text subs only where the phrase is a
# current-state geojson/footprint description
for name in ("llms.txt", "ard.json"):
    p = PA / name
    backup_to(p, "phase-a")
    t = p.read_text(encoding="utf-8")
    t2, n = text_subs(t)
    if n:
        p.write_text(t2, encoding="utf-8")
    log("fix", f"phase-a/{name}", f"count phrases x{n}")

# --- C. ai-repo footprint.json (staged from HEAD download) ---
src = Path("/tmp/ai-footprint.json")
assert src.exists()
fp = json.loads(src.read_text(encoding="utf-8"))
assert fp["counts"] == {"geojsonFeatures": 52, "winchesterFootprint": 31, "martinsburgFootprint": 35,
                         "sharedAreas": 14, "gbpWinchester": 16, "gbpMartinsburg": 14,
                         "extendedWinchester": 15, "extendedMartinsburg": 21}, fp["counts"]
fp["counts"]["geojsonFeatures"] = 53
fp["counts"]["winchesterFootprint"] = 32
fp["counts"]["extendedWinchester"] = 16
wf = fp["winchesterFootprint"]
wi = wf.index("Woodstock, VA")
wf.insert(wi + 1, "Bristow, VA")
areas = fp["areas"]
ai = next(i for i, a in enumerate(areas) if a["geojsonId"] == "place-woodstock-va")
areas.insert(ai + 1, {
    "name": "Bristow, VA", "type": "city", "branches": ["winchester"], "shared": False,
    "gbp": False, "gbpBranches": [],
    "source": "Live service-area.geojson feature branch property, 2026-10-30 \u2014 assigned to the Winchester branch by owner ruling 2026-10-30, closest branch (NOT a Google Business Profile service area)",
    "attested": "2026-10-30", "geojsonId": "place-bristow-va",
})
fp["status"] = fp["status"].replace("(52 features; branch membership and shared areas)",
                                    "(53 features; branch membership and shared areas)")
fp["status"] += (" Bristow, VA added 2026-10-30 \u2014 Winchester branch extended footprint by owner ruling "
                 "2026-10-30 (closest branch), verified against the live service-area GeoJSON the same day; "
                 "Bristow is not a Google Business Profile service area.")
fp["dateModified"] = TODAY
outdir = BATCH / "push-ai/data"
outdir.mkdir(parents=True, exist_ok=True)
(outdir / "footprint.json").write_text(json.dumps(fp, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
log("footprint", "push-ai/data/footprint.json",
    f"counts 52/31/15 -> 53/32/16; winchesterFootprint +Bristow (32); areas +Bristow record ({len(areas)}); dateModified {TODAY}")

# --- D. rubric DB ---
DB = HOME / "workspace/theflatratemovers/rubric.db"
shutil.copy2(DB, BK / "rubric.db.before-bristow")
db = sqlite3.connect(DB)
before_att = db.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
before_sa = db.execute("SELECT COUNT(*) FROM service_area WHERE place_id LIKE '%winchester%'").fetchone()[0]
assert db.execute("SELECT COUNT(*) FROM service_area WHERE area='Bristow, VA'").fetchone()[0] == 0
db.execute("INSERT INTO service_area (place_id, area, source) VALUES (?, ?, ?)",
           ("https://theflatratemovers.com/#winchester-place", "Bristow, VA",
            "service-area.geojson footprint (branch property), adopted 2026-10-30 \u2014 assigned to the Winchester branch by owner ruling 2026-10-30; NOT a Google Business Profile service area"))
db.execute("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?, ?, ?, ?)",
           ("Bristow, VA added to the Winchester branch footprint (extended, not a Google Business Profile service area): footprint is now Winchester 32 areas, Martinsburg 35, 14 shared, 53 service-area GeoJSON features",
            "Owner ruling 2026-10-30 (Bristow served, Winchester branch as closest) + service-area.geojson feature place-bristow-va",
            "2026-10-30",
            "map geocoding 2026-10-30: 38.73258, -77.54573, Prince William County, ZIP 20136; live GeoJSON + graphs + ai-sitemap + llms + data txt verified 2026-10-30"))
db.execute("INSERT INTO attestation (claim, source, verified, evidence) VALUES (?, ?, ?, ?)",
           ("Bristow propagation complete: GeoJSON feature, both machine graphs, head graph, ai-sitemap, llms.txt, data txt, Route 81 coverage dataset (67 entries, Bristow traced to place-bristow-va), per-page JSON Winchester lists (55 lists at 32), rubric service_area row; provenance re-signed 2026-10-30",
            "Batch Bristow 2026-10-30 (out/batch-bristow records in the-flat-rate-machine)",
            "2026-10-30",
            "verify.js full suite + public-only PROVENANCE OK after deploy 2026-10-30"))
db.commit()
after_att = db.execute("SELECT COUNT(*) FROM attestation").fetchone()[0]
after_sa = db.execute("SELECT COUNT(*) FROM service_area WHERE place_id LIKE '%winchester%'").fetchone()[0]
row = db.execute("SELECT area, source FROM service_area WHERE area='Bristow, VA'").fetchone()
integ = db.execute("PRAGMA integrity_check").fetchone()[0]
db.close()
log("rubric", "rubric.db", f"service_area winchester {before_sa} -> {after_sa} (row: {row[0]}); attestation {before_att} -> {after_att}; integrity {integ}")

(BATCH / "changes-part3.json").write_text(json.dumps(LOG, indent=1), encoding="utf-8")
