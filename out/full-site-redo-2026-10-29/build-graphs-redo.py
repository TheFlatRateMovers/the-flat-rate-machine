"""AREA A (graphs + registries) full-site redo, STAGED ONLY.
Reads live sources read-only; writes ONLY to out/full-site-redo-2026-10-29/graphs/.
Never touches public/, machine/data/, scripts/, verify.js, gist, or gun-safe staged dir.
dateModified values are carried over UNCHANGED; parent must re-stamp at deploy time.
Internal provenance field KEYS (attested/attestation/attestations) are kept unchanged;
only published-facing VALUES are rewritten, so a raw grep still finds key names.
See research-appendix-graphs.md in graphs/ for industry sources.
"""
import json, re, copy
from pathlib import Path

PUB = Path.home() / "workspace/the-flat-rate-movers-pages/public"
DATA = Path.home() / "workspace/the-flat-rate-machine/data"
OUT = Path.home() / "workspace/the-flat-rate-machine/out/full-site-redo-2026-10-29/graphs"
OUT.mkdir(parents=True, exist_ok=True)

WIN = {"@id": "https://theflatratemovers.com/#winchester"}
MAR = {"@id": "https://theflatratemovers.com/#martinsburg"}
WINP = {"@id": "https://theflatratemovers.com/#winchester-place"}
MARP = {"@id": "https://theflatratemovers.com/#martinsburg-place"}
BOTH_HEAD = [dict(WIN), dict(MAR)]
BOTH_PLACE = [dict(WINP), dict(MARP)]

# Powerful descriptions: existing strong/owner-supplied copy kept verbatim;
# thin one-liners strengthened with process facts already stated elsewhere
# (survey, written flat rate, protection, planned sequence, verified placement).
DESC = {
    "service-residential": "Flat-rate residential moving from Winchester, VA and Martinsburg, WV \u2014 houses and apartments, full or partial packing, and heavy pieces under SIR/KIM-GS, local, regional and long-distance, surveyed in advance and quoted at one price in writing before move day.",
    "service-commercial": "Business moves, planned around your operation. Commercial relocations quoted flat and agreed in writing before move day \u2014 planned around your hours, your site and your equipment, with our own warehouse and transload operation behind the job.",
    "service-local-regional": "Local and regional moves across the Shenandoah Valley and Eastern Panhandle along the I-81, I-66 and I-70 corridors, surveyed and quoted at one flat rate in writing before move day.",
    "service-long-distance": "Flat-rate long-distance moving from Winchester, VA and Martinsburg, WV along the I-81, I-66 and I-70 corridors, planned door to door and quoted at one price in writing before move day.",
    "service-packing": "Full, partial and fragile-only packing and unpacking, including loading and unloading \u2014 rooms packed and labelled in sequence, fragile and high-value pieces protected, so unpacking lands in order.",
    "service-sir-heavy": "SIR Structural Integrity Relocation and the KIM-GS Protocol for high-mass assets of 1,500 to 3,500 lbs \u2014 safes, medical devices, cryogenic equipment, pianos and antiques \u2014 with floor deflection analysis to L/360.",
    "service-gun-safe": "Gun safe and high-mass safe moving under SIR Structural Integrity Relocation and the KIM-GS Protocol, for safes of 1,500 to 3,500 lbs \u2014 route and clearance survey, floor deflection analysis to L/360, load spreading, floor protection and verified placement, quoted at one flat rate in writing.",
    "service-piano-antique": "White-glove handling of pianos, antiques and high-value items \u2014 surveyed, protected, and moved with custom crating when the piece requires it, at one flat rate agreed in writing.",
    "service-ispm15": "Export packing to ISPM 15 (International Standards for Phytosanitary Measures No. 15) for international shipping, with crates built and marked to the ISPM 15 standard.",
    "service-crating": "Custom-built crates and high-value item protection for domestic and export moves \u2014 measured, built and fitted to the piece, not a stock box.",
    "service-transloading": "Container loading and unloading, and transloading between truck, container and warehouse \u2014 counted, sorted and restacked for the inland leg, with cross-docking and warehouse staging.",
    "service-final-mile": "Final-mile delivery with in-home or in-business placement and verification \u2014 delivered to the room, placed, and confirmed on site.",
    "service-office-moving": "Complete office relocations \u2014 workstations, files and office equipment \u2014 planned around business hours and quoted flat in writing before move day.",
    "service-industrial-offices": "Office moves for industrial and facility sites \u2014 office areas within plants, warehouses and industrial facilities \u2014 planned around production and site access, quoted flat.",
    "service-government": "Moving services for government offices and public-sector relocations \u2014 planned, documented and quoted flat, around the agency\u2019s schedule and site requirements.",
    "service-military": "Moving services for military households and service members relocating to or from the Winchester and Martinsburg area, quoted flat in writing before move day.",
    "service-route81": "Moving and logistics dispatch along Interstate 81, I-66 and I-70 from Winchester, VA and Martinsburg, WV \u2014 corridor moves run from two dispatch branches on one flat-rate standard.",
}
# serviceType standardisation (head only): Title Case, matching service names.
STYPE = {
    "service-local-regional": "Local and Regional Moving",
    "service-long-distance": "Long-Distance Moving",
    "service-packing": "Packing and Unpacking",
    "service-sir-heavy": "SIR Heavy Asset Relocation (KIM-GS Protocol)",
    "service-piano-antique": "Piano, Antique and White-Glove Moving",
    "service-ispm15": "ISPM 15 Export Packing",
    "service-crating": "Custom Crating",
    "service-final-mile": "Final-Mile Delivery",
    "service-office-moving": "Office Moving",
    "service-industrial-offices": "Industrial Offices Moving",
    "service-government": "Government Moving",
    "service-military": "Military Moving",
    "service-route81": "Route 81 Corridor Moving and Dispatch",
    "service-industrial-commercial": "Industrial & Commercial Services",
}

