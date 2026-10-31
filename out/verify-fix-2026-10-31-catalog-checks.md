# Verify re-expression — Batch 4a Catalog Checks (2026-10-31)

Two existing assertions and one new section, all in one motion with
the data change they assert (the estate rule: a check may only be
re-expressed in the same motion as the data change, and only toward
strictly stronger assertions).

## D-2 (dataset discoverability, §14) — identifier assertion

Before: an intent collection node's identifier passed when it was a
PropertyValue object with propertyID 'DOI' and value
'10.5281/zenodo.23818766'.

After: the identifier must equal the string
'https://doi.org/10.5281/zenodo.23818766' exactly.

Why: reconciliation Element 4 build input 5 puts the concept DOI in
URL form on its holder nodes (the form DataCite and schema.org
consumers resolve directly). Exact string equality is strictly
stronger than the two-field PropertyValue match it replaces: it pins
the scheme, the resolver host and the full identifier, and admits no
second field that could drift.

## D-5 (dataset discoverability, §14) — live DOI assertion

Same re-expression as D-2, on the live-fetched intent dataset: the
four collection nodes' identifiers must each equal the DOI URL
string. The landing-title half of D-5 is unchanged.

## New §21 — DC-1..DC-5 (dataset catalog checks)

Added, asserting Dossier 04 / Element 4 build inputs 1, 2, 5, 6, 7
over the local deploy tree (P-3 proves served == local after
deploy). DC-2's four exceptions (self-reference, the index entry,
the per-page landing-unit entry, and the republication-cycle entry)
are each verified mechanically inside the check, never waived: a
self entry must carry NO sha256, an index entry must carry NO
sha256, a landing-unit entry is identified by the per-page pairing,
and a republication entry is accepted only when the target route
document provably embeds the containing graph (node @id-set
equality). DS-RESOLVE (build input 8) is deliberately NOT a per-run
check: it is a C5-cadence live run, recorded in the batch record.

## DC-5 holder identity (noted during the batch's own test loop)

DC-5 identifies holder nodes by @id, not by object identity, so the
verbatim route-document copies of the intent graph are asserted to
carry the DOI URL form as well, instead of being flagged as extra
carriers or, worse, exempted. The assertion surface grew; nothing
was waived.

