import { ethers } from "hardhat";
import { Contract } from "ethers";
import { WrappedToken } from "../typechain-types";

// ERC20 Token ABI - minimal interface for balanceOf function
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

export async function checkBalance(accountAddress: string, tokenAddress?: string) {
  try {
    // Validate account address
    if (!ethers.isAddress(accountAddress)) {
      throw new Error("Invalid account address provided");
    }

    // Get signers and provider from hardhat
    const [signer] = await ethers.getSigners();
    const provider = ethers.provider;

    console.log("🔍 Checking balances for account:", accountAddress);
    console.log("=" .repeat(60));

    // Check Ether balance
    const ethBalance = await provider.getBalance(accountAddress);
    const ethBalanceInEther = ethers.formatEther(ethBalance);
    
    console.log("💰 ETH Balance:");
    console.log(`   ${ethBalanceInEther} ETH`);
    console.log(`   ${ethBalance.toString()} Wei`);
    console.log();

    // Check token balance if token address is provided
    if (tokenAddress) {
      // Validate token address
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error("Invalid token address provided");
      }

      try {
        // Try to connect using WrappedToken factory first (for our specific token)
        let tokenContract: WrappedToken | Contract;
        let isWrappedToken = false;
        
        try {
          const WrappedTokenFactory = await ethers.getContractFactory("WrappedToken");
          tokenContract = WrappedTokenFactory.attach(tokenAddress) as WrappedToken;
          isWrappedToken = true;
        } catch {
          // If it's not a WrappedToken, use generic ERC20 contract
          tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
        }

        // Get token information using the connected contract
        const [tokenBalance, decimals, symbol, name] = await Promise.all([
          tokenContract.balanceOf(accountAddress),
          tokenContract.decimals(),
          tokenContract.symbol(),
          tokenContract.name()
        ]);

        // Format token balance
        const tokenBalanceFormatted = ethers.formatUnits(tokenBalance, decimals);

        console.log("🪙 Token Balance:");
        console.log(`   Token: ${name} (${symbol})`);
        console.log(`   Type: ${isWrappedToken ? 'WrappedToken' : 'ERC20'}`);
        console.log(`   Address: ${tokenAddress}`);
        console.log(`   Balance: ${tokenBalanceFormatted} ${symbol}`);
        console.log(`   Raw Balance: ${tokenBalance.toString()}`);
        console.log();

      } catch (error) {
        console.log("❌ Error checking token balance:");
        console.log(`   Token Address: ${tokenAddress}`);
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.log();
      }
    }

    // Summary
    console.log("📊 Summary:");
    console.log(`   Account: ${accountAddress}`);
    console.log(`   ETH: ${ethBalanceInEther} ETH`);
    
    if (tokenAddress) {
      try {
        let tokenContract: WrappedToken | Contract;
        
        try {
          const WrappedTokenFactory = await ethers.getContractFactory("WrappedToken");
          tokenContract = WrappedTokenFactory.attach(tokenAddress) as WrappedToken;
        } catch {
          tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
        }
        
        const [tokenBalance, decimals, symbol] = await Promise.all([
          tokenContract.balanceOf(accountAddress),
          tokenContract.decimals(),
          tokenContract.symbol()
        ]);
        const tokenBalanceFormatted = ethers.formatUnits(tokenBalance, decimals);
        console.log(`   Token: ${tokenBalanceFormatted} ${symbol}`);
      } catch (error) {
        console.log(`   Token: Error retrieving balance`);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Main execution
async function main() {
  // Try to get arguments from command line first, then fall back to environment variables
  const args = process.argv.slice(2);
  
  let accountAddress: string;
  let tokenAddress: string | undefined;
  
  if (args.length >= 1) {
    // Command line arguments provided
    accountAddress = args[0];
    tokenAddress = args[1]; // Optional
  } else {
    // Try environment variables
    accountAddress = process.env.ACCOUNT_ADDRESS || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    tokenAddress = process.env.TOKEN_ADDRESS;
    
    if (!process.env.ACCOUNT_ADDRESS) {
      console.log("No arguments provided, using test address...");
      console.log("Usage: npx hardhat run scripts/CheckBalance.ts -- <account_address> [token_address]");
      console.log("   OR: ACCOUNT_ADDRESS=0x... TOKEN_ADDRESS=0x... npx hardhat run scripts/CheckBalance.ts");
      console.log("");
      console.log("Parameters:");
      console.log("  account_address  - The address to check balances for (required)");
      console.log("  token_address    - The ERC20 token contract address (optional)");
      console.log("");
      console.log("Examples:");
      console.log("  npx hardhat run scripts/CheckBalance.ts -- 0x1234...5678");
      console.log("  npx hardhat run scripts/CheckBalance.ts -- 0x1234...5678 0xabcd...efgh");
      console.log("  ACCOUNT_ADDRESS=0x1234...5678 npx hardhat run scripts/CheckBalance.ts");
    }
  }

  await checkBalance(accountAddress, tokenAddress);
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
