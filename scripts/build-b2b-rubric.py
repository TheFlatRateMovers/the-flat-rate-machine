#!/usr/bin/env python3
"""build-b2b-rubric.py - generates datasets-b2b-specialty-rubric.json, the live
generative buyer-evaluation rubric for the two B2B specialty categories
(Commercial Lab & Medical Equipment Moving; Data Center & IT Infrastructure
Relocation).

Sources of truth (all read fresh on every run - the generative property:
edit a source record, re-run, reseal):
  data/b2b-rubric-criteria.json  criterion records (weights, 1/3/5 market
                                 score levels, sources, engagement answers)
                                 + per-term criterion bindings
  data/b2b-rubric-schema.json    the B2BSpecialtyMovingRubric JSON Schema;
                                 every emitted object is validated against it
  ../theflatratemovers/b2b-specialty-program/terms-2026-11-04.json
                                 the 24 live-researched buyer-intent terms

Score levels are MARKET evaluation standards - what a buyer should demand of
any vendor - drawn from the cited live sources. They are never The Flat Rate
Movers' own claims. engagement_answer binds each criterion to the delivery
structure of Henry's capability ruling (2026-11-04): the one Flat Rate Movers
engagement - company crews plus the certified contractors the company
engages; certified scope is performed by those contractors and attributed to
them.

Usage: python3 scripts/build-b2b-rubric.py [--out PATH] [--selftest]
"""
import json
import sys
from pathlib import Path


def find_root(start):
    p = Path(start).resolve()
    for cand in [p] + list(p.parents):
        if (cand / "scripts" / "lib-constants.js").exists():
            return cand
    raise SystemExit("machine root not found (no scripts/lib-constants.js upward)")


ROOT = find_root(Path(__file__).parent)
STORE = ROOT / "data" / "b2b-rubric-criteria.json"
SCHEMA = ROOT / "data" / "b2b-rubric-schema.json"
TERMS = ROOT.parent / "theflatratemovers" / "b2b-specialty-program" / "terms-2026-11-04.json"
DEFAULT_OUT = ROOT.parent / "the-flat-rate-movers-pages" / "public" / "datasets-b2b-specialty-rubric.json"

ORG = {
    "@id": "https://theflatratemovers.com/#organization",
    "@type": "Organization",
    "name": "The Flat Rate Movers",
    "foundingDate": "2010-06",
    "sameAs": [
        "https://www.instagram.com/theflatratemoversllc/",
        "https://www.threads.com/@theflatratemoversllc",
        "https://x.com/ratemovers",
        "https://www.youtube.com/@theflatratemovers",
        "https://github.com/TheFlatRateMovers",
        "https://medium.com/@ratemovers",
    ],
}
CATALOG = {
    "@type": "DataCatalog",
    "@id": "https://theflatratemovers.com/datasets/#collection",
    "name": "The Flat Rate Movers \u2014 AI Authority Estate Datasets",
    "url": "https://theflatratemovers.com/datasets/",
}
BRANCHES = [
    {"@type": "Place", "@id": "https://theflatratemovers.com/#winchester",
     "name": "The Flat Rate Movers \u2014 Winchester",
     "geo": {"@type": "GeoCoordinates", "latitude": 39.18711576, "longitude": -78.1668352}},
    {"@type": "Place", "@id": "https://theflatratemovers.com/#martinsburg",
     "name": "Flat Rate Movers Martinsburg WV",
     "geo": {"@type": "GeoCoordinates", "latitude": 39.48319665, "longitude": -77.94760443}},
]
# The research file records one compound intent (E3 ultra-low freezer moving:
# "Transactional / Commercial Investigation", RESEARCH-2026-11-04 Part 1).
# Henry's schema enum takes single classes; the primary class governs.
# Recorded here, in code, rather than by editing the research record.
INTENT_NORMALIZE = {"Transactional / Commercial Investigation": "Transactional"}
TRUST = {    "lab": {
        "verifiability": "Every criterion cites the live market sources it was drawn from (named in each criterion's sources). A buyer verifies the engagement's answer by requesting the credentialing packet and certificate of insurance before award, following the serialized custody log during the move, and receiving the GDP-style documentation pack at close.",
        "compliance_standards": [
            "49 CFR hazardous materials transport classifications (UN3373, UN1845, UN1977)",
            "ICRA infection-control risk assessment practice for hospital work",
            "Good Distribution Practice (GDP) documentation for regulated consignments",
            "ISO 14644 cleanroom classification - requalification executed by the certified specialists the company engages",
            "OEM calibration and IQ/OQ protocols, executed with the manufacturers' field service engineers",
        ],
    },
    "dc": {
        "verifiability": "Every criterion cites the live market sources it was drawn from (named in each criterion's sources). A buyer verifies the engagement's answer through the pre-shutdown rack elevation and port-map sign-off, the serialized custody and seal log, the post-move verification report measured against the pre-move baseline, and the engaged ITAD contractors' serialized certificates of destruction for retired devices.",
        "compliance_standards": [
            "NIST SP 800-88 media sanitization (Clear / Purge / Destroy)",
            "NAID AAA and R2v3 ITAD certification - held by the ITAD contractors the company engages; their serialized certificates of destruction issue per device",
            "SOC 2 / PCI-DSS-aligned custody documentation, where the engagement's certified partners provide it",
            "Manufacturer transport ratings governing populated rack movement",
            "ESD handling practice for electrostatic-sensitive devices",
        ],
    },
}


