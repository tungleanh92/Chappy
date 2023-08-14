const { ethers, upgrades } = require("hardhat");
// const { abi } = require("../artifacts/contracts/Campaign.sol/Campaign.json");
const { abi } = require("../artifacts/contracts/mocks/Chappy.sol/Chappy.json");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // // Unit Deploy&Verify mock token contract for reward
  // const MockToken = await ethers.getContractFactory("Chappy");
  // const erc20Token = await MockToken.deploy("ARB", "ARB");
  // await erc20Token.deployed();
  // console.log("MockToken deployed to:", erc20Token.address);
  // await sleep(1000);
  // await hre.run("verify:verify", {
  //   address: erc20Token.address,
  //   contract: "contracts/mocks/Chappy.sol:Chappy",
  //   constructorArguments: ["ARB", "ARB"],
  // });
  // Unit Deploy&Verify Chappy token contract for validate user
  // const ChappyToken = await ethers.getContractFactory("Chappy");
  // const chappyToken = await ChappyToken.deploy("BNB", "BNB");
  // await chappyToken.deployed();
  // console.log("ChappyToken deployed to:", chappyToken.address);
  // await sleep(5000);
  // await hre.run("verify:verify", {
  //   address: "0x45735c549265472ae614c7614bc7b528862619aA",
  //   contract: "contracts/mocks/Chappy.sol:Chappy",
  //   constructorArguments: ["BNB", "BNB"],
  // });
  // // Unit Deploy&Verify Chappy token contract for validate user
  // const ChappyToken2 = await ethers.getContractFactory("Chappy");
  // const chappyToken2 = await ChappyToken2.deploy("USDD", "USDD");
  // await chappyToken2.deployed();
  // console.log("ChappyToken deployed to:", chappyToken2.address);
  // await sleep(5000);
  // await hre.run("verify:verify", {
  //   address: chappyToken2.address,
  //   contract: "contracts/mocks/Chappy.sol:Chappy",
  //   constructorArguments: ["USDD", "USDD"],
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
  //   "0xD0C34f21c1a67bA4F97c4C6aF53592d4a7f45235",
  //   "0x2082F9e97908c37C4D28BB049e56F7e7B4B1D2a1",
  //   "0x4D1f0c0aa5899354f4f466f7FC34ad31797e433B",
  //   "0xb8d61dc88c4cb9e4590992a2e3a70bd75a187989",
  //   [
  //     "0xD0C34f21c1a67bA4F97c4C6aF53592d4a7f45235",
  //     "0x6a4154fb217175B9490699B30231766D13B21058",
  //     "0xf705457121591e5a849cc1Ae2f0A1425547df65D",
  //   ],
  //   500,
  // ]);
  // await Campaign.deployed();
  // await sleep(1000 * 10);
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
    "0xE9D5430C39Ed4C73FE4303D771e99419FAc6a3A5",
    SC_upgarde_master
  );
  console.log("upgrades deployed to:", master_upgrade.address);
  let implAddress = await upgrades.erc1967.getImplementationAddress(
    "0xE9D5430C39Ed4C73FE4303D771e99419FAc6a3A5"
  );
  console.log("implAddress: ", implAddress);
  // Unit Verify campaign contract
  // await hre.run("verify:verify", {
  //   address: "0x8a3000089015b043b34d8f5963cc0f68d7bf0218",
  // });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
