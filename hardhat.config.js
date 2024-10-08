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
    eth: {
      url: "https://eth-mainnet.g.alchemy.com/v2/muMVZ-GJSLgDNvayvAh7amZMUaKO3Ff4",
      accounts: [SECRET_KEY_POLYGON],
    },
    ethFork: {
      url: "http://15.237.137.101:8545",
      accounts: [SECRET_KEY_POLYGON],
    },
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
    arbitrumGoerli: {
      url: "https://arbitrum-goerli.public.blastapi.io",
      accounts: [
        "82f2875d49e8c831c611db7b7203d5f2b6ae97f730486859fcc9babe1baa954d",
      ],
    },
    optimismGoerli: {
      url: "https://optimism-goerli.gateway.tenderly.co",
      accounts: [
        "82f2875d49e8c831c611db7b7203d5f2b6ae97f730486859fcc9babe1baa954d",
      ],
    },
    "base-goerli": {
      url: "https://goerli.base.org",
      accounts: [
        "82f2875d49e8c831c611db7b7203d5f2b6ae97f730486859fcc9babe1baa954d",
      ],
      gasPrice: 1000000000,
    },
    avalancheTestnet: {
      url: "https://ava-testnet.public.blastapi.io/ext/bc/C/rpc",
      accounts: [
        "82f2875d49e8c831c611db7b7203d5f2b6ae97f730486859fcc9babe1baa954d",
      ],
    },
    polygonMainnet: {
      url: "https://poly-rpc.gateway.pokt.network",
      accounts: [SECRET_KEY_POLYGON],
    },
    sepoliaTestnet: {
      url: "https://eth-sepolia.g.alchemy.com/v2/-Wikk-cvObqfX0TnXiqf_LvpstkJjc56",
      accounts: [
        "82f2875d49e8c831c611db7b7203d5f2b6ae97f730486859fcc9babe1baa954d",
      ],
    },
    goerli: {
      url: "https://goerli.infura.io/v3/1d8e302b7d964752851c01c455c266dc",
      accounts: [
        "82f2875d49e8c831c611db7b7203d5f2b6ae97f730486859fcc9babe1baa954d",
      ],
    },
  },
  etherscan: {
    apiKey: {
      arbitrumGoerli: "WBGSPYJD8CEWWMAVAGJ3UCAT4FUTCD72KU",
      optimisticGoerli: "3ADRJJGHB95667BBDK99D82TST382NSZZY",
      "base-goerli": "0395d930-2ad9-4298-a01a-ee4a2f43fd83",
      bscTestnet: "YK25KWCWJNA9P6JJCG32FEEUW1KF76DEUW",
      polygonMumbai: "RWTK6RMTQWG56N2IFXQBSGQ5RU51J2S9X9",
      polygon: "RWTK6RMTQWG56N2IFXQBSGQ5RU51J2S9X9",
      sepolia: "-Wikk-cvObqfX0TnXiqf_LvpstkJjc56",
      goerli: "9NABH8YAU3ZE31V6UY3F8Y9QB7R9EMGCU4",
      mainnet: "9NABH8YAU3ZE31V6UY3F8Y9QB7R9EMGCU4",
      avalancheFujiTestnet: "HGTTZ79EXZQBSEIZ9486VN95M6PTHAAMZ7",
    },
    // customChains: [
    //   {
    //     network: "base-goerli",
    //     chainId: 84531,
    //     urls: {
    //       apiURL: "https://base-goerli.blockscout.com/api",
    //       browserURL: "https://base-goerli.blockscout.com",
    //     },
    //   },
    // ],
  },
};
