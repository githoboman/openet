import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import solc from 'solc';
import dotenv from 'dotenv';
import { ContractFactory, JsonRpcProvider, Network, FetchRequest, Wallet, formatEther } from 'ethers';

const root = path.resolve(import.meta.dirname, '../..');
const gatewayDir = path.resolve(import.meta.dirname, '..');

dotenv.config({ path: path.join(gatewayDir, '.env') });

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required in .env`);
  return value;
}

async function compile(filename, contractName) {
  const source = await readFile(path.join(root, 'contracts', filename), 'utf8');
  const input = {
    language: 'Solidity',
    sources: { [filename]: { content: source } },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = output.errors?.filter((item) => item.severity === 'error') ?? [];
  if (errors.length) {
    throw new Error(errors.map((item) => item.formattedMessage).join('\n'));
  }
  const artifact = output.contracts[filename]?.[contractName];
  if (!artifact?.evm?.bytecode?.object) {
    throw new Error(`missing compiled artifact for ${contractName}`);
  }
  return { abi: artifact.abi, bytecode: `0x${artifact.evm.bytecode.object}` };
}

async function deploy(contractName, artifact, signer, args = []) {
  console.log(`\nDeploying ${contractName} to BOT Chain Mainnet...`);
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(...args);
  console.log(`Transaction sent: ${contract.deploymentTransaction().hash}`);
  console.log(`Waiting for confirmation on BOT Chain Mainnet...`);
  const receipt = await contract.deploymentTransaction().wait(2); // Wait 2 confirmations on Mainnet
  if (!receipt || receipt.status !== 1) {
    throw new Error(`Deployment of ${contractName} failed (status != 1)`);
  }
  const address = await contract.getAddress();
  console.log(`✓ Successfully deployed ${contractName} at: ${address}`);
  console.log(`Block Number: ${receipt.blockNumber}, Gas Used: ${receipt.gasUsed.toString()}`);
  return {
    contractName,
    address,
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
  };
}

async function main() {
  const privateKey = process.env.OPENX_MAINNET_DEPLOYER_KEY || requireEnv('OPENX_DEPLOYER_KEY');
  const rpcUrl = process.env.BOTCHAIN_MAINNET_RPC_URL || 'https://rpc.botchain.ai';
  const explorerUrl = process.env.BOTCHAIN_MAINNET_EXPLORER_URL || 'https://scan.botchain.ai';
  const targetChainId = 677;

  console.log('========================================================');
  console.log('       BOT Chain (MAINNET) Smart Contract Deployer        ');
  console.log('========================================================');

  const fetchReq = new FetchRequest(rpcUrl);
  fetchReq.timeout = 20000;
  const network = new Network('botchain-mainnet', targetChainId);
  const provider = new JsonRpcProvider(fetchReq, network, { staticNetwork: true });

  const deployer = new Wallet(privateKey, provider);
  console.log(`Deployer Address: ${deployer.address}`);
  console.log(`RPC Endpoint:     ${rpcUrl} (Chain ID: ${targetChainId})`);

  const balance = await provider.getBalance(deployer.address);
  console.log(`Deployer Balance: ${formatEther(balance)} BOT (${balance.toString()} wei)`);

  if (balance === 0n) {
    console.error('\n[Error] Insufficient funds: The deployer wallet has 0 BOT balance on Mainnet.');
    console.error(`Please fund ${deployer.address} with at least 0.05 BOT via:`);
    console.error(`  Official Bridge: https://bridge.botchain.ai/`);
    console.error(`  Official DEX:    https://dex.botchain.ai/#/swap`);
    console.error('Once funded, rerun: npm run deploy:botchain:mainnet');
    process.exit(1);
  }

  console.log('\nCompiling smart contracts with optimizer (runs: 200)...');
  const [registryArtifact, anchorArtifact] = await Promise.all([
    compile('StatementCommitmentRegistry.sol', 'StatementCommitmentRegistry'),
    compile('ReceiptAnchor.sol', 'ReceiptAnchor'),
  ]);
  console.log('Compilation succeeded.');

  // 1. Deploy StatementCommitmentRegistry
  const registry = await deploy('StatementCommitmentRegistry', registryArtifact, deployer);

  // 2. Deploy ReceiptAnchor (relayer set to deployer address)
  const anchor = await deploy('ReceiptAnchor', anchorArtifact, deployer, [deployer.address]);

  const summary = {
    network: 'BOT Chain Mainnet',
    chainId: targetChainId,
    deployer: deployer.address,
    contracts: {
      statementCommitmentRegistry: {
        address: registry.address,
        tx: registry.transactionHash,
        explorer: `${explorerUrl}/address/${registry.address}`,
      },
      receiptAnchor: {
        address: anchor.address,
        tx: anchor.transactionHash,
        explorer: `${explorerUrl}/address/${anchor.address}`,
      },
    },
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = path.join(gatewayDir, 'deployments');
  await mkdir(deploymentsDir, { recursive: true });
  await writeFile(
    path.join(deploymentsDir, 'botchain-mainnet.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );

  // Update .env with mainnet deployed addresses
  const envPath = path.join(gatewayDir, '.env');
  let envContent = await readFile(envPath, 'utf8').catch(() => '');
  if (!envContent.includes('OPENX_MAINNET_STATEMENT_COMMITMENT_REGISTRY=')) {
    envContent += `\n# BOT Chain Mainnet Contracts\nOPENX_MAINNET_STATEMENT_COMMITMENT_REGISTRY=${registry.address}\nOPENX_MAINNET_RECEIPT_ANCHOR_CONTRACT=${anchor.address}\n`;
  } else {
    envContent = envContent.replace(
      /OPENX_MAINNET_STATEMENT_COMMITMENT_REGISTRY=.*/,
      `OPENX_MAINNET_STATEMENT_COMMITMENT_REGISTRY=${registry.address}`
    );
    envContent = envContent.replace(
      /OPENX_MAINNET_RECEIPT_ANCHOR_CONTRACT=.*/,
      `OPENX_MAINNET_RECEIPT_ANCHOR_CONTRACT=${anchor.address}`
    );
  }
  await writeFile(envPath, envContent, 'utf8');

  console.log('\n========================================================');
  console.log('🎉 BOT Chain Mainnet Deployment Succeeded!');
  console.log('========================================================');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nDeployment manifest written to gateway/deployments/botchain-mainnet.json`);
  console.log(`gateway/.env updated with mainnet contract addresses.`);
}

main().catch((err) => {
  console.error('\nMainnet deployment failed:', err);
  process.exit(1);
});
