'use strict';
/* lib-constants.js — the estate's canonical shared values (Copy-
 * Integrity batch, 2026-11-04). ONE source for the values that are
 * copied across files: the site origin, the dataset catalog object
 * (the includedInDataCatalog value every dataset node carries), and
 * the dataset collection DOI.
 *
 * Why this module exists: the catalog-pointer reconciliation
 * (2026-11-04) found the catalog object hardcoded as a private
 * literal in nine producer builders and in verify.js — when the
 * value changed (the GSC Datasets notice), one copy (verify.js §34)
 * escaped the fix sweep because the sweep was hand-listed. Producers
 * and the verifier now READ the value from here; there is nothing to
 * sweep. verify.js §42 (CI-1) asserts this module's seats are
 * byte-identical and that its values equal the canonical values
 * registered in data/copies-registry.json.
 *
 * Seats: this file lives byte-identically at the machine root
 * (verify.js's seat), scripts/ (the builders' seat), and repo-dir/
 * (the sealed twin seat) — check-twins.js classes A + C pair them
 * automatically and TW-1/TW-2 keep them identical. Edit any seat and
 * copy the bytes to the other two, exactly like every other twin.
 *
 * The CATALOG object is frozen: consumers assign a spread copy
 * ({ ...CATALOG }) when a node needs its own object, so the
 * canonical value can never be mutated through a consumer. */
const SITE = 'https://theflatratemovers.com';
const CATALOG = Object.freeze({
  '@type': 'DataCatalog',
  '@id': SITE + '/datasets/#collection',
  'name': 'The Flat Rate Movers — AI Authority Estate Datasets',
  'url': SITE + '/datasets/',
});
const CATALOG_ID = CATALOG['@id'];
const DATASET_DOI = '10.5281/zenodo.23879048';
const DATASET_DOI_URL = 'https://doi.org/' + DATASET_DOI;

module.exports = { SITE, CATALOG, CATALOG_ID, DATASET_DOI, DATASET_DOI_URL };
