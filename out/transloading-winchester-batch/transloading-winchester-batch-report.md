# Transloading Services — Winchester VA deep refresh — batch report (2026-10-29)

Deploy: https://fa1128a2.the-flat-rate-movers.pages.dev (9 files uploaded)
Live: https://theflatratemovers.com/transloading-winchester-va/
Indexing target (recorded only — no Search Console requests this batch): https://theflatratemovers.com/transloading-winchester-va/

## What shipped
- Canonical #service-transloading-winchester-va node completed identically in head graph (25), entity graph (33) and best graph (80): hub url added where missing (entity + head; best already carried it), full 682-character package description carried everywhere, Place chain #winchester/#martinsburg at the full footprint (31/35) unchanged. Exactly one Winchester node per graph. The generic #service-transloading node is byte-identical in every graph (verified by exactly-one-node-changed checks plus a direct before/after comparison of the generic node).
- datasets-transloading-winchester.json NEW (public JSON files 52 → 54, counting the Q15 ocean file below): W-D1–W-D8, 8 nodes retyped Dataset 4 / Service 2 / Article 2, CC BY 4.0 on the Dataset nodes, all dateModified 2026-10-29. In-div markup block on the Winchester page parse-equal to the served file. Developer "Transloading — Winchester data" card added after the IT data card.
- Q15 EXECUTED — ocean datasets live-serving fix: public/datasets-ocean-container.json placed byte-identical to the copy published in the ai repo (git blob c208450e8f57318a8fb3236e85b8a396d4418f50, 8 Dataset nodes). Live success test passes: the address now returns 200 + application/json with a matching blob hash; before this batch it returned the SPA page as text/html.
- Per-page JSON (transloading-winchester-va.json): ONLY the Service node replaced with the canonical node; expanded Place nodes (31/35) preserved byte-for-byte; Organization + BreadcrumbList untouched.
- ai-sitemap: Winchester service description refreshed to the canonical text; keywords 60 → 66 (+6 package query forms: transloading winchester va; transloading services virginia; transloading virginia port container; container unloading winchester va; virginia inland port transloading; port of virginia container services; none dropped). Services 23 / hasPart 155 unchanged.
- llms.txt: Winchester service line refreshed in place (canonical description + W-D1–W-D8 summary + file links); dated 2026-10-29 entry appended; history byte-identical. Data txt: dated 2026-10-29 entry appended.
- Rubric DB (in place, backup rubric.db in this batch's backup-2026-10-29/): service row description updated to canonical; attestation 103 → 107 (+4: canonical node, Winchester datasets published, per-page JSON refresh, Q15 ocean live-serving fix). service 32 / edge 40 / opening_hours 14 / service_area 66 / rubric_check 7 unchanged; integrity ok.

## Counts (unchanged by design — refresh, no new page or service)
Pages 155 / services 23 / sitemap 155 / head 25 / entity 33 / best 80 / ai-sitemap 23 services, 155 hasPart, 66 keywords.

## Reconciliation (merge-note steps vs live state)
- services.json Winchester entry (pageCount 1) + generic entry: (b) already satisfied, verified — not rewritten.
- pages.json Winchester entry present, status live: (b) already satisfied.
- descriptions.json Winchester entry present: (b) verified present, unchanged (page meta description artifact, not the graph description).
- Merge-note count assumptions (153 pages / 22 services / entity 39 / best 74 / head 24): (c) stale — pre-redo, pre-storage/senior/IT. Reconciled to the live baseline (155/23; entity 33, best 80, head 25, keywords 60); the batch moves no count.
- Entity graph node (gains url + full staged description): (a) done as written — url added, 347-char live text replaced with the full 682-char package description.
- Best graph node (gains full staged description; url present): (a) done as written — description swapped in place.
- Head graph node (gains url + full description; 7 corridor-inclusive areaServed strings KEPT): (c) corrected end state — the full-site redo had already replaced the 7 strings with the canonical Place chain (#winchester/#martinsburg) before this package merged; the node was completed with url + the package description on that chain. No strings were reintroduced (they would have forked the head node from the other two graphs).
- Generic node (entity: Martinsburg-pointed string areas; best: absent — leave): (c) description of live state is stale (post-redo the entity generic node carries the canonical Place chain, and the best graph's transloading service node is the Martinsburg page's own node under its page @id) — disposition is unchanged: (b) untouched, byte-identical verified in all three graphs.
- Q12 datasets file approval: (a) executed — datasets-transloading-winchester.json + page markup + Developer entry, per the parent brief's standing full-propagation rule.
- Q13 Place @id reconciliation: (b) already satisfied — every live file (head, entity, best, per-page JSON) and the package schema.json itself use the canonical #winchester / #martinsburg @ids; no rename needed, no duplicate Place nodes created.
- Q14 machine Place footprint expansion (16/14 → 31/35): (b) already satisfied by the redo — verified 31/35 in entity, best, and per-page JSON; the staged GBP 16/14 lists were NOT applied anywhere.
- Q15 ocean datasets live-serving: (a) EXECUTED in this merge per the parent brief — see "What shipped". Success test: live 200 + application/json, blob-identical to the ai-repo copy.
- DB rubric_check row proposed by the merge-note: (c) NOT added — rubric_check is a 7-row catalog; per-service rows are never added (standing rule). DB edge rows: (b) none added (zero fragment-service edges by design).
- ARD catalog entry: (c) unchanged — ai-catalog.json carries no per-category entries (standing precedent).
- pageMeta verify: (b) svc already points at #service-transloading-winchester-va; unchanged.
- §8 gated items Q1–Q9 (terminals/ramps, TWIC status, container pricing basis, drayage performer, chassis source, reefer, bonded/FTZ/customs, equipment, flat rack/OOG, handled container types): honored — unclaimed; they appear in the datasets only as explicit non-claims. Pricing in all new content is "quoted per job" only — zero CWT, zero dollar figures, zero rates of any kind in this batch's new blocks.

## Retype mapping (datasets-transloading-winchester.json)
W-D1 Winchester Transload Operations → Service · W-D2 Cross-Dock, Decon & Restack Operations → Dataset · W-D3 Winchester Container Equipment Reference → Dataset · W-D4 Winchester Port Chain & Corridor Dispatch → Dataset · W-D5 Winchester Commercial Terms & Cost Avoidance → Article · W-D6 Winchester Buyer Personas & Trigger Events → Article · W-D7 Handling, Protection & Compliance Boundaries → Service · W-D8 Winchester Service Areas, Dispatch & Quote Path → Dataset. No FAQPage node (the W-D source carries no discrete Q&A pairs; the page's existing FAQ is unchanged visible copy).

## Gate results
Backups first (out/transloading-winchester-batch/backup-2026-10-29/, unpushed); all merge preconditions asserted against live state before any write; build ran clean on first execution. node --check BOTH inline scripts OK (885 + 124,113 chars); all 14 index ld+json blocks parse (13 + the new in-div block); in-div block parse-equal; verify.js 71/71 PASS; router gate CLEAN pre-build and post-build (pageMeta 155 keys == router array 155 entries, sets exactly equal, no repairs). Forbidden scans: zero in every new published block — including zero "CWT" and zero "$" anywhere in the batch's new content; index-wide deltas vs backup all 0→0 (attest/USDOT/Spearman/Around Town/DESIGN 6/Bristow/subcontract); branches distinct everywhere; R7 pattern-checked on the live payload only — no quote test post.

## Live verification (no sampling)
- datasets-transloading-winchester.json → 200 + application/json; 8 nodes; 4 Dataset / 2 Service / 2 Article; all dateModified 2026-10-29; CC BY 4.0 on all Datasets.
- datasets-ocean-container.json (Q15) → 200 + application/json; 8 Dataset nodes; served bytes hash to the ai-repo blob c208450e… — byte-identical.
- Live head (25), entity (33), best (80): exactly one #service-transloading-winchester-va each — hub url https://theflatratemovers.com/transloading-winchester-va/, full 682-char description, Place-chain areaServed; generic #service-transloading node identical to the pre-batch backup in entity + best (+ head).
- Live transloading div datasets block parse-equal to the live datasets file; Developer "Transloading — Winchester data" card present.
- Live transloading-winchester-va.json → 200 + application/json; Service node canonical (682); Places 31/35 preserved.
- ai-sitemap live 23/155/66, Winchester description 682 chars; sitemap live 155 locs; llms + data txt dated entries live.
- Route proofs (live payload carries div + pageMeta key + router entry): /transloading-winchester-va/, /senior-moving/, /videos/, /moving-and-storage/, /warehouse-relocation/, IT page — all good.
- Regression sweep: ALL 54 public JSON files → 200 + application/json + valid JSON, zero exceptions (incl. the new datasets-transloading-winchester.json and the Q15 datasets-ocean-container.json).
- Index: tagline present, CTA ×391, 0 "DESIGN 6", quote markers intact.
- One transient: the first live fetch of the new datasets file, seconds after deploy, returned the SPA fallback (edge propagation); an immediate re-check and every later check returned the JSON file. No action needed.

## Pre-existing condition flagged (not introduced by this batch)
The ocean datasets file served under Q15 is byte-identical to the copy published in the ai repo since deploy batch 1. Its commercial-terms node cites the industrial-commercial CWT schedule (Unload $8.00/CWT, Load $10.00/CWT, APU $12.00/CWT, Residential/Driver Meet $400–$425 per man) inside an explicit non-claim passage — the schedule is quoted only to state that a per-container/per-CWT rate for standalone container unloads is NOT claimed and that whether the schedule extends is an open question. The Q15 fix changes only the file's live-domain serving, not its content; revising that passage is a separate decision, not part of this merge.

## GitHub (before this batch)
theflatratemovers-ai HEAD 99d469ccc07370647c595dccb17611b436da5e45 · the-flat-rate-machine HEAD 59a54b6cc3607a2a6f77fe6e691d01c7fc4a23a8 · gist graph data/entity-graph.json SHA cda897e61319a0f52172ef1365402e4d7179cddf (2,486 B) — verified before pushes; never overwritten. (Commit hashes + read-back in the batch handoff.)

## Indexing target (record only)
- https://theflatratemovers.com/transloading-winchester-va/
