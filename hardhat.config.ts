import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// Import tasks
import "./tasks/check";
import "./tasks/deploy";

const DEV_MNEMONIC = 'test test test test test test test test test test test junk';

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
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
