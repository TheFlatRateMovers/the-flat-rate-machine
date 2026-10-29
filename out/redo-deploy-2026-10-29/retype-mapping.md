# Dataset retype mapping — redo deploy 2026-10-29 (decision 2)

| file | @id | old type | new type | reason |
|---|---|---|---|---|
| datasets-residential.json | https://theflatratemovers.com/#dataset-residential-operations | Dataset | Service | service-description content: the household move operation chain |
| datasets-residential.json | https://theflatratemovers.com/#dataset-residential-dwelling-access | Dataset | Service | service-description content: dwelling scope and access inputs of the service |
| datasets-residential.json | https://theflatratemovers.com/#dataset-residential-item-taxonomy | Dataset | Dataset | reference data: room/item taxonomy with handling classes |
| datasets-residential.json | https://theflatratemovers.com/#dataset-residential-dispatch-network | Dataset | Dataset | reference data: branch facts and service-area data (52 features) |
| datasets-residential.json | https://theflatratemovers.com/#dataset-residential-commercial-terms | Dataset | Article | guide prose: pricing-term and valuation education, no company price schedule |
| datasets-residential.json | https://theflatratemovers.com/#dataset-residential-personas-triggers | Dataset | Article | informational prose: buyer personas, triggers, demand evidence |
| datasets-residential.json | https://theflatratemovers.com/#dataset-residential-protection-compliance | Dataset | Service | service-description content: protection, handling and building compliance practice |
| datasets-residential.json | https://theflatratemovers.com/#dataset-residential-areas-quote-path | Dataset | Dataset | reference data: service-area data (52 features, branch facts) with quote path |
| datasets-commercial.json | https://theflatratemovers.com/#dataset-commercial-operations | Dataset | Service | service-description content: the commercial move operation chain |
| datasets-commercial.json | https://theflatratemovers.com/#dataset-commercial-premises-access | Dataset | Service | service-description content: premises scope and access operations |
| datasets-commercial.json | https://theflatratemovers.com/#dataset-commercial-asset-taxonomy | Dataset | Dataset | reference data: business asset taxonomy with handling classes |
| datasets-commercial.json | https://theflatratemovers.com/#dataset-commercial-dispatch | Dataset | Dataset | reference data: branch facts and service-area data (52 features) |
| datasets-commercial.json | https://theflatratemovers.com/#dataset-commercial-terms | Dataset | Article | guide prose: pricing-term and downtime education with labeled domain figures |
| datasets-commercial.json | https://theflatratemovers.com/#dataset-commercial-personas | Dataset | Article | informational prose: buyer personas and trigger events |
| datasets-commercial.json | https://theflatratemovers.com/#dataset-commercial-protection-compliance | Dataset | Service | service-description content: protection, IT coordination and building compliance practice |
| datasets-commercial.json | https://theflatratemovers.com/#dataset-commercial-areas-quote | Dataset | Dataset | reference data: service-area data (52 features, branch facts) with quote path |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-operations | Dataset | Service | service-description content: the gun safe move operation chain |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-weight-access | Dataset | Dataset | reference data: weight/size classes (SIR band 1,500-3,500 lbs plus labeled domain classes) |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-taxonomy | Dataset | Dataset | reference data: safe/access/equipment taxonomy |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-dispatch | Dataset | Dataset | reference data: branch facts and service-area data (52 features) |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-commercial-terms | Dataset | Article | guide prose: terms and cost-driver education with labeled domain markers |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-personas | Dataset | Article | informational prose: buyer personas and trigger events |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-compliance | Dataset | Service | service-description content: floor, protection and handling compliance practice |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-areas-quote | Dataset | Dataset | reference data: service-area data (52 features, branch facts) with quote path |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-service-subband | Dataset | Service | service-description content: published service practice for safes under 1,500 lbs |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-service-emptying | Dataset | Service | service-description content: published service practice, safe emptied first |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-service-stairs | Dataset | Service | service-description content: published service practice, stairs up and down |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-service-equipment | Dataset | Service | service-description content: published service practice, equipment matched to project |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-service-anchoring | Dataset | Service | service-description content: published service practice, re-anchoring on request |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-service-vault | Dataset | Service | service-description content: published service practice, vault work any size |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-service-classes | Dataset | Dataset | reference data: safe-class spectrum definitions (RSC, B/C-rate, TL-15/TL-30) |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-service-winchester | Dataset | Article | informational prose: Winchester branch page coverage and branch facts |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-service-longdistance | Dataset | Article | informational prose: published long-distance runs and audience depth, no scope claim |
| datasets-gun-safe.json | https://theflatratemovers.com/#dataset-gun-safe-service-locksmith | Dataset | Service | service-description content: published service scope boundary, no locksmith services |

FAQPage: no node in the three files carries discrete question/answer pairs (the gun-safe service-detail nodes list likely-search questions inside prose, without paired answers), so no node was retyped to FAQPage. The hub FAQPage block is unchanged.

Totals: 34 nodes — Dataset: 11, Service: 15, Article: 8
