import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

// Import tasks
import "./tasks/check";
import "./tasks/deploy";

const DEV_MNEMONIC = process.env.DEV_MNEMONIC || 'test test test test test test test test test test test junk';

// deployer mnemonic may not be needed for hardhat or local testing
// should include a way to bypass this check for hardhat/local testing
const DEPLOYER_MNEMONIC = process.env.DEPLOYER_MNEMONIC;
if (!DEPLOYER_MNEMONIC) {
  console.error("DEPLOYER_MNEMONIC is not set, please set it in the .env file");
  process.exit(1);
} else {
  console.log(`Using DEPLOYER_MNEMONIC, DEPLOYER ADDRESS: ${ethers.Wallet.fromPhrase(DEPLOYER_MNEMONIC).address}`);
}

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337,
      accounts: {
        mnemonic: DEV_MNEMONIC,
        count: 20,
      },
    },
    localhost: {
      chainId: 31337,
      url: "http://localhost:8545",
      accounts: {
        mnemonic: DEV_MNEMONIC,
        count: 20,
      },
    },
    sepolia: {
      chainId: 11155111,
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: {
        mnemonic: DEPLOYER_MNEMONIC,
        count: 20,
      },
    },
    ethereum: {
      chainId: 1,
      url: "https://ethereum-rpc.publicnode.com",
      accounts: {
        mnemonic: DEPLOYER_MNEMONIC,
        count: 20,
      },
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY!,
      mainnet: process.env.ETHERSCAN_API_KEY!,
    },
  },
};

export default config;
