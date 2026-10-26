/**
 * BOT Chain Network Configuration and Utilities
 * Reference: https://dev-docs.botchain.ai/docs/intro/
 */

export interface BotChainNetwork {
  chainId: number;
  chainIdHex: string;
  name: string;
  shortName: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl: string;
  faucetUrl?: string;
  walletApiUrl: string;
  identityApiUrl: string;
  dexUrl: string;
  bridgeUrl: string;
  boWalletUrl: string;
  isTestnet: boolean;
}

export const BOTCHAIN_TESTNET: BotChainNetwork = {
  chainId: 968,
  chainIdHex: '0x3c8',
  name: 'BOT Chain Testnet',
  shortName: 'Bohr Testnet',
  rpcUrl: 'https://rpc.bohr.life',
  nativeCurrency: {
    name: 'BOT',
    symbol: 'BOT',
    decimals: 18,
  },
  blockExplorerUrl: 'https://scan.bohr.life',
  faucetUrl: 'https://faucet.botchain.ai/basic',
  walletApiUrl: 'https://wallet-api.bohr.life',
  identityApiUrl: 'https://identity-api.bohr.life',
  dexUrl: 'https://dex.botchain.ai/#/swap',
  bridgeUrl: 'https://bridge.botchain.ai/',
  boWalletUrl: 'https://wallet.botchain.ai/',
  isTestnet: true,
};

export const BOTCHAIN_MAINNET: BotChainNetwork = {
  chainId: 677,
  chainIdHex: '0x2a5',
  name: 'BOT Chain Mainnet',
  shortName: 'BOT Mainnet',
  rpcUrl: 'https://rpc.botchain.ai',
  nativeCurrency: {
    name: 'BOT',
    symbol: 'BOT',
    decimals: 18,
  },
  blockExplorerUrl: 'https://scan.botchain.ai',
  walletApiUrl: 'https://wallet-api.botchain.ai',
  identityApiUrl: 'https://identity-api.botchain.ai',
  dexUrl: 'https://dex.botchain.ai/#/swap',
  bridgeUrl: 'https://bridge.botchain.ai/',
  boWalletUrl: 'https://wallet.botchain.ai/',
  isTestnet: false,
};

const isConfiguredForMainnet =
  process.env.NEXT_PUBLIC_BOTCHAIN_NETWORK === 'mainnet' ||
  process.env.NEXT_PUBLIC_BOTCHAIN_CHAIN_ID === '677';

export const DEFAULT_NETWORK = isConfiguredForMainnet ? BOTCHAIN_MAINNET : BOTCHAIN_TESTNET;

export const SUPPORTED_NETWORKS: Record<number, BotChainNetwork> = {
  968: BOTCHAIN_TESTNET,
  677: BOTCHAIN_MAINNET,
};

export function getBotChainNetwork(chainId?: number | null): BotChainNetwork {
  if (!chainId) return DEFAULT_NETWORK;
  return SUPPORTED_NETWORKS[chainId] || DEFAULT_NETWORK;
}

export function isBotChain(chainId: number): boolean {
  return chainId === 968 || chainId === 677;
}

export function isBotChainTestnet(chainId: number): boolean {
  return chainId === 968;
}

export function isBotChainMainnet(chainId: number): boolean {
  return chainId === 677;
}

export function getAddChainParameters(network: BotChainNetwork = BOTCHAIN_TESTNET) {
  return {
    chainId: network.chainIdHex,
    chainName: network.name,
    nativeCurrency: network.nativeCurrency,
    rpcUrls: [network.rpcUrl],
    blockExplorerUrls: [network.blockExplorerUrl],
  };
}

export function formatBotAddress(address?: string | null): string {
  if (!address) return '';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatBotAmount(weiAmount: string | bigint | number, decimals: number = 4): string {
  try {
    const wei = typeof weiAmount === 'bigint' ? weiAmount : BigInt(weiAmount || '0');
    const divisor = BigInt(10 ** 18);
    const whole = wei / divisor;
    const remainder = wei % divisor;
    if (remainder === 0n) return whole.toString();
    const remStr = remainder.toString().padStart(18, '0');
    const trimmed = remStr.slice(0, decimals).replace(/0+$/, '');
    return trimmed ? `${whole}.${trimmed}` : whole.toString();
  } catch {
    return '0';
  }
}

export function getBotExplorerTxUrl(txHash: string, chainId: number = DEFAULT_NETWORK.chainId): string {
  const net = getBotChainNetwork(chainId);
  return `${net.blockExplorerUrl}/tx/${txHash}`;
}

export function getBotExplorerAddressUrl(address: string, chainId: number = DEFAULT_NETWORK.chainId): string {
  const net = getBotChainNetwork(chainId);
  return `${net.blockExplorerUrl}/address/${address}`;
}

export function getBotExplorerBlockUrl(blockNumber: string | number, chainId: number = DEFAULT_NETWORK.chainId): string {
  const net = getBotChainNetwork(chainId);
  return `${net.blockExplorerUrl}/block/${blockNumber}`;
}
