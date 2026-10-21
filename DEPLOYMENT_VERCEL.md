# 🚀 Vercel Deployment Guide — OpenET / OpenX Portal

This guide explains how to deploy the **OpenET Portal** to [Vercel](https://vercel.com) connected directly to **BOT Chain (Bohr Testnet)**.

---

## ⛓️ 1. Deployed Smart Contracts (BOT Chain Bohr Testnet)

The core verification and anchoring contracts are already deployed on Bohr Testnet (Chain ID `968`):

| Contract Name | Address | Transaction | Explorer |
|---|---|---|---|
| **StatementCommitmentRegistry** | `0xaD853e558171821372f084C87CEb5fAb4ca32E95` | `0x046bacd23ccdc43e1efc8b2b60c1274da920e4e03329d97a3c4497d59fe71bfc` | [View on BOTScan](https://scan.bohr.life/address/0xaD853e558171821372f084C87CEb5fAb4ca32E95) |
| **ReceiptAnchor** | `0xEB09EE90BC8803AFA8CA068F4bf6f51F95b203fE` | `0x56b66ed3b554596ff533be1d301cef2b3fd790ca6d6b772970faefb3d90bc983` | [View on BOTScan](https://scan.bohr.life/address/0xEB09EE90BC8803AFA8CA068F4bf6f51F95b203fE) |

---

## 🛠️ 2. Deployment Instructions

### Method A: Deploy via Vercel Web Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repository.
2. Under **Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select `portal` (or leave default if using the root `vercel.json`).
3. Under **Environment Variables**, add the following:

```env
NEXT_PUBLIC_BOTCHAIN_CHAIN_ID=968
NEXT_PUBLIC_BOTCHAIN_RPC_URL=https://rpc.bohr.life
NEXT_PUBLIC_BOTCHAIN_EXPLORER_URL=https://scan.bohr.life
NEXT_PUBLIC_STATEMENT_COMMITMENT_REGISTRY=0xaD853e558171821372f084C87CEb5fAb4ca32E95
NEXT_PUBLIC_RECEIPT_ANCHOR_CONTRACT=0xEB09EE90BC8803AFA8CA068F4bf6f51F95b203fE
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
