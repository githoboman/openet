'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import {
  BOTCHAIN_TESTNET,
  BOTCHAIN_MAINNET,
  getBotChainNetwork,
  getAddChainParameters,
  formatBotAmount,
  isBotChain,
  isBotChainTestnet,
} from '@/lib/botchain';

export interface PortalAuth {
  enabled: boolean;
  ready: boolean;
  authenticated: boolean;
  walletAddress: string | null;
  chainId: number | null;
  isBotChain: boolean;
  isTestnet: boolean;
  balance: string | null;
  balanceWei: string | null;
  networkName: string;
  connectionType: 'injected' | 'privy' | null;
  login: (preferredType?: 'injected' | 'privy') => Promise<void>;
  logout: () => void;
  switchToBotChainTestnet: () => Promise<boolean>;
  switchNetwork: (targetChainId: number) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  sendTransaction: (transaction: { to: string; data: string; value?: string }) => Promise<string | null>;
  sendBotTransaction: (transaction: { to: string; data: string; value?: string }) => Promise<string | null>;
  sendArbitrumTransaction: (transaction: { to: string; data: string; value?: string }) => Promise<string | null>;
  waitTransaction: (transactionHash: string) => Promise<boolean>;
  waitArbitrumTransaction: (transactionHash: string) => Promise<boolean>;
  signTypedData: (chainId: number, typedData: Record<string, unknown>) => Promise<string | null>;
}

const defaultAuthValue: PortalAuth = {
  enabled: true,
  ready: false,
  authenticated: false,
  walletAddress: null,
  chainId: null,
  isBotChain: false,
  isTestnet: false,
  balance: null,
  balanceWei: null,
  networkName: 'Not Connected',
  connectionType: null,
  login: async () => undefined,
  logout: () => undefined,
  switchToBotChainTestnet: async () => false,
  switchNetwork: async () => false,
  refreshBalance: async () => undefined,
  getAccessToken: async () => null,
  sendTransaction: async () => null,
  sendBotTransaction: async () => null,
  sendArbitrumTransaction: async () => null,
  waitTransaction: async () => false,
  waitArbitrumTransaction: async () => false,
  signTypedData: async () => null,
};

const PortalAuthContext = createContext<PortalAuth>(defaultAuthValue);

// Direct JSON-RPC balance query to BOT Chain Testnet for maximum reliability
async function fetchBotNativeBalance(address: string, rpcUrl: string = BOTCHAIN_TESTNET.rpcUrl): Promise<string | null> {
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.result === 'string' ? data.result : null;
  } catch {
    return null;
  }
}

/**
 * Injected EVM Wallet Provider (MetaMask, Rabby, BO Wallet, Trust, etc.)
 * Works out-of-the-box with NO third-party API keys required.
 */
function InjectedPortalAuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balanceWei, setBalanceWei] = useState<string | null>(null);

  const getEthereum = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const anyWindow = window as unknown as { ethereum?: any };
    return anyWindow.ethereum || null;
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalanceWei(null);
      return;
    }
    const targetRpc = chainId === 677 ? BOTCHAIN_MAINNET.rpcUrl : BOTCHAIN_TESTNET.rpcUrl;
    const rawBalance = await fetchBotNativeBalance(walletAddress, targetRpc);
    if (rawBalance) {
      setBalanceWei(rawBalance);
    }
  }, [walletAddress, chainId]);

  const updateChainAndBalance = useCallback(async (addr: string) => {
    const ethereum = getEthereum();
    if (!ethereum) return;
    try {
      const hexChain = await ethereum.request({ method: 'eth_chainId' });
      const parsedChain = parseInt(hexChain, 16);
      setChainId(parsedChain);
    } catch {
      setChainId(null);
    }
    const rawBalance = await fetchBotNativeBalance(addr, BOTCHAIN_TESTNET.rpcUrl);
    if (rawBalance) {
      setBalanceWei(rawBalance);
    }
  }, [getEthereum]);

  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) {
      setReady(true);
      return;
    }

    const checkExistingConnection = async () => {
      try {
        const stored = localStorage.getItem('openx_injected_connected');
        if (stored === 'true') {
          const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            await updateChainAndBalance(accounts[0]);
          }
        }
      } catch (err) {
        console.error('Failed to restore wallet connection', err);
      } finally {
        setReady(true);
      }
    };

    void checkExistingConnection();

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        setWalletAddress(null);
        setBalanceWei(null);
        localStorage.removeItem('openx_injected_connected');
      } else {
        setWalletAddress(accounts[0]);
        void updateChainAndBalance(accounts[0]);
      }
    };

    const handleChainChanged = (hexChain: string) => {
      const parsed = parseInt(hexChain, 16);
      setChainId(parsed);
      if (walletAddress) {
        void refreshBalance();
      }
    };

    if (ethereum.on) {
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (ethereum.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [getEthereum, updateChainAndBalance, refreshBalance, walletAddress]);

  const switchNetwork = async (targetChainId: number): Promise<boolean> => {
    const ethereum = getEthereum();
    if (!ethereum) return false;
    const targetHex = `0x${targetChainId.toString(16)}`;
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetHex }],
      });
      setChainId(targetChainId);
      return true;
    } catch (switchError: any) {
      if (switchError?.code === 4902 || switchError?.data?.originalError?.code === 4902 || switchError?.message?.includes('Unrecognized chain')) {
        const net = getBotChainNetwork(targetChainId);
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [getAddChainParameters(net)],
          });
          setChainId(targetChainId);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  };

  const switchToBotChainTestnet = async (): Promise<boolean> => {
    return switchNetwork(BOTCHAIN_TESTNET.chainId);
  };

  const login = async (): Promise<void> => {
    const ethereum = getEthereum();
    if (!ethereum) {
      window.open(BOTCHAIN_TESTNET.boWalletUrl, '_blank');
      window.alert('No EVM wallet detected in your browser. Install MetaMask, Rabby, or BOT Chain official BO Wallet (opened in new tab) to continue.');
      return;
    }
    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        localStorage.setItem('openx_injected_connected', 'true');
        await updateChainAndBalance(accounts[0]);
        const hexChain = await ethereum.request({ method: 'eth_chainId' });
        const curChain = parseInt(hexChain, 16);
        if (curChain !== BOTCHAIN_TESTNET.chainId && curChain !== BOTCHAIN_MAINNET.chainId) {
          void switchToBotChainTestnet();
        }
      }
    } catch (err: any) {
      console.error('Wallet connection rejected:', err);
    }
  };

  const logout = () => {
    setWalletAddress(null);
    setBalanceWei(null);
    localStorage.removeItem('openx_injected_connected');
  };

  const sendTransaction = async (transaction: { to: string; data: string; value?: string }): Promise<string | null> => {
    const ethereum = getEthereum();
    if (!ethereum || !walletAddress) return null;
    if (chainId !== BOTCHAIN_TESTNET.chainId && chainId !== BOTCHAIN_MAINNET.chainId) {
      const switched = await switchToBotChainTestnet();
      if (!switched) {
        throw new Error('Please switch to BOT Chain Testnet (Chain ID 968) in your wallet to continue.');
      }
    }
    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: walletAddress,
        to: transaction.to,
        data: transaction.data,
        value: transaction.value || '0x0',
      }],
    }) as string;
    return txHash;
  };

  const waitTransaction = async (transactionHash: string): Promise<boolean> => {
    const ethereum = getEthereum();
    if (!ethereum) return false;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const receipt = await ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [transactionHash],
        }) as { status?: string } | null;
        if (receipt) {
          void refreshBalance();
          return receipt.status === '0x1';
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    return false;
  };

  const signTypedData = async (targetChainId: number, typedData: Record<string, unknown>): Promise<string | null> => {
    const ethereum = getEthereum();
    if (!ethereum || !walletAddress) return null;
    await switchNetwork(targetChainId);
    return await ethereum.request({
      method: 'eth_signTypedData_v4',
      params: [walletAddress, JSON.stringify(typedData)],
    }) as string;
  };

  const isBot = chainId !== null && isBotChain(chainId);
  const isTest = chainId !== null && isBotChainTestnet(chainId);
  const formattedBalance = balanceWei ? formatBotAmount(balanceWei) : '0';
  const networkName = chainId
    ? isBot
      ? getBotChainNetwork(chainId).name
      : `Chain ${chainId}`
    : 'Not Connected';

  return (
    <PortalAuthContext.Provider
      value={{
        enabled: true,
        ready,
        authenticated: Boolean(walletAddress),
        walletAddress,
        chainId,
        isBotChain: isBot,
        isTestnet: isTest,
        balance: formattedBalance,
        balanceWei,
        networkName,
        connectionType: walletAddress ? 'injected' : null,
        login,
        logout,
        switchToBotChainTestnet,
        switchNetwork,
        refreshBalance,
        getAccessToken: async () => null,
        sendTransaction,
        sendBotTransaction: sendTransaction,
        sendArbitrumTransaction: sendTransaction,
        waitTransaction,
        waitArbitrumTransaction: waitTransaction,
        signTypedData,
      }}
    >
      {children}
    </PortalAuthContext.Provider>
  );
}

/**
 * Privy Provider Integration (Active when NEXT_PUBLIC_PRIVY_APP_ID is configured)
 */
