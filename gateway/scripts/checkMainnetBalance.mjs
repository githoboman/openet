import dotenv from 'dotenv';
import { JsonRpcProvider, Network, FetchRequest, formatEther } from 'ethers';
import path from 'node:path';

dotenv.config({ path: path.resolve(import.meta.dirname, '../.env') });

const address = process.env.OPENX_MAINNET_DEPLOYER_ADDRESS || process.env.OPENX_DEPLOYER_ADDRESS || '0x080211c4Db9d3861d8Ab760245E4cA5Ca54aDA4b';
const rpcUrl = process.env.BOTCHAIN_MAINNET_RPC_URL || 'https://rpc.botchain.ai';

async function main() {
  console.log(`========================================================`);
  console.log(`       BOT Chain (MAINNET) Balance & Pre-Flight Check     `);
  console.log(`========================================================`);
  console.log(`Wallet Address: ${address}`);
  console.log(`RPC Endpoint:   ${rpcUrl}`);

  try {
    const fetchReq = new FetchRequest(rpcUrl);
    fetchReq.timeout = 15000;
    const network = new Network('botchain-mainnet', 677);
    const provider = new JsonRpcProvider(fetchReq, network, { staticNetwork: true });

    console.log(`Querying account balance on Chain ID 677...`);
    const balanceWei = await provider.getBalance(address);
    const balanceBot = formatEther(balanceWei);
    console.log(`\nMainnet Balance: ${balanceBot} BOT (${balanceWei.toString()} wei)`);

    const gasPrice = await provider.send('eth_gasPrice', []).then(hex => BigInt(hex)).catch(() => 20000000000n);
    console.log(`Gas Price:       ${gasPrice.toString()} wei (~${Number(gasPrice) / 1e9} Gwei)`);

    // Estimate deployment requirement (~350k gas)
    const estimatedDeploymentCostWei = 350000n * gasPrice;
    const estimatedCostBot = formatEther(estimatedDeploymentCostWei);
    console.log(`Estimated Deployment Cost: ~${estimatedCostBot} BOT (~350k gas)`);

    if (balanceWei >= estimatedDeploymentCostWei) {
      console.log(`\n🎉 Wallet is FUNDED and READY for Mainnet Deployment!`);
      console.log(`Execute deployment with:`);
      console.log(`  npm run deploy:botchain:mainnet`);
    } else {
      console.log(`\n⚠ Insufficient Mainnet BOT.`);
      console.log(`To deploy contracts to Mainnet, please fund this address with at least 0.05 BOT:`);
      console.log(`  Address: ${address}`);
      console.log(`Official BOT Chain Bridge: https://bridge.botchain.ai/`);
      console.log(`Official BOT Chain DEX:    https://dex.botchain.ai/#/swap`);
    }
  } catch (error) {
    console.error(`Error querying Mainnet RPC:`, error.message);
  }
}

main();
