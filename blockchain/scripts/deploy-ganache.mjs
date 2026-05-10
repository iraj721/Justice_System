import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============ LOAD .env FILE MANUALLY ============
const envPath = path.join(__dirname, '..', '.env');
console.log("Looking for .env at:", envPath);

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  console.log("✅ .env file found!");
  
  // Parse .env file manually
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key] = value;
        console.log(`  Loaded: ${key}=${value.substring(0, 20)}...`);
      }
    }
  }
} else {
  console.log("⚠️ .env file not found, using default values");
}

// ============ GET CONFIGURATION ============
const rpcUrl = process.env.GANACHE_RPC_URL || "http://127.0.0.1:7545";
const pk = process.env.DEPLOYER_PRIVATE_KEY;

console.log("\n📡 Configuration:");
console.log(`  RPC URL: ${rpcUrl}`);
console.log(`  Private Key: ${pk ? pk.substring(0, 20) + "..." : "NOT FOUND"}`);

if (!pk) {
  console.error("\n❌ ERROR: DEPLOYER_PRIVATE_KEY not found!");
  console.error("Please ensure .env file exists with DEPLOYER_PRIVATE_KEY");
  process.exit(1);
}

// ============ FIND ARTIFACT ============
const artifactPath = path.resolve(
  __dirname,
  "..",
  "artifacts",
  "contracts",
  "PublicAuditTrail.sol",
  "CompleteJusticeSystem.json"
);

console.log(`\n📁 Looking for artifact at: ${artifactPath}`);

if (!fs.existsSync(artifactPath)) {
  console.error("\n❌ ERROR: Contract artifact not found!");
  console.error("Please compile the contract first:");
  console.error("  npx hardhat compile");
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
const abi = artifact.abi;
const bytecode = artifact.bytecode;

console.log(`✅ Artifact loaded! Bytecode length: ${bytecode.length}`);

// ============ DEPLOY CONTRACT ============
console.log("\n🚀 Deploying contract...");

try {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(pk, provider);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance === 0n) {
    console.error("\n❌ ERROR: Wallet has 0 ETH!");
    console.error("Please fund the wallet in Ganache");
    process.exit(1);
  }
  
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  
  console.log("⏳ Waiting for deployment...");
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("\n✅✅✅ DEPLOYMENT SUCCESSFUL! ✅✅✅");
  console.log(`📜 Contract Address: ${contractAddress}`);
  
  // Save contract address to file
  const addressFile = path.join(__dirname, "..", "contract-address.txt");
  fs.writeFileSync(addressFile, contractAddress);
  console.log(`💾 Address saved to: ${addressFile}`);
  
  // Also save to .env
  console.log("\n📝 Add this to your backend/.env:");
  console.log(`CHAIN_CONTRACT_ADDRESS=${contractAddress}`);
  
} catch (error) {
  console.error("\n❌ Deployment failed!");
  console.error(error);
  process.exit(1);
}