function PrivyPortalAuthProvider({ children }: { children: React.ReactNode }) {
  const { ready: privyReady, authenticated: privyAuth, user, login: privyLogin, logout: privyLogout, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const [balanceWei, setBalanceWei] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const wallet = user?.linkedAccounts.find((account) => account.type === 'wallet' && account.chainType === 'ethereum');
  const walletAddress = wallet && 'address' in wallet ? (wallet.address as string) : null;

  const refreshBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalanceWei(null);
      return;
    }
    const rawBalance = await fetchBotNativeBalance(walletAddress, BOTCHAIN_TESTNET.rpcUrl);
    if (rawBalance) {
      setBalanceWei(rawBalance);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      void refreshBalance();
      const connected = wallets.find((item) => item.address.toLowerCase() === walletAddress.toLowerCase());
      if (connected) {
        connected.getEthereumProvider().then(async (provider) => {
          try {
            const hexChain = await provider.request({ method: 'eth_chainId' }) as string;
            setChainId(parseInt(hexChain, 16));
          } catch {}
        }).catch(() => {});
      }
    } else {
      setBalanceWei(null);
      setChainId(null);
    }
  }, [walletAddress, wallets, refreshBalance]);

  const switchNetwork = async (targetChainId: number): Promise<boolean> => {
    const connected = wallets.find((item) => item.address.toLowerCase() === walletAddress?.toLowerCase());
    if (!connected) return false;
    const provider = await connected.getEthereumProvider();
    const targetHex = `0x${targetChainId.toString(16)}`;
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetHex }],
      });
      setChainId(targetChainId);
      return true;
    } catch (switchError: any) {
      if (switchError?.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        const net = getBotChainNetwork(targetChainId);
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [getAddChainParameters(net)],
          });
          setChainId(targetChainId);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  };

  const switchToBotChainTestnet = async (): Promise<boolean> => {
    return switchNetwork(BOTCHAIN_TESTNET.chainId);
  };

  const sendTransaction = async (transaction: { to: string; data: string; value?: string }): Promise<string | null> => {
    const connected = wallets.find((item) => item.address.toLowerCase() === walletAddress?.toLowerCase());
    if (!connected) return null;
    const provider = await connected.getEthereumProvider();
    await switchToBotChainTestnet();
    return await provider.request({
      method: 'eth_sendTransaction',
      params: [{ from: walletAddress, to: transaction.to, data: transaction.data, value: transaction.value || '0x0' }],
    }) as string;
  };

  const waitTransaction = async (transactionHash: string): Promise<boolean> => {
    const connected = wallets.find((item) => item.address.toLowerCase() === walletAddress?.toLowerCase());
    if (!connected) return false;
    const provider = await connected.getEthereumProvider();
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const receipt = await provider.request({ method: 'eth_getTransactionReceipt', params: [transactionHash] }) as { status?: string } | null;
      if (receipt) {
        void refreshBalance();
        return receipt.status === '0x1';
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    return false;
  };

  const signTypedData = async (targetChainId: number, typedData: Record<string, unknown>): Promise<string | null> => {
    const connected = wallets.find((item) => item.address.toLowerCase() === walletAddress?.toLowerCase());
    if (!connected || !walletAddress) return null;
    const provider = await connected.getEthereumProvider();
    await switchNetwork(targetChainId);
    return await provider.request({
      method: 'eth_signTypedData_v4',
      params: [walletAddress, JSON.stringify(typedData)],
    }) as string;
  };

  const isBot = chainId !== null && isBotChain(chainId);
  const isTest = chainId !== null && isBotChainTestnet(chainId);
  const formattedBalance = balanceWei ? formatBotAmount(balanceWei) : '0';
  const networkName = chainId
    ? isBot
      ? getBotChainNetwork(chainId).name
      : `Chain ${chainId}`
    : 'Not Connected';

  return (
    <PortalAuthContext.Provider
      value={{
        enabled: true,
        ready: privyReady,
        authenticated: privyAuth && Boolean(walletAddress),
        walletAddress,
        chainId,
        isBotChain: isBot,
        isTestnet: isTest,
        balance: formattedBalance,
        balanceWei,
        networkName,
        connectionType: 'privy',
        login: async () => privyLogin(),
        logout: privyLogout,
        switchToBotChainTestnet,
        switchNetwork,
        refreshBalance,
        getAccessToken,
        sendTransaction,
        sendBotTransaction: sendTransaction,
        sendArbitrumTransaction: sendTransaction,
        waitTransaction,
        waitArbitrumTransaction: waitTransaction,
        signTypedData,
      }}
    >
      {children}
    </PortalAuthContext.Provider>
  );
}

export function PortalAuthProvider({
  usePrivyMode = false,
  children,
}: {
  usePrivyMode?: boolean;
  children: React.ReactNode;
}) {
  if (usePrivyMode) {
    return <PrivyPortalAuthProvider>{children}</PrivyPortalAuthProvider>;
  }
  return <InjectedPortalAuthProvider>{children}</InjectedPortalAuthProvider>;
}

export function usePortalAuth(): PortalAuth {
  return useContext(PortalAuthContext);
}
