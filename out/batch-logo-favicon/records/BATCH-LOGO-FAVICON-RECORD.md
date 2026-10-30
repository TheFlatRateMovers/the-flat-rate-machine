# Batch Logo + Favicon — Record — 2026-10-30

Baseline (post-racking, verified before edits): pages 163, services 25, datasets 27,
signed distributions 212, intent rows 1,155, router 163==163, machine HEAD 98ab7958,
ai HEAD c6a475d1. Local key files (shell, middleware, head-data) matched the signed
index digests; ai repo data/ai-master-index.json blob SHA equaled the local index's.

## What changed
- **Favicon set created + tagged.** favicon.ico (16/32/48), favicon-16x16.png,
  favicon-32x32.png, apple-touch-icon.png (180), android-chrome-192x192.png,
  android-chrome-512x512.png, site.webmanifest — resize-only from the 1024×1024 logo,
  installed at the site root. The empty `<link rel="icon" href="data:,">` in the shell
  head was replaced with the full tag set (ico + PNG sizes + apple-touch-icon +
  manifest). theme-color #0c2340 already existed and was kept. STATIC_FILES 257 → 264.
- **Logo declaration fixed.** The best graph's dead bare-string logo
  (https://theflatratemovers.com/assets/logo.png — verified live 404) was replaced with
  an ImageObject (real asset URL, width 1024, height 1024) in all three graph copies
  (site public, machine data, ai repo full graph). The same ImageObject was ADDED to
  every full Organization node (slogan-bearing) across the estate: 135 public files
  (124 by serialization round-trip + 11 by guarded text surgery), the index.html head
  graph, the site entity graph, the machine data entity graph, and the workspace
  ai-sitemap mirror — every other field byte-identical (parallel-structure guard on
  every file). Creator stubs (abbreviated references) intentionally untouched.
- **.wideph crop fixed.** Added `.wideph.logo-wide{object-fit:contain;background:#fff}`
  and reclassed all 32 logo figures (the audit found 32, not 2) so the square logo is
  no longer cropped by the wide-photo cover rule. Real photos keep `cover`.
- **Intent rubric consequence handled.** The logo edits changed 135 row-target JSON
  digests, so the intent generator was re-run (DB rows now carry the new digests;
  I-1 passes) and the regenerated datasets-intent-coverage.json installed; seal pass 2
  asserted ONLY that dataset's digest moved.
- **Workspace graph mirrors** (theflatratemovers/*.json) re-synced byte-identically
  with the machine data copies, per the verify.js invariant.
- head-data.js: regenerated during the batch, diffed, and RESTORED byte-identical —
  it embeds per-page JSON filenames, not content, so this batch changes nothing in it.

## Seal
Distributions 212 → 212 (no additions; assets are not distributions per P2 precedent).
Pass 1 set-diff: 137 digests changed == the edited set (135 JSONs + shell + middleware),
0 added, 0 removed, 0 gaps. Pass 2: only the intent dataset. PROVENANCE OK locally
(212 match / 0 mismatch / 0 unresolved) after each pass.

## Gates
Local gates OK (router 163==163, quote-form md5 4d8d49f05b22b129eac623a41370d9cb
unchanged, node --check clean on inline scripts + both function modules, ld+json
39/39 non-empty blocks parse — the empty #page-jsonld runtime slot is pre-existing
in the baseline and excluded with a dated note in the gate script).
verify.js: 85/88 at first run (2 graph-mirror invariants + I-1 — all fixed forward,
no check waived) → 87/88 pre-deploy (sole failure I-5, live bytes) → post-deploy
87/88 (sole failure P-6, repo bytes) → 88/88 after the pushes.

## Deploy + live verification
Wrangler deploy `1ee07b6b` — 264 files, 146 uploaded. Live: site.webmanifest serves
the correct document; the intent dataset serves the new digest (I-5 pass);
favicon.ico responds 200 with binary content (the text-fetch tool reports no
extractable content for the binary; contrasted with the explicit 404 the same tool
returned for the dead logo URL). Served-head tag presence is proven by the sealed
shell (P-3/P-6 digest chain over the exact deployed bytes) plus the local gate
assertions on that shell.

## Pushes (exactly one per repo, fired back-to-back per Henry's stacking request)
- theflatratemovers-ai: data/best-json-entity-graph-full.json, data/ai-master-index.json,
  data/ai-master-index.jws.
- the-flat-rate-machine: code/site-shell/index.html, code/pages-functions/_middleware.js,
  data/best-json-entity-graph.json, data/entity-graph.json,
  out/batch-logo-favicon/BATCH-LOGO-FAVICON-PLAN.md,
  out/batch-logo-favicon/records/BATCH-LOGO-FAVICON-RECORD.md.
Pre-push key-content grep over push paths: 0. Gist entity-graph blob
cda897e61319a0f52172ef1365402e4d7179cddf untouched.
