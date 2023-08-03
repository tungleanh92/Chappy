const { ethers, upgrades } = require("hardhat");
const { abi } = require("../artifacts/contracts/Campaign.sol/Campaign.json");
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // Unit Deploy&Verify mock token contract for reward
  // const MockToken = await ethers.getContractFactory("Chappy");
  // const erc20Token = await MockToken.deploy("COOKIE", "COOKIE");
  // await erc20Token.deployed();
  // console.log("MockToken deployed to:", erc20Token.address);
  // await sleep(1000 * 60);
  // await hre.run("verify:verify", {
  //   address: "0x4D1f0c0aa5899354f4f466f7FC34ad31797e433B",
  //   contract: "contracts/mocks/Chappy.sol:Chappy",
  //   constructorArguments: ["COOKIE", "COOKIE"],
  // });
  // // Unit Deploy&Verify Chappy token contract for validate user
  // const ChappyToken = await ethers.getContractFactory("Chappy");
  // const chappyToken = await ChappyToken.deploy("ChappyGPT", "PGPT");
  // await chappyToken.deployed();
  // console.log("ChappyToken deployed to:", chappyToken.address);
  // await sleep(1000 * 60);
  // await hre.run("verify:verify", {
  //   address: chappyToken.address,
  //   contract: "contracts/mocks/Chappy.sol:Chappy",
  //   constructorArguments: ["ChappyGPT", "PGPT"],
  // });
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
  const SC_upgarde_master = await ethers.getContractFactory("Campaign");
  const master_upgrade = await upgrades.upgradeProxy(
    "0xa58d78fab2192b1F5A813cF8fbbE67A31fdbb276",
    SC_upgarde_master,
    {}
  );
  console.log("upgrades deployed to:", master_upgrade.address);
  implAddress = await upgrades.erc1967.getImplementationAddress(
    "0xa58d78fab2192b1F5A813cF8fbbE67A31fdbb276"
  );
  // Unit Verify campaign contract
  await hre.run("verify:verify", {
    address: implAddress,
  });
  // const provider = new ethers.providers.JsonRpcProvider(
  //   "https://eth-goerli.g.alchemy.com/v2/BfvtYO9B_ta39GCu8EJz1Py3nUULPFCM"
  // );
  // const signer = new ethers.Wallet(
  //   "5c485fcce07d690c90016ff5190daeb18519da8ed8c4faf234b486bba276e5ac",
  //   provider
  // );
  // const contract = new ethers.Contract(
  //   "0xa58d78fab2192b1f5a813cf8fbbe67a31fdbb276",
  //   abi,
  //   signer
  // );
  // let pt = ethers.utils.parseEther((2 / 3).toFixed(18).toString());
  // let re = {
  //   taskIds: [[73]],
  //   pointForMultiple: [],
  //   signature:
  //     "0xb98b5b1ff4e1b4d9f399afcba3e4274ebcb861e362963e3da5e898a3549a508241898d44fc25702556f0a18af6238c50081cd6615b99cb0b0542d1488f53164c1c",
  //   isValidUser: [1],
  // };

  // const x = await contract.estimateGas.claimReward(re, {
  //   value: "0",
  // });
  // console.log(x);
  ////
  // const iface = new ethers.utils.Interface(abi);
  // const errorMessage = iface.parseError("0x41e55b52");
  // console.log(errorMessage);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
