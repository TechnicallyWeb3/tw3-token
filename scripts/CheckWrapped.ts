import { ethers } from "hardhat";
import { WrappedToken } from "../typechain-types";
import { checkBalance } from "./CheckBalance";

export async function checkWrappedToken(tokenAddress?: string) {
  try {
    // Get signers and provider from hardhat
    const [signer] = await ethers.getSigners();
    const provider = ethers.provider;
    const callerAddress = await signer.getAddress();

    console.log("🔍 WrappedToken Contract Summary");
    console.log("=" .repeat(60));

    // Get token address - use provided address or try to get from deployment
    let wrappedTokenAddress: string;
    
    if (tokenAddress) {
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error("Invalid token address provided");
      }
      wrappedTokenAddress = tokenAddress;
    } else {
      // Try to get the deployed contract address from hardhat
      try {
        const WrappedTokenFactory = await ethers.getContractFactory("WrappedToken");
        // This will throw if no deployment found
        const deployedToken = await WrappedTokenFactory.deploy("Wrapped Ether", "WETH");
        wrappedTokenAddress = await deployedToken.getAddress();
        console.log("📋 Using deployed WrappedToken contract");
      } catch (error) {
        throw new Error("No WrappedToken deployment found. Please provide a token address or deploy the contract first.");
      }
    }

    console.log(`📍 Contract Address: ${wrappedTokenAddress}`);
    console.log(`👤 Caller Address: ${callerAddress}`);
    console.log();

    // Connect to the WrappedToken contract
    const WrappedTokenFactory = await ethers.getContractFactory("WrappedToken");
    const wrappedToken = WrappedTokenFactory.attach(wrappedTokenAddress) as WrappedToken;

    // Get contract information
    const [totalSupply, decimals, symbol, name, contractEthBalance] = await Promise.all([
      wrappedToken.totalSupply(),
      wrappedToken.decimals(),
      wrappedToken.symbol(),
      wrappedToken.name(),
      provider.getBalance(wrappedTokenAddress)
    ]);

    // Format values
    const totalSupplyFormatted = ethers.formatUnits(totalSupply, decimals);
    const contractEthBalanceFormatted = ethers.formatEther(contractEthBalance);

    // Display contract summary
    console.log("📊 Contract Summary:");
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Decimals: ${decimals}`);
    console.log(`   Total Supply: ${totalSupplyFormatted} ${symbol}`);
    console.log(`   Raw Total Supply: ${totalSupply.toString()}`);
    console.log(`   Contract ETH Balance: ${contractEthBalanceFormatted} ETH`);
    console.log(`   Raw Contract ETH Balance: ${contractEthBalance.toString()} Wei`);
    console.log();

    // Check caller's balance using the existing CheckBalance function
    console.log("👤 Caller Balance Details:");
    console.log("-".repeat(40));
    await checkBalance(callerAddress, wrappedTokenAddress);

  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  let tokenAddress: string | undefined;
  
  if (args.length >= 1) {
    // Command line argument provided
    tokenAddress = args[0];
  } else {
    // Try environment variable
    tokenAddress = process.env.WRAPPED_TOKEN_ADDRESS;
    
    if (!process.env.WRAPPED_TOKEN_ADDRESS) {
      console.log("No token address provided, attempting to use deployed contract...");
      console.log("Usage: npx hardhat run scripts/CheckWrapped.ts -- [token_address]");
      console.log("   OR: WRAPPED_TOKEN_ADDRESS=0x... npx hardhat run scripts/CheckWrapped.ts");
      console.log("");
      console.log("Parameters:");
      console.log("  token_address    - The WrappedToken contract address (optional)");
      console.log("");
      console.log("Examples:");
      console.log("  npx hardhat run scripts/CheckWrapped.ts");
      console.log("  npx hardhat run scripts/CheckWrapped.ts -- 0xabcd...efgh");
      console.log("  WRAPPED_TOKEN_ADDRESS=0xabcd...efgh npx hardhat run scripts/CheckWrapped.ts");
      console.log();
    }
  }

  await checkWrappedToken(tokenAddress);
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 