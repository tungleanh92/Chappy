require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("@openzeppelin/upgrades-core");
require("solidity-docgen");
require("dotenv").config({ path: __dirname + "/.env" });

const API_KEY = process.env.API_KEY_ARB;

const SECRET_KEY_POLYGON = process.env.PRIVATE_KEY_MAINNET;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    arbitrumTestnet: {
      url: "https://goerli-rollup.arbitrum.io/rpc",
      accounts: [
        "82f2875d49e8c831c611db7b7203d5f2b6ae97f730486859fcc9babe1baa954d",
      ],
    },
    bnbTestnet: {
      url: "https://data-seed-prebsc-1-s2.binance.org:8545",
      accounts: [
        "82f2875d49e8c831c611db7b7203d5f2b6ae97f730486859fcc9babe1baa954d",
      ],
    },
    mumbai: {
      url: "https://polygon-mumbai.blockpi.network/v1/rpc/public",
      accounts: [
        "82f2875d49e8c831c611db7b7203d5f2b6ae97f730486859fcc9babe1baa954d",
      ],
    },
    polygonMainnet: {
      url: "https://poly-rpc.gateway.pokt.network",
      accounts: [SECRET_KEY_POLYGON],
    },
  },
  etherscan: {
    apiKey: {
      arbitrumGoerli: "WBGSPYJD8CEWWMAVAGJ3UCAT4FUTCD72KU",
      bscTestnet: "YK25KWCWJNA9P6JJCG32FEEUW1KF76DEUW",
      polygonMumbai: "RWTK6RMTQWG56N2IFXQBSGQ5RU51J2S9X9",
      polygon: "RWTK6RMTQWG56N2IFXQBSGQ5RU51J2S9X9",
    },
  },
};
