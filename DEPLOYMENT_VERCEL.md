# 🚀 Vercel Deployment Guide — OpenET / OpenX Portal

This guide explains how to deploy the **OpenET Portal** to [Vercel](https://vercel.com) connected directly to **BOT Chain Mainnet (Chain ID 677)** and **BOT Chain Bohr Testnet (Chain ID 968)**.

---

## ⛓️ 1. Live Deployed Smart Contracts

### A. BOT Chain Mainnet (Chain ID `677`)

| Contract Name | Mainnet Address | Deployment Tx | Explorer Link |
|---|---|---|---|
| **StatementCommitmentRegistry** | `0xaD853e558171821372f084C87CEb5fAb4ca32E95` | `0x79b2887b...` | [View on BOTScan Mainnet](https://scan.botchain.ai/address/0xaD853e558171821372f084C87CEb5fAb4ca32E95) |
| **ReceiptAnchor** | `0xEB09EE90BC8803AFA8CA068F4bf6f51F95b203fE` | `0xee00202a...` | [View on BOTScan Mainnet](https://scan.botchain.ai/address/0xEB09EE90BC8803AFA8CA068F4bf6f51F95b203fE) |

### B. BOT Chain Bohr Testnet (Chain ID `968`)

| Contract Name | Testnet Address | Deployment Tx | Explorer Link |
|---|---|---|---|
| **StatementCommitmentRegistry** | `0xaD853e558171821372f084C87CEb5fAb4ca32E95` | `0x046bacd2...` | [View on BOTScan Testnet](https://scan.bohr.life/address/0xaD853e558171821372f084C87CEb5fAb4ca32E95) |
| **ReceiptAnchor** | `0xEB09EE90BC8803AFA8CA068F4bf6f51F95b203fE` | `0x56b66ed3...` | [View on BOTScan Testnet](https://scan.bohr.life/address/0xEB09EE90BC8803AFA8CA068F4bf6f51F95b203fE) |

---

## 🛠️ 2. Deployment Instructions

### Method A: Deploy via Vercel Web Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repository (`openet`).
2. Under **Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `portal`
3. Under **Environment Variables**, configure for Mainnet:

```env
# Network Configuration (BOT Chain Mainnet)
NEXT_PUBLIC_BOTCHAIN_NETWORK=mainnet
NEXT_PUBLIC_BOTCHAIN_CHAIN_ID=677
NEXT_PUBLIC_BOTCHAIN_RPC_URL=https://rpc.botchain.ai
NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL=https://scan.botchain.ai

# Smart Contract Addresses
NEXT_PUBLIC_STATEMENT_COMMITMENT_REGISTRY=0xaD853e558171821372f084C87CEb5fAb4ca32E95
NEXT_PUBLIC_RECEIPT_ANCHOR_CONTRACT=0xEB09EE90BC8803AFA8CA068F4bf6f51F95b203fE

# Gateway Endpoints
OPENX_GATEWAY_URL=https://your-gateway-host.com
NEXT_PUBLIC_OPENX_GATEWAY_URL=https://your-gateway-host.com
```

> **Note on Wallets:**  
> The portal has built-in support for native browser injected wallets (MetaMask, Rabby, BO Wallet) on BOT Chain. `NEXT_PUBLIC_PRIVY_APP_ID` is strictly optional.

4. Click **Deploy**.

---

### Method B: Deploy via Vercel CLI

From your terminal:

```bash
# 1. Install or run Vercel CLI
cd portal
npx vercel

# 2. Deploy to Production
npx vercel --prod
```

---

## ⚙️ 3. Verification Checklist

- [x] Contracts compiled and deployed to BOT Chain Bohr Testnet.
- [x] Deployment record saved to [`gateway/deployments/botchain-testnet.json`](./gateway/deployments/botchain-testnet.json).
- [x] `portal/vercel.json` and root `vercel.json` configured.
- [x] `portal/.env.example` and `portal/.env.local` populated with contract addresses.
- [x] Native browser wallet auto-switching to Chain `968` (Bohr Testnet).
