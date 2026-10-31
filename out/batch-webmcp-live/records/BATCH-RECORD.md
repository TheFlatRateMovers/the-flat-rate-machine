# Batch record — WebMCP Agent Tools Live (2026-10-31)

Batch dir: `out/batch-webmcp-live/` (backup/, files/, records/, work/, repo-dir/).
Order: Henry's approval 2026-10-31 ("Approve: build the WebMCP agent tools
as the next batch"), fired when the Intent Rubric v2 deploy closed
(ai HEAD a3fa99f2, machine HEAD aa84b8c0, 257 distributions, verify.js
97/97, API worker 932e3166). Standard: the FULL doctrine — full data, full
propagation, all three audiences, live = done, never fabricated.

Trigger: Henry's PageSpeed Insights run on https://theflatratemovers.com/
showed the Agentic Browsing category at 4/4 passed audits (accessibility
tree well-formed, CLS 0, llms.txt follows recommendations, ARD manifest
valid) with three UNSCORED / not-applicable items, all because the site's
pages register no WebMCP tools: "WebMCP form coverage", "WebMCP tools
registered", "WebMCP schemas are valid". The estate's server-side MCP at
api.theflatratemovers.com/mcp (6 tools) does not satisfy these page-level
audits — they inspect the document in the browser.

## STEP 0 — Research (from primary sources, before coding)

Sources: Chrome for Developers — WebMCP Imperative API (published
2026-05-18, updated 2026-10-16), WebMCP Declarative API (updated
2026-09-25), WebMCP best practices; Lighthouse audit docs — "Registered
WebMCP tools", "Forms missing declarative WebMCP", "WebMCP schema
validity" (developer.chrome.com/docs/lighthouse/agentic-browsing/).

### Imperative API — current shape
- Entry point is **`document.modelContext`** (secure contexts only).
  `navigator.modelContext` is the deprecated pre-rename location; resolve
  `document.modelContext || navigator.modelContext` and feature-detect —
  absent provider = complete no-op.
