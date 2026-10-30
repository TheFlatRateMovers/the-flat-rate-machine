# Founding-date batch — GAP LIST (pre-edit, 2026-10-30)

Method: recursive sweep of every JSON/JSON-LD in (a) the Pages public
tree, (b) index.html JSON-LD embeds, (c) the ai repo at HEAD 1fb37c288748
(all 103 JSON blobs fetched + parse-verified), (d) the machine repo
canonical surfaces at HEAD 22137cf078 (data/, code/). A "gap node" = a
full node typed Organization / MovingCompany / LocalBusiness (or a type
list containing one) whose name/@id identifies The Flat Rate Movers LLC
or a branch, lacking "foundingDate". Fix value everywhere:
"foundingDate": "2010-06" (month precision, no day). No other fields
change anywhere.

## A. Site — dataset files: 12 files × 8 creator Organization stubs = 96
datasets-crating, datasets-final-mile, datasets-government,
datasets-industrial-commercial, datasets-industrial-offices,
datasets-ispm15, datasets-military, datasets-ocean-container,
datasets-piano-antique, datasets-residential, datasets-route81,
datasets-transloading. Stub shape: {@id #organization, @type
Organization, name, sameAs} under "creator" of each of the file's
8 graph nodes.

## B. Site — index.html embeds
- 21 embed occurrences of the 12 datasets above (byte-identical copies
  of the files; ispm15 x3, crating x3, piano-antique x3, route81 x3,
  military x2, final-mile x2, + 5 singles) = 168 embed stub nodes,
  fixed by splicing the edited file bytes into each embed.
- Head graph (embed block 0): 2 branch LocalBusiness nodes
  (#winchester, #martinsburg) lack foundingDate; the parent
  #organization node has it.

## C. Site — per-page JSONs: 32 branch LocalBusiness nodes in 30 files
28 files x 1: commercial-movers-winchester-va,
crating-movers-martinsburg-wv, final-mile-movers-martinsburg-wv,
government-movers-martinsburg-wv, government-movers-winchester-va,
gun-safe-movers-martinsburg-wv, gun-safe-movers-winchester-va,
industrial-commercial-movers-martinsburg-wv,
industrial-commercial-movers-winchester-va,
industrial-offices-movers-martinsburg-wv,
industrial-offices-movers-winchester-va,
international-export-packing-crating-winchester-va,
ispm15-movers-martinsburg-wv, local-regional-movers-martinsburg-wv,
local-regional-movers-winchester-va,
long-distance-movers-martinsburg-wv, military-movers-martinsburg-wv,
military-movers-winchester-va, moving-company-martinsburg-wv,
moving-company-winchester-va, office-moving-movers-martinsburg-wv,
office-moving-movers-winchester-va, packing-cost-winchester-va,
packing-movers-martinsburg-wv, packing-services-winchester-va,
piano-antique-movers-martinsburg-wv, sir-heavy-movers-martinsburg-wv,
transloading-movers-martinsburg-wv.
2 files x 2: interstate-66-corridor, interstate-70-corridor.
(In every case the same file's parent Organization LLC node already
carries foundingDate; only the branch node lacks it.)

## D. Site — ai-master-index.json: 2 nodes
Top-level "creator" Organization (The Flat Rate Movers LLC) and
@graph[0] Organization LLC node. (The index carries no self-digest
entry; the fix rides the normal digest-sign reseal.)

## E. AI repo — mirrors + files
- data/datasets-*.json: the same 12 files x 8 = 96 nodes (byte-mirrors
  of the site files; edited bytes pushed).
- data/ai-master-index.json: 2 nodes (mirror of D; pushed with reseal).
- schemas/: 26 branch nodes in 24 files — 22 files x 1
  (commercial-movers-winchester-va, crating-movers-martinsburg-wv,
  final-mile-movers-martinsburg-wv, government-movers-martinsburg-wv,
  government-movers-winchester-va, gun-safe-movers-martinsburg-wv,
  industrial-commercial-movers-martinsburg-wv,
  industrial-commercial-movers-winchester-va,
  industrial-offices-movers-martinsburg-wv,
  industrial-offices-movers-winchester-va,
  ispm15-movers-martinsburg-wv, local-regional-movers-martinsburg-wv,
  local-regional-movers-winchester-va,
  long-distance-movers-martinsburg-wv, military-movers-martinsburg-wv,
  military-movers-winchester-va, office-moving-movers-martinsburg-wv,
  office-moving-movers-winchester-va, packing-movers-martinsburg-wv,
  piano-antique-movers-martinsburg-wv, sir-heavy-movers-martinsburg-wv,
  transloading-movers-martinsburg-wv)
  + interstate-66-corridor x 2 + interstate-70-corridor x 2.
- Full Organization LLC nodes x 4: answer-engine.json,
  authority-index.jsonld, identity/root-entity.jsonld,
  protocols/protocol-relationships.jsonld. (answer-engine and
  authority-index are also sealed distributions — repo files are
  pushed BEFORE the reseal, per standing flow.)

## F. Machine repo canonical surfaces: ZERO gaps
data/entity-graph.json, data/best-json-entity-graph.json and
data/locations.json already carry foundingDate. code/site-shell/
index.html is the byte-identical shell copy of the site index.html
and is re-synced after the section-B edit (it is a sealed
distribution; pushed before the reseal).

## G. Dispositioned — NO edit (referenced-only / no full node)
- The other 13 datasets (both site files and ai mirrors): their org
  references are untyped reference stubs — counted exactly: 106
  creator stubs {@id, sameAs} and 128 pure {@id} publisher/provider
  refs. They resolve to the canonical #organization node, which
  carries foundingDate. No node fabricated.
- endpoint-definition.jsonld (ai): provider = {@type, @id} only.
- ai-catalog.json (ai + site) and .well-known/ard.json (site):
  contain no Organization node at all — nothing to attach the field
  to; no node fabricated.
- Machine repo out/** batch snapshots and out/phase-a staged copies:
  dated working history, not live surfaces (phase-a copies that carry
  org nodes already carry foundingDate — verified).

## H. EXCLUDED by standing rule — never overwritten
- ai repo data/entity-graph.json (gist-lineage file, blob SHA
  cda897e61319a0f52172ef1365402e4d7179cddf): its Organization node
  lacks foundingDate, but the file must NEVER be overwritten.
  Recorded here as a known, rule-bound exception.

## Totals to fix
96 (site datasets) + 168 (embeds) + 2 (head branches) + 32 (site page
JSONs) + 2 (site index) + 96 (ai mirrors) + 26 (ai schemas) + 4 (ai
org files) + 2 (ai index, via reseal) = 428 nodes.
Expected digest changes in the reseal: 12 datasets + 30 page JSONs +
shell + answer-engine + authority-index = 45 entries.
