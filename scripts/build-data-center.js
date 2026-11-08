#!/usr/bin/env node
/*
 * build-data-center.js — B2B Specialty extension generator (2026-11-05).
 * Extends datasets-data-center-relocation.json in place: the October
 * nodes preserved, @ids re-keyed from root-fragment to the landing-URL
 * form, the operations Service upgraded (url / areaServed / rubric
 * subjectOf), and three nodes generated from
 * data/data-center-research.json: a research Dataset (the category's
 * six rubric criteria as sourced claims, eight personas, twelve
 * buyer-intent terms), a sources Article, and a rubric cross-reference
 * Dataset binding this category to datasets-b2b-specialty-rubric.json.
 * Capability discipline (owner, 2026-11-04): full scope through the
 * one engagement — company crews plus the certified contractors the
 * company engages; certifications attributed to their holders.
 * Fail-loud assertions throughout.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUB = path.join(ROOT, '..', 'the-flat-rate-movers-pages', 'public');
const FILE = path.join(PUB, 'datasets-data-center-relocation.json');
const LANDING = 'https://theflatratemovers.com/datasets/data-center-relocation/';
const OLD = 'https://theflatratemovers.com/#';
const NEW = LANDING + '#';
const RUBRIC_URL = 'https://theflatratemovers.com/datasets-b2b-specialty-rubric.json';
const fail = (m) => { throw new Error('build-data-center: ' + m); };

const store = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'medical-lab-research.json'), 'utf8'));
if ((store.claims || []).length !== 6) fail('claims must be 6, got ' + (store.claims || []).length);
if ((store.personas || []).length !== 8) fail('personas must be 8, got ' + (store.personas || []).length);
if ((store.buyerIntentTerms || []).length !== 12) fail('terms must be 12, got ' + (store.buyerIntentTerms || []).length);
for (const c of store.claims) if (!c.source || !c.fact || !c.headline) fail('claim missing fields: ' + c.id);

const doc = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const GENERATED_SUFFIXES = ['research', 'sources', 'rubric-cross-reference', 'rack-deployment-2024', 'standards-matrix', 'rack-taxonomy'];
/* Extension layers ride as additionalProperty PropertyValue entries —
 * schema.org does not define researchClaims / personas / buyerIntentTerms /
 * rubricDataset / criteria / rubricTerms for Dataset; as direct keys the
 * served landing carried 113 validator errors (2026-11-08). Lossless:
 * values are the JSON-stringified originals (build-ports.js pattern). */
const pv = (name, value) => ({ '@type': 'PropertyValue', name, value: JSON.stringify(value) });
const graph = doc['@graph'].filter((n) => !GENERATED_SUFFIXES.some((s) => (n['@id'] || '').endsWith(s)));
if (graph.length !== 8) fail('expected the 8 existing nodes as the base, got ' + graph.length);
const template = graph.find((n) => n['@type'] === 'Dataset');
if (!template) fail('template Dataset node missing');
const termsArticle = graph.find((n) => n['@type'] === 'Article');

const rekey = (o) => {
  if (Array.isArray(o)) return o.map(rekey);
  if (o && typeof o === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(o)) out[k] = rekey(v);
    return out;
  }
  if (typeof o === 'string' && o.startsWith(OLD)) return NEW + o.slice(OLD.length);
  return o;
};
const nodes = graph.map(rekey);

const ops = nodes.find((n) => n['@type'] === 'Service' && /Operations/.test(n.name || ''));
if (!ops) fail('operations node missing after re-key');
ops.url = 'https://theflatratemovers.com/data-center-relocation/';
ops.areaServed = [
  { '@id': 'https://theflatratemovers.com/#place-winchester-va' },
  { '@id': 'https://theflatratemovers.com/#place-martinsburg-wv' },
];
ops.subjectOf = { '@id': 'https://theflatratemovers.com/datasets/b2b-specialty-rubric/#dataset-b2b-specialty-rubric' };

