// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WrappedToken is ERC20 {
    
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function wrap() public payable {
        require(msg.value > 0, "Amount must be greater than 0");
        // will wrap the token 1 to 1 with Ether
        _mint(msg.sender, msg.value);
    }

    function unwrap(uint256 amount) public {
        require(amount > 0, "Amount must be greater than 0");
        // will send the Ether back to the user
        _burn(msg.sender, amount); // where token balance changes happen, burn first to prevent reentrancy
        payable(msg.sender).transfer(amount); // where ether balance changes happen, withdrawl
    }

}