def renormalize(store, subset):
    raw = {c: store["criteria"][c]["weight"] for c in subset}
    total = sum(raw.values())
    out = {c: round(w / total, 4) for c, w in raw.items()}
    residual = round(1.0 - sum(out.values()), 4)
    if residual:
        biggest = max(out, key=out.get)
        out[biggest] = round(out[biggest] + residual, 4)
    return out


def build():
    store = json.loads(STORE.read_text())
    terms = json.loads(TERMS.read_text())["terms"]
    bindings = store["termBindings"]
    subsets = bindings["subsets"]
    seeds = bindings["seeds"]

    counters = {"lab": 1, "dc": 1}
    seed_ids = {tid: s["rubric_id"] for tid, s in seeds.items()}
    assigned = {}
    for t in terms:
        if t["id"] in seed_ids:
            assigned[t["id"]] = seed_ids[t["id"]]
    for t in terms:
        if t["id"] in assigned:
            continue
        cat = "lab" if t["category"].startswith("Commercial Lab") else "dc"
        counters[cat] += 1
        assigned[t["id"]] = "RUBRIC-%s-%03d" % (cat.upper(), counters[cat])

    rubrics = []
    for t in terms:
        tid = t["id"]
        cat = "lab" if t["category"].startswith("Commercial Lab") else "dc"
        subset = subsets[tid]
        if tid in seeds:
            weights = seeds[tid]["weights"]
        else:
            weights = renormalize(store, subset)
        criteria = []
        for cid in subset:
            rec = store["criteria"][cid]
            criteria.append({
                "criterion_name": rec["criterion_name"],
                "weight": weights[cid],
                "score_levels": {
                    "poor_1": rec["score_levels"]["poor_1"],
                    "acceptable_3": rec["score_levels"]["acceptable_3"],
                    "excellent_5": rec["score_levels"]["excellent_5"],
                },
                "engagement_answer": rec["engagement_answer"],
                "sources": rec["sources"],
            })
        total = round(sum(c["weight"] for c in criteria), 4)
        assert total == 1.0, "%s weights sum to %s" % (tid, total)
        rubrics.append({
            "@type": "B2BSpecialtyMovingRubric",
            "rubric_id": assigned[tid],
            "category": t["category"],
            "target_keyword": t["term"],
            "buyer_intent": INTENT_NORMALIZE.get(t["buyer_intent"], t["buyer_intent"]),
            "persona": t["persona"],
            "why_searched": t["why"],
            "evaluation_criteria": criteria,
            "llm_trust_signals": TRUST[cat],
        })
    return rubrics