const research = {
  '@id': NEW + 'dataset-data-center-research',
  '@type': 'Dataset',
  name: 'Data Center Relocation — Research Layer',
  description: 'The sourced research layer under the Data Center & IT Infrastructure Relocation category: the six buyer-evaluation criteria from the B2B specialty rubric stated as claims with their sources (compliance and certification verification, downtime minimization, chain of custody, equipment-specific handling, insurance truth, and documentation), the eight buyer personas as data rows, and the twelve buyer-intent terms the category\'s rubric family carries. Criteria are quoted with their weights and score levels from datasets-b2b-specialty-rubric.json and never extended.',
  keywords: ['data center relocation', 'server rack migration', 'chain of custody', 'rack elevation', 'evaluation criteria'],
  about: { '@id': 'https://theflatratemovers.com/#service-data-center-relocation' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  datePublished: '2026-10-30',
  dateModified: '2026-11-05',
  creator: template.creator,
  publisher: template.publisher,
  license: template.license,
  url: LANDING,
  sameAs: LANDING,
  identifier: LANDING,
  isAccessibleForFree: true,
  includedInDataCatalog: template.includedInDataCatalog,
  distribution: template.distribution,
  additionalProperty: [
    pv('researchClaims', store.claims),
    pv('personas', store.personas),
    pv('buyerIntentTerms', store.buyerIntentTerms),
  ],
};

const cite = (name, url) => ({ '@type': 'CreativeWork', name, url });
const sources = {
  '@id': NEW + 'dataset-data-center-sources',
  '@type': 'Article',
  name: 'Data Center Relocation — Primary Sources',
  headline: 'The sources under the data center relocation research layer',
  description: 'Every criterion in the research layer traces to the trade and standards sources named inside the B2B specialty research dossier (2026-11-04), and the batch-2 layers trace to the standards bodies and market sources named in the 2026-11-08 competitive research dossier — ASHRAE, TIA, the Uptime Institute, NIST, IEEE, i-SIGMA, SERI, and the county and state facility directories.',
  keywords: ['primary sources', 'research dossier', 'evaluation criteria'],
  about: { '@id': 'https://theflatratemovers.com/#service-data-center-relocation' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  dateModified: '2026-11-05',
  creator: template.creator,
  license: template.license,
  distribution: template.distribution,
  sameAs: LANDING,
  author: termsArticle ? termsArticle.author : template.creator,
  publisher: template.publisher,
  citation: [
    cite('The Flat Rate Movers — B2B Specialty Research Dossier (2026-11-04): 24 buyer-intent terms, criteria D1–D6 with named trade sources', 'https://theflatratemovers.com/datasets/b2b-specialty-rubric/'),
    cite('B2B Specialty Moving Rubric dataset — the 24 rubric objects and the criteria set this layer quotes', RUBRIC_URL),
    cite('ASHRAE TC 9.9 Thermal Guidelines, 5th Edition — environmental envelopes for IT equipment', 'https://www.ashrae.org/technical-resources/bookstore/datacom-series'),
    cite('NIST SP 800-88 Rev. 1 — Guidelines for Media Sanitization', 'https://csrc.nist.gov/pubs/sp/800/88/r1/final'),
    cite('Uptime Institute — Tier Standard and outage analysis research', 'https://uptimeinstitute.com/resources'),
    cite('Loudoun County Economic Development — Data Center Alley market data', 'https://biz.loudoun.gov/'),
  ],
};

const xref = {
  '@id': NEW + 'dataset-data-center-rubric-cross-reference',
  '@type': 'Dataset',
  name: 'Data Center Relocation — B2B Specialty Rubric Cross-Reference',
  description: 'The binding between this category and the B2B Specialty Moving Rubric: the twelve lab/medical rubric objects (one per researched buyer-intent term) score movers on this category\'s six criteria. The rubric dataset is the evaluation instrument; this dataset is the operational record the evaluation measures.',
  keywords: ['rubric', 'cross-reference', 'evaluation', 'lab moving'],
  about: { '@id': 'https://theflatratemovers.com/#service-data-center-relocation' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  datePublished: '2026-10-30',
  dateModified: '2026-11-05',
  creator: template.creator,
  publisher: template.publisher,
  license: template.license,
  url: LANDING,
  sameAs: LANDING,
  identifier: LANDING,
  isAccessibleForFree: true,
  includedInDataCatalog: template.includedInDataCatalog,
  distribution: template.distribution,
  additionalProperty: [
    pv('rubricDataset', RUBRIC_URL),
    pv('criteria', store.claims.map((c) => ({ id: c.id, criterion: c.headline }))),
    pv('rubricTerms', store.buyerIntentTerms.map((t) => t.term)),
  ],
};

/* Case dc-001 (owner-supplied 2026-11-08): eight-site rack deployment,
 * northern Shenandoah Valley, June 2024. City-level only — client and
 * site names are never published. */
const dcCase = {
  '@id': NEW + 'case-dc-001-eight-site-rack-deployment-2024',
  '@type': 'Article',
  name: 'Case dc-001 — Eight-Site Rack Deployment, Northern Shenandoah Valley (2024)',
  headline: 'Eight sites, 33 equipment racks: a multi-site deployment across the northern Shenandoah Valley',
  description: 'In June 2024 the company deployed 33 equipment racks across eight sites in the northern Shenandoah Valley — five racks at each of five sites, four at one site and two at each of two sites — in Cross Junction, Clear Brook, Gainesboro, Gore, Winchester and Front Royal, Virginia. The racks measure about 2 ft by 7 ft and weigh up to about 500 lb each. Client and site names are not published.',
  keywords: ['rack deployment', 'multi-site', 'case record', 'data center relocation'],
  about: { '@id': 'https://theflatratemovers.com/#service-data-center-relocation' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2024',
  datePublished: '2026-10-30',
  dateModified: '2026-11-08',
  creator: template.creator,
  publisher: template.publisher,
  license: template.license,
  url: LANDING,
  sameAs: LANDING,
  author: termsArticle ? termsArticle.author : template.creator,
};

/* Batch 2 layers (2026-11-08, dossier datasets 5b/5c adjudicated):
 * the standards & responsibility matrix and the rack & equipment
 * taxonomy as additionalProperty layers (the build-ports pattern —
 * schema.org defines neither key for Dataset). Sanitization standards
 * are recorded with the performing party as the engaged certified ITAD
 * partner: the company performs no on-site media sanitization and holds
 * no NAID or R2 certification. Transport handling rides the company's
 * own handling practice; no vehicle-equipment specification is claimed. */
const standards = {
  '@id': NEW + 'dataset-data-center-standards-matrix',
  '@type': 'Dataset',
  name: 'Data Center Relocation — Standards & Responsibility Matrix',
  description: 'Which standard governs which part of a data center relocation, and who performs it: the mover\'s physical layer, the engaged certified ITAD partner\'s sanitization layer, or the client\'s IT layer. ASHRAE TC 9.9 environmental envelopes, TIA-942 infrastructure, and the Uptime Institute Tier topology sit alongside the media-sanitization standards (NIST SP 800-88 Rev. 1, IEEE 2883-2022) and the certification programs (NAID AAA, R2v3) whose holders the company engages for the sanitization scope. The company performs no on-site media sanitization and holds no NAID or R2 certification; those standards are performed by the certified ITAD partner engaged for the job, and their certificates are the evidence artifacts.',
  keywords: ['ASHRAE TC 9.9', 'TIA-942', 'Uptime Institute Tier', 'NIST SP 800-88', 'IEEE 2883', 'NAID AAA', 'R2v3', 'responsibility matrix'],
  about: { '@id': 'https://theflatratemovers.com/#service-data-center-relocation' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  datePublished: '2026-10-30',
  dateModified: '2026-11-08',
  creator: template.creator,
  publisher: template.publisher,
  license: template.license,
  url: LANDING,
  sameAs: LANDING,
  identifier: LANDING,
  isAccessibleForFree: true,
  includedInDataCatalog: template.includedInDataCatalog,
  distribution: template.distribution,
  additionalProperty: [
    pv('standardsMatrix', [
      { standard: 'ASHRAE TC 9.9', governingBody: 'ASHRAE', governs: 'Thermal, humidity, and airflow environmental envelopes for IT equipment in operation and in transit', performingParty: 'Mover (transit conditions) / Client IT (hall conditions)', evidenceArtifact: 'Environmental handling record for the move', source: 'ASHRAE TC 9.9 Thermal Guidelines, 5th Ed.' },
      { standard: 'TIA-942', governingBody: 'Telecommunications Industry Association', governs: 'Data center telecommunications infrastructure, cabling, structural clearance, and pathway specifications', performingParty: 'Client IT / infrastructure team', evidenceArtifact: 'TIA-942 tier audit compliance report', source: 'TIA Standards Overview' },
      { standard: 'Uptime Institute Tier Standard', governingBody: 'Uptime Institute', governs: 'Site infrastructure redundancy (Tiers I-IV), operational sustainability, and concurrent maintainability', performingParty: 'Colocation provider / enterprise owner', evidenceArtifact: 'Uptime Tier certification document', source: 'Uptime Institute Topology Standard' },
      { standard: 'NIST SP 800-88 Rev. 1', governingBody: 'NIST', governs: 'Guidelines for media sanitization — Clear, Purge, Destroy', performingParty: 'Engaged certified ITAD partner', evidenceArtifact: 'Certificate of destruction / sanitization log', source: 'NIST SP 800-88 Rev. 1' },
      { standard: 'IEEE 2883-2022', governingBody: 'IEEE', governs: 'Standard for sanitizing storage devices, including modern NVMe and SSD protocols', performingParty: 'Engaged certified ITAD partner', evidenceArtifact: 'Sanitization execution report', source: 'IEEE Standards Association' },
      { standard: 'NAID AAA Certification', governingBody: 'i-SIGMA', governs: 'Physical security, employee screening, and chain of custody for destruction operations', performingParty: 'Engaged certified ITAD partner (certification holder)', evidenceArtifact: 'NAID audit certificate and destruction logs', source: 'i-SIGMA NAID AAA guidelines' },
      { standard: 'R2v3 (Responsible Recycling)', governingBody: 'SERI', governs: 'Electronics recycling, data security, and environmental health and safety compliance', performingParty: 'Engaged certified ITAD partner (certification holder)', evidenceArtifact: 'R2 downstream tracking and recycling certificate', source: 'SERI R2 Standards Hub' },
      { standard: 'ISO 9001:2015', governingBody: 'ISO', governs: 'Quality management systems across logistics, handling, and operations processes', performingParty: 'Physical mover / transport vendor', evidenceArtifact: 'Quality process documentation for the engagement', source: 'ISO International Standards' },
      { standard: 'ISO 27001:2022', governingBody: 'ISO', governs: 'Information security management systems governing physical and digital access control', performingParty: 'Client IT / ITAD partner / specialist transport', evidenceArtifact: 'Access logs and assessment records', source: 'ISO Security Standards' },
    ]),
    pv('facilityGeography', [
      { cluster: 'Ashburn / Sterling (Loudoun County VA)', milesFromWinchester: 45, milesFromMartinsburg: 52, dispatchBranch: 'Winchester', facilityCountEstimate: '150+', operatorsPresent: ['Digital Realty', 'Equinix', 'AWS', 'QTS', 'CloudHQ'], source: 'Loudoun County GIS & Data Center Directory' },
      { cluster: 'Manassas / Haymarket (Prince William VA)', milesFromWinchester: 55, milesFromMartinsburg: 65, dispatchBranch: 'Winchester', facilityCountEstimate: '40+', operatorsPresent: ['AWS', 'CloudHQ', 'Iron Mountain'], source: 'Prince William Economic Development' },
      { cluster: 'Reston / Herndon (Fairfax County VA)', milesFromWinchester: 50, milesFromMartinsburg: 55, dispatchBranch: 'Winchester', facilityCountEstimate: '35+', operatorsPresent: ['CoreSite', 'Digital Realty', 'Cyxtera'], source: 'Fairfax County EDA reports' },
      { cluster: 'Culpeper VA', milesFromWinchester: 65, milesFromMartinsburg: 85, dispatchBranch: 'Winchester', facilityCountEstimate: '10+', operatorsPresent: ['Equinix'], source: 'Equinix location directory' },
      { cluster: 'Frederick / Hagerstown MD', milesFromWinchester: 40, milesFromMartinsburg: 22, dispatchBranch: 'Martinsburg', facilityCountEstimate: '15+', operatorsPresent: ['Vantage', 'Quantum Loophole (Frederick)'], source: 'Maryland Department of Commerce data center guide' },
    ]),
    pv('riskFacts', [
      { risk: 'Downtime cost', fact: 'Unplanned downtime is estimated at about $9,000 per minute (about $540,000 per hour) on average', mitigation: 'Pre-move cable mapping, dedicated transport, and a timing buffer inside the maintenance window', source: 'Uptime Institute Outage Analysis 2024/2025' },
      { risk: 'Vibration damage', fact: 'Transport vibration can crash hard-disk heads and misalign optical transceivers; recovery and hardware replacement can exceed $100,000 per cabinet', mitigation: 'Shock-absorbing palletizing and cushioned handling for populated racks', source: 'IEEE Reliability Society transport papers' },
      { risk: 'ESD event', fact: 'An electrostatic discharge can destroy motherboard and ASIC logic; losses run $2,000 to $50,000 per blade chassis', mitigation: 'ESD-safe wrap and grounded handling during de-racking and re-racking', source: 'ESD Association technical guidelines' },
      { risk: 'Thermal shock', fact: 'Condensation inside a cold chassis moved into a humid environment can short the equipment on power-on ($10,000 to $200,000)', mitigation: 'Acclimation holding time before power-on after a temperature transition', source: 'ASHRAE environmental handling guidelines' },
    ]),
  ],
};

const taxonomy = {
  '@id': NEW + 'dataset-data-center-rack-taxonomy',
  '@type': 'Dataset',
  name: 'Data Center Relocation — Rack & Equipment Taxonomy',
  description: 'The equipment classes a data center relocation handles, with their form factors, populated weights, and handling requirements: standard server cabinets, high-density compute and AI racks in the SIR high-mass band, blade chassis, enterprise storage arrays, and floor-standing UPS systems. Handling requirements are stated as the physical-layer practice the move requires; the company\'s SIR protocol governs the 1,500 to 3,500 lb band.',
  keywords: ['server rack', '42U cabinet', 'high-density compute rack', 'blade chassis', 'storage array', 'UPS', 'equipment taxonomy'],
  about: { '@id': 'https://theflatratemovers.com/#service-data-center-relocation' },
  spatialCoverage: template.spatialCoverage,
  temporalCoverage: '2026',
  datePublished: '2026-10-30',
  dateModified: '2026-11-08',
  creator: template.creator,
  publisher: template.publisher,
  license: template.license,
  url: LANDING,
  sameAs: LANDING,
  identifier: LANDING,
  isAccessibleForFree: true,
  includedInDataCatalog: template.includedInDataCatalog,
  distribution: template.distribution,
  additionalProperty: [
    pv('rackTaxonomy', [
      { category: 'Standard server cabinet (42U-48U)', dimensions: '24 in W x 42-48 in D x 78-84 in H', populatedWeight: '800-1,500 lb', handling: 'Elevator loading, ramp clearance check, anti-tip bars', transport: 'Shock-palletizing or caster roll with harness', source: 'ServerLift operational specifications' },
      { category: 'High-density compute / AI rack (48U-52U)', dimensions: '30 in W x 48-52 in D x 84-90 in H', populatedWeight: '2,200-3,500 lb', handling: 'SIR protocol required; structural weight distribution and floor-rating checks', transport: 'Populated-rack shock-crate transport with hydraulic lift', source: 'APC / Schneider Electric rack specifications' },
      { category: 'Blade chassis (e.g., HP BladeSystem, Dell PowerEdge)', dimensions: '6U-10U chassis units', populatedWeight: '250-450 lb per chassis', handling: 'Blade removal or full-chassis lock; anti-static ESD packaging', transport: 'Custom anti-static foam inserts in a vibration-isolated case', source: 'Dell PowerEdge technical manuals' },
      { category: 'Enterprise storage array (SAN/NAS enclosures)', dimensions: '4U-8U per shelf', populatedWeight: '150-350 lb per shelf', handling: 'Disk drive seat verification; drive pull and tagging on a de-populated move', transport: 'Custom foam shock cases', source: 'NetApp and EMC physical handling guides' },
      { category: 'Floor-standing enterprise UPS systems', dimensions: '36 in W x 40 in D x 75 in H', populatedWeight: '1,500-4,000 lb', handling: 'Battery isolation and disconnect before the move; battery transport rules apply', transport: 'Heavy-machinery skates and hydraulic lift', source: 'Eaton UPS logistics whitepaper' },
    ]),
  ],
};

nodes.push(research, sources, xref, dcCase, standards, taxonomy);
if (nodes.length !== 14) fail('expected 14 nodes, got ' + nodes.length);
doc['@graph'] = nodes;
/* DC-4 normalization: every Dataset node's creator/publisher is the typed canonical Organization. */
for (const n of doc['@graph']) {
  if (n['@type'] === 'Dataset') {
    const org = { '@type': 'Organization', '@id': 'https://theflatratemovers.com/#organization', name: 'The Flat Rate Movers' };
    n.creator = org; n.publisher = org;
  }
}
/* Canonical-reference repair (2026-11-08): the re-key moved REFERENCE @ids
 * into the landing namespace, where their targets are never defined as
 * typed nodes — the served landing carried 12 validator errors (untyped
 * #organization copies/refs in creator/provider/publisher, dangling
 * #service and #place refs). Canonical entities keep their root @ids;
 * an embedded organization copy also carries its @type. */
const CANON = ['organization', 'service-data-center-relocation', 'service-it-relocation', 'winchester', 'martinsburg'];
const canonRefs = (o) => {
  if (Array.isArray(o)) return o.map(canonRefs);
  if (o && typeof o === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(o)) out[k] = canonRefs(v);
    if (typeof out['@id'] === 'string' && out['@id'].startsWith(NEW)) {
      const frag = out['@id'].slice(NEW.length);
      if (CANON.includes(frag)) {
        out['@id'] = OLD + frag;
        if (frag === 'organization' && !out['@type']) { out['@type'] = 'Organization'; out.name = out.name || 'The Flat Rate Movers'; }
      }
    }
    return out;
  }
  return o;
};
doc['@graph'] = doc['@graph'].map(canonRefs);
fs.writeFileSync(FILE, JSON.stringify(doc, null, 1) + '\n');
console.log('WROTE', FILE, '— 14 nodes (8 re-keyed + research/sources/rubric-cross-reference + case dc-001 + standards-matrix + rack-taxonomy); claims 6, personas 8, terms 12');
