# Batch RACKING WORDING UPDATE — Deploy Record (2026-10-30)

Purpose: correct the LIVE warehouse racking relocation estate to Henry's 2026-10-30
answers Q2–Q5 (the racking batch had shipped with the staged boundary wording;
Henry then answered: Q2 anchoring — YES, performed by crews; Q3 permits/engineering —
the company consults and engages CERTIFIED CONTRACTORS for those scope elements;
Q4 rack types/heights/mezzanines — NO exclusions, any scope the client wants;
Q5 pattern — crew or certified contractors per client). Q1 (crews disassemble +
reassemble) was already live and stands. NO rollback; wording corrected in place.

## The correction (old → new position)

OLD (shipped in the racking batch, now removed everywhere): racking "reinstalled …
against the customer's engineered drawings and permits; the company does not perform
rack engineering, seismic calculation or permit approval"; anchoring framed as set
by the customer's drawings only; the warehouse-Relocation dataset's non-claims listed
"racking teardown or reinstall as a company service" as unpublished/unclaimed.

NEW (live everywhere): teardown, transport, reinstallation AND floor anchoring are
performed by the company's crews (frames set, leveled, plumbed and anchored; anchor
type, size and torque per the project's LARC drawings). Where a project requires
engineering, seismic calculation or permits, the company consults and arranges them
through the certified contractors it engages — full scope inside the one flat-rate
engagement, no rack type, height or mezzanine exclusion. HARD LINE KEPT: the company
itself holds NO engineering licensure and NO permit authority — the certified
elements rest with the engaged contractors. Damaged components still never
re-erected; market figures still labeled market context; price still quoted per job
at one flat rate.

Canonical new service sentence (all graph/service surfaces): "Racking is torn down,
transported, reinstalled and anchored to the floor by the company's crews, to the
manufacturer's specification and ANSI MH16.1 / RMI guidance. Where a project requires
engineering, seismic calculation or permits, the company consults and arranges them
through the certified contractors it engages, so the full scope — any rack type,
height or mezzanine configuration — is handled inside the one flat-rate engagement;
the engineering and permit authority itself rests with those certified contractors."

## Files touched (53 replacements: 49 scripted + 4 follow-up instances)

- public/index.html — 26 scripted (service sentence ×2 [head graph + embed], FAQ
  short forms, warehouse-dataset embed W1–W3, full page div: hero, boundaries
  paragraph, spec-table anchoring row, "What we do for you" line, process steps
  2 + 7, reuse paragraph, standards paragraph, section heading + paragraph,
  FAQ answer, footer boundary line, pageMeta description) + 2 follow-up (process
  step (2) "project's engineered drawings"; D4 cost-model permit/engineering line
  re-attributed to arranged certified-contractor work).
- public/warehouse-racking-relocation.json — service sentence ×1.
- public/datasets-warehouse-racking-relocation.json — 8 scripted + 2 follow-up
  (D1 operations, D2 process chain steps 7–8 + step (2), D4 cost model,
  D6 compliance incl. its explicit non-claims list).
- public/datasets-warehouse.json — W1–W3: racking teardown/reinstall removed from
  the non-claims lists; compliance node now points to the racking dataset as a
  published company service.
- public/entity-graph.json, public/best-json-entity-graph.json, public/ai-sitemap.json,
  public/llms.txt (service entry + dated 2026-10-30 update note), public/the-flat-rate-movers-data.txt
  (dated update note) — service sentence/fragment updated ×1–2 each.
- Machine data/services.json, data/entity-graph.json, data/best-json-entity-graph.json,
  out/phase-a/ai-sitemap.json, out/phase-a/llms.txt — same updates; FLAT graph mirrors
  synced by cp from machine data copies.
- AI repo data/entity-graph-full.json + data/best-json-entity-graph-full.json —
  fetched at HEAD f034ad4f (blob SHAs verified: bde43550…, f8729bff…), service
  sentence replaced ×1 each, pushed from staged copies.
- functions/head-data.js — regenerated (diff limited to the racking entry's
  description + embedded page JSON, plus the generator header line).

Deliberately LEFT unchanged: gun-safe re-anchoring copy (different service, on-request
is correct there); the racking dataset D5 persona line about dealers selling "the
steel and the engineering" (describes dealers); the replacement-components purchasing
passages (page FAQ + dataset terms + rubric row — a cost-responsibility fact: damaged
components are the customer's purchase; Henry's answers did not change who pays for
replacement steel); market cost figures; intent query strings (search phrasing, not
claims); the senior dataset's unrelated "not published for this company" line
(facility-staff coordination).

