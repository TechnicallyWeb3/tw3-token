import { expect } from "chai";
import hre from "hardhat";

describe("WrappedToken", function () {
    // test variables
    let wrappedToken: any;
    let deployer: any;
    let user1: any;
    let user2: any;
    let user3: any;

    before(async function () {
        [deployer, user1, user2, user3] = await hre.ethers.getSigners();
        const WrappedTokenFactory = await hre.ethers.getContractFactory("WrappedToken");
        wrappedToken = await WrappedTokenFactory.deploy("Wrapped Ether", "WETH");
        await wrappedToken.waitForDeployment();
    });

    it("should deploy the token with 0 total supply", async function () {
        expect(await wrappedToken.totalSupply()).to.equal(0);
    });

    it("should allow any address to wrap tokens", async function () {
        const wrapAmount = hre.ethers.parseEther("1.0");
        const wrapTx = await wrappedToken.wrap({ value: wrapAmount });
        await wrapTx.wait();

        expect(await wrappedToken.balanceOf(deployer.address)).to.equal(wrapAmount);
        expect(await wrappedToken.totalSupply()).to.equal(wrapAmount);

        const wrap2Tx = await wrappedToken.connect(user1).wrap({ value: wrapAmount });
        await wrap2Tx.wait();

        expect(await wrappedToken.balanceOf(user1.address)).to.equal(wrapAmount);
        expect(await wrappedToken.totalSupply()).to.equal(wrapAmount * 2n);

        const wrap3Tx = await wrappedToken.connect(user2).wrap({ value: wrapAmount });
        await wrap3Tx.wait();

        expect(await wrappedToken.balanceOf(user2.address)).to.equal(wrapAmount);
        expect(await wrappedToken.totalSupply()).to.equal(wrapAmount * 3n);

        const wrap4Tx = await wrappedToken.connect(user3).wrap({ value: wrapAmount });
        await wrap4Tx.wait();

        expect(await wrappedToken.balanceOf(user3.address)).to.equal(wrapAmount);
        expect(await wrappedToken.totalSupply()).to.equal(wrapAmount * 4n);

    });

    it("should allow any address to unwrap tokens", async function () {
        const unwrapAmount = hre.ethers.parseEther("1.0");
        const startingWrappedEther = await hre.ethers.provider.getBalance(wrappedToken.target);

        const unwrapTx = await wrappedToken.unwrap(unwrapAmount);
        await unwrapTx.wait();

        expect(await wrappedToken.balanceOf(deployer.address)).to.equal(0);
        expect(await wrappedToken.totalSupply()).to.equal(startingWrappedEther - unwrapAmount);

        const unwrap2Tx = await wrappedToken.connect(user1).unwrap(unwrapAmount);
        await unwrap2Tx.wait();

        expect(await wrappedToken.balanceOf(user1.address)).to.equal(0);
        expect(await wrappedToken.totalSupply()).to.equal(startingWrappedEther - unwrapAmount * 2n);

        const unwrap3Tx = await wrappedToken.connect(user2).unwrap(unwrapAmount);
        await unwrap3Tx.wait();

        expect(await wrappedToken.balanceOf(user2.address)).to.equal(0);
        expect(await wrappedToken.totalSupply()).to.equal(startingWrappedEther - unwrapAmount * 3n);

        const unwrap4Tx = await wrappedToken.connect(user3).unwrap(unwrapAmount);
        await unwrap4Tx.wait();

        expect(await wrappedToken.balanceOf(user3.address)).to.equal(0);
        expect(await wrappedToken.totalSupply()).to.equal(0n);
    });

    it("should wrap tokens when ether is sent directly to contract via receive()", async function () {
        const sendAmount = hre.ethers.parseEther("2.5");
        const initialBalance = await wrappedToken.balanceOf(user1.address);
        const initialTotalSupply = await wrappedToken.totalSupply();

        // Send ether directly to the contract address
        const tx = await user1.sendTransaction({
            to: wrappedToken.target,
            value: sendAmount
        });
        await tx.wait();

        // Verify tokens were minted to the sender
        expect(await wrappedToken.balanceOf(user1.address)).to.equal(initialBalance + sendAmount);
        expect(await wrappedToken.totalSupply()).to.equal(initialTotalSupply + sendAmount);
    });

    it("should reject zero value transactions via receive()", async function () {
        // Try to send 0 ether directly to the contract
        await expect(
            user1.sendTransaction({
                to: wrappedToken.target,
                value: 0
            })
        ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("should automatically unwrap tokens when transferred to contract via transfer()", async function () {
        // First wrap some tokens
        const wrapAmount = hre.ethers.parseEther("1.0");
        const wrapTx = await wrappedToken.connect(user1).wrap({ value: wrapAmount });
        await wrapTx.wait();

        const initialBalance = await wrappedToken.balanceOf(user1.address);
        const initialContractBalance = await hre.ethers.provider.getBalance(wrappedToken.target);
        const initialUserEthBalance = await hre.ethers.provider.getBalance(user1.address);

        // Transfer tokens to the contract (should auto-unwrap)
        const transferAmount = hre.ethers.parseEther("0.5");
        const transferTx = await wrappedToken.connect(user1).transfer(wrappedToken.target, transferAmount);
        await transferTx.wait();

        // Verify tokens were burned
        expect(await wrappedToken.balanceOf(user1.address)).to.equal(initialBalance - transferAmount);
        expect(await wrappedToken.totalSupply()).to.equal(initialBalance - transferAmount);

        // Verify ether was sent back to user
        expect(await hre.ethers.provider.getBalance(wrappedToken.target)).to.equal(initialContractBalance - transferAmount);
        expect(await hre.ethers.provider.getBalance(user1.address)).to.be.greaterThan(initialUserEthBalance);
    });

    it("should automatically unwrap tokens when transferred to contract via transferFrom()", async function () {
        // First wrap some tokens for user2
        const wrapAmount = hre.ethers.parseEther("1.0");
        const wrapTx = await wrappedToken.connect(user2).wrap({ value: wrapAmount });
        await wrapTx.wait();

        // Approve user1 to spend user2's tokens
        const approveTx = await wrappedToken.connect(user2).approve(user1.address, wrapAmount);
        await approveTx.wait();

        const initialBalance = await wrappedToken.balanceOf(user2.address);
        const initialContractBalance = await hre.ethers.provider.getBalance(wrappedToken.target);
        const initialUser2EthBalance = await hre.ethers.provider.getBalance(user2.address);
        const initialTotalSupply = await wrappedToken.totalSupply();

        // Transfer tokens from user2 to contract via user1 (should auto-unwrap)
        const transferAmount = hre.ethers.parseEther("0.5");
        const transferFromTx = await wrappedToken.connect(user1).transferFrom(user2.address, wrappedToken.target, transferAmount);
        await transferFromTx.wait();

        // Verify tokens were burned from user2
        expect(await wrappedToken.balanceOf(user2.address)).to.equal(initialBalance - transferAmount);
        expect(await wrappedToken.totalSupply()).to.equal(initialTotalSupply - transferAmount);

        // Verify ether was sent back to user2 (the token owner)
        expect(await hre.ethers.provider.getBalance(wrappedToken.target)).to.equal(initialContractBalance - transferAmount);
        expect(await hre.ethers.provider.getBalance(user2.address)).to.be.greaterThan(initialUser2EthBalance);
    });

    it("should work normally when transferring to other addresses", async function () {
        // First wrap some tokens
        const wrapAmount = hre.ethers.parseEther("1.0");
        const wrapTx = await wrappedToken.connect(user1).wrap({ value: wrapAmount });
        await wrapTx.wait();

        const initialUser1Balance = await wrappedToken.balanceOf(user1.address);
        const initialUser2Balance = await wrappedToken.balanceOf(user2.address);
        const initialTotalSupply = await wrappedToken.totalSupply();

        // Transfer tokens to user2 (should work normally)
        const transferAmount = hre.ethers.parseEther("0.3");
        const transferTx = await wrappedToken.connect(user1).transfer(user2.address, transferAmount);
        await transferTx.wait();

        // Verify normal transfer behavior
        expect(await wrappedToken.balanceOf(user1.address)).to.equal(initialUser1Balance - transferAmount);
        expect(await wrappedToken.balanceOf(user2.address)).to.equal(initialUser2Balance + transferAmount);
        expect(await wrappedToken.totalSupply()).to.equal(initialTotalSupply); // Total supply unchanged
    });
});