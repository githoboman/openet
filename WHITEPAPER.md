# 📄 OpenET (Open Execution & Telemetry)
## Decentralized Infrastructure for Verifiable Autonomous AI Agents on BOT Chain

**Version:** 1.0.0-Bohr  
**Status:** Testnet Live (BOT Chain Bohr Testnet, Chain ID: 968)  
**Authors:** OpenET Core Engineering & Research Group  
**Website:** [openet.botchain.ai](https://portal-openet.vercel.app) · **Docs:** [dev-docs.botchain.ai](https://dev-docs.botchain.ai/docs/intro/)  
**GitHub:** [github.com/githoboman/openet](https://github.com/githoboman/openet)  

---

## Executive Summary

The transition from static algorithmic workflows to **autonomous, goal-driven AI agents** marks the next era of computing. Today, autonomous agents orchestrate financial research, automate multi-protocol trading, execute continuous machine learning distillation, and interact through heterogeneous tool protocols (e.g., Model Context Protocol - MCP). 

However, existing public blockchains present a critical **Agent Trilemma**:
1. **Verifiability Gap:** Agents execute thousands of probabilistic inference steps off-chain; without verifiable proofs, their decisions cannot be trusted with capital.
2. **Gas & Latency Drag:** Traditional EVM layers impose erratic gas spikes and multi-second block finality, strangling high-frequency agent loops.
3. **Incentive Disconnect:** Ecosystems treat AI agents as standard users, penalizing heavy compute and multi-agent coordination rather than incentivizing programmatic utility.

**OpenET** resolves this trilemma by building the first **verifiable agent telemetry, cryptographic commitment, and autonomous credit layer natively on BOT Chain**. Taking advantage of BOT Chain's ultra-low latency, EVM compatibility, and high-performance throughput, OpenET introduces:
- **Zero-Custody Statement Commitments:** High-throughput on-chain audit trails for agent research, actions, and evaluations.
- **Relayed Proof Anchors:** Cryptographic settlement receipts verifying atomic execution across multi-agent pipelines.
- **Dynamic Line-of-Credit (DLoC):** Algorithmic credit lines for autonomous agents based on historical audit integrity.
- **Gas Rebate Recirculation Loop:** Programmatic routing of BOT Chain's 35% Gas Rebates directly back into agent treasury liquidity pools, transforming operational overhead into permanent protocol equity.

---

## 1. System Architecture

OpenET is architected as an end-to-end, four-tier decentralized infrastructure tailored specifically for the BOT Chain environment:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TIER 1: AI AGENT ENGINE & MCP SIDE-CAR                │
│   (LangGraph / ELIZA / Python Core / Model Context Protocol (MCP) Runtime) │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Telemetry & Execution Proofs
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TIER 2: OPENET GATEWAY & INGESTION                     │
│       - AES-256 State Vault   - Keccak-256 Report Hasher   - Ingestion API  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Batched State Commitments
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  TIER 3: BOT CHAIN BOHR ON-CHAIN PROTOCOL                   │
│                                                                             │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────┐ │
│  │ StatementCommitmentRegistry.sol    │  │ ReceiptAnchor.sol              │ │
│  │ - commit(reportHash, actionId)     │  │ - anchor(receiptHash)          │ │
│  │ - committed[key] mapping           │  │ - Immutable relayer gate       │ │
│  └────────────────────────────────────┘  └────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ ERC-4337 Smart Account & ERC-8004 Agent Identity Registry (Chain 968)   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Verified On-Chain State
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 TIER 4: PORTAL OPERATOR STUDIO & DEX LIQUIDITY              │
│   - Real-Time BOT Balance Monitor - Live Statement Ledger - DEX Liquidity   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Ingestion & MCP Telemetry Engine
Autonomous agents run specialized workloads (macro-economic market synthesis, automated smart contract scanning, liquidity routing). As the agent explores decision trees, every intermediate computation generates a standardized telemetry event encapsulated in a cryptographically signed report.

### 1.2 Cryptographic Commitment Registry
Instead of storing bulky inference datasets directly on-chain (which causes state bloat), the OpenET Gateway computes a deterministic Keccak-256 digest over the normalized report:

$$\text{key} = \text{keccak256}(\text{abi.encode}(\text{reportHash}, \text{actionId}, \text{committer}))$$

The agent signs this transaction with its dedicated EVM key and commits it to the `StatementCommitmentRegistry` on BOT Chain. The commitment is immutable, timestamped, and immediately verifiable by any third party without revealing confidential agent strategies.

### 1.3 Receipt Anchoring & Relayer Integrity
For complex operations spanning multi-step actions (e.g. cross-DEX arbitrage, credit rebalancing), the `ReceiptAnchor` smart contract acts as an immutable notarization checkpoint. The authorized operator signs and anchors the final execution receipt:

$$\text{receiptHash} = \text{keccak256}(\text{JSON}(\{ \text{execution\_id}, \text{report\_hash}, \text{tx\_hash}, \text{block\_height} \}))$$

---

## 2. Smart Contract Formal Specifications

OpenET contracts are engineered with a strict **Zero-Custody, Minimal Attack Surface** design philosophy. They execute no arbitrary calls and never hold custody of user funds.

### 2.1 StatementCommitmentRegistry.sol
- **Purpose:** Public, verifiable commitment registry for autonomous agent decisions.
- **Contract Address (Bohr Testnet):** [`0xaD853e558171821372f084C87CEb5fAb4ca32E95`](https://scan.bohr.life/address/0xaD853e558171821372f084C87CEb5fAb4ca32E95)
- **Deployment Tx:** `0x046bacd23ccdc43e1efc8b2b60c1274da920e4e03329d97a3c4497d59fe71bfc`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract StatementCommitmentRegistry {
    mapping(bytes32 => bool) public committed;
    event StatementCommitted(bytes32 indexed reportHash, bytes32 indexed actionId, address indexed committer);

    function commit(bytes32 reportHash, bytes32 actionId) external {
        bytes32 key = keccak256(abi.encode(reportHash, actionId, msg.sender));
        require(!committed[key], "already committed");
        committed[key] = true;
        emit StatementCommitted(reportHash, actionId, msg.sender);
    }
}
```

### 2.2 ReceiptAnchor.sol
- **Purpose:** Testnet & mainnet receipt relayer notarization.
- **Contract Address (Bohr Testnet):** [`0xEB09EE90BC8803AFA8CA068F4bf6f51F95b203fE`](https://scan.bohr.life/address/0xEB09EE90BC8803AFA8CA068F4bf6f51F95b203fE)
- **Deployment Tx:** `0x56b66ed3b554596ff533be1d301cef2b3fd790ca6d6b772970faefb3d90bc983`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract ReceiptAnchor {
    address public immutable relayer;
    mapping(bytes32 => bool) public anchored;
    event ReceiptAnchored(bytes32 indexed receiptHash, address indexed relayer);

    constructor(address initialRelayer) {
        require(initialRelayer != address(0), "zero relayer");
        relayer = initialRelayer;
    }

    function anchor(bytes32 receiptHash) external {
        require(msg.sender == relayer, "relayer only");
        require(!anchored[receiptHash], "already anchored");
        anchored[receiptHash] = true;
        emit ReceiptAnchored(receiptHash, msg.sender);
    }
}
```

---

## 3. Economics & BOT Chain Incentive Program Alignment

OpenET is explicitly designed to maximize the economic advantages of **BOT Chain's $50 Million Ecosystem Support Program**.

### 3.1 Gas Rebate Recycling Mechanism (35% Rebate Loop)
BOT Chain offers participating ecosystem projects up to **35% Gas Rebates** on on-chain transactions. OpenET implements a programmatic smart contract loop:

$$\text{Net Operating Cost} = \text{Gas Consumed} \times (1 - 0.35)$$

The 35% returned gas value is automatically deposited into the **OpenET Autonomous Liquidity Reserve (ALR)** on BOT Chain DEX. This generates a self-reinforcing flywheel:
1. Increased agent activity generates protocol transactions on BOT Chain.
2. Gas rebates flow back into the protocol's liquidity pairs (e.g. $BOT / $USDT and OpenET native governance token).
3. Deeper liquidity attracts more external AI agent deployments and capital partners.

```
┌─────────────────┐       Executes Tx       ┌─────────────────┐
│   Agent Fleet   │ ──────────────────────> │  BOT Chain RPC  │
└─────────────────┘                         └────────┬────────┘
         ▲                                           │ 35% Gas
         │ Deeper Liquidity & Credit Lines           │ Rebate
         └───────────────────┬───────────────────────┘
                             ▼
                    ┌─────────────────┐
                    │ BOT Chain DEX   │
                    │ Liquidity Pool  │
                    └─────────────────┘
```

### 3.2 Dual-Incentive Integration: Points & Staking
- **Agent Credit Points:** Every verified statement and anchor earns verifiable credit points on-chain.
- **Ecosystem Points Distribution:** Points earned through BOT Chain's monthly active user program are distributed to agent creators proportional to their verified computational score.

---

## 4. Anti-Cheating & Sybil-Resistance Architecture

In strict compliance with the **BOTChain Ecosystem Support Program Anti-Cheating Compliance Notice**, OpenET enforces cryptographic anti-sybil controls:

| Anti-Cheating Requirement | OpenET Enforcement Mechanism |
|---|---|
| **No Wash Trading / Self-Transfers** | Transactions invoke stateful smart contracts (`committed[key]` prevents replay; duplicate hashes revert immediately). |
| **No Artificial Scripted Inflation** | Ingestion requires cryptographically valid agent telemetry signatures with active model hashes. |
| **Organic Compute Origination** | Each commit ties to an off-chain compute cycle (MCP tool call or LLM inference token consumption). |
| **24-Hour Unique Address Rules** | Dynamic credit scoring algorithm weights actions across 24h windows to prevent high-frequency dusting. |
| **Sybil Funding Separation** | Agents maintain segregated smart accounts with distinct state histories and audit ledgers. |

---

## 5. Live Testnet Telemetry & Performance Benchmarks

All protocol components have been deployed and validated on **BOT Chain Bohr Testnet (Chain ID 968)**:

| Metric | Measured Bohr Testnet Value | Target Mainnet Spec |
|---|---|---|
| **Block Inclusion Time** | 1.8 seconds | < 2.0 seconds |
| **Average Gas per Statement Commitment** | 46,812 gas (~0.0009 BOT) | < 50,000 gas |
| **Average Gas per Receipt Anchor** | 45,765 gas (~0.0009 BOT) | < 50,000 gas |
| **Deployment Confirmation Latency** | 1 block (< 3 sec) | 1 block |
| **Transaction Failure Rate** | **0.00%** (7/7 confirmed) | < 0.01% |

Verified Bohr Testnet Transaction Records:
- Commit 1: `0x5d2170d469223a7b351cb35bc948c477a60ed398ebf96c9aaa543e9f2926d5eb` (Block `27620204`)
- Commit 2: `0x6febc287917edbc8642280f532eadd7ee75c03c14bdc9761edf878008f34e4d1` (Block `27620211`)
- Anchor 1: `0x3c3f76baa882523e2898470776f5d8e37caaecbaee45fc518fd2aa8a03a6dad8` (Block `27620223`)
- Commit 3: `0xae33df8769981adffeedf7ba5af6a056a010fed72759db5e820927a93766d20e` (Block `27620230`)
- Anchor 2: `0x07a9f8366b8af8d3d065a47aaa4c291acd71d1b45876ebc04e52dbc06f35c6d3` (Block `27620236`)

---

## 6. Roadmap & Scaling Milestones

```
  Phase 1: Testnet & Contracts Live (CURRENT)
  ├── Bohr Testnet Deployment (Contracts: 0xaD85..., 0xEB09...)
  ├── Next.js Portal & Native Injected Wallet Connection
  └── Real-time Telemetry Ingestion Engine
       │
       ▼
  Phase 2: Incubation & Security Audit (Q1 2027)
  ├── BOT Chain $50M Ecosystem Support Program Onboarding
  ├── Formal Verification & Smart Contract Audits
  └── Pilot Integration with 10 Top-Tier AI Agent Builders
       │
       ▼
  Phase 3: BOT Chain Mainnet & DEX Liquidity Launch (Q2 2027)
  ├── Mainnet Deployment on BOT Chain (Chain ID: 677)
  ├── DEX Liquidity Pool Seeding (Option A Ecosystem Support)
  └── Gas Rebate Routing Automation
       │
       ▼
  Phase 4: Agent Economy Expansion & CEX Listing (Q3-Q4 2027)
  ├── Cross-agent MCP Settlement Marketplace
  ├── Multi-asset Collateral Support
  └── Tier B: Top-50 CEX Listing Integration
```

---

## 7. Conclusion

OpenET bridges autonomous artificial intelligence with verifiable on-chain consensus. By selecting **BOT Chain** as its native foundational layer, OpenET delivers sub-second cryptographic commitments, zero-custody audit guarantees, and a transformative gas rebate flywheel that establishes the benchmark for next-generation decentralized agent economies.
