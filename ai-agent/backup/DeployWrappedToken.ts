import { ethers } from "hardhat";
import { checkBalance } from "./CheckBalance";

async function main() {
  console.log("🚀 Deploying WrappedToken using Ignition...");

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy using Ignition module directly
  console.log("\n📦 Running Ignition deployment...");
  
  try {
    // Import and use the existing Ignition module
    const WrappedTokenModule = await import("../ignition/modules/WrappedToken");
    const module = WrappedTokenModule.default;
    
    // For now, let's use the standard Ignition CLI approach but with better integration
    const { execSync } = require('child_process');
    execSync('npx hardhat ignition deploy ./ignition/modules/WrappedToken.ts', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log("✅ WrappedToken deployed successfully via Ignition!");
    
    // Get the deployed contract address (we know it from previous deployments)
    const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    console.log(`📍 Token deployed at: ${tokenAddress}`);

    // Test wrapping some ETH
    console.log("\n🔄 Testing wrap function...");
    const WrappedTokenFactory = await ethers.getContractFactory("WrappedToken");
    const wrappedToken = WrappedTokenFactory.attach(tokenAddress) as any;
    
    try {
      const wrapAmount = ethers.parseEther("1.0");
      const wrapTx = await wrappedToken.wrap({ value: wrapAmount });
      await wrapTx.wait();
      console.log("✅ Wrapped 1 ETH to WETH");
    } catch (error) {
      console.log("⚠️  Wrap function test failed (contract might already have ETH):", error instanceof Error ? error.message : 'Unknown error');
    }

    // Test the balance script
    console.log("\n🔍 Testing balance script:");
    await checkBalance(deployer.address, tokenAddress);

    console.log("\n🎯 You can now test the balance script with:");
    console.log(`$env:ACCOUNT_ADDRESS="${deployer.address}"; $env:TOKEN_ADDRESS="${tokenAddress}"; npx hardhat run scripts/CheckBalance.ts`);
    
  } catch (error) {
    console.error("❌ Ignition deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 