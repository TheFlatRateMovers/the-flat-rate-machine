# Verify fix record — 2026-11-01, batch E6-B2 (archive re-snapshot)

Two changes to verify.js, both in the direction of strictness; no
check weakened, deleted, or waived. Suite 139 → 140 checks.

## P-5 re-expression (certificate population)

Intended state changed by this batch's approved scope: the signed
index gains exactly ONE new distribution — the E6-B2 signed
verification report (ai-verification-report-2026-11-01-e6b2.json),
which the certificate-coverage directive requires to be sealed like
every other estate file. P-5's exact-count pin moves 491 → 492, and
the new report file joins the non-page exclusion set beside the
E6-B1 report (both reports are root-level JSON files that are not
per-page JSONs; without the exclusion the page-file population count
would read 211 against the pinned 210 route documents). Every other
P-5 conjunct is unchanged: all 210 per-page JSONs + all 210 route
documents + llms-full.txt + the site shell + the deployed code sets
remain pinned by name and count.

## AR-7 added (§23, archive registry)

Pins the second signed verification report the way AR-5 pins the
first: the report file stands beside the index at the URL recorded
in the registry's E6-B2 snapshot-run record; its bytes hash to the
run-recorded SHA-256; its detached JWS verifies against the
published JWKS; its Internet Archive leg tallies (saves confirmed,
pre-existing current-era, submitted-unverified, failed) and its
sample tallies equal the run record's fields exactly; the run's
confirmed count equals saves-confirmed + pre-existing; and every
capture row the wave added carries fixity status "verified" under a
manifest version naming the pre-B2 seal (SHA-256 3fb30cd7…), the
seal the captures were taken under. The E6-B1 report and AR-1..AR-6
are untouched.
