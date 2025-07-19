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
});