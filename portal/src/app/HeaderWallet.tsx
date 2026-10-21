'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePortal } from '@/lib/portalContext';
import { usePortalAuth } from './PortalAuthProvider';
import {
  LogIn,
  LogOut,
  Sun,
  Moon,
  Copy,
  Check,
  Bot,
  ExternalLink,
  ChevronDown,
  AlertTriangle,
  Coins,
  RefreshCw,
  Wallet,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { WebMcpStatusIndicator } from '@/lib/webmcp/WebMcpProvider';
import {
  BOTCHAIN_TESTNET,
  BOTCHAIN_MAINNET,
  formatBotAddress,
  getBotExplorerAddressUrl,
} from '@/lib/botchain';

export function HeaderWallet() {
  const { theme, toggleTheme } = usePortal();
  const {
    ready,
    authenticated,
    walletAddress,
    chainId,
    isBotChain,
    isTestnet,
    balance,
    login,
    logout,
    switchToBotChainTestnet,
    switchNetwork,
    refreshBalance,
  } = usePortalAuth();

  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayWallet = formatBotAddress(walletAddress);

  const copyWallet = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleSwitchToTestnet = async () => {
    setSwitchingNetwork(true);
    try {
      await switchToBotChainTestnet();
    } finally {
      setSwitchingNetwork(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="flex items-center gap-2.5">
      <WebMcpStatusIndicator />

      {/* ChatGPT Link */}
      <a
        href="https://chatgpt.com/?hints=search&q=OpenX%20Portal%20agent%20management"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden xl:inline-flex items-center gap-1 rounded-lg border border-primary/30 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition"
        title="Open OpenX Portal tools in ChatGPT"
      >
        <Bot className="h-3.5 w-3.5" />
        <span>Open in ChatGPT</span>
      </a>

      {/* Dark / Light Mode Switcher */}
      <button
        onClick={toggleTheme}
        className="rounded-xl border border-outline-variant/30 bg-surface-container-high/60 p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition shadow-sm"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle Dark/Light Theme"
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4 text-primary transition-transform hover:rotate-45" />
        ) : (
          <Moon className="h-4 w-4 text-agent-accent transition-transform hover:-rotate-12" />
        )}
      </button>

      {!ready ? (
        <div className="h-9 w-28 animate-pulse rounded-xl bg-surface-container-high/60" />
      ) : authenticated && walletAddress ? (
        <div className="relative flex items-center gap-2" ref={dropdownRef}>
          {/* Marketplace / Studio Link */}
          <Link
            href="/"
            className="hidden md:inline-flex items-center gap-1 rounded-lg border border-outline-variant/30 px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition"
          >
            Agent Studio
          </Link>

          {/* Network Pill */}
          {isTestnet ? (
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>BOT Testnet (968)</span>
            </div>
          ) : isBotChain ? (
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>BOT Mainnet</span>
            </div>
          ) : (
            <button
              onClick={handleSwitchToTestnet}
              disabled={switchingNetwork}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition"
              title="Click to switch to BOT Chain Testnet (Chain ID 968)"
            >
              <AlertTriangle className="h-3 w-3 animate-bounce" />
              <span>Switch to BOT Testnet</span>
            </button>
          )}

          {/* Balance Pill */}
          {balance !== null && (
            <div className="hidden lg:flex items-center gap-1 rounded-xl border border-primary/20 bg-surface-container-high px-2.5 py-1 text-xs font-mono font-bold text-primary">
              <Coins className="h-3.5 w-3.5 text-primary/80" />
              <span>{balance} BOT</span>
            </div>
          )}

          {/* Connected Wallet Button & Dropdown Trigger */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-agent-accent/30 bg-surface-container-high px-3 py-1.5 hover:bg-surface-container-highest transition shadow-sm"
            title="Account Options"
          >
            <span className={`h-2 w-2 rounded-full ${isTestnet ? 'bg-secondary' : isBotChain ? 'bg-cyan-400' : 'bg-amber-400'}`} />
            <span className="font-mono text-xs font-semibold text-on-surface">
              {displayWallet}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-on-surface-variant transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="space-y-3">
                {/* Header with Address & Copy */}
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant font-mono">Connected Wallet</p>
                    <p className="font-mono text-xs font-bold text-on-surface mt-0.5">{displayWallet}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={copyWallet}
                      className="rounded-lg p-1.5 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition"
                      title="Copy Address"
                    >
                      {copied ? <Check className="h-4 w-4 text-secondary" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <a
                      href={getBotExplorerAddressUrl(walletAddress, chainId || 968)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-1.5 hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition"
                      title="View on BOTScan"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* Network & Balance Box */}
                <div className="rounded-xl border border-outline-variant/30 bg-surface-container p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Network</span>
                    <span className={`font-semibold ${isTestnet ? 'text-emerald-400' : isBotChain ? 'text-cyan-400' : 'text-amber-400'}`}>
                      {isTestnet ? 'BOT Testnet (968)' : isBotChain ? 'BOT Mainnet (677)' : `Chain ${chainId}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Balance</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-primary">{balance} BOT</span>
                      <button
                        onClick={handleRefresh}
                        className="text-on-surface-variant hover:text-primary p-0.5"
                        title="Refresh balance"
                      >
                        <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin text-primary' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Network Switching Section if not on Testnet */}
                {!isTestnet && (
                  <button
                    onClick={handleSwitchToTestnet}
                    disabled={switchingNetwork}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/40 p-2 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{switchingNetwork ? 'Switching…' : 'Switch to BOT Testnet (968)'}</span>
                  </button>
                )}

                {/* Quick Ecosystem Links */}
                <div className="space-y-1 pt-1 border-t border-outline-variant/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant font-mono mb-1.5">BOT Chain Ecosystem</p>
                  <a
                    href={BOTCHAIN_TESTNET.faucetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-on-surface hover:bg-surface-container-high transition"
                  >
                    <span className="flex items-center gap-2">
                      <Coins className="h-3.5 w-3.5 text-primary" />
                      <span>Claim Testnet tBOT</span>
                    </span>
                    <ExternalLink className="h-3 w-3 text-on-surface-variant" />
                  </a>

                  <a
                    href={BOTCHAIN_TESTNET.blockExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-on-surface hover:bg-surface-container-high transition"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink className="h-3.5 w-3.5 text-secondary" />
                      <span>BOTScan Explorer</span>
                    </span>
                    <ExternalLink className="h-3 w-3 text-on-surface-variant" />
                  </a>

                  <a
                    href={BOTCHAIN_TESTNET.boWalletUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-on-surface hover:bg-surface-container-high transition"
                  >
                    <span className="flex items-center gap-2">
                      <Wallet className="h-3.5 w-3.5 text-agent-accent" />
                      <span>BO Wallet</span>
                    </span>
                    <ExternalLink className="h-3 w-3 text-on-surface-variant" />
                  </a>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-error/30 bg-error/10 p-2 text-xs font-bold text-error hover:bg-error/20 transition mt-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <button
            onClick={() => setConnectModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:bg-[#33f3ff] transition"
          >
            <LogIn className="h-4 w-4" />
            <span>Connect Wallet</span>
          </button>

          {/* Connect Wallet Modal */}
          {connectModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-md rounded-2xl border border-outline-variant/40 bg-surface-container-low p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                  <div>
                    <h3 className="font-headline text-lg font-bold text-on-surface">Connect to BOT Chain</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">Choose your wallet to connect to BOT Chain Testnet (Chain ID 968)</p>
                  </div>
                  <button
                    onClick={() => setConnectModalOpen(false)}
                    className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Option 1: Browser EVM Wallet */}
                  <button
                    onClick={async () => {
                      setConnectModalOpen(false);
                      await login('injected');
                    }}
                    className="w-full flex items-center justify-between rounded-xl border border-primary/30 bg-surface-container p-3.5 text-left hover:bg-surface-container-high hover:border-primary transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">Browser Wallet</p>
                        <p className="text-xs text-on-surface-variant">MetaMask, Rabby, BO Wallet, Trust, Coinbase</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">Connect →</span>
                  </button>

                  {/* Option 2: BOT Chain Official BO Wallet */}
                  <a
                    href={BOTCHAIN_TESTNET.boWalletUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container p-3.5 text-left hover:bg-surface-container-high hover:border-agent-accent transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-agent-accent/10 text-agent-accent group-hover:scale-105 transition-transform">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">BO Wallet (Official)</p>
                        <p className="text-xs text-on-surface-variant">Dedicated wallet for the BOT Chain ecosystem</p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-on-surface-variant group-hover:text-agent-accent transition" />
                  </a>

                  {/* Option 3: Faucet quick link for onboarding */}
                  <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-secondary">Need testnet tokens?</p>
                      <p className="text-[11px] text-on-surface-variant">Claim free tBOT tokens from the official faucet.</p>
                    </div>
                    <a
                      href={BOTCHAIN_TESTNET.faucetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-secondary/15 border border-secondary/30 px-2.5 py-1 text-xs font-bold text-secondary hover:bg-secondary/25 transition flex items-center gap-1"
                    >
                      <span>Faucet</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="border-t border-outline-variant/20 pt-3 text-center">
                  <p className="text-[11px] text-on-surface-variant font-mono">
                    Chain ID: 968 · RPC: https://rpc.bohr.life · Currency: BOT
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
