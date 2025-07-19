import { task } from "hardhat/config";

task("check:balance", "Check balance of an account")
  .addParam("account", "The account address to check")
  .addOptionalParam("token", "The token contract address (optional)")
  .setAction(async (taskArgs, hre) => {
    const { checkBalance } = await import("../scripts/CheckBalance");
    await checkBalance(taskArgs.account, taskArgs.token);
  });

task("check:wrapped", "Check WrappedToken contract summary and caller balance")
  .addOptionalParam("token", "The WrappedToken contract address (optional)")
  .setAction(async (taskArgs, hre) => {
    const { checkWrappedToken } = await import("../scripts/CheckWrapped");
    await checkWrappedToken(taskArgs.token);
  }); 