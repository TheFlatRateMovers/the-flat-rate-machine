# Batch record — WebMCP Schema Fix Live (2026-10-31)

Batch dir: `out/batch-webmcp-schema-fix-live/` (records/, work/).
Order: the single remaining PageSpeed Agentic Browsing failure after the
WebMCP Token batch. Standard: the FULL doctrine; the quote-form segment
is owner-protected (segment md5 must remain
`4d8d49f05b22b129eac623a41370d9cb`).

## The failure (real-environment proof)

PageSpeed run 2026-10-31 07:51 EDT (report
https://pagespeed.web.dev/analysis/https-theflatratemovers-com/7z1txwtiwc):
Agentic Browsing 5/6. The origin-trial token works; "WebMCP tools
registered" lists all 9 tools (7 imperative + 2 declarative);
"WebMCP form coverage" PASSES; accessibility tree / CLS 0 / llms.txt /
ARD pass. The single FAILED audit is "WebMCP schemas are invalid",
with exactly one issue row: Element = `form#quoteForm`; Issue =
"Form level `tooldescription` attribute is missing. Add it to describe
the tool for AI agents." The audit's own element snippet shows the form
WITH `tooldescription="The Flat Rate Movers quote form. Filling this in
prepares a flat rate quot…"` present, and the tools-registered audit
lists `request_flat_rate_quote` WITH that description. The
markup-annotated `#heroQuote` produced NO issue. Only the
runtime-annotated `#quoteForm` was flagged.

Pre-state (from the brief, spot-verified at batch start): 204 pages ·
236 sitemap locs · 259 distributions · PROVENANCE OK 259/259 ·
verify.js 100/100 · intent rows 2,736 · API worker
3c805d1c-4bf3-427f-add7-c337572ede6b · shell 5,034,682 B, md5
`5a468125486b336432e47add3f6a0331` (matches the live file at batch
start).

## DIAGNOSIS (recorded before any fix, per the brief)

### 1. How the shipped script annotates #quoteForm

The WebMCP layer is the shell's third executable script (an IIFE
immediately before `</body>`). Inside the provider-exists branch —
`if (!mc || typeof mc.registerTool !== 'function') return;` — it first
registers the seven imperative tools in a synchronous `forEach`, and
THEN, synchronously, in the same task, annotates the form. Nothing is
deferred to an event, a promise, or a fetch. The annotation itself is
two sequential statements (verbatim from the shipped script):

```js
      form.setAttribute('toolname', 'request_flat_rate_quote');
      form.setAttribute('tooldescription', 'The Flat Rate Movers quote form. …');
```

followed by the field loop (each field gains `name` = its id, then a
`toolparamdescription` derived from its own label). So the annotation
ORDER is: toolname first, tooldescription second, field attributes
last — each `setAttribute` a separate operation on the CONNECTED,
in-document form.

### 2. How the Lighthouse schema audit actually reads annotations

From the Lighthouse source (GoogleChrome/lighthouse @ ac1b8fa6,
fetched and read for this batch):

- `core/audits/webmcp-schema-validity.js` does NOT inspect the DOM. It
  consumes a dedicated artifact, `WebMcpSchemaIssues`, mapping each
  browser-reported issue's `errorType` (here
  `FormModelContextMissingToolDescription`) to the failure text. Its
  own description: "Please fix any errors or warnings **reported by
  the browser**."
- `core/gather/gatherers/webmcp-schema.js` collects those issues from
  the DevTools Protocol **`Audits.issueAdded`** event stream
  (`GenericIssue` / `genericIssueDetails`) during the navigation. It
  only ever APPENDS (`this._issues.push(details)`); there is no
  retraction path anywhere in the pipeline — an issue emitted at any
  instant of the run is in the final report, even if the condition is
  corrected a microsecond later. The issue's element snippet is
  resolved AFTER the run, from the LIVE DOM node
  (`resolveNodeIdToObjectId` + `pageFunctions.getNodeDetails` at
  `getArtifact` time) — which is why the report's snippet shows the
  form's final, corrected state next to an issue about its transient
  state.
- By contrast: `webmcp-form-coverage` reads the `Inputs` artifact
  (final DOM attribute state — passes), and `webmcp-registered-tools`
  reads CDP `WebMCP.toolsAdded` events with latest-wins dedupe by tool
  name (`core/gather/gatherers/webmcp.js`) — the tool's final
  registration state carries the description (shows it). Google's doc
  page for the audit confirms the failure conditions (a form with
  `toolname` but missing `tooldescription` fails) but does not
  disclose the issue-stream mechanics; the source does.

