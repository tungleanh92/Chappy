const { ethers, upgrades } = require("hardhat");
// const { abi } = require("../artifacts/contracts/Campaign.sol/Campaign.json");
const { abi } = require("../artifacts/contracts/mocks/Chappy.sol/Chappy.json");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// test
async function main() {
  // Unit Deploy&Verify mock token contract for reward
  const ChappyToken = await ethers.getContractFactory("Chappy");
  const chappyToken = await ChappyToken.deploy("CHAPPY", "CHAPPY");
  await chappyToken.deployed();
  console.log("ChappyToken deployed to:", chappyToken.address);
  await sleep(1000 * 10);
  await hre.run("verify:verify", {
    address: chappyToken.address,
    contract: "contracts/mocks/Chappy.sol:Chappy",
    constructorArguments: ["CHAPPY", "CHAPPY"],
  });
  // Unit Deploy&Verify Chappy token contract for validate user
  const CookieToken = await ethers.getContractFactory("Chappy");
  const cookieToken = await CookieToken.deploy("COOKIE", "COOKIE");
  await cookieToken.deployed();
  console.log("CookieToken deployed to:", cookieToken.address);
  await sleep(1000 * 10);
  await hre.run("verify:verify", {
    address: cookieToken.address,
    contract: "contracts/mocks/Chappy.sol:Chappy",
    constructorArguments: ["COOKIE", "COOKIE"],
  });
  // Unit Deploy&Verify nft contract for validate user
  const ChappyNFT = await ethers.getContractFactory("ChappyNFT");
  const chappyNFT = await ChappyNFT.deploy();
  await chappyNFT.deployed();
  console.log("ChappyNFT deployed to:", chappyNFT.address);
  await sleep(1000 * 10);
  await hre.run("verify:verify", {
    address: chappyNFT.address,
    contract: "contracts/mocks/ChappyNFT.sol:ChappyNFT",
  });
  // Unit Deploy&Verify campaign contract
  const CampaignContract = await ethers.getContractFactory("Campaign");
  const Campaign = await upgrades.deployProxy(CampaignContract, [
    "0xf705457121591e5a849cc1Ae2f0A1425547df65D",
    chappyToken.address,
    cookieToken.address,
    "0xf705457121591e5a849cc1Ae2f0A1425547df65D",
    [
      "0x6a4154fb217175B9490699B30231766D13B21058",
      "0xf705457121591e5a849cc1Ae2f0A1425547df65D",
    ],
    0,
  ]);
  await Campaign.deployed();
  await sleep(1000 * 10);
  console.log("Campaign deployed to:", Campaign.address);
  let implAddress = await upgrades.erc1967.getImplementationAddress(
    Campaign.address
  );
  console.log("implCampaign deployed to:", implAddress);
  await hre.run("verify:verify", {
    address: implAddress,
  });
  // Unit Upgrade campaign contract
  // const SC_upgarde_master = await ethers.getContractFactory("Campaign");
  // const master_upgrade = await upgrades.upgradeProxy(
  //   "0xE5a1508C50D025b156bdc7702f66a7DCCA2653B1",
  //   SC_upgarde_master
  // );
  // console.log("upgrades deployed to:", master_upgrade.address);
  // let implAddress = await upgrades.erc1967.getImplementationAddress(
  //   "0xE5a1508C50D025b156bdc7702f66a7DCCA2653B1"
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
