# Flat Rate Movers Genesis Node — FRMNODE

The on-chain node of The Flat Rate Movers LLC's machine-readable estate.
The estate already runs on owned infrastructure: the domain, Ed25519-signed
datasets under a signed master index, a public API, Kaggle mirrors, and a
Zenodo DOI. This token is that architecture's provenance anchor on-chain.

## The instrument

- **Standard:** ERC-721 (one token, ever — enforced in the contract)
- **Chain:** Base (Ethereum L2), chainId 8453
- **Name:** Flat Rate Movers Genesis Node
- **Symbol:** FRMNODE
- **Token #1:** "The Flat Rate Movers — Genesis Node #1", minted to the
  company deployer wallet at deployment
- **Nature:** an identity and provenance record. It is not offered for sale,
  is not listed on any marketplace, and carries no financial rights and no
  ownership in the company. There is no ERC-20 companion coin.

Token #1's metadata attributes carry the estate's coordinates: the SHA-256
seal of the signed ai-master-index at build time
(`9f047bb786b0af328e0c45ae240975fa1f068d1ee618b85027d04218ce2948c1`),
the Zenodo concept DOI (10.5281/zenodo.23879048), the Kaggle account
(theflatratemovers), founding year 2010, and the two branches
(Winchester, VA · Martinsburg, WV). A genesis anchor freezes the seal it was
struck under by design; later seals supersede it in the index itself.

## Metadata resolution

`tokenURI(1)` returns the metadata as an on-chain **data URI**
(`data:application/json;base64,…`) — the token resolves its own metadata
from chain state, with no hosting dependency. Verified byte-exact against
`metadata/genesis-node-1.json` in both proof runs.

The same JSON is kept as a file in this folder for mirroring. Planned
off-chain mirror (activates when the file is pushed with a future
machine-repo batch — deliberately not pushed during this build; see
BUILD-RECORD.md):
`https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/token/genesis-node-1.json`

The estate-domain path was not used: adding a file to the live site requires
a full seal/deploy cycle of the website, which this build does not touch.
Free IPFS pinning routes (Pinata, web3.storage, nft.storage) all require
account API keys, so none was usable without new credentials.

## Custody

- Deployer wallet (public): `0xD6F43035476f280B3ee5D22cb8bc39F8a5Db3433`
- Private key: ONLY in `~/workspace/theflatratemovers/keys/token-deployer-wallet.txt`
  (mode 0600, same custody folder as the Ed25519 signing key). It is never
  printed in any record, log, or message. Losing that file loses the wallet;
  keep it with the company's other keys.
- The wallet was generated locally with `scripts/make-wallet.mjs`
  (ethers `Wallet.createRandom()`).

## Proofs (see BUILD-RECORD.md for full detail)

The process is proven end-to-end twice with the exact production bytecode,
signer, and metadata: (A) a clean local anvil chain, and (B) an anvil fork
of live Base mainnet state (block 55,776,413) — deploy, mint #1, full
readback (name, symbol, owner, ownerOf, tokenURI), and a second-mint
attempt reverting as designed. A Base Sepolia testnet deployment was
attempted first and is blocked at the faucet step (every public faucet
requires an account sign-in, a wallet-connect UI, or a captcha — none is
completable headlessly); the fork simulation is the recorded substitute,
labeled as a simulation, never as a testnet deployment.

Predicted mainnet contract address (deployer's nonce-0 create address —
the address the contract will land at if the deploy is the wallet's first
mainnet transaction, as it currently stands):
`0x783CE8e4bDDecD9e1fe5694cfd1836dA65F361dd`

## Mainnet deployment — the owner's one step + one command

1. Send a small amount of ETH **on the Base network** to
   `0xD6F43035476f280B3ee5D22cb8bc39F8a5Db3433`
   (measured cost at the 2026-11-10 live read: ≈ $0.03 of L2 execution fees
   for deploy + mint, plus Base's small L1 data fee — $10 of ETH is a wide
   margin; see BUILD-RECORD.md for the sourced figures).
2. Run exactly:
   ```
   cd ~/workspace/theflatratemovers/token && node scripts/deploy-mainnet.mjs
   ```
   The script refuses to send anything while the balance is zero, deploys,
   mints #1, reads every value back from the live contract, and writes
   `mainnet-deployment.json` with the contract address and BaseScan links.

## Files

- `contracts/FlatRateMoversGenesisNode.sol` — the contract (solc 0.8.38,
  OpenZeppelin 5.6.1, EVM target cancun, optimizer 200 runs)
- `metadata/genesis-node-1.json` — token #1 metadata (the data-URI payload)
- `artifacts/FlatRateMoversGenesisNode.json` — compiled ABI + bytecode
- `scripts/make-wallet.mjs` — one-time wallet generation (already run)
- `scripts/compile.mjs` — solc-js compile
- `scripts/deploylib.mjs` — shared deploy/mint/readback flow (proofs)
- `scripts/prove-local-anvil.mjs`, `scripts/prove-fork.mjs`,
  `scripts/rpc-relay.mjs`, `scripts/run-fork-proof.sh` — the proof harness
- `scripts/deploy-mainnet.mjs` — the mainnet command above
- `proof-local-output.json`, `proof-fork-output.json` — proof run outputs
- `BUILD-RECORD.md` — the build record with all values and deviations
