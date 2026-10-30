# verify.js extension — Batch Dataset Discoverability (2026-10-30)

The batch gives every published dataset file a canonical landing page
(33 new pages: the /datasets/ hub + 32 landings), completes Dataset
metadata estate-wide (landing url + unique sameAs, identifier,
isAccessibleForFree, typed DataDownload distributions including a
self-referencing entry), adds the dataset files to sitemap.xml, and
stamps the estate's Zenodo concept DOI (10.5281/zenodo.23818766) as
the identifier of the intent-coverage collection nodes and of the
signed AI master index root.

Per the stale-check rule (checks encode era premises; when an approved
batch changes intended state, the check is rewritten stricter in the
same motion — never waived), verify.js was extended in this batch:

- P-5 assertion: `pageFiles.length === 167` → `=== 200`;
  `(servedIndex.distribution || []).length === 220` → `=== 253`;
  check name updated (200 per-page JSONs, 253 distributions =
  42 data + 200 pages + 11 shell/code). A dated comment was appended
  to the P-5 comment chain in verify.js itself.
- Section 2 (live sitemap set equality) REWRITTEN: the old premise
  "live sitemap set == pages.json set" is superseded by this approved
  batch (the sitemap now also lists the 32 published dataset files).
  The expected set is now derived — pages.json URLs ∪ dataset-file
  URLs enumerated from the Pages public listing (DATASET_FILES) — and
  the three checks assert: every registry page is in the live
  sitemap; every live URL is a registry page or a published dataset
  file; the live count equals the derived expected count (232).
  Stricter than before: an unlisted new dataset file now fails the
  suite instead of passing silently.
- S-4 (live sitemap lastmod count) follows the same derived total:
  `mods.length === pages.pages.length + DATASET_FILES.length`.
- New section 14 (checks D-1..D-5), asserting the batch's invariants:
  D-1 a landing page per dataset file (registry + per-page JSON in
  the served signed index + head-data entry); D-2 every Dataset node
  in the dataset files and in index.html carries landing url/unique
  sameAs, an identifier (the DOI PropertyValue on the four
  intent-coverage collection nodes, the landing URL elsewhere),
  isAccessibleForFree, fully typed distributions and a
  self-referencing DataDownload; D-3 the local sitemap set equals
  registry pages + dataset files; D-4 the site and machine entity
  graphs agree on every Dataset node's landing fields; D-5 the live
  intent dataset carries the DOI and its landing page serves its own
  title.

Suite size: 88 → 93 checks. No check was removed or weakened; the one
rewritten premise (section 2) is recorded here and in a dated comment
at the check itself.

## Addendum — two corrections made during this batch's first runs

Both were found by the new checks' own first executions and fixed
stricter before the suite's first full green run; neither weakened an
assertion:

- D-1 originally read head-data.js from the machine repo's `code/`
  tree, which does not exist in the local checkout (that tree lives
  only in the GitHub repo). D-1 now reads the Pages project's deployed
  `functions/head-data.js` — the same source S-1 already verifies.
- D-4 originally extracted Dataset nodes from `@graph` only and found
  none: the entity graphs are root-node documents whose root IS the
  Dataset node, with `@graph` carrying the other nodes. The extractor
  now considers the root plus `@graph` members (1 Dataset node,
  agreeing across both copies).
- Each correction re-digested verify.js alone (seal passes 3–5,
  changed set asserted == {verify.js} each time).