## Rubric (rubric.db, backed up first)

- CORRECTED IN PLACE: the "Standards boundary published:" attestation row — claim now
  states crews perform teardown/transport/reinstall/anchoring, engineering/seismic/
  permits are consulted on and arranged through certified contractors the company
  engages, the company holds NO engineering licensure/permit authority, manufacturer/
  R-Mark non-claims retained; source carries the dated 2026-10-30 correction note.
- ADDED 2 rows: "Anchoring published: …" (source: Henry Q2) and "Engineering &
  permits published: …" (source: Henry Q3+Q4). Attestations 273 → 275. The
  'services.json id' evidence count invariant holds at 26.
- Intent rubric regenerated: 1,176 rows, 0 excluded, rows digest
  17869c3357cc6de12ba3b26f50d993e683cc850922b44a8df787ab8e309d0a8a; dataset installed
  to public/ and re-sealed (pass 2).

## Seal (distributions stay 214; digest-only)

- Pass 1 set-diff vs the FF&E-sealed index: added 0, removed 0, digest-changed
  exactly 10: ai-sitemap.json, llms.txt, entity-graph.json, best-json-entity-graph.json,
  datasets-warehouse-racking-relocation.json, datasets-warehouse.json,
  warehouse-racking-relocation.json, shell (code/site-shell/index.html),
  code/pages-functions/head-data.js, tools/gen-head-data.js. 0 gaps.
- Pass 2 (after intent regeneration): digest-changed exactly 1
  (datasets-intent-coverage.json). Signed under kid theflatratemovers-2026-10-29-1.
- verify-provenance.py over local bytes: PROVENANCE OK (214 match, 0 mismatch).

## Gates

- node --check on both executable inline scripts of index.html: PASS. All edited
  JSON files parse; all 41 ld+json blocks in the shell parse.
- Quote-form segment md5 unchanged: 4d8d49f05b22b129eac623a41370d9cb (asserted in
  apply script and re-asserted pre-deploy).
- Router 164==164 (pageMeta untouched by this wording batch; head-data regenerated
  at 164 entries, 0 problems).
- verify.js: pre-deploy 87/88 (sole failure I-5, live-state — resolved by deploy);
  post-deploy 87/88 with sole failure P-6 (repo-served digests vs live bytes —
  resolved by this batch's GitHub pushes, which carry the new shell/head-data/
  gen-head-data bytes; re-run after pushes is the closing check).
- Live verification: all 26 scripted NEW strings present across the live racking
  surfaces (page, per-page JSON, both datasets, llms.txt, data txt) and all 26 OLD
  strings absent; zero live occurrences of "does not perform rack engineering",
  "customer's engineered drawings", "your engineered drawings" (racking surfaces).

## Deploy

- wrangler Pages deploy from ~/workspace/the-flat-rate-movers-pages:
  https://33bae41e.the-flat-rate-movers.pages.dev (266 files; 12 uploaded +
  Functions bundle). No quote test posts.

## GitHub (one push per repo, back-to-back)

- Pre-push HEADs: ai f034ad4f, machine e768b751. Gist blob
  cda897e61319a0f52172ef1365402e4d7179cddf untouched (never overwritten).
- AI paths (10): llms.txt, ai-sitemap.json, the-flat-rate-movers-data.txt,
  data/datasets-warehouse-racking-relocation.json, data/datasets-warehouse.json,
  data/entity-graph-full.json, data/best-json-entity-graph-full.json,
  schemas/warehouse-racking-relocation.json, data/ai-master-index.json,
  data/ai-master-index.jws.
- Machine paths (9): code/site-shell/index.html, code/pages-functions/head-data.js,
  tools/gen-head-data.js, data/services.json, data/entity-graph.json,
  data/best-json-entity-graph.json, out/phase-a/ai-sitemap.json,
  out/phase-a/llms.txt, this record. (No verify-fix note — no check was rewritten
  in this batch. _middleware.js and verify.js are byte-unchanged and not pushed.)
- Counts unchanged: pages 164, services 26, datasets 28, distributions 214,
  STATIC_FILES 266, rubric attestations 275, intent rows 1,176.
