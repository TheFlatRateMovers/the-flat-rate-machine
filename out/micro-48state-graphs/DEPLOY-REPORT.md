# MICRO-BATCH 48-STATE GRAPHS — DEPLOY REPORT (2026-10-29)

48-state workforce-coverage sentences for the dataset + graph surfaces
(Henry's all-AI-surfaces audit), WITH the provenance re-sign the byte
changes require. Standing authorization; staged at
out/micro-48state-graphs/. Pages deployment d50dcf02 (6 files uploaded).

## Edits (parsed-diff gated)

EDIT 1 — datasets-industrial-commercial.json: EXACTLY 2 diffs in the whole
file, both descriptions, no spatialCoverage or anything else touched:
- /@graph[7] (#dataset-industrial-commercial-areas-dispatch).description
  += " Workforce deployment coverage — a separate scope within this
  service: the Specialized Workforce Labor service deploys teams to jobs
  in all 48 contiguous United States, quoted per job. That nationwide
  workforce deployment coverage attaches to the workforce service only;
  it does not change the branches' 52-area moving footprint above, which
  governs the moving services."
- /@graph[3] (#dataset-industrial-commercial-deployment).description
  += " Deployment under the service's workforce layer (Specialized
  Workforce Labor) covers all 48 contiguous United States, quoted per
  job — a workforce deployment scope distinct from the branches' 52-area
  moving footprint."
Copies moved in the same motion: site public/ file, ai-repo data/ copy,
and the index.html embedded copy (JSON-LD block 26) — post-edit the embed
parse-equals the updated file exactly (diff paths identical: [3] + [7]).

EDIT 2 — graph set: EXACTLY 1 diff per file, canonical node only:
- #service-industrial-commercial description += " The service's workforce
  layer, Specialized Workforce Labor, carries workforce deployment
  coverage in all 48 contiguous states, quoted per job — a nationwide
  workforce scope distinct from the branches' 52-area moving footprint."
Files: entity-graph.json (/@graph[15]), best-json-entity-graph.json
(/@graph[83]), index.html head graph (block 0, /@graph[19]) — head
canonical node parse-equals the entity-graph canonical node post-edit;
ai-repo mirrors data/entity-graph-full.json +
data/best-json-entity-graph-full.json (byte-identical streams). Untouched
per order: the two branch-scoped IC nodes in the best graph, every
areaServed, and the gist data/entity-graph.json (blob SHA re-confirmed
cda897e61319a0f52172ef1365402e4d7179cddf after the push).

EDIT 3 — PROVENANCE RE-SIGN: digest-index.py re-ran over the edited
public/ bytes + the 5 ai-repo digest sources re-fetched at HEAD dab9447f
(all 5 byte-identical to the P1 snapshots): 35/35 complete, 0 gaps.
Index diff vs the P1-signed index = EXACTLY 3 digest entries changed:
- Entity Graph — Full (92 nodes): d3e7ccaea117…/39076 → afe27a7b119a…/39305
- Best JSON Entity Graph:          e7236fe2612e…/60891 → c70d150cb965…/61120
- Industrial & Commercial Services Datasets: cb0173475587…/31546 → f7345ef147c9…/32143
sign-index.py re-signed (kid theflatratemovers-2026-10-29-1, canonical
16,600 bytes). ai-master-index.json + .jws redeployed to the site and to
ai-repo data/. Pre-push gate: "-----BEGIN" = 0, "PRIVATE KEY" = 0,
custody filename = 0 across all push paths; private key read only from
its custody path by the tools, never copied or printed.

## Verification (all live)
- Sentence counts on live fetches: graph sentence exactly 1× in each of
  entity-graph.json, best-json-entity-graph.json, and live index.html;
  D8 sentence 1× and D4 sentence 1× in the live dataset file and in live
  index.html. Live-vs-pre-batch parsed diff of index.html = only blocks
  0 + 26, only the 3 intended description paths; live embed parse-equals
  the live dataset file. (Live HTML bytes differ from public/ bytes by
  Cloudflare edge injection — parsed equality is the verified level,
  same as prior batches.)
- Public-only verify-provenance.py (JWKS + index + JWS + all 30
  site-served packs fetched fresh from theflatratemovers.com + 5 repo
  files from raw.githubusercontent at the new HEAD): PROVENANCE OK —
  35/35 digests match the LIVE served bytes.
- verify.js FINAL: 75/75 PASS (incl. P-2 signature valid over the served
  index, P-3 30/30 site digests match live bytes).
- Quote-form segment md5 unchanged: 4d8d49f05b22b129eac623a41370d9cb
  (old == new); everything in index.html outside the two edited JSON-LD
  blocks is byte-identical by construction and verified.
- node --check: both executable inline scripts pass (unchanged set).
- Forbidden sweep on shipped content: Spearman 0, Around Town 0,
  Bristow 0. JSON parse on every touched file: pass.
- Counts unchanged: pages 156 (live sitemap 156 locs), services 23,
  datasets 25 files / IC dataset 8 nodes, best graph 92 nodes, rubric
  190 (untouched), per-page JSONs 82/156 (no page changes).

## HEADs
- ai: dab9447fdfb453ff27d798271ebafb6ec8dcd4e8 → 2d04d6b8f3b7e63112f840bc17da1fd343a92144 (5 files, data/)
- machine: 3883bc8a8b38a9b8d328e89221d183fb65e8690e → (this record push; read back at deploy)

## Deviations
- None in scope or content. One process note: fetching /index.html
  directly returns an empty body on this estate (root / serves the
  document); live HTML verification was performed against
  https://theflatratemovers.com/ — recorded so no future batch mistakes
  the empty /index.html fetch for missing content.
