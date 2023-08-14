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
  // const CampaignContract = await ethers.getContractFactory("Campaign");
  // const Campaign = await upgrades.deployProxy(CampaignContract, [
  //   "0xf705457121591e5a849cc1Ae2f0A1425547df65D",
  //   "0x60D37F0C3271658EE2135Aa171786faE97bFe2f4",
  //   "0x67b9c94afB83ef5D511719239fcf90ec9fD08f39",
  //   "0xf705457121591e5a849cc1Ae2f0A1425547df65D",
  //   ["0xf705457121591e5a849cc1Ae2f0A1425547df65D"],
  //   500,
  // ]);
  // await Campaign.deployed();
  // await sleep(10000);
  // console.log("Campaign deployed to:", Campaign.address);
  // let implAddress = await upgrades.erc1967.getImplementationAddress(
  //   Campaign.address
  // );
  // console.log("implCampaign deployed to:", implAddress);
  // await hre.run("verify:verify", {
  //   address: implAddress,
  // });
  // Unit Upgrade campaign contract
  const SC_upgarde_master = await ethers.getContractFactory("Campaign");
  const master_upgrade = await upgrades.upgradeProxy(
    "0x782Bee2fd9eCCAC03B4e7c418279ba9709DC626B",
    SC_upgarde_master
  );
  console.log("upgrades deployed to:", master_upgrade.address);
  let implAddress = await upgrades.erc1967.getImplementationAddress(
    "0x782Bee2fd9eCCAC03B4e7c418279ba9709DC626B"
  );
  console.log("implAddress: ", implAddress);
  // Unit Verify campaign contract
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
