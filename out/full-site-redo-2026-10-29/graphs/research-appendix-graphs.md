# Research appendix — Area A: Graphs + Registries (full-site redo, staged 2026-10-29)

This appendix holds the industry sources behind the framing used in the staged
rewrites. Sources live HERE ONLY. They are not quoted, cited, or hedged into
published copy, dataset descriptions, or schema descriptions.

## 1. Floor deflection L/360 (SIR / gun-safe / heavy-asset descriptions)

The staged copy keeps the company's existing L/360 statement and frames it as
floor-deflection analysis. The L/360 figure itself is the standard serviceability
limit for floor members under live load in the International Building Code.

- IBC Table 1604.3 limits live-load deflection of floor members to L/360 and
  total load to L/240; members supporting plaster or sensitive finishes meet
  L/360 total. Source: https://calcexp.com/engineering-manufacturing-calculators/beam-load-calculator/
- IBC Table 1604.3, same limits restated (floor, typical: L/360 live load,
  L/240 total load). Source: https://www.steelsolver.com/p/steel-joist-spacing-calculator.html
- Residential floors: L/360 live load (gypsum-board ceiling finish) or L/480
  (plaster finish); total load L/240. Source: https://blog.truegeometry.com/api/exploreHTML/49fc1ab64b206965920800a834a5e492.exploreHTML

What the staged copy does NOT claim: it does not claim a structural
engineering credential, a stamped calculation, or a building-code certification
for any individual move. It states the company's existing protocol (route and
clearance survey, floor deflection analysis to L/360, load spreading, floor
protection, verified placement) in confident process language.

## 2. ISPM 15 export packing (ISPM 15 / crating descriptions)

The staged copy keeps the company's existing ISPM 15 statement and frames crates
as "built and marked to the ISPM 15 standard." The standard itself:

- ISPM 15, "Regulation of Wood Packaging Material in International Trade," is
  the phytosanitary standard of the International Plant Protection Convention
  (IPPC). It sets treatment and marking rules for wood packaging material
  (pallets, crates, dunnage) used in international trade.
  Source: https://www.gov.ie/en/department-of-agriculture-food-and-the-marine/publications/wood-packaging-material-and-ispm-15/
- Approved treatment is most commonly heat treatment: wood core temperature of
  at least 56 °C maintained for a minimum of 30 minutes throughout the wood
  profile, followed by the official ISPM 15 mark.
  Source: https://inspection.canada.ca/en/plant-health/attention-exporters-requirements-wood-packaging-material-outbound-shipments-canada
- Over 80 countries require imported wood packaging to comply with ISPM 15
  (same CFIA source above).

What the staged copy does NOT claim: it does not claim the company is an
IPPC-registered treatment facility, and it does not publish any facility or
producer code. It states export packing "to ISPM 15" exactly as the company
already offered it.

## 3. Written flat rate before move day (all service descriptions)

The staged copy's recurring line — "quoted at one flat rate in writing before
move day" — follows the industry's written-estimate practice, stated as the
company's own guarantee ("Guaranteed Flat Rate or Your Move is Free!"), not as
a regulatory claim about the company:

- A binding estimate guarantees the customer does not have to pay more than
  the estimated amount at delivery, unless additional items/services are added
  or unforeseen circumstances (stairs, elevators, permits) require a new binding
  estimate. Movers must provide a written estimate based on actual or virtual
  inspection of household goods. Source (FMCSA):
  https://www.fmcsa.dot.gov/consumer-protection/protect-your-move/what-binding-move-estimate
- ATA Moving & Storage guidance: get estimates in writing, compare binding,
  non-binding, and not-to-exceed estimate types, and be wary of low-ball
  estimates that grow once goods are loaded. Source:
  https://www.moving.org/index.php/prepare-choose-mover?gvas=blue

Note: the company is NOT described in staged copy as holding any interstate
operating authority, and no USDOT/MC number appears anywhere in staged copy.
USDOT/MC status remains unconfirmed and is never published as a company claim.

## 4. Schema.org chaining (Place @id chains, areaServed, OfferCatalog)

The staged rewrites use the schema.org vocabulary the site already used:
Organization / MovingCompany / LocalBusiness, Place, PostalAddress,
GeoCoordinates, OpeningHoursSpecification, AggregateRating, Service,
serviceType, provider, areaServed, hasOfferCatalog / OfferCatalog, and stable
`@id` references instead of copied text. No new vocabulary was introduced and
no `@id` was renamed: head-graph keeps `#winchester` / `#martinsburg`,
entity/best graphs keep `#winchester-place` / `#martinsburg-place`. The cross-
file `@id` mismatch between those two schemes is flagged in the Area A report
as a deploy-time decision for the parent, not silently "fixed," because
renaming either scheme would break live page references.

## 5. Branch facts used verbatim (no new facts invented)

All branch facts in staged files are copied exactly from the standing facts
for this task: Winchester = The Flat Rate Movers, 116 W Piccadilly St Suite 11,
Winchester VA 22601, geo 39.18711576,-78.1668352, Mon-Fri 8-6, Sat 8-4,
Sun 9-4, Google 5.0 / 1 review; Martinsburg = Flat Rate Movers Martinsburg WV
(no "The"), 736 Williamsport Pike Suite 2, Martinsburg WV 25404, geo
39.48319665,-77.94760443, Mon-Fri 9-6, Sat 9-4, Sun 9-4, Google 4.7 / 6 reviews;
phone +1-540-422-2153; founding June 2010; tagline "Guaranteed Flat Rate or
Your Move is Free!"; footprint Winchester 31, Martinsburg 35, shared 14,
52 GeoJSON features; services 22; pages 153. CWT rates ($8.00 unload, $10.00
load, $12.00 APU, $400–$425 per man Residential/Driver Meet) are reproduced
verbatim from owner-supplied copy in the industrial/warehouse descriptions and
were not re-derived, rounded, or extended to other services.
