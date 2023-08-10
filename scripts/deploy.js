const { ethers, upgrades } = require("hardhat");
// const { abi } = require("../artifacts/contracts/Campaign.sol/Campaign.json");
const { abi } = require("../artifacts/contracts/mocks/Chappy.sol/Chappy.json");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // // Unit Deploy&Verify mock token contract for reward
  // const MockToken = await ethers.getContractFactory("Chappy");
  // const erc20Token = await MockToken.deploy("COOKIE", "COOKIE");
  // await erc20Token.deployed();
  // console.log("MockToken deployed to:", erc20Token.address);
  // await sleep(1000 * 10);
  // await hre.run("verify:verify", {
  //   address: erc20Token.address,
  //   contract: "contracts/mocks/Chappy.sol:Chappy",
  //   constructorArguments: ["COOKIE", "COOKIE"],
  // });
  // // Unit Deploy&Verify Chappy token contract for validate user
  // const ChappyToken = await ethers.getContractFactory("Chappy");
  // const chappyToken = await ChappyToken.deploy("ChappyGPT", "PGPT");
  // await chappyToken.deployed();
  // console.log("ChappyToken deployed to:", chappyToken.address);
  // await sleep(1000 * 10);
  // await hre.run("verify:verify", {
  //   address: chappyToken.address,
  //   contract: "contracts/mocks/Chappy.sol:Chappy",
  //   constructorArguments: ["ChappyGPT", "PGPT"],
  // });
  // Unit Deploy&Verify nft contract for validate user
  // const ChappyNFT = await ethers.getContractFactory("ChappyNFT");
  // const chappyNFT = await ChappyNFT.deploy();
  // await chappyNFT.deployed();
  // console.log("ChappyToken deployed to:", chappyNFT.address);
  // await sleep(10000);
  // await hre.run("verify:verify", {
  //   address: chappyNFT.address,
  //   contract: "contracts/mocks/ChappyNFT.sol:ChappyNFT",
  // });
  // Unit Deploy&Verify campaign contract
  const CampaignContract = await ethers.getContractFactory("Campaign");
  const Campaign = await upgrades.deployProxy(CampaignContract, [
    "0xf705457121591e5a849cc1Ae2f0A1425547df65D",
    "0xf7e43A2A24ee3cAb8385A0Ee24001A39697ee9e0",
    "0x2e6731396D8d0475A9BBd3d981bfd8c94a6c8AB0",
    "0xf705457121591e5a849cc1Ae2f0A1425547df65D",
    ["0xf705457121591e5a849cc1Ae2f0A1425547df65D"],
    500,
  ]);
  await Campaign.deployed();
  await sleep(10000);
  console.log("Campaign deployed to:", Campaign.address);
  implAddress = await upgrades.erc1967.getImplementationAddress(
    "0x76943aBF12DD209352140ab6d9e4F1379DF9f99C"
  );
  console.log("implCampaign deployed to:", implAddress);
  await hre.run("verify:verify", {
    address: "0xe558bf69941df08a4b71d883881583b4d77ed083",
  });
  // Unit Upgrade campaign contract
  // const SC_upgarde_master = await ethers.getContractFactory("Campaign");
  // const master_upgrade = await upgrades.upgradeProxy(
  //   "0xF353f62D58a8aF501D898D9A0c5a5F946B6539D6",
  //   SC_upgarde_master
  // );
  // console.log("upgrades deployed to:", master_upgrade.address);
  // let implAddress = await upgrades.erc1967.getImplementationAddress(
  //   "0xF353f62D58a8aF501D898D9A0c5a5F946B6539D6"
  // );
  // console.log("implAddress: ", implAddress);
  // // Unit Verify campaign contract
  // await hre.run("verify:verify", {
  //   address: implAddress,
  // });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
