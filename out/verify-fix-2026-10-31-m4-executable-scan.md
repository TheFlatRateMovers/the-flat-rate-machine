# Verify fix record — M-4 executable-lines scan, 2026-10-31

Context: the reliability batch (`out/batch-reliability-2026-10-31/`,
design `out/reliability-design-2026-10-31/DESIGN.md` §B D4) added
verify.js §17 checks M-1..M-5 via the helper
`scripts/check-machinery.py`. The batch gate closed at 109/110 with
M-4 as the sole failure, and the batch stopped before its step 10
per the estate rule (a batch that fails any check does not deploy).
This record is the decision and the re-expression that closes it,
under the standing stale-check rule: rewrite the check to test the
intended property, stricter — never waive it (precedent:
`out/verify-fix-2026-10-31-per-route-shell.md`).

No check was weakened, deleted, or waived. One check is
re-expressed to test the property it exists for. The suite stays
at 110 checks.

## What M-4 as written tested

As designed (D4) and first implemented, M-4 was a raw substring
scan: the full text of `scripts/*.py`, `scripts/*.js`, `verify.js`
was searched for three per-batch literals
(`batch-intent-rubric-v2-live`, `batch-per-route-shell-live`,
`batch-naming/.venv`), expecting zero hits. Raw text includes
comments, so the scan tested "no stale path is *mentioned*
anywhere in the file", not the property M-4 exists for: "no stale
path can be *executed* by live tooling" (the registry is the only
file allowed to name an `out/` path — a rule about live path
resolution, per design incident 1/3).

## The one hit, and why it is provenance text, not behavior

Exactly one hit across the 21 scanned files:
`scripts/build-routes.js` line 3, inside the file's `/* */` header
comment:

```
2026-10-31; design: out/batch-per-route-shell-live/records/DESIGN.md).
```

It is a historical provenance pointer recording where the file's
design lives — the same kind of text as this record and every
batch record. A comment is never parsed as a path, never resolved,
never executed; nothing in the estate reads it. Editing the file
to delete it was not an available resolution inside the batch: the
comment sits in a sealed distribution, the design's files-touched
list excludes `build-routes.js`, and the batch's reseal was
required to change exactly 2 digests (achieved). Retiring the
literal was rejected for the opposite reason: the literal names a
real per-batch folder, and a future compiled-in default pointing
at it is exactly incident 1 recurring — the scan must keep
watching for it in executable code.

## The re-expression

M-4 now scans the same file set (21 files: `scripts/*.py`,
`scripts/*.js`, `verify.js`) and the same three literals, over
**executable lines only**: each file's comments are blanked
char-for-char (length and newlines preserved) before scanning —
JS `//` and `/* */`, Python `#` — by a string-aware stripper in
`scripts/check-machinery.py`:

- String literals, template literals, and docstrings are copied
  verbatim: their contents are executable text and stay scanned
  (a stale literal inside a string still fails M-4 — the ingest
  tool's own pre-D1 state carried literals in code and docstring,
  and both remain in scope).
- `${ }` expressions inside templates are processed as code,
  nested templates via a frame stack.
- Regex literals are consumed verbatim (escapes and `[...]`
  classes tracked; a `/` opens a regex only where a term can
  start — after operators/punctuators or a regex-preceding
  keyword, never after an operand). This is load-bearing on this
  codebase: `/\//g` (build-intent-rubric.js) and `/^\/\/…/`
  (build-routes.js) place an escaped slash directly before the
  closing slash, and a comment-stripper without regex tracking
  blanks the rest of those lines.

`check-machinery.py` is an unsealed bootstrap file (design D4
bootstrap rule: the checker must be changeable without resealing
what it checks), so this edit required no reseal; `verify.js` is
unchanged, and the sealed index/JWS still hash to the batch's
resealed pair (`fba8dc6c…` / `2b607380…`) after the edit.

## Why coverage of executable code is unchanged

The scan's inputs shrink by exactly one category: comment text.
Every executable line in the same 21 files is still scanned for
every one of the three literals, and string/docstring contents —
where a compiled-in path default would actually live — are still
scanned. Validation before the gate was re-run:

- 67 stripper assertions pass: literals planted in JS/Python
  comments are hidden; literals planted in code, strings,
  docstrings, and templates are still found; division is not
  mistaken for regex; regexes are not mistaken for comments.
- On the real file set, stripping preserves byte length and
  newline count on all 21 files (only comment characters are
  blanked), the raw scan still finds the one historical hit, and
  the executable scan finds zero.

The re-expression is stricter in precision, which is the
direction the stale-check rule requires: M-4 now tests exactly
"no stale per-batch path can execute", so a provenance comment
can never again false-fail the suite (blocking a clean batch),
and no future stale default in code can hide behind the argument
that the check only ever policed mentions.

## Result

verify.js §17 after the re-expression: M-1..M-5 all PASS
(M-4 detail: "21 live tooling files scanned (executable lines,
comments stripped), zero stale per-batch path literals").
Full suite result and the batch's step-10 cadence are recorded
in the continuation appended to
`out/batch-reliability-2026-10-31/records/BATCH-RECORD.md`.