### 3. The mechanism (explains BOTH observations)

Chrome processes a declarative form's WebMCP annotation per attribute
change, at the moment the change lands. When our script's FIRST
`setAttribute` lands, the connected form gains `toolname` and becomes
a form tool while `tooldescription` is not yet present — Chrome
validates that state and files a DevTools issue
`FormModelContextMissingToolDescription` against the form node. That
issue is permanent for the run. The SECOND `setAttribute` (a statement
later, same task) completes the pair: the registered tool gains its
description (tools-registered audit ✓, final-DOM snippet ✓, coverage
audit ✓) — but nothing retracts the already-filed issue, so the
schema audit, which reads ONLY the issue stream, fails the form.

Corroboration from the run itself: exactly ONE issue was filed — the
form-level description. No `FormModelContextMissingToolName` (by the
time `tooldescription` landed, `toolname` was already present) and no
parameter issues (each field's `name` is set by the very operation
that would be checked, and every field's description leg is satisfied
by its wrapping `<label>`). `#heroQuote`, annotated in the HTML
source, enters the document already carrying BOTH attributes — the
browser never observes a half-annotated state — and produced no
issue. The parser case proves the safe end-state: **a form that is
connected to the document only ever in its fully-annotated state
validates clean.**

### Fix class decision

- Order swap (tooldescription before toolname) is a GUESS: if
  Chrome's per-attribute processing validates on either attribute's
  change whenever the form is observed with exactly one of the pair,
  the swap merely trades the issue for `FormModelContextMissingToolName`.
  The evidence cannot exclude that model. Rejected.
- **Class A fix, adopted:** inside the WebMCP script block only,
  annotate the form while it is DETACHED from the document, then
  reinsert it at its exact original position in the same synchronous
  block (with a finally-guaranteed reinsertion). Attribute changes on
  a disconnected element cannot register it as a tool in the document;
  when it reconnects it is observed for the first time already
  carrying the complete annotation — byte-for-byte the `#heroQuote`
  parser case that produced no issue. This holds under every trigger
  model consistent with the observations. The element node itself is
  never replaced (same node out and back), so its addEventListener
  submit handler — including the `agentInvoked` guard — its field
  values, and its identity are untouched; the whole operation happens
  inside one synchronous task during initial parse, before any paint
  or interaction, so nothing visual or functional can interleave. If
  the form has no parent (not connected), the script falls back to
  direct annotation (the previous behaviour) rather than skipping.
  The quote-form segment's file bytes are not touched; segment md5
  and W-2 are unaffected.
- Class C drive-by (ordered in the brief): the `search_intent` tool
  description hardcodes "2,732 published rows" — stale (2,736 live,
  growing). Reworded to drop the hard count; the tool itself returns
  live counts. No other description changes.
- verify.js §15 gains W-4, asserting the MECHANISM against the served
  page: it executes the served WebMCP script in a vm against an
  instrumented fake DOM whose form tracks every attribute state the
  browser could observe while the form is CONNECTED, and fails if any
  connected snapshot carries exactly one of toolname/tooldescription
  (the issue-generating state), or if the detach/reattach ordering is
  absent. The unfixed served page fails W-4 by construction — the
  check has teeth before the fix and passes after it. Record:
  `out/verify-fix-2026-10-31-webmcp-schema.md`.

## What shipped (fix class A + C, as diagnosed)

Diff vs the pre-batch shell (backed up at `work/index.html.pre-batch`,
md5 `5a468125486b336432e47add3f6a0331`, 5,034,682 B) — confined to the
WebMCP script block; scripts 0 and 1 byte-identical; the whole-shell
diff is exactly these two edit classes:

1. **Fix A (script block only).** The `#quoteForm` annotation now runs
   on the DETACHED form: the script records the form's parent and next
   sibling, removes the form from the document, runs the annotation
   (the original statements and field loop, unchanged, wrapped in a
   local `annotate` function), and reinserts the SAME node at its
   exact original position inside a `finally` — reinsertion is
   guaranteed even if annotation throws; if the form has no parent,
   it annotates directly (previous behaviour) rather than skipping.
   An in-code comment states the mechanism and points at this record.
