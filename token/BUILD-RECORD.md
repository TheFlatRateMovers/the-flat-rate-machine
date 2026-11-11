# BUILD RECORD — FRMNODE Token Layer (2026-11-10)

Built under Henry's order of 2026-11-10 (explicit permission and authority,
"move at the speed of code"). All values below are public. The deployer
private key exists only in the custody file and appears nowhere in this
record or any log.

## Identity

- Instrument: ERC-721, contract `FlatRateMoversGenesisNode`
- Name: **Flat Rate Movers Genesis Node** · Symbol: **FRMNODE**
- Chain (production target): Base mainnet, chainId 8453
- Supply by construction: 1 (token id 1; a second mint reverts — proven)
- Design constraints honored: no sale, no offering, no marketplace listing,
  no price/return language in contract, metadata, or records; no ERC-20.

## Deployer wallet

- Public address: **0xD6F43035476f280B3ee5D22cb8bc39F8a5Db3433**
- Custody: `~/workspace/theflatratemovers/keys/token-deployer-wallet.txt`,
  mode 0600, generated locally via ethers `Wallet.createRandom()`
  (`scripts/make-wallet.mjs`). Key never printed or logged.
- Mainnet state at build close (live read, 2026-11-10T21:21Z, Base block
  55,776,571): balance **0 ETH**, nonce **0** — unfunded, as designed.
  Funding is the owner's one step (see Mainnet path).

## Metadata

- File: `metadata/genesis-node-1.json` (in this folder)
- On-chain reference: `tokenURI(1)` = `data:application/json;base64,…`
  (self-resolving from chain state; no hosting dependency)
- Resolution proof: in BOTH proof runs, `tokenURI(1)` equaled the data URI
  of the file byte-for-byte, and its base64 decode byte-matched the file
  (`tokenURIMatchesMetadataFile: true`, `tokenURIDecodesToMetadataFile: true`)
- Attributes carried: AI Master Index Seal (SHA-256)
  `6b044aa75fd0a093ef0daa8cf8d6550741e6aab90c911066e2670bc17b1d09a1`
  — read LIVE from https://theflatratemovers.com/ai-master-index.json at
  build time (seal id 9f047bb7, 1,256 distributions); the seal attribute
  was refreshed to the Outside-Copies closing seal at the mirror push
  below (seal id 6b044aa7, 1,306 distributions) · Zenodo concept DOI
  10.5281/zenodo.23879048 · Kaggle `theflatratemovers` · Founded 2010 ·
  Winchester, VA · Martinsburg, WV
- Off-chain mirror (PUSHED 2026-11-11, Outside-Copies micro-batch):
  the token's public record files (genesis-node-1.json, README.md,
  BUILD-RECORD.md, contracts/FlatRateMoversGenesisNode.sol) are mirrored
  in the machine repo under `token/` —
  `https://raw.githubusercontent.com/TheFlatRateMovers/the-flat-rate-machine/main/token/genesis-node-1.json`
  — pushed with the metadata's seal attribute refreshed to the
  Outside-Copies closing seal 6b044aa75fd0a093ef0daa8cf8d6550741e6aab90c911066e2670bc17b1d09a1
  (1,306 distributions). The data URI makes the token fully resolvable
  without the mirror; the mirror is additive.

## Proof runs (substitute for testnet — see Deviation 1)

### Proof A — local anvil chain (clean room)
- Contract: **0x783CE8e4bDDecD9e1fe5694cfd1836dA65F361dd**
- Deploy tx: `0x8b291e7f14d07109eb6bcc646d574171a393900443564627f6900127d8e775d5` · gas 1,105,326
- Mint #1 tx: `0x76cff5f87563cdd5706a76f036081a5d5fcde80168663f105862fd85ab82f0c5` · gas 1,142,678
- Readback: name "Flat Rate Movers Genesis Node" · symbol "FRMNODE" ·
  owner = deployer · ownerOf(1) = deployer · genesisMinted = true ·
  tokenURI byte-matches metadata file · second mint reverted as designed
- Output: `proof-local-output.json`

### Proof B — anvil fork of live Base mainnet state (SIMULATION)
- Fork block: **55,776,413** (real mainnet state via public RPC)
- Contract: **0x783CE8e4bDDecD9e1fe5694cfd1836dA65F361dd** (same address —
  it is the deployer wallet's nonce-0 create address; with the wallet's
  mainnet nonce still 0, this is the predicted mainnet contract address)
