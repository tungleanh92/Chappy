// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Chappy is ERC20, Ownable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(0xB8D61dc88c4cb9e4590992a2e3a70bd75a187989, 1000000000 * 10 ** uint(decimals()));
    }

    function mint(uint256 amount, address recipient) external onlyOwner {
        _mint(recipient, amount);
    }
}