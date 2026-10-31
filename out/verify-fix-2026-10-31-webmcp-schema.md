# verify.js fix record — §15 W-4 (2026-10-31, Batch WebMCP Schema Fix)

## The defect W-4 guards

PageSpeed (2026-10-31 07:51 EDT, report 7z1txwtiwc) failed ONE Agentic
Browsing audit — "WebMCP schemas are invalid" — with a single issue:
`form#quoteForm`, "Form level `tooldescription` attribute is missing",
even though the attribute is present in the final DOM and the
registered tool carries the description.

Root cause (full diagnosis in
`out/batch-webmcp-schema-fix-live/records/BATCH-RECORD.md`): the
schema-validity audit does not read the DOM. Lighthouse's
`webmcp-schema-validity` audit consumes the `WebMcpSchemaIssues`
artifact, which its gatherer builds by APPENDING DevTools
`Audits.issueAdded` GenericIssue events during the run. Chrome files
`FormModelContextMissingToolDescription` at the instant it observes
the connected `#quoteForm` carrying `toolname` but not yet
`tooldescription` — the shipped WebMCP script set the two attributes
in two sequential `setAttribute` statements on the in-document form.
Issues are never retracted, so the failure survives the correction
that lands one statement later. The markup-annotated `#heroQuote`
(connected from parse with both attributes) produced no issue.

## The fix being guarded

The WebMCP script now annotates `#quoteForm` while the form is
DETACHED from the document and reinserts the same node at its exact
original position inside the same synchronous block (finally-guaranteed
reinsertion). The connected form is only ever observed fully
annotated — the parser case. Quote-form segment bytes untouched
(md5 `4d8d49f05b22b129eac623a41370d9cb`; W-2 unchanged).

## What W-4 asserts (against the SERVED shell)

It executes the served WebMCP script in a vm against an instrumented
fake DOM whose form records every attribute state observable while
the form is CONNECTED, and requires ALL of:

- all 7 imperative tools still register with the form present;
- ZERO connected snapshots carrying exactly one of
  toolname/tooldescription (the issue-generating state);
- the detach → annotate → reinsert ordering in the op log, with no
  form attribute set before the detach;
- the form ends connected, `toolname = request_flat_rate_quote`,
  tooldescription present;
- every field ends with `name` = its id and a `toolparamdescription`.

Teeth, proven before deploy with the same harness: the ORIGINAL
shipped script produces exactly 1 half-annotated connected state
(mirroring the single PSI issue); the fixed script produces 0. W-4
therefore fails against the pre-fix served page and passes against
the fixed one. The check extends §15 stricter (W-1..W-3 untouched);
totals move 100 → 101 checks.