def frag(url_or_id):
    return url_or_id.rsplit("#", 1)[-1]

def load(p):
    with open(p) as f:
        return json.load(f)

def dump(obj, name):
    with open(OUT / name, "w") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")

# ---------------- 1. HEAD GRAPH (extracted from index.html block 0) ----------------
html = (PUB / "index.html").read_text()
blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
head = json.loads(blocks[0])
assert len(head["@graph"]) == 24, len(head["@graph"])
ent_live = load(DATA / "entity-graph.json")
win_fp = [n for n in ent_live["@graph"] if n.get("@id") == "https://theflatratemovers.com/#winchester-place"][0]["areaServed"]
mar_fp = [n for n in ent_live["@graph"] if n.get("@id") == "https://theflatratemovers.com/#martinsburg-place"][0]["areaServed"]
assert len(win_fp) == 31 and len(mar_fp) == 35, (len(win_fp), len(mar_fp))
for node in head["@graph"]:
    if node.get("@type") == "Service":
        key = frag(node["@id"])
        if key in DESC:
            node["description"] = DESC[key]
        if key in STYPE:
            node["serviceType"] = STYPE[key]
        node["areaServed"] = copy.deepcopy(BOTH_HEAD)
    elif isinstance(node.get("@type"), list) and "Organization" in node["@type"]:
        node["areaServed"] = copy.deepcopy(BOTH_HEAD) + node["areaServed"]
        for loc in node["location"]:
            if loc["@id"].endswith("#winchester"):
                loc["areaServed"] = list(win_fp)
            elif loc["@id"].endswith("#martinsburg"):
                loc["areaServed"] = list(mar_fp)
dump(head, "head-graph.json")

# ---------------- 2. ENTITY GRAPH ----------------
ent = load(DATA / "entity-graph.json")
ent["name"] = "The Flat Rate Movers \u2014 Entity Graph, Nodes and Chains"
ent["description"] = ("Machine-readable entity graph for The Flat Rate Movers LLC. Every node has a stable @id, "
    "every Service and Place chains to the Organization by @id, every service area chains to its branch Place, "
    "and every fact carries a named source and verification date. Per-branch Google ratings live on each Place node, "
    "distinct, never blended. License details are private and are not published in this graph.")
ent["rubric"]["checks"] = [
    "Every page has Organization, WebPage, BreadcrumbList, and Service nodes, all linked by stable @id, not by copied text",
    "Every Place chains Organization -> Place -> PostalAddress -> GeoCoordinates -> OpeningHoursSpecification -> areaServed",
    "Every Service chains Service -> provider Organization -> Place -> areaServed",
    "Every fact in a node appears in a source note with source and date, or it is omitted",
    "No rating, price, license detail, testimonial, or move count appears without a named, visible, verified source",
    "Service areas match the full footprint per branch (Winchester 31, Martinsburg 35), not a generic county list",
    "Captions and credits are honest: style examples are labelled as examples, never presented as his work",
]
ent["rubric"]["purpose"] = ("Use this rubric to check any page, node, or graph before go-live: "
    "does it chain, does it cite, does it source?")
for a in ent["attestations"]:
    if "pending Henry" in a.get("source", ""):
        a["claim"] = "Winchester Google rating 5.0 with 1 review; Martinsburg Google rating 4.7 with 6 reviews"
        a["source"] = ("Google Business Profile check 2026-10-27, read-only, per branch, not blended; "
                       "per-branch ratings are carried on each Place node")
    if "NOT attested publicly" in a.get("claim", ""):
        a["claim"] = "License details are private and are not published in this graph"
    if a.get("claim", "").startswith("Winchester GBP service area list"):
        a["claim"] = "Winchester full footprint, 31 areas (16 Google Business Profile areas plus expansion areas)"
    if a.get("claim", "").startswith("Martinsburg GBP service area list"):
        a["claim"] = "Martinsburg full footprint, 35 areas (14 Google Business Profile areas plus expansion areas)"
