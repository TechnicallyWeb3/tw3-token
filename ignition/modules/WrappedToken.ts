// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const WrappedTokenModule = buildModule("WrappedTokenModule", (m) => {
  const tokenName = m.getParameter("tokenName", "Wrapped Ether");
  const tokenSymbol = m.getParameter("tokenSymbol", "WETH");

  const wrappedToken = m.contract("WrappedToken", [tokenName, tokenSymbol]);

  return { wrappedToken };
});

export default WrappedTokenModule; 