import dotenv from 'dotenv';
import { JsonRpcProvider, formatEther } from 'ethers';
import path from 'node:path';

dotenv.config({ path: path.resolve(import.meta.dirname, '../.env') });

const address = process.env.OPENX_DEPLOYER_ADDRESS || '0x080211c4Db9d3861d8Ab760245E4cA5Ca54aDA4b';
const rpcUrl = process.env.BOTCHAIN_RPC_URL || 'https://rpc.bohr.life';

async function main() {
  console.log(`Checking BOT Chain Bohr Testnet balance...`);
  console.log(`Wallet Address: ${address}`);
  console.log(`RPC Endpoint:   ${rpcUrl}`);

  const provider = new JsonRpcProvider(rpcUrl);
  try {
    const balanceWei = await provider.getBalance(address);
    const balanceBot = formatEther(balanceWei);
    console.log(`\nBalance: ${balanceBot} BOT (${balanceWei.toString()} wei)`);

    if (balanceWei > 0n) {
      console.log(`\nWallet has funds and is READY to deploy! Run:`);
      console.log(`  node scripts/deployBotChainTestnet.mjs`);
    } else {
      console.log(`\nWallet balance is 0 BOT.`);
      console.log(`Please claim testnet tokens from: https://faucet.botchain.ai/basic`);
    }
  } catch (error) {
    console.error(`Error querying balance:`, error.message);
  }
}

main();
