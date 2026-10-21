'use client';

import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { PortalAuthProvider } from './PortalAuthProvider';
import { BOTCHAIN_TESTNET } from '@/lib/botchain';

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

const botChainTestnetDefinition = {
  id: BOTCHAIN_TESTNET.chainId,
  name: BOTCHAIN_TESTNET.name,
  network: 'bot-testnet',
  nativeCurrency: BOTCHAIN_TESTNET.nativeCurrency,
  rpcUrls: {
    default: {
      http: [BOTCHAIN_TESTNET.rpcUrl],
    },
    public: {
      http: [BOTCHAIN_TESTNET.rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'BOTScan',
      url: BOTCHAIN_TESTNET.blockExplorerUrl,
    },
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  if (!appId) {
    return <PortalAuthProvider usePrivyMode={false}>{children}</PortalAuthProvider>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: { theme: 'dark', accentColor: '#00f0ff' },
        loginMethods: ['wallet', 'email'],
        defaultChain: botChainTestnetDefinition as any,
        supportedChains: [botChainTestnetDefinition as any],
        embeddedWallets: { createOnLogin: 'users-without-wallets' },
      }}
    >
      <PortalAuthProvider usePrivyMode={true}>{children}</PortalAuthProvider>
    </PrivyProvider>
  );
}