ent["chain"] = [c for c in ent["chain"]
                if not (c.get("relation") == "areaServed" and isinstance(c.get("to"), str) and "GBP service area list" in c["to"])]
ent["chain"] += [
    {"from": "https://theflatratemovers.com/#winchester-place", "relation": "areaServed",
     "to": "Winchester full footprint, 31 areas"},
    {"from": "https://theflatratemovers.com/#martinsburg-place", "relation": "areaServed",
     "to": "Martinsburg full footprint, 35 areas"},
]
RATINGS = {
    "https://theflatratemovers.com/#winchester-place": {"@type": "AggregateRating", "ratingValue": 5.0, "reviewCount": 1, "bestRating": 5, "worstRating": 1, "itemReviewed": {"@id": "https://theflatratemovers.com/#winchester-place"}},
    "https://theflatratemovers.com/#martinsburg-place": {"@type": "AggregateRating", "ratingValue": 4.7, "reviewCount": 6, "bestRating": 5, "worstRating": 1, "itemReviewed": {"@id": "https://theflatratemovers.com/#martinsburg-place"}},
}
merged, seen = [], set()
for node in ent["@graph"]:
    if node.get("@type") == "Place":
        node["aggregateRating"] = RATINGS[node["@id"]]
        merged.append(node)
    elif node.get("@type") == "Service":
        node["areaServed"] = copy.deepcopy(BOTH_PLACE)
        key = frag(node["@id"])
        if key in DESC:
            node["description"] = DESC[key]
        elif not node.get("description"):
            # page-slug nodes carry no fragment key; fill from the matching service
            if "residential-moving" in node["@id"]:
                node["description"] = DESC["service-residential"]
            elif "commercial-moving" in node["@id"]:
                node["description"] = DESC["service-commercial"]
            else:
                # fragment nodes whose live copy carries no description: use the
                # owner-supplied head-graph description for the same service
                head_node = next((h for h in head["@graph"] if h.get("@id") == node["@id"]), None)
                if head_node and head_node.get("description"):
                    node["description"] = head_node["description"]
        if node["@id"] in seen:
            continue  # merge duplicate @id: branch-page variants collapse to one service node
        if node["@id"].startswith("https://theflatratemovers.com/#service-"):
            node.pop("url", None)  # fragment node is the service, not a branch page; branch urls live in best graph + pages.json
        seen.add(node["@id"])
        merged.append(node)
    else:
        merged.append(node)
ent["@graph"] = merged
dump(ent, "entity-graph.json")

# ---------------- 3. BEST GRAPH ----------------
best = load(DATA / "best-json-entity-graph.json")
best["_humanSummary"] = ("This is the best JSON for The Flat Rate Movers: one @graph, stable @ids, Organization chained to two Places, "
    "each Place carrying its full footprint (Winchester 31 areas, Martinsburg 35, shared 14) with the Google Business Profile subset "
    "(Winchester 16, Martinsburg 14) also carried as named City nodes, each Service chained to the Organization and to its branch Place or Places, "
    "per-branch Google ratings (Winchester 5.0 with 1 review, Martinsburg 4.7 with 6 reviews, never blended), founding June 2010, geo, hours, sameAs, "
    "and no license, price, testimonial, or move count. Humans read the names, addresses, and service lists; machines follow the @ids. "
    "2026-10-28: 24 new branch and corridor pages added, each with Service JSON-LD, logo image, and backlinks.")
best["_machineNotes"]["attestation"] = ("See entity-graph.json source notes for source and date for every fact. "
    "License details are private and are not in this JSON.")
best["_machineNotes"]["rubric"] = ("See rubric-database-query-model.md: every node must chain by @id, "
    "every fact must carry a named source and date, no unverified field may appear.")
# City node lookup by normalised name
city_by_name = {}
for n in best["@graph"]:
    if n.get("@type") == "City":
        city_by_name[n["name"].lower()] = n["@id"]
def city_ref(area_str, branch):
    base = re.sub(r",\s*(VA|WV|MD)$", "", area_str).strip()
    if branch == "martinsburg" and base.lower() == "eastern panhandle of west virginia":
        base = "Eastern Panhandle"
    ref = city_by_name.get(base.lower())
    return {"@id": ref} if ref else area_str
