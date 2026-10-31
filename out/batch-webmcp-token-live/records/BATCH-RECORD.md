# Batch WebMCP Token Live — Record (2026-10-31)

The WebMCP origin trial token (issued 2026-10-31, registration
7465121002645618689, record at
~/workspace/theflatratemovers/webmcp-origin-trial.md) is embedded in
the site shell, re-sealed under the certificate, deployed, and
verified live. The token is public by design — it ships in the
page head. Trial: feature WebMCP, origin
https://theflatratemovers.com:443, expiry 1806364800
(2027-03-29); renewal is a cadence item ahead of that date.

## What shipped

- ONE line added to the shell `<head>`, immediately after the
  charset meta:
  `<meta http-equiv="origin-trial" content="TOKEN">` — the token
  copied programmatically from the registration record (never
  retyped) and validated by decoding its payload before embedding
  (origin + feature + expiry all match the record).
- The whole-shell diff vs the pre-batch backup is exactly that one
  added line — nothing else moved.
- Shell: 5,034,430 → **5,034,682 B**; md5
  33c6f797edb78422072242d67328de9f → **5a468125486b336432e47add3f6a0331**.
- Pages copy, batch repo-dir canonical copy, and the staged mirror
  copy are byte-identical (same md5).

## Invariants held

- Quote-form segment md5 `4d8d49f05b22b129eac623a41370d9cb` —
  byte-identical before and after.
- All three executable inline scripts byte-identical before/after
  (md5s 51e19ed8…, 71493024…, 9cb4f28f… — helpers, router, WebMCP
  layer) and `node --check`-clean on both sides of the edit.
- Router / pages / pageMeta untouched: 204 pages, sitemap 236 locs,
  intent rows 2,736.
- No content changes, no new pages, no quote test posts, no GSC
  cron edits.

## Seal

- Single pass: digest-index 259/259 filled, 0 gaps; digest-changed
  == exactly {site shell}; zero non-digest field changes; top-level
  index fields identical; label "Entity Graph — Site (38 nodes)"
  intact. Distributions stay **259**.
- Standalone verify-provenance over the sealed tree BEFORE deploy:
  JWS verified, payload canonical, **259 match / 0 mismatch /
  0 unresolved — PROVENANCE OK**.
- Live ai-master-index.json / .jws byte-identical to the sealed
  copies after deploy.

## Deploy + live verification

- Pages deployment: https://14823425.the-flat-rate-movers.pages.dev
  (3 files uploaded, 309 static total).
- Served https://theflatratemovers.com/ carries the exact meta tag
  with the exact token (programmatic exact-match, exactly 1
  occurrence). /datasets/intent-coverage/ and
  /transloading-vs-cross-docking-vs-deconsolidation/ serve 200 with
  their own content from the new shell.
- verify.js full run post-deploy: **99/100** — the sole failure is
  P-6, naming exactly the outstanding shell mirror (repo-served
  4,994,644 B vs signed index 5,034,682 B; 17/18 repo-served
  digests match). P-6 is pre-existing, was not edited or waived,
  and turns green when the mirror lands (parent route, below).
  P-5 passes at 259 distributions / 204 per-page JSONs; §13, §14
  and §15 W-1..W-3 all pass against the served page (log:
  records/verify-postdeploy.log).

## API cadence

- Bundle refreshed against the new seal (signed-index digest
  matches 37/37 compared; intent rows 2,736, 98 with evidence);
  tests 34/34; worker redeployed — version
  `3c805d1c-4bf3-427f-add7-c337572ede6b`. Live: /v1/verify
  match:true (source live); /v1/intent total 2,736.

## llms.txt / data txt decision

- NOT changed. The WebMCP batch's precedent was full propagation
  for a shipped capability (the tools layer itself, described in
  dated entries at launch). The trial token changes no capability
  and no content — it is an activation mechanism for the already
  described layer, and the enrollment is already fully recorded in
  webmcp-origin-trial.md and this record. Churning two signed
  surfaces for a note would add digest churn with no
  machine-consumer value, so both files stay byte-identical and
  out of the seal's changed set (proven by the seal assertion:
  the shell is the ONLY digest change).

## Pushes

- AI repo: ONE push — data/ai-master-index.json +
  data/ai-master-index.jws (the re-sealed index copies). Final
  HEAD confirmed by read-back in the delivery report.
- Machine repo: ONE push — this record, plus the WebMCP batch
  record re-synced (its closing addendum, written 2026-10-31, had
  never landed remotely — remote copy was 15,648 B vs local
  17,474 B; it rides here per the record-sync pattern its own
  addendum announced).
- Pre-push key-content grep across both push trees: 0 hits. The
  Ed25519 private key never left its custody path.
- Gist-based ai-repo data/entity-graph.json blob
  cda897e61319a0f52172ef1365402e4d7179cddf: not in either push;
  re-confirmed at read-back.

## OUTSTANDING — the machine-repo shell mirror (parent route)

- `code/site-shell/index.html` is NOT in this batch's machine push:
  the sealed shell (5,034,682 B; JSON-escaped payload above the
  connector's measured ceiling band 5,261,194–5,303,103 chars) is
  deterministically 413-blocked, as established in the N5/N6 batch.
- The exact final shell is staged at
  `out/batch-webmcp-token-live/work/push-machine/code/site-shell/index.html`
  (md5 5a468125486b336432e47add3f6a0331, 5,034,682 B) for the
  parent's GitHub web-upload route. A single push/upload of that
  one path lands the mirror and turns P-6 green.
- State until then: **PENDING-PARENT-UPLOAD**. The shell bytes are
  LIVE on Pages and sealed in the signed index; only the repo
  mirror is behind — the same honest state the N5/N6 record
  closed with, carried forward one shell revision.
