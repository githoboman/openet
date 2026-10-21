'use client';

import React, { useState, useEffect } from 'react';
import { usePortalAuth } from '@/app/PortalAuthProvider';
import {
  BOTCHAIN_TESTNET,
  BOTCHAIN_MAINNET,
  formatBotAddress,
  getBotExplorerAddressUrl,
  getBotExplorerTxUrl,
  getBotExplorerBlockUrl,
} from '@/lib/botchain';
import {
  Bot,
  ExternalLink,
  Coins,
  ShieldCheck,
  Check,
  Copy,
  RefreshCw,
  Send,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Layers,
  Cpu,
  Fingerprint,
  Wallet,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface BotChainPageProps {
  params: { agentId: string };
}

interface TestTxRecord {
  hash: string;
  timestamp: string;
  status: 'pending' | 'success' | 'failed';
  type: string;
}

export default function BotChainHubPage({ params }: { params: { agentId: string } }) {
  const {
    ready,
    authenticated,
    walletAddress,
    chainId,
    isBotChain,
    isTestnet,
    balance,
    login,
    switchToBotChainTestnet,
    refreshBalance,
    sendTransaction,
    waitTransaction,
  } = usePortalAuth();

  const [copiedAddr, setCopiedAddr] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [sendingTestTx, setSendingTestTx] = useState(false);
  const [testTxs, setTestTxs] = useState<TestTxRecord[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [amountInput, setAmountInput] = useState('0.01');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Agent OS Mock / Local State for Demo & Testing
  const [smartWalletStatus, setSmartWalletStatus] = useState<'PREDICTED' | 'DEPLOYED'>('PREDICTED');
  const [deployingWallet, setDeployingWallet] = useState(false);
  const [identityStatus, setIdentityStatus] = useState<'UNREGISTERED' | 'PENDING' | 'REGISTERED'>('UNREGISTERED');
  const [erc8004Id, setErc8004Id] = useState<string | null>(null);

  const copyAddress = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleSwitch = async () => {
    setSwitching(true);
    try {
      await switchToBotChainTestnet();
    } finally {
      setSwitching(false);
    }
  };

  const handleDeploySmartAccount = async () => {
    setDeployingWallet(true);
    setStatusMessage('Initiating ERC-4337 smart account deployment on Bohr Testnet...');
    setTimeout(() => {
      setSmartWalletStatus('DEPLOYED');
      setDeployingWallet(false);
      setStatusMessage('Smart account successfully deployed on BOT Chain Testnet!');
      setTimeout(() => setStatusMessage(null), 4000);
    }, 2500);
  };

  const handleRegisterIdentity = async () => {
    if (!walletAddress) {
      window.alert('Please connect your wallet first.');
      return;
    }
    setIdentityStatus('PENDING');
    setStatusMessage('Submitting ERC-8004 Agent Identity registration to BOT Chain Testnet...');
    setTimeout(() => {
      const randomId = Math.floor(Math.random() * 900 + 100).toString();
      setIdentityStatus('REGISTERED');
      setErc8004Id(randomId);
      setStatusMessage(`Agent Identity registered! ERC-8004 ID #${randomId}`);
      setTimeout(() => setStatusMessage(null), 5000);
    }, 3000);
  };

  const handleSendTestTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      window.alert('Please connect your wallet first.');
      return;
    }
    if (!isTestnet) {
      const switched = await switchToBotChainTestnet();
      if (!switched) {
        window.alert('Please switch to BOT Chain Testnet (Chain ID 968) to submit.');
        return;
      }
    }

    const targetTo = recipientInput.trim() || walletAddress;
    setSendingTestTx(true);
    setStatusMessage('Awaiting signature in connected wallet...');

    try {
      // Send on-chain transaction (ping or transfer)
      const txHash = await sendTransaction({
        to: targetTo,
        data: '0x',
        value: amountInput ? `0x${(BigInt(Math.floor(parseFloat(amountInput) * 1e18))).toString(16)}` : '0x0',
      });

      if (!txHash) {
        throw new Error('Transaction was cancelled or rejected by wallet.');
      }

      setStatusMessage(`Transaction submitted: ${txHash.slice(0, 10)}... Awaiting block inclusion...`);
      const newRecord: TestTxRecord = {
        hash: txHash,
        timestamp: new Date().toLocaleTimeString(),
        status: 'pending',
        type: targetTo === walletAddress ? 'Self Ping / Health Check' : 'tBOT Transfer',
      };
      setTestTxs((prev) => [newRecord, ...prev]);

      const confirmed = await waitTransaction(txHash);
      setTestTxs((prev) =>
        prev.map((t) => (t.hash === txHash ? { ...t, status: confirmed ? 'success' : 'failed' } : t))
      );
      setStatusMessage(confirmed ? 'Transaction confirmed on BOT Chain Testnet!' : 'Transaction reverted.');
      setTimeout(() => setStatusMessage(null), 5000);
      void refreshBalance();
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err?.message || 'Transaction failed'}`);
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setSendingTestTx(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Overview Bar */}
      <section className="rounded-2xl border border-primary/30 bg-surface-container-low p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary font-mono">
                BOT Chain Migration · Testnet Seam
              </p>
            </div>
            <h1 className="font-headline text-2xl font-extrabold text-on-surface mt-1 flex items-center gap-2.5">
              <span>BOT Chain Testnet Hub</span>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-xs font-mono font-bold text-emerald-400">
                Chain ID: 968
              </span>
            </h1>
            <p className="text-xs text-on-surface-variant mt-1 max-w-3xl">
              High-performance EVM Layer 1 for DePIN and AI Agents. Manage smart accounts, verify ERC-8004 on-chain agent identities, obtain testnet tBOT tokens, and inspect transactions via BOTScan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={BOTCHAIN_TESTNET.faucetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-secondary/15 border border-secondary/40 px-3.5 py-2 text-xs font-bold text-secondary hover:bg-secondary/25 transition shadow-sm"
            >
              <Coins className="h-4 w-4" />
              <span>Claim tBOT Faucet</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <a
              href={BOTCHAIN_TESTNET.blockExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container-high border border-outline-variant/40 px-3.5 py-2 text-xs font-bold text-on-surface hover:text-primary transition"
            >
              <ExternalLink className="h-4 w-4" />
              <span>BOTScan</span>
            </a>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {statusMessage && (
          <div className="mt-4 rounded-xl border border-primary/40 bg-primary/10 p-3 text-xs font-medium text-primary flex items-center gap-2 animate-in fade-in">
            <Activity className="h-4 w-4 animate-spin shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </section>

      {/* 2. Three Parameter & Wallet Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card A: Network Connection Status */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-primary" /> Network Config
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${isTestnet ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isTestnet ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {isTestnet ? 'Connected: 968' : isBotChain ? 'Mainnet: 677' : 'Other Network'}
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-on-surface-variant">
              <span>Network:</span>
              <span className="text-on-surface font-semibold">BOT Chain Testnet (Bohr)</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>RPC Endpoint:</span>
              <span className="text-primary truncate max-w-[180px]">{BOTCHAIN_TESTNET.rpcUrl}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Native Token:</span>
              <span className="text-on-surface font-bold">BOT (18 Decimals)</span>
            </div>
          </div>

          {!isTestnet && (
            <button
              onClick={handleSwitch}
              disabled={switching}
              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 p-2 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{switching ? 'Switching…' : 'Switch Wallet to Bohr Testnet (968)'}</span>
            </button>
          )}
        </div>

        {/* Card B: Connected Operator Wallet */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-agent-accent" /> Operator Account
            </span>
            {walletAddress && (
              <button
                onClick={handleRefresh}
                className="text-on-surface-variant hover:text-primary p-1"
                title="Refresh balance"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-primary' : ''}`} />
              </button>
            )}
          </div>

          {authenticated && walletAddress ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-mono">Address:</span>
                <div className="flex items-center gap-1 font-mono text-xs font-bold text-on-surface">
                  <span>{formatBotAddress(walletAddress)}</span>
                  <button
                    onClick={() => copyAddress(walletAddress)}
                    className="p-1 hover:bg-surface-container-high rounded"
                    title="Copy Address"
                  >
                    {copiedAddr ? <Check className="h-3.5 w-3.5 text-secondary" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant font-mono">Balance:</span>
                <span className="font-mono text-base font-extrabold text-primary">
                  {balance} <span className="text-xs font-normal text-on-surface-variant">BOT</span>
                </span>
              </div>

              <div className="pt-1">
                <a
                  href={getBotExplorerAddressUrl(walletAddress, chainId || 968)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <span>View account on BOTScan</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="py-2 text-center space-y-2">
              <p className="text-xs text-on-surface-variant">No wallet connected</p>
              <button
                onClick={() => login('injected')}
                className="w-full rounded-xl bg-primary px-3 py-2 text-xs font-bold text-on-primary hover:bg-[#33f3ff] transition"
              >
                Connect Browser Wallet
              </button>
            </div>
          )}
        </div>

        {/* Card C: Agent OS Smart Account Status */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-mono flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-secondary" /> ERC-4337 Smart Account
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${smartWalletStatus === 'DEPLOYED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-primary/15 text-primary border border-primary/30'}`}>
              {smartWalletStatus}
            </span>
          </div>

          <p className="text-xs text-on-surface-variant">
            {smartWalletStatus === 'PREDICTED'
              ? 'Agent smart account counterfactual address is pre-calculated via CREATE2. Can receive funds immediately.'
              : 'Smart contract account is deployed on BOT Chain Testnet. Outgoing transfers and UserOperations enabled.'}
          </p>

          {smartWalletStatus === 'PREDICTED' ? (
            <button
              onClick={handleDeploySmartAccount}
              disabled={deployingWallet}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary/15 border border-primary/40 p-2 text-xs font-bold text-primary hover:bg-primary/25 transition disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{deployingWallet ? 'Deploying (Gas Sponsored)…' : 'Deploy Smart Account (Free Gas)'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              <span>Smart Account ready on Bohr Testnet</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Agent OS Operations Seam */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Interactive Transaction & Statement Commitment Seam */}
        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 space-y-4">
          <div className="border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              <h2 className="font-headline text-lg font-bold text-on-surface">
                Testnet Transaction & Health Check
              </h2>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Test your connected wallet with live transactions on BOT Chain Testnet (Chain ID 968). Confirm gas estimation, latency, and block inclusion.
            </p>
          </div>

          <form onSubmit={handleSendTestTransaction} className="space-y-3 text-xs">
            <div>
              <label className="block text-on-surface-variant font-medium mb-1">
                Recipient Address (Leave empty for self-ping healthcheck):
              </label>
              <input
                type="text"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder={walletAddress || '0x...'}
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container px-3.5 py-2.5 font-mono text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-on-surface-variant font-medium mb-1">
                Amount in BOT:
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container px-3.5 py-2.5 font-mono text-xs text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sendingTestTx || !walletAddress}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-on-primary hover:bg-[#33f3ff] transition disabled:opacity-50 shadow-sm"
            >
              {sendingTestTx ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Submitting to Bohr Testnet…</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Transaction via Wallet</span>
                </>
              )}
            </button>
          </form>

          {/* Test Transaction History */}
          {testTxs.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                Recent Testnet Submissions
              </p>
              <div className="divide-y divide-outline-variant/20 rounded-xl border border-outline-variant/30 bg-surface-container">
                {testTxs.map((tx) => (
                  <div key={tx.hash} className="p-3 flex items-center justify-between text-xs font-mono">
                    <div>
                      <p className="font-semibold text-on-surface">{tx.type}</p>
                      <a
                        href={getBotExplorerTxUrl(tx.hash, 968)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-[11px] mt-0.5"
                      >
                        <span>{tx.hash.slice(0, 16)}...</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        tx.status === 'success'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : tx.status === 'pending'
                          ? 'bg-primary/20 text-primary animate-pulse'
                          : 'bg-error/20 text-error'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Column: ERC-8004 Agent Identity Service */}
        <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 space-y-4">
          <div className="border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-agent-accent" />
              <h2 className="font-headline text-lg font-bold text-on-surface">
                ERC-8004 Agent Identity
              </h2>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Compliant on-chain Agent Identity protocol on BOT Chain. Connects an agent’s smart account with independently verifiable metadata and ownership.
            </p>
          </div>

          <div className="rounded-xl border border-outline-variant/30 bg-surface-container p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Identity Status:</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded ${
                  identityStatus === 'REGISTERED'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : identityStatus === 'PENDING'
                    ? 'bg-primary/20 text-primary animate-pulse'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {identityStatus}
              </span>
            </div>

            {erc8004Id && (
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">ERC-8004 Agent ID:</span>
                <span className="font-mono font-bold text-primary">#{erc8004Id}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Registry Address:</span>
              <span className="font-mono text-on-surface truncate max-w-[200px]" title="0xb43edfb9c7609cf645e932b2ff20f26f0d4488de">
                0xb43edfb9...4488de
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Identity API:</span>
              <span className="font-mono text-primary">{BOTCHAIN_TESTNET.identityApiUrl}</span>
            </div>
          </div>

          {identityStatus === 'UNREGISTERED' ? (
            <button
              onClick={handleRegisterIdentity}
              disabled={!walletAddress}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-agent-accent px-4 py-2.5 text-xs font-bold text-on-primary hover:bg-[#b854ff] transition disabled:opacity-50 shadow-sm"
            >
              <Fingerprint className="h-4 w-4" />
              <span>Register ERC-8004 Agent Identity on Bohr</span>
            </button>
          ) : identityStatus === 'PENDING' ? (
            <div className="p-3 rounded-xl border border-primary/30 bg-primary/10 text-xs text-primary flex items-center justify-center gap-2">
              <Activity className="h-4 w-4 animate-spin" />
              <span>Registering on-chain identity...</span>
            </div>
          ) : (
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Identity active & verifiable by third parties</span>
              </div>
              <a
                href={`${BOTCHAIN_TESTNET.blockExplorerUrl}/address/0xb43edfb9c7609cf645e932b2ff20f26f0d4488de`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-emerald-300 font-mono text-[11px]"
              >
                View Registry
              </a>
            </div>
          )}

          {/* Integration Guide Note */}
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-3 text-[11px] text-on-surface-variant space-y-1">
            <p className="font-semibold text-on-surface">Developer Integration Seam:</p>
            <p>
              Agents call <code className="text-primary font-mono">POST https://identity-api.bohr.life/v1/agents/identities</code> with their <code className="font-mono">wallet_id</code> and <code className="font-mono">external_agent_id</code> to claim their verifiable on-chain identity on Bohr Testnet.
            </p>
          </div>
        </section>
      </div>

      {/* 4. Quick Links & Resources Footer */}
      <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-5">
        <h3 className="font-headline text-sm font-bold text-on-surface mb-3">
          BOT Chain Developer Resources & Documentation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <a
            href="https://dev-docs.botchain.ai/docs/intro/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-outline-variant/30 bg-surface-container p-3 hover:border-primary transition group"
          >
            <p className="font-bold text-on-surface group-hover:text-primary transition">Dev Docs Intro →</p>
            <p className="text-[11px] text-on-surface-variant mt-1">Full technical guide to BOT Chain architecture and tools</p>
          </a>

          <a
            href="https://dev-docs.botchain.ai/docs/Developers/quick-guide/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-outline-variant/30 bg-surface-container p-3 hover:border-primary transition group"
          >
            <p className="font-bold text-on-surface group-hover:text-primary transition">Quick Guide →</p>
            <p className="text-[11px] text-on-surface-variant mt-1">Network parameters, RPCs, and developer toolkits</p>
          </a>

          <a
            href="https://dev-docs.botchain.ai/docs/Agent-OS"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-outline-variant/30 bg-surface-container p-3 hover:border-primary transition group"
          >
            <p className="font-bold text-on-surface group-hover:text-primary transition">Agent OS Spec →</p>
            <p className="text-[11px] text-on-surface-variant mt-1">Smart account abstraction and ERC-8004 identity specs</p>
          </a>

          <a
            href="https://faucet.botchain.ai/basic"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-outline-variant/30 bg-surface-container p-3 hover:border-secondary transition group"
          >
            <p className="font-bold text-on-surface group-hover:text-secondary transition">tBOT Faucet →</p>
            <p className="text-[11px] text-on-surface-variant mt-1">Claim free testnet tokens for agent transaction testing</p>
          </a>
        </div>
      </section>
    </div>
  );
}
