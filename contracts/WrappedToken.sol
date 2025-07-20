// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WrappedToken is ERC20 {
    
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    receive() external payable {
        wrap();
    }

    function wrap() public payable {
        require(msg.value > 0, "Amount must be greater than 0");
        // will wrap the token 1 to 1 with Ether
        _mint(msg.sender, msg.value);
    }

    function unwrap(uint256 amount) public {
        _unwrap(msg.sender, amount);
    }

    function _unwrap(address from, uint256 amount) internal {
        require(amount > 0, "Amount must be greater than 0");
        _burn(from, amount);
        payable(from).transfer(amount);
    }

    function _update(address from, address to, uint256 amount) internal override {
        if (to == address(this)) {
            _unwrap(from, amount);
            return;
        }
        super._update(from, to, amount);
    }
}