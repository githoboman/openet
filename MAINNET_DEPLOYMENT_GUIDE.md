# 🌐 BOT Chain Mainnet Deployment Guide — OpenET / OpenX

This guide provides the complete end-to-end instructions for deploying OpenET smart contracts and configuring the portal for **BOT Chain Mainnet (Chain ID 677)**.

---

## 📋 1. BOT Chain Mainnet Specifications

| Parameter | Mainnet Value | Notes |
|---|---|---|
| **Network Name** | BOT Chain Mainnet | High-performance public AI blockchain |
| **Chain ID** | `677` (`0x2a5`) | Confirmed live via JSON-RPC `eth_chainId` |
| **RPC Endpoint** | `https://rpc.botchain.ai` | Standard JSON-RPC EVM provider |
| **Block Explorer** | `https://scan.botchain.ai` | Official BOTScan Explorer |
| **Native Currency** | BOT | 18 decimals |
| **Gas Price** | 20 Gwei (`0x4a817c800`) | Fast block times (~1-2 seconds) |
| **Official Bridge** | https://bridge.botchain.ai/ | Cross-chain asset transfers |
| **Official DEX** | https://dex.botchain.ai/#/swap | Swap & liquidity |
| **Official BO Wallet** | https://wallet.botchain.ai/ | Ecosystem non-custodial wallet |

---

## 🔑 2. Deployer Wallet & Funding

The deployer wallet is configured in `gateway/.env` (`ETHEREUM_PRIVATE_KEY` / `OPERATOR_PRIVATE_KEY`):

- **Deployer Public Address:** `0x080211c4Db9d3861d8Ab760245E4cA5Ca54aDA4b`
- **Mainnet Explorer:** [View on BOTScan](https://scan.botchain.ai/address/0x080211c4Db9d3861d8Ab760245E4cA5Ca54aDA4b)

### Gas Cost Estimation
- **StatementCommitmentRegistry Deployment:** ~170,000 gas (~0.0034 BOT)
- **ReceiptAnchor Deployment:** ~150,000 gas (~0.0030 BOT)
- **Total Minimum Required:** **~0.007 BOT**
- **Recommended Balance:** **0.05 – 0.10 BOT** (covers deployment, verification, and initial anchor test transactions)

### Funding Options
1. **Direct BOT Transfer:** Send BOT from an existing funded account or exchange to `0x080211c4Db9d3861d8Ab760245E4cA5Ca54aDA4b`.
2. **Bridge:** Transfer assets via the official [BOT Chain Bridge](https://bridge.botchain.ai/).
3. **DEX:** Swap for BOT on the [BOT DEX](https://dex.botchain.ai/#/swap).

### Check Mainnet Balance
Run the automated pre-flight balance checker from the `gateway/` directory:

```bash
cd gateway
npm run wallet:check:mainnet
```

This will output:
- Live BOT balance on Mainnet (`https://rpc.botchain.ai`)
- Current gas price
- Estimated cost for both contracts
- Readiness verdict (`READY TO DEPLOY` or `INSUFFICIENT BALANCE`)

---

## 🚀 3. Deploying Smart Contracts to Mainnet

Once the deployer wallet has $\ge 0.01$ BOT, execute the automated deployment pipeline:

```bash
cd gateway
npm run deploy:botchain:mainnet
```

### What this command does:
1. Compiles `contracts/StatementCommitmentRegistry.sol` and `contracts/ReceiptAnchor.sol` with `solc` (0.8.24) and EVM optimizer (`runs: 200`).
2. Connects to `https://rpc.botchain.ai` with Chain ID `677`.
3. Deploys `StatementCommitmentRegistry` and waits for 2 block confirmations.
4. Deploys `ReceiptAnchor` and waits for 2 block confirmations.
5. Saves the manifest to [`gateway/deployments/botchain-mainnet.json`](gateway/deployments/botchain-mainnet.json) with contract addresses, transaction hashes, block numbers, and explorer URLs.
6. Automatically updates `gateway/.env` with the new mainnet addresses.

---

## ☁️ 4. Vercel Production Configuration

To deploy the **OpenET Portal** to production on Vercel connected to BOT Chain Mainnet:

### Environment Variables for Vercel Dashboard

In [Vercel Project Settings → Environment Variables](https://vercel.com):

```env
# Network Selection (Mainnet)
NEXT_PUBLIC_BOTCHAIN_NETWORK=mainnet
NEXT_PUBLIC_BOTCHAIN_CHAIN_ID=677
NEXT_PUBLIC_BOTCHAIN_RPC_URL=https://rpc.botchain.ai
NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL=https://scan.botchain.ai

# Smart Contract Addresses (from gateway/deployments/botchain-mainnet.json)
NEXT_PUBLIC_STATEMENT_COMMITMENT_REGISTRY=<DEPLOYED_MAINNET_REGISTRY_ADDRESS>
NEXT_PUBLIC_RECEIPT_ANCHOR_CONTRACT=<DEPLOYED_MAINNET_ANCHOR_ADDRESS>

# Gateway Endpoints
OPENX_GATEWAY_URL=https://your-production-gateway.com
NEXT_PUBLIC_OPENX_GATEWAY_URL=https://your-production-gateway.com
```

### Build & Root Settings
- **Framework Preset:** `Next.js`
- **Root Directory:** `portal`
- **Build Command:** `npm run build`
- **Install Command:** `npm install` (dashboard override can remain OFF / default).

---

## 🔄 5. Dual-Network Support (Mainnet $\leftrightarrow$ Testnet)

The OpenET Portal seamlessly supports both networks without re-deploying code:
- **Default Network:** Controlled by `NEXT_PUBLIC_BOTCHAIN_NETWORK` (`mainnet` or `testnet`).
- **1-Click Switching:** Users can toggle between **BOT Mainnet (677)** and **Bohr Testnet (968)** anytime via the Header Wallet dropdown.
- **Auto-Switching:** Connected wallets (MetaMask, Rabby, BO Wallet) receive an automatic `wallet_switchEthereumChain` / `wallet_addEthereumChain` request matching the active context.

---

## ✅ 6. Mainnet Readiness Checklist

- [x] Chain ID `677` verified against `https://rpc.botchain.ai`
- [x] Automated balance checker created: `npm run wallet:check:mainnet`
- [x] Automated deployment pipeline created: `npm run deploy:botchain:mainnet`
- [x] Deployment manifest structure created for `gateway/deployments/botchain-mainnet.json`
- [x] Portal network library configured for dynamic Mainnet/Testnet resolution
- [x] Portal UI upgraded with 1-click Mainnet & Testnet switching
- [x] Next.js production build verified passing
- [ ] Fund Deployer (`0x080211c4Db9d3861d8Ab760245E4cA5Ca54aDA4b`) with $\ge 0.05$ BOT
- [ ] Run `npm run deploy:botchain:mainnet`
- [ ] Populate Vercel production environment variables and deploy
