import { ethers } from "hardhat";

async function main() {
  console.log("Generating seed phrase...");
  
  // Generate a random wallet which includes a mnemonic
  const wallet = ethers.Wallet.createRandom();
  
  console.log("\n=== Generated Seed Phrase ===");
  console.log("Mnemonic:", wallet.mnemonic?.phrase);
  console.log("Address:", wallet.address);
  console.log("Private Key:", wallet.privateKey);
  console.log("=============================\n");
  
  console.log("⚠️  IMPORTANT: Keep this seed phrase secure and private!");
  console.log("   Never share it with anyone or commit it to version control.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
