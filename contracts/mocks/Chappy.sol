// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Chappy is ERC20, Ownable {
    // CHANGED FOR UNITTEST
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(0x6a4154fb217175B9490699B30231766D13B21058, 1000000000 * 10 ** uint(decimals()));
    }

    function mint(uint256 amount, address recipient) external onlyOwner {
        _mint(recipient, amount);
    }
}