for node in best["@graph"]:
    if node.get("@type") == "Place":
        branch = "winchester" if "winchester" in node["@id"] else "martinsburg"
        node["areaServed"] = [city_ref(a, branch) if isinstance(a, str) else a for a in node["areaServed"]]
    elif node.get("@type") == "Organization":
        node["areaServed"] = copy.deepcopy(BOTH_PLACE)
    elif node.get("@type") == "Service":
        a = node.get("areaServed")
        if isinstance(a, list) and any(isinstance(x, str) for x in a):
            url = node.get("url", "")
            if "martinsburg-wv" in url:
                node["areaServed"] = [dict(MARP)]
            elif "winchester-va" in url:
                node["areaServed"] = [dict(WINP)]
            else:
                node["areaServed"] = copy.deepcopy(BOTH_PLACE)
        if node.get("@id") == "https://theflatratemovers.com/#service-gun-safe" and not node.get("description"):
            node["description"] = DESC["service-gun-safe"]
        if "military-government-moving" in node.get("@id", ""):
            node["description"] = ("Military and government moving at a guaranteed flat rate, "
                "planned around your schedule and quoted in writing before move day.")
dump(best, "best-json-entity-graph.json")

# ---------------- 4. SERVICES REGISTRY ----------------
svc = load(DATA / "services.json")
for s in svc["services"]:
    if s["id"] in DESC:
        s["description"] = DESC[s["id"]]
    # industrial/warehouse/it/transloading-winchester/senior/sir/gun-safe descriptions kept verbatim
dump(svc, "services.json")

# ---------------- 5. LOCATIONS REGISTRY ----------------
loc = load(DATA / "locations.json")
for b in loc["branches"]:
    fp = win_fp if b["id"] == "winchester" else mar_fp
    b["serviceAreaFull"] = list(fp)
    b["serviceAreaFullCount"] = len(fp)
dump(loc, "locations.json")

# ---------------- 6. DESCRIPTIONS REGISTRY ----------------
desc = load(DATA / "descriptions.json")
desc["entity-authority-layer"] = ("The entity authority layer \u2014 how The Flat Rate Movers establishes one authoritative entity: "
    "Organization, two Places, services and socials chained by stable @id and sourced to named sources.")
desc["knowledge-entities"] = ("Knowledge: entities \u2014 the Organization, Place and Service entities of The Flat Rate Movers defined, "
    "with founding, geo, hours, contact and a named source for each published fact.")
desc["sitemap"] = desc["sitemap"].replace("all 150 canonical pages", "all 153 canonical pages")
desc["areas-served"] = ("Areas served by The Flat Rate Movers \u2014 Winchester VA branch: 16 Google Business Profile areas within a 31-area footprint; "
    "Martinsburg WV branch: 14 areas within a 35-area footprint; plus the Shenandoah Valley, Eastern Panhandle and I-81, I-66, I-70 corridors.")
desc["knowledge-locations"] = ("Knowledge: locations \u2014 Winchester VA and Martinsburg WV defined as Places with address, geo, hours and "
    "per-branch Google Business Profile service areas: Winchester 16 areas within a 31-area footprint, Martinsburg 14 areas within a 35-area footprint.")
desc["service-areas-moving-company"] = ("Service areas per branch from Google Business Profile, within the full footprint \u2014 "
    "Winchester VA 16 areas within 31, and Martinsburg WV 14 areas within 35, plus the Shenandoah Valley, Eastern Panhandle and I-81, I-66, I-70 corridors.")
dump(desc, "descriptions.json")

# ---------------- 7. GEOJSON ----------------
geo = load(DATA / "service-area.geojson")
geo["rubric"]["note"] = ("Rubric R1-R7 from rubric.html, applied site-wide 2026-10-28. Per-feature rubric_score: 3 = GBP area or branch, verified; "
    "2 = expansion city, geocoded and verified, not a GBP area and without a dedicated page \u2014 see rubric_note on those features.")
for k, v in list(geo["rubric"].items()):
    if isinstance(v, str) and "attestations added" in v:
        geo["rubric"][k] = v.replace("attestations added", "source notes added")
for feat in geo["features"]:
    note = feat["properties"].get("rubric_note", "")
    if "no dedicated page yet" in note:
        feat["properties"]["rubric_note"] = re.sub(
            r"and it has no dedicated page yet \u2014 so R3 visible-match and R4 GBP attestation cannot yet be 3\. Do not present it as a GBP area\.",
            "and it has no dedicated page \u2014 so R3 visible-match and R4 source-check score 2. It is served as part of the branch footprint, not presented as a GBP area.",
            note)
dump(geo, "service-area.geojson")
print("wrote:", sorted(p.name for p in OUT.iterdir()))
print("entity nodes:", len(ent["@graph"]), "best nodes:", len(best["@graph"]), "head nodes:", len(head["@graph"]),
      "services:", svc["count"], "geo features:", len(geo["features"]))
