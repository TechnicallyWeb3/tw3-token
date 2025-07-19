import { task } from "hardhat/config";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Helper function to load deployed addresses
function loadDeployedAddresses(chainId: number): any {
  const deploymentPath = path.join(__dirname, `../ignition/deployments/chain-${chainId}/deployed_addresses.json`);
  
  if (fs.existsSync(deploymentPath)) {
    console.log("🔍 Deployment file found...");
    try {
      return JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    } catch (error) {
      console.log("⚠️  Could not parse deployed addresses file");
      return null;
    }
  }
  return null;
}

task("deploy", "Deploy WrappedToken using Hardhat Ignition")
  .addOptionalParam("tokenName", "Token name for WrappedToken (default: Wrapped Ether)")
  .addOptionalParam("tokenSymbol", "Token symbol for WrappedToken (default: WETH)")
  .setAction(async (taskArgs, hre) => {
    console.log(`🚀 Deploying WrappedToken using Hardhat Ignition...`);

    // Check if already deployed
    const deployedAddresses = loadDeployedAddresses(hre.network.config.chainId!);
    if (deployedAddresses && deployedAddresses['WrappedTokenModule#WrappedToken']) {
      console.log("📋 Found existing deployment:");
      console.log(`   WrappedToken Address: ${deployedAddresses['WrappedTokenModule#WrappedToken']}`);
      console.log();
      
      console.log("⚠️  Contract already deployed. Skipping deployment.");
      console.log("✅ Using existing deployment");
      return;
    } else {

      // Get the signer
      const [deployer] = await hre.ethers.getSigners();
      console.log(`Deploying with account: ${deployer.address}`);
      console.log(`Account balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address))} ETH`);
      console.log();

      try {
        const modulePath = "./ignition/modules/WrappedToken.ts";
        const params: string[] = [];

        if (taskArgs.tokenName) {
          params.push(`--parameters.tokenName="${taskArgs.tokenName}"`);
        }
        if (taskArgs.tokenSymbol) {
          params.push(`--parameters.tokenSymbol="${taskArgs.tokenSymbol}"`);
        }
        if (hre.network.name !== "hardhat") {
          params.push(`--network ${hre.network.name}`);
        }

        // Build the command
        const command = `npx hardhat ignition deploy ${modulePath} ${params.join(" ")}`;
        console.log(`📦 Running: ${command}`);
        console.log();

        // Execute the deployment
        execSync(command, { 
          stdio: 'inherit',
          cwd: process.cwd()
        });

        console.log();
        console.log("✅ Deployment completed successfully!");
      
        // Get deployment info
        console.log("📋 Deployment Information:");
        console.log(`   Deployer: ${deployer.address}`);
        console.log(`   Network: ${hre.network.name}`);
        console.log(`   Chain ID: ${hre.network.config.chainId}`);
        
        // Show deployment artifacts location
        console.log(`   Artifacts: ignition/deployments/chain-${hre.network.config.chainId}/`);
        
        // Load and display the new deployed address
        const newDeployedAddresses = loadDeployedAddresses(hre.network.config.chainId!);
        if (newDeployedAddresses && newDeployedAddresses['WrappedTokenModule#WrappedToken']) {
          console.log(`   WrappedToken Address: ${newDeployedAddresses['WrappedTokenModule#WrappedToken']}`);
        } else {
          console.log("❌ Deployment not found: deployment file not found");
        }
      
      } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
      }
    }
  });