2. **Fix C (drive-by, ordered).** The `search_intent` description no
   longer hardcodes a row count: "…intent rubric: 2,732 published
   rows that map…" → "…intent rubric: published rows that map…". The
   tool returns live counts from the API. No other description
   changed.

New shell: 5,036,301 B, md5 `64ca6dbbe49908ae32a4c2c7aad39e91`.
Quote-form segment md5 `4d8d49f05b22b129eac623a41370d9cb` before AND
after. `node --check` passes on all three executable scripts.

Mechanism proof (instrumented fake-DOM harness, same model as W-4):
the ORIGINAL script produces exactly **1** half-annotated connected
state (mirroring the single PSI issue); the FIXED script produces
**0**, with op order removeChild → set toolname/tooldescription while
disconnected → insertBefore; the form ends connected and fully
annotated, all fields named and described, all 7 tools registered.

## verify.js §15 extension

W-4 added (record `out/verify-fix-2026-10-31-webmcp-schema.md`):
executes the SERVED WebMCP script against an instrumented fake DOM
and asserts the mechanism — zero half-annotated connected states,
detach/annotate/reinsert ordering, full final annotation. W-1..W-3
unmodified; W-2 unmodified (segment protection intact). Suite totals
100 → 101 checks. Pre-deploy run against the still-old served page:
**100/101, sole failure W-4** (half-annotated connected states=1 —
the check reproduces the PSI failure in-suite). Post-deploy:
**100/101, sole failure P-6** (see below); W-1..W-4 all pass against
the served page, W-4 reporting half-annotated connected states=0.

## Seal

Single pass: digest-index 259/259 filled, 0 gaps; digest-changed ==
exactly {site shell, verify.js}; zero non-digest field changes;
top-level index fields identical; label "Entity Graph — Site
(38 nodes)" intact. Distributions stay **259**. Standalone
verify-provenance over the sealed tree before deploy: JWS verified,
payload canonical, **259 match / 0 mismatch / 0 unresolved —
PROVENANCE OK**. Live ai-master-index.json/.jws byte-identical to the
sealed copies after deploy (served digests reconcile in the suite's
P-checks).

## Deploys

- Pages: deployment https://19b7b9f1.the-flat-rate-movers.pages.dev
  (3 files uploaded, 309 static total). Served-page assertions all
  pass: origin-trial meta present exactly once; served WebMCP block
  carries the detach/reinsert fix; "2,732" absent, new wording
  present; `toolautosubmit` absent; served quote-form segment md5
  canonical.
- API cadence: bundle refreshed (signed-index digest matches 37/37
  compared; intent rows 2,736, 98 with evidence); tests 34/34; worker
  redeployed — version `b29238a1-4947-4754-b0f4-1df20fc5b2d8`. Live:
  /v1/verify match:true (source "live") against the new seal;
  /v1/intent total 2,736.
- P-6 state: post-deploy it names the repo-served copies that lag the
  new seal — the site shell (staged for the parent's upload route,
  below) and verify.js (closed by this batch's own machine push;
  a re-run after the push confirms P-6 narrows to the shell only).
  P-6 was not edited or waived.

## Pushes

_(closing addendum appended after read-backs; the addendum rides the
next estate batch's machine push, per the record-sync pattern.)_

## OUTSTANDING — the machine-repo shell mirror (parent route)

- `code/site-shell/index.html` is NOT in this batch's machine push:
  the sealed shell (5,036,301 B) exceeds the connector's payload
  ceiling (HTTP 413), the recorded transport exception.
- The exact final shell is staged at
  `out/batch-webmcp-schema-fix-live/work/push-machine/code/site-shell/index.html`
  (md5 `64ca6dbbe49908ae32a4c2c7aad39e91`, 5,036,301 B) for the
  parent's GitHub web-upload route. One upload of that path lands
  the mirror and turns P-6 fully green.
- State until then: **PENDING-PARENT-UPLOAD**. The shell bytes are
  LIVE on Pages and sealed in the signed index; only the repo mirror
  lags, as with the two preceding shell batches.
- Also the parent's: the PageSpeed re-run that proves the schema
  audit flips to pass in the real environment (this batch proves the
  mechanism in-suite via W-4 and by construction; the PSI visual is
  the remaining confirmation, as with the WebMCP and token batches).
