# Verify fix 2026-11-01 — §13c check I-10 (intent landing per-page JSON sync pin)

Batch: Intent Landing Stale-Counts Fix (Retrieval Machine follow-on,
all-true rule). One check ADDED; no check removed, weakened, or
waived. Suite 132 -> 133 checks.

## Why

`dataset-intent-coverage.json` — the intent dataset landing page's
per-page JSON — is a batch-authored artifact (dataset-discoverability
batch, 2026-10-30) with NO standing generator. Its @graph[0]
description was a copy of the dataset file's @graph[0] description at
authoring time (v1: "1218 generated rows … 28 services, 167 pages",
dateModified 2026-10-30). `scripts/build-intent-rubric.js` then
regenerated the dataset file repeatedly through rubric v2 (2,962
rows / 209 pages at this batch), and landing re-syncs updated the
shell div's embedded dataset graph — but nothing re-derived the
per-page JSON, so the copy diverged silently and stayed live,
including baked into the /datasets/intent-coverage/ route document's
head (build-routes.js bakes the per-page JSON verbatim).

## The check

§13c **I-10** asserts, from the local public tree:

- per-page JSON @graph[0].description is byte-equal to
  datasets-intent-coverage.json @graph[0].description;
- per-page @graph[0].dateModified >= the dataset file's;
- neither stale figure ("1218 generated rows", "167 pages") appears
  anywhere in the per-page JSON.

Fail-closed: a missing file or field is a FAIL via the wrapping
try/catch, never a skip. Any future rubric regeneration that moves
the dataset description now fails this gate in the same batch that
ships it, until the per-page copy is re-synced — the divergence
mechanism is closed, not just the string.

## Same-motion source fixes (this batch)

- Per-page JSON @graph[0]: description set to the dataset file's
  current verified text verbatim; dateModified 2026-10-30 ->
  2026-11-01.
- Shell intent landing div prose: the div's own count strings
  "2906" -> "2962" (3 occurrences — the no-comma form E5-B1's
  sync-intent-div.py missed when it moved the comma forms). The
  div prose is the text the answer-evidence fragments quote; AE
  regenerated in this batch's fixpoint now quotes 2962.
