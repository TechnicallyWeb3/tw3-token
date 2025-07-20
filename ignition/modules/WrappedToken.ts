// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const WrappedTokenModule = buildModule("WrappedTokenModule", (m) => {
  const tokenName = m.getParameter("tokenName", "TW3 Wrapped ETH");
  console.log("tokenName", tokenName);
  const tokenSymbol = m.getParameter("tokenSymbol", "tw3ETH");
  console.log("tokenSymbol", tokenSymbol);

  const wrappedToken = m.contract("WrappedToken", [tokenName, tokenSymbol]);

  return { wrappedToken };
});

export default WrappedTokenModule; 