- `await document.modelContext.registerTool(tool, options?)` where
  tool = `{ name, description, inputSchema, annotations?, execute }`.
  `inputSchema` is a JSON Schema object. `execute(args, { signal })`
  returns the result (Chrome's current examples return strings).
  Unregister via an `AbortSignal` passed in options. `getTools()` /
  `executeTool()` / `toolchange` events also exist.
- `annotations`: `readOnlyHint` (no state change), `untrustedContentHint`
  (output contains untrusted content), `consequentialHint` (significant /
  non-reversible action — triggers mandatory user confirmation),
  `debugging` (Chrome 156+). All seven tools in this batch are read-only:
  `{ readOnlyHint: true, untrustedContentHint: false,
  consequentialHint: false }`.
- Availability: WebMCP is a W3C Web Machine Learning Community Group
  draft, in Chrome origin trial (Chrome 149+; local testing via
  chrome://flags/#enable-webmcp-testing). NOT a finished standard. The
  implementation below is the standards-track shape behind full
  feature-detection: it activates wherever the API is exposed (origin
  trial, flag, or agent browsers) and is a no-op everywhere else. No
  origin-trial token is embedded: trial enrollment is an owner account
  action, recorded here as the one remaining activator for stock Chrome.

### Declarative API — form annotations
- `<form toolname="…" tooldescription="…">` registers the form as a tool;
  the browser derives the input schema from its fields (labels, or
  `toolparamdescription` on individual fields, refine it). Removing
  either attribute unregisters the tool; attributes may also be set at
  runtime to register dynamically (best-practices doc).
- Invocation semantics (the decisive fact for the hard line): when an
  agent invokes a declarative form tool, **the browser brings the form
  into focus and populates its fields; the form remains visible to the
  user, and submission is left to the user**. Submission on invocation
  happens ONLY if the form carries the separate **`toolautosubmit`**
  attribute. `SubmitEvent.agentInvoked` is true only when a form is
  triggered by an agent (i.e. via toolautosubmit).
- Therefore an annotation form exists that identifies without enabling
  submission: toolname + tooldescription, NO toolautosubmit anywhere,
  plus a defensive `agentInvoked` guard in the submit handler (below).

### How the three Lighthouse audits detect (audit docs, verbatim rules)
- **webmcp-registered-tools** (informational): lists all tools
  registered on the page via either API; empty list = nothing shown;
  warning if more than 40 tools. Our count: 7 imperative + 2 declarative
  = 9.
- **webmcp-form-coverage** ("Forms missing declarative WebMCP",
  informational, no warnings for now): identifies `<form>` elements that
  don't have BOTH `toolname` and `tooldescription`. The shell contains
  exactly two forms: `#heroQuote` and `#quoteForm`.
- **webmcp-schema-validity** (pass/fail): FAILS if a form has one of
  toolname/tooldescription but not the other; FAILS if **a required form
  field is missing a `name` attribute**; WARNS if an optional field has
  a name but no `toolparamdescription` and no associated `<label>`.
  Estate fact: NO field in either form carries a `name` attribute today
  (all capture is by `id`; the string "FormData" appears 0 times in the
  shell, so `name` attributes are inert for the site's own logic). Any
  annotation must therefore also supply `name` (= the field's id) and
  `toolparamdescription` for every field, or the batch would convert a
  not-applicable audit into a FAILING one. Both forms wrap every field
  in a `<label>`, which independently satisfies the warning leg.

### Form disposition (decided from the research + Henry's hard line)
The hard line: the quote form is NEVER agent-submittable; no quote test
posts ever. The quote-form byte segment (`<form id="quoteForm"…</form>`,
md5 `4d8d49f05b22b129eac623a41370d9cb`) must stay byte-identical — so
`#quoteForm` cannot be annotated in the HTML at all.
- `#heroQuote` (hero card): annotated in the HTML (form tag + field
  names/descriptions). Proof it cannot submit anything: its submit
  handler calls `e.preventDefault()`, reads the three values, sets
  `location.hash='#/quote'` and prefills the real form — there is no
  network call in the handler at all; the settled configuration is that
  the hero card cannot submit. Even an agent-triggered submit of this
  form transmits nothing. No `toolautosubmit`.
- `#quoteForm` (the real form): annotated AT RUNTIME by the WebMCP
  script, and only when a modelContext provider exists (zero DOM change
  in browsers without WebMCP): the script sets `toolname` /
  `tooldescription` on the form and `name` (= id, only where absent) +
  `toolparamdescription` (derived from each field's own label text) on
  every field. Its file bytes — and the segment md5 — do not change.
  Submission through the annotation is impossible by construction:
  (1) `toolautosubmit` is never set, in markup or at runtime, so tool
  invocation fills and focuses only, per the documented semantics;
  (2) defense in depth — the form's existing submit handler gains one
  guard line: if `e.agentInvoked` is true, return immediately (the
  handler already begins with `e.preventDefault()`), so even a future
  spec change that let an agent trigger submission would send nothing;
  (3) the handler's behaviour for every human submission is unchanged.
  The honeypot control is not inside either `<form>` element and is
  never exposed as a tool parameter.

## Build plan (as executed)

A third executable `<script>` block is added immediately before
`</body>` in `public/index.html` (mirrored to the canonical machine-repo
shell copy), registering seven READ-ONLY tools backed by the estate's
own sealed data via `https://api.theflatratemovers.com`:
`search_services`, `get_service`, `list_service_areas`, `find_dataset`,
`search_intent`, `verify_certificate`, `get_quote_guidance` — each with
a valid JSON Schema input, a plain-language description written for an
AI reader, deterministic read-only behaviour and graceful failure text.
No tool writes, submits, sends, or transacts anything.
Full propagation in the same motion: dated llms.txt entry + dated
data-txt entry; the shell is re-sealed (digest→sign) with verify.js;
verify.js gains §15 (W-1..W-3) asserted against the served page (record:
`out/verify-fix-2026-10-31-webmcp.md`).

## Pre-flight facts (measured 2026-10-31, before edits)
- Quote-form segment md5 (regex `<form id="quoteForm"[\s\S]*?</form>`):
  `4d8d49f05b22b129eac623a41370d9cb` — canonical. Segment length 8,065 B.
- Shell: 4,976,705 B; executable inline scripts: 2 (helpers + router);
  JSON-LD blocks: 76. Router pages array == pageMeta keys == 202 (v2).
- PSI API "before" state: the keyless pagespeedonline endpoint answered
  `Quota exceeded for quota metric 'Queries' … consumer
  'project_number:583797351490'` — the shared anonymous quota is
  exhausted; recorded verbatim. (Henry's own PSI run is the "before"
  visual state: 4/4 passed, 3 WebMCP items not applicable.)
- Headless registration check via the local Chromium binary
  (/opt/meta-chromium/chrome, 155.0.8059.80): NOT achievable — the
  binary refuses CLI startup ("Hatch WebGL domain policy is required
  for browser startup"); it is the harness browser and is not driven
  outside the browser-task route. Verification therefore runs as a
  Node functional test of the exact shipped script against a
  spec-shaped mock provider + the live API (see files/), plus
  served-page assertions after deploy. Visual PSI confirmation is
  pending a browser pass; stated plainly in the delivery report.

## What shipped

- **Registration layer live** in the site shell (third executable script,
  immediately before `</body>`): seven read-only WebMCP tools —
  `search_services`, `get_service`, `list_service_areas`, `find_dataset`,
  `search_intent`, `verify_certificate`, `get_quote_guidance` — each with
  a valid JSON Schema input, plain-language AI-reader descriptions,
  `readOnlyHint: true` / `consequentialHint: false` annotations, and
  graceful failure text. Data comes from the estate's own sealed
  surfaces via api.theflatratemovers.com and /service-area.geojson.
  Feature-detected on `document.modelContext || navigator.modelContext`;
  a complete no-op where WebMCP is absent.
- **Form coverage, both forms, zero submission risk:**
  - `#heroQuote` annotated in markup (toolname `start_flat_rate_quote` +
    tooldescription; `name` + `toolparamdescription` on all 4 fields).
    Its handler transmits nothing by construction (preventDefault +
    in-page navigation + prefill only).
  - `#quoteForm` annotated at runtime by the layer, only when a
    modelContext provider exists: toolname `request_flat_rate_quote` +
    tooldescription; every field gains `name` (= its id, only where
    absent) and a `toolparamdescription` derived from its own label.
    No `toolautosubmit` is set anywhere, in markup or at runtime, and
    the form's submit handler now refuses agent-invoked submits
    (`if (e.agentInvoked) { return; }` directly after its existing
    `e.preventDefault()`). The form's file bytes never changed.
- **Full propagation in the same motion:** dated update entries appended
  to llms.txt and the-flat-rate-movers-data.txt; verify.js gains §15
  (W-1..W-3, record `out/verify-fix-2026-10-31-webmcp.md`); the shell is
  re-sealed under the same certificate.

## Gates run

- Quote-form segment md5 `4d8d49f05b22b129eac623a41370d9cb` before AND
  after every edit (build script asserts both); the full-shell diff vs
  the pre-batch backup shows exactly the three intended edit classes
  (hero annotation, one guard line, the new script block) and nothing
  else — router pages array and pageMeta literals byte-identical ⇒
  router == pageMeta == 202 stands.
- `node --check` passes on all three executable inline scripts.
- Functional test of the exact shipped script (Node vm, mock provider,
  LIVE API): 29/29 — registration set exact; schemas structurally valid;
  execute() proven against live data (gun-safe search/detail, Bristow →
  Winchester branch, 53-area footprint, intent rows total 2,732,
  certificate verify match:true); legacy `navigator.modelContext`
  fallback registers; no-provider path never touches the DOM; a throwing
  registration is isolated (6/7 still register, annotation still runs).
- Seal: digest-index 257/257 filled, 0 gaps; digest-changed == exactly
  {site shell, llms.txt, verify.js}; zero non-digest field changes;
  top-level index fields identical; standalone verify-provenance over
  the sealed tree: **PROVENANCE OK 257/257**. Distributions stay 257 —
  the layer rides inside the shell's existing distribution.
- Pre-deploy verify.js: 97/100 — the only failures W-1/W-2/W-3 against
  the still-old SERVED shell (pure live-state ordering; W-2's detail
  confirms the live quote segment md5 was already canonical).

## Deploys

- Pages: deployment https://53fc6e29.the-flat-rate-movers.pages.dev
  (5 files uploaded, 307 total). Served-page assertions on
  https://theflatratemovers.com/ all pass: all 7 tool descriptors
  present, `document.modelContext` layer present, hero form annotated,
  `toolautosubmit` absent, served quote-form segment md5 canonical,
  agentInvoked guard served. (Served bytes differ from the sealed
  source shell from char 338 onward — the middleware's per-route head
  injection, the estate's documented disposition; the seal covers the
  canonical shell copy.) Spot routes /quote/ and
  /datasets/intent-coverage/ return 200.
- API worker: UNCHANGED — the tools consume the API as-is; no data it
  serves changed, so the cadence rule does not trigger a redeploy.
  Version stays `932e3166-d6a4-43c3-a61f-64526ad2bd38`.
- Push divergence checks (snapshot procedure): remote blob SHAs at
  HEAD for all six pre-existing push paths equal the pre-change local
  copies' blob SHAs exactly (ai index 935afd25… == backup); the two
  record files are new paths. Pre-push key-content grep across both
  push trees: 0 (asserted in the closing addendum with the HEADs).

## Proof — PageSpeed / Agentic Browsing

- PSI API (keyless pagespeedonline endpoint), before AND after: the
  shared anonymous consumer quota is exhausted — verbatim response:
  "Quota exceeded for quota metric 'Queries' and limit 'Queries per
  day' of service 'pagespeedonline.googleapis.com' for consumer
  'project_number:583797351490'". No API key exists for this estate and
  none may be invented. The API route therefore cannot expose the
  agentic category today.
- Local headless check: not achievable — the only Chromium binary on
  this machine is the harness browser, which refuses CLI startup
  outside the browser-task route.
- What IS proven: registration by construction + execution (29/29
  functional tests against the live API, §15 W-3 re-executes the SERVED
  script in the permanent suite), and the served page carries the layer
  (W-1/W-2). Expected PSI state once a browser pass runs it: tools
  registered flips from not-applicable to listing 9 tools (7 imperative
  + 2 declarative); form coverage lists no uncovered forms (both forms
  carry toolname + tooldescription — the quote form's are present in
  the DOM in any WebMCP-capable browser, which is the environment the
  audit runs in); schemas valid passes (descriptors validated; every
  form field named and described). **Visual PSI confirmation is pending
  a browser pass** — stated plainly, per the brief. One further
  activator for stock Chrome outside PSI: WebMCP is an origin trial —
  trial enrollment for the origin is an owner account action and was
  not performed; the layer activates wherever the API is exposed
  (trial, flag, or agent browsers) and is inert elsewhere.
