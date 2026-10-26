import dotenv from 'dotenv';
import { JsonRpcProvider, Network, FetchRequest, Wallet, formatEther, isAddress } from 'ethers';
import path from 'node:path';

dotenv.config({ path: path.resolve(import.meta.dirname, '../.env') });

const recipient = process.argv[2] || '0x90753f69645eC1B6985EEE786721a5D10E0F5aC2';
const privateKey = process.env.OPENX_MAINNET_DEPLOYER_KEY || process.env.OPENX_DEPLOYER_KEY;
const rpcUrl = process.env.BOTCHAIN_MAINNET_RPC_URL || 'https://rpc.botchain.ai';
const targetChainId = 677;

if (!privateKey) {
  console.error('Missing private key in gateway/.env');
  process.exit(1);
}

if (!isAddress(recipient)) {
  console.error(`Invalid recipient address: ${recipient}`);
  process.exit(1);
}

async function main() {
  console.log('========================================================');
  console.log('       BOT Chain Mainnet Sweep / Transfer Script        ');
  console.log('========================================================');

  const fetchReq = new FetchRequest(rpcUrl);
  fetchReq.timeout = 20000;
  const network = new Network('botchain-mainnet', targetChainId);
  const provider = new JsonRpcProvider(fetchReq, network, { staticNetwork: true });
  const wallet = new Wallet(privateKey, provider);

  console.log(`From (Sender):    ${wallet.address}`);
  console.log(`To (Recipient):   ${recipient}`);
  console.log(`RPC Endpoint:     ${rpcUrl} (Chain ID: ${targetChainId})`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Current Balance:  ${formatEther(balance)} BOT (${balance.toString()} wei)`);

  if (balance === 0n) {
    console.error('Error: Wallet balance is 0 BOT. Nothing to sweep.');
    process.exit(1);
  }

  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice ?? 20000000000n;
  const gasLimit = 21000n;
  const txCost = gasLimit * gasPrice;

  console.log(`Gas Price:        ${gasPrice.toString()} wei (~${Number(gasPrice) / 1e9} Gwei)`);
  console.log(`Est. Gas Fee:     ${formatEther(txCost)} BOT (${txCost.toString()} wei)`);

  if (balance <= txCost) {
    console.error(`Error: Balance (${formatEther(balance)} BOT) is not enough to cover the transfer fee (${formatEther(txCost)} BOT).`);
    process.exit(1);
  }

  const amountToSend = balance - txCost;
  console.log(`Amount to Send:   ${formatEther(amountToSend)} BOT (${amountToSend.toString()} wei)`);

  console.log('\nBroadcasting transaction to BOT Chain Mainnet...');
  const tx = await wallet.sendTransaction({
    to: recipient,
    value: amountToSend,
    gasLimit,
    gasPrice,
  });

  console.log(`Transaction Hash: ${tx.hash}`);
  console.log('Waiting for confirmation...');
  const receipt = await tx.wait(1);

  if (receipt && receipt.status === 1) {
    console.log('\n🎉 Sweep Succeeded!');
    console.log(`Block Number:     ${receipt.blockNumber}`);
    console.log(`Gas Used:         ${receipt.gasUsed.toString()}`);
    console.log(`BOTScan Explorer: https://scan.botchain.ai/tx/${tx.hash}`);
  } else {
    console.error('\nTransaction failed or reverted.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\nTransfer failed:', err);
  process.exit(1);
});