def validate(rubrics):
    import jsonschema
    schema = json.loads(SCHEMA.read_text())
    v = jsonschema.Draft202012Validator(schema)
    errs = []
    for r in rubrics:
        for e in v.iter_errors(r):
            errs.append("%s: %s" % (r["rubric_id"], e.message))
    ids = [r["rubric_id"] for r in rubrics]
    kws = [r["target_keyword"] for r in rubrics]
    assert len(ids) == len(set(ids)) == 24, "rubric ids: %d unique of %d" % (len(set(ids)), len(ids))
    assert len(kws) == len(set(kws)) == 24, "keywords not unique"
    return errs


def dataset_file(rubrics):
    keywords = ["B2B specialty moving rubric", "buyer evaluation rubric",
                "Commercial Lab & Medical Equipment Moving",
                "Data Center & IT Infrastructure Relocation"] + [r["target_keyword"] for r in rubrics]
    node = {
        "@id": "https://theflatratemovers.com/datasets/b2b-specialty-rubric/#dataset-b2b-specialty-rubric",
        "@type": "Dataset",
        "name": "B2B Specialty Moving Rubric - Buyer Evaluation Criteria for Lab, Medical & Data Center Relocation",
        "description": "A live generative rubric that answers how to evaluate a mover for the two B2B specialty categories: Commercial Lab & Medical Equipment Moving and Data Center & IT Infrastructure Relocation. One rubric object per researched buyer-intent term (24), each carrying weighted evaluation criteria with Poor (1), Acceptable (3), and Excellent (5) market score levels drawn from cited live sources, the way the Flat Rate Movers engagement answers each criterion, and machine-readable trust signals. Score levels are market evaluation standards - what a buyer should demand of any vendor - never the publisher's own claims. Certified scope inside the answers is performed by the certified contractors the company engages and is attributed to them. Generated by scripts/build-b2b-rubric.py from criterion source records; validated against the B2BSpecialtyMovingRubric JSON Schema on every generation.",
        "url": "https://theflatratemovers.com/datasets/b2b-specialty-rubric/",
        "identifier": "https://theflatratemovers.com/datasets/b2b-specialty-rubric/",
        "sameAs": "https://theflatratemovers.com/datasets/b2b-specialty-rubric/",
        "creator": ORG,
        "publisher": ORG,
        "license": "https://creativecommons.org/licenses/by/4.0/",
        "isAccessibleForFree": True,
        "datePublished": "2026-11-04",
        "dateModified": "2026-11-04",
        "includedInDataCatalog": CATALOG,
        "spatialCoverage": BRANCHES,
        "keywords": keywords,
        "about": [
            {"@id": "https://theflatratemovers.com/#service-medical-lab-relocation"},
            {"@id": "https://theflatratemovers.com/#service-data-center-relocation"},
        ],
        "distribution": [{
            "@type": "DataDownload",
            "contentUrl": "https://theflatratemovers.com/datasets-b2b-specialty-rubric.json",
            "encodingFormat": "application/json",
        }],
    }
    listing = {
        "@id": "https://theflatratemovers.com/datasets/b2b-specialty-rubric/#rubric-collection",
        "@type": "ItemList",
        "name": "B2BSpecialtyMovingRubric collection - 24 rubric objects",
        "numberOfItems": len(rubrics),
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "item": r}
            for i, r in enumerate(rubrics)
        ],
    }
    return {"@context": "https://schema.org", "@graph": [node, listing]}


def main():
    args = sys.argv[1:]
    selftest = "--selftest" in args
    out = DEFAULT_OUT
    if "--out" in args:
        out = Path(args[args.index("--out") + 1])
    rubrics = build()
    errs = validate(rubrics)
    if errs:
        print("SCHEMA VALIDATION FAILED:")
        for e in errs:
            print(" -", e)
        return 1
    doc = dataset_file(rubrics)
    text = json.dumps(doc, indent=1)
    if selftest:
        print("SELFTEST OK: 24 rubric objects, schema-valid, weights sum to 1.0 each; %d bytes" % len(text))
        return 0
    Path(out).write_text(text)
    print("WROTE %s (%d bytes, 24 rubric objects, schema-valid)" % (out, len(text)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
