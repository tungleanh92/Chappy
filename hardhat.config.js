require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require('@openzeppelin/upgrades-core');

API_KEY = process.env.API_KEY_ARB;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.18',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
    },
  },
  networks: {
    arbitrumTestnet: {
      url: 'https://goerli-rollup.arbitrum.io/rpc',
      accounts: ['82f2875d49e8c831c611db7b7203d5f2b6ae97f730486859fcc9babe1baa954d']
    }
  },
  etherscan: {
    apiKey: {
      arbitrumGoerli: 'WBGSPYJD8CEWWMAVAGJ3UCAT4FUTCD72KU'
    }
  }
};
