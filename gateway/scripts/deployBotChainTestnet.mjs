import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import solc from 'solc';
import dotenv from 'dotenv';
import { ContractFactory, JsonRpcProvider, Wallet, formatEther } from 'ethers';

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
  console.log(`\nDeploying ${contractName}...`);
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(...args);
  console.log(`Transaction sent: ${contract.deploymentTransaction().hash}`);
  console.log(`Waiting for block confirmation on Bohr Testnet...`);
  const receipt = await contract.deploymentTransaction().wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error(`Deployment of ${contractName} failed (status != 1)`);
  }
  const address = await contract.getAddress();
  console.log(`Successfully deployed ${contractName} at: ${address}`);
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
  const privateKey = requireEnv('OPENX_DEPLOYER_KEY');
  const rpcUrl = process.env.BOTCHAIN_RPC_URL || 'https://rpc.bohr.life';
  const explorerUrl = process.env.BOTCHAIN_EXPLORER_URL || 'https://scan.bohr.life';

  console.log('========================================================');
  console.log('       BOT Chain (Bohr Testnet) Smart Contract Deployer  ');
  console.log('========================================================');

  const provider = new JsonRpcProvider(rpcUrl);
  const network = await provider.getNetwork();
  console.log(`Connected to RPC: ${rpcUrl} (Chain ID: ${network.chainId.toString()})`);

  const deployer = new Wallet(privateKey, provider);
  console.log(`Deployer Address: ${deployer.address}`);

  const balance = await provider.getBalance(deployer.address);
  console.log(`Deployer Balance: ${formatEther(balance)} BOT (${balance.toString()} wei)`);

  if (balance === 0n) {
    console.error('\n[Error] Insufficient funds: The deployer wallet has 0 BOT balance.');
    console.error(`Please claim testnet BOT for ${deployer.address} at:`);
    console.error(`  https://faucet.botchain.ai/basic`);
    console.error('Once the tokens arrive, rerun this script.');
    process.exit(1);
  }

  console.log('\nCompiling contracts...');
  const [registryArtifact, anchorArtifact] = await Promise.all([
    compile('StatementCommitmentRegistry.sol', 'StatementCommitmentRegistry'),
    compile('ReceiptAnchor.sol', 'ReceiptAnchor'),
  ]);
  console.log('Compilation succeeded.');

  // Deploy StatementCommitmentRegistry
  const registry = await deploy('StatementCommitmentRegistry', registryArtifact, deployer);

  // Deploy ReceiptAnchor (relayer set to deployer address)
  const anchor = await deploy('ReceiptAnchor', anchorArtifact, deployer, [deployer.address]);

  const summary = {
    network: 'Bohr Testnet',
    chainId: Number(network.chainId),
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
    path.join(deploymentsDir, 'botchain-testnet.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );

  // Update .env with deployed addresses
  const envPath = path.join(gatewayDir, '.env');
  let envContent = await readFile(envPath, 'utf8').catch(() => '');
  envContent = envContent.replace(
    /OPENX_STATEMENT_COMMITMENT_REGISTRY=.*/,
    `OPENX_STATEMENT_COMMITMENT_REGISTRY=${registry.address}`
  );
  envContent = envContent.replace(
    /OPENX_RECEIPT_ANCHOR_CONTRACT=.*/,
    `OPENX_RECEIPT_ANCHOR_CONTRACT=${anchor.address}`
  );
  await writeFile(envPath, envContent, 'utf8');

  console.log('\n========================================================');
  console.log('Deployment Complete!');
  console.log('========================================================');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nDeployment details saved to gateway/deployments/botchain-testnet.json`);
  console.log(`gateway/.env updated with deployed contract addresses.`);
}

main().catch((err) => {
  console.error('\nDeployment failed:', err);
  process.exit(1);
});
