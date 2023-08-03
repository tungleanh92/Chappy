const { ethers, upgrades } = require("hardhat");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // // Unit Deploy&Verify mock token contract for reward
  // const MockToken = await ethers.getContractFactory("Chappy");
  // const erc20Token = await MockToken.deploy("COOKIE", "COOKIE");
  // await erc20Token.deployed();
  // console.log("MockToken deployed to:", erc20Token.address);
  // // await sleep(10000);
  // // await hre.run("verify:verify", {
  // //   address: erc20Token.address,
  // //   contract: "contracts/mocks/Chappy.sol:Chappy",
  // //   constructorArguments: ["COOKIE", "COOKIE"],
  // // });
  // // Unit Deploy&Verify Chappy token contract for validate user
  // const ChappyToken = await ethers.getContractFactory("Chappy");
  // const chappyToken = await ChappyToken.deploy("ChappyGPT", "PGPT");
  // await chappyToken.deployed();
  // console.log("ChappyToken deployed to:", chappyToken.address);
  // // await sleep(10000);
  // // await hre.run("verify:verify", {
  // //   address: chappyToken.address,
  // //   contract: "contracts/mocks/Chappy.sol:Chappy",
  // //   constructorArguments: ["ChappyGPT", "PGPT"],
  // // });
  // // Unit Deploy&Verify nft contract for validate user
  // const ChappyNFT = await ethers.getContractFactory("ChappyNFT");
  // const chappyNFT = await ChappyNFT.deploy();
  // await chappyNFT.deployed();
  // console.log("ChappyToken deployed to:", chappyNFT.address);
  // // await sleep(10000);
  // // await hre.run("verify:verify", {
  // //   address: chappyNFT.address,
  // //   contract: "contracts/mocks/ChappyNFT.sol:ChappyNFT",
  // // });
  // // Unit Deploy&Verify campaign contract
  // const CampaignContract = await ethers.getContractFactory("Campaign");
  // const Campaign = await upgrades.deployProxy(CampaignContract, [
  //   "0xf705457121591e5a849cc1Ae2f0A1425547df65D",
  //   chappyToken.address,
  //   erc20Token.address,
  //   "0xf705457121591e5a849cc1Ae2f0A1425547df65D",
  //   ["0xf705457121591e5a849cc1Ae2f0A1425547df65D"],
  //   500,
  //   "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526",
  // ]);
  // await Campaign.deployed();
  // await sleep(10000);
  // console.log("Campaign deployed to:", Campaign.address);
  // implAddress = await upgrades.erc1967.getImplementationAddress(
  //   "0x0cfadf266ab39ba4a0c6af70b678340b0c2ed870"
  // );
  // console.log("implCampaign deployed to:", implAddress);
  // await hre.run("verify:verify", {
  //   address: implAddress,
  // });
  // Unit Upgrade campaign contract
  // const SC_upgarde_master = await ethers.getContractFactory("Campaign");
  // const master_upgrade = await upgrades.upgradeProxy(
  //   "0xa58d78fab2192b1F5A813cF8fbbE67A31fdbb276",
  //   SC_upgarde_master,
  //   {}
  // );
  // console.log("upgrades deployed to:", master_upgrade.address);
  // implAddress = await upgrades.erc1967.getImplementationAddress(
  //   "0xa58d78fab2192b1F5A813cF8fbbE67A31fdbb276"
  // );
  // Unit Verify campaign contract
  await hre.run("verify:verify", {
    address: "0x48ba4db7f36f98f1c2961f2fd39c83e947cf07c1",
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