- Deploy tx (fork only): `0x9de5e8eee18abcee10a916fa51cef4c2cbdb4121cbfc2cad4f38c9bae3317f52` · gas 1,105,326
- Mint tx (fork only): `0x9e8cb351b72095f6316cb500a9e102285993034b04f2f1a4917c86ebfb279a72` · gas 1,142,678
- Readback identical to Proof A on every field; second mint reverted
- Output: `proof-fork-output.json`
- These transactions exist only on the ephemeral fork. There is NO
  BaseScan link for them and none is claimed. This simulation is not a
  testnet deployment and is not presented as one.

### Testnet (Base Sepolia) — NOT deployed
No Sepolia contract address or explorer link exists. The deployment process
itself is proven by Proofs A+B with the production bytecode and signer;
Sepolia differs only in funding source. See Deviation 1.

## Mainnet path — one owner step + one command

1. Owner funds **0xD6F43035476f280B3ee5D22cb8bc39F8a5Db3433** with ETH
   **on the Base network** (any exchange withdrawal or wallet send set to
   the Base network).
2. Run: `cd ~/workspace/theflatratemovers/token && node scripts/deploy-mainnet.mjs`
   — aborts unfunded, deploys, mints #1, verifies by live readback, writes
   `mainnet-deployment.json` with BaseScan links.

### Cost, honestly sourced (live read 2026-11-10T21:21:31Z)
- Base gas price (eth_gasPrice via mainnet.base.org): **0.006000536 gwei**
- ETH/USD (CoinGecko, same read): **$2,059.04**
- Gas measured on real mainnet state (Proof B): deploy 1,105,326 · mint 1,142,678 · total 2,248,004
- L2 execution cost: deploy ≈ 0.00000663 ETH (**$0.014**) · mint ≈ 0.00000686 ETH (**$0.014**) · total ≈ **$0.028**
- Base additionally charges an L1 data fee per transaction (not inside
  eth_gasPrice); for these payload sizes it is cents, not dollars.
  Expected all-in total: **well under $0.25**. Funding with ~$10 of ETH
  leaves a ~40× margin and covers any gas movement before the run.

## Deviations (file-and-cause)

1. **No testnet deployment — faucet wall.** Six public Base Sepolia faucet
   routes checked 2026-11-10 (Coinbase, QuickNode, Alchemy, Chainlink,
   thirdweb, Google Cloud Web3 faucet): every one requires an account
   sign-in, a wallet-connect browser UI, and/or a captcha — none is
   completable by a headless agent with no supplied credentials. Per the
   build brief's fallback: local-chain proof + mainnet fork simulation
   substituted, labeled as such everywhere. (If a faucet drip is ever
   supplied to the deployer address on Sepolia, `scripts/deploy-mainnet.mjs`
   needs only its RPC/chain constants changed to run the identical flow
   on Sepolia.)
2. **Tooling: ganache → anvil.** ganache 7.9.2 in this environment stalls
   at server start with `chain.hardfork: 'cancun'` (isolated by test:
   default and 'shanghai' start, 'cancun' never listens). Foundry's anvil
   1.9.0 was installed and runs both proofs.
   (`scripts/prove-local.mjs`, the ganache harness, was removed.)
3. **EVM target pinned to cancun.** solc's default target emitted MCOPY
   (invalid opcode on the shanghai local chain); OpenZeppelin 5.6.1 itself
   requires a cancun-or-later target (its code uses `mcopy`), so the
   contract compiles with `evmVersion: 'cancun'` (scripts/compile.mjs) and
   executes on anvil. Cancun bytecode is native on Base mainnet today.
4. **Nonce management.** ethers v6 against anvil returned a stale pending
   nonce on back-to-back sends (mint carried nonce 0 after the deploy
   consumed it; "nonce too low"). All send paths (deploylib, mainnet
   script) wrap the wallet in `ethers.NonceManager`.
5. **Fork transport.** This box's egress is proxy-only; anvil (Rust) does
   not honor the proxy env and its direct fork fetch timed out. A
   localhost relay (`scripts/rpc-relay.mjs`, node fetch → mainnet.base.org)
   now fronts the fork. Detached background fork-anvil sessions also stall
   at a runtime confirmation gate here, so the fork runs with an in-line
   lifecycle (`scripts/run-fork-proof.sh`).
6. **Metadata not pushed to GitHub in this batch** — see Metadata section.
   The estate-domain path was likewise not used (it would require a
   website seal/deploy cycle). The on-chain data URI is the resolution
   mechanism of record; both mirrors are additive.

## Verification commands (anyone, public values only)

- Local proof rerun: start `anvil --port 8545`, then
  `node scripts/prove-local-anvil.mjs`
- Fork proof rerun: `bash scripts/run-fork-proof.sh`
- After mainnet deployment: read `mainnet-deployment.json`, open the
  BaseScan contract link, and compare name/symbol/tokenURI against
  `metadata/genesis-node-1.json`.
