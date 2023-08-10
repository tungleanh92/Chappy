const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const etherJS = require("ethers");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
// const { abi } = require("../artifacts/contracts/Campaign.sol/Campaign.json");
const { abi } = require("../artifacts/contracts/mocks/Chappy.sol/Chappy.json");

describe("Campaign contract", function () {
  async function deployFixture() {
    [owner, acc1, acc2, acc3, acc4, acc5, cut_receiver] =
      await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("Chappy");
    const erc20Token = await MockToken.deploy("Wrapped ETH", "WETH");

    const CookieToken = await ethers.getContractFactory("Chappy");
    const cookieToken = await CookieToken.deploy("Cookie", "COOKIE");

    const ChappyToken = await ethers.getContractFactory("Chappy");
    const chappyToken = await ChappyToken.deploy("Chappy", "CHA");

    const ChappyNFT = await ethers.getContractFactory("ChappyNFT");
    const chappyNFT = await ChappyNFT.deploy();

    const Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    const aggregator = await Aggregator.deploy();

    const Campaign = await ethers.getContractFactory("Campaign");
    const campaign = await upgrades.deployProxy(
      Campaign,
      [
        owner.address,
        chappyToken.address,
        cookieToken.address,
        cut_receiver.address,
        [owner.address, acc3.address],
        1000,
      ],
      {
        initializer: "initialize",
      }
    );

    return {
      owner,
      acc1,
      acc2,
      acc3,
      acc4,
      acc5,
      cut_receiver,
      campaign,
      erc20Token,
      chappyToken,
      cookieToken,
      chappyNFT,
      aggregator,
    };
  }

  async function generateSignature(sender, nonce, signer) {
    let message = ethers.utils.solidityKeccak256(
      ["uint72", "address"],
      [nonce, sender]
    );
    let messageStringBytes = ethers.utils.arrayify(message);
    return await signer.signMessage(messageStringBytes);
  }

  async function bufferedFourDolla() {
    return "17000000000000000";
  }

  it("Should revert if init again", async function () {
    const provider = new etherJS.providers.JsonRpcProvider(
      "http://10.20.1.32:8545"
    );
    // const signer = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    const contract = new etherJS.Contract(
      "0x60D37F0C3271658EE2135Aa171786faE97bFe2f4",
      abi,
      provider
    );
    let decimal = await contract.decimals();
    console.log(decimal);
    // const {
    //   acc1,
    //   acc3,
    //   campaign,
    //   chappyNFT,
    //   chappyToken,
    //   cut_receiver,
    //   aggregator,
    //   cookieToken,
    // } = await loadFixture(deployFixture);
    // await expect(
    //   campaign.initialize(
    //     owner.address,
    //     chappyToken.address,
    //     cookieToken.address,
    //     cut_receiver.address,
    //     [acc1.address, acc3.address],
    //     1000
    //   )
    // ).to.be.revertedWith("Initializable: contract is already initialized");
  });

  // it("Simulate", async function () {
  //   const {
  //     owner,
  //     acc1,
  //     acc2,
  //     acc3,
  //     acc4,
  //     acc5,
  //     origin,
  //     campaign,
  //     erc20Token,
  //     chappyToken,
  //     chappyNFT,
  //     cut_receiver,
  //     cookieToken,
  //   } = await loadFixture(deployFixture);

  //   // let camapaignInfo = {
  //   //   rewardToken: cookieToken.address,
  //   //   collection: "0x0000000000000000000000000000000000000000",
  //   //   minimumBalance: 1000,
  //   //   amount: 1000,
  //   //   startAt: Math.floor(Date.now() / 1000),
  //   //   endAt: Math.floor(Date.now() / 1000 + 86400),
  //   //   checkNFT: 0,
  //   // };
  //   // let nonce = await campaign.getNonce();
  //   // let signature = await generateSignature(
  //   //   acc1.address,
  //   //   nonce.toNumber(),
  //   //   owner
  //   // );
  //   // let x = etherJS.utils.defaultAbiCoder.encode(
  //   //   ["uint24[][]", "uint80[]", "bytes"],
  //   //   [
  //   //     [[20], [14], [7], [15, 15, 15, 15, 15, 15, 16, 16], [22], [21]],
  //   //     [
  //   //       {
  //   //         type: "BigNumber",
  //   //         hex: "0x0de0b6b3a7640000",
  //   //       },
  //   //       {
  //   //         type: "BigNumber",
  //   //         hex: "0x0de0b6b3a7640000",
  //   //       },
  //   //       {
  //   //         type: "BigNumber",
  //   //         hex: "0x0de0b6b3a7640000",
  //   //       },
  //   //       {
  //   //         type: "BigNumber",
  //   //         hex: "0x0de0b6b3a7640000",
  //   //       },
  //   //       {
  //   //         type: "BigNumber",
  //   //         hex: "0x0de0b6b3a7640000",
  //   //       },
  //   //       {
  //   //         type: "BigNumber",
  //   //         hex: "0x0de0b6b3a7640000",
  //   //       },
  //   //       {
  //   //         type: "BigNumber",
  //   //         hex: "0x0de0b6b3a7640000",
  //   //       },
  //   //       {
  //   //         type: "BigNumber",
  //   //         hex: "0x0de0b6b3a7640000",
  //   //       },
  //   //       {
  //   //         type: "BigNumber",
  //   //         hex: "0x0de0b6b3a7640000",
  //   //       },
  //   //       {
  //   //         type: "BigNumber",
  //   //         hex: "0x0de0b6b3a7640000",
  //   //       },
  //   //       {
  //   //         type: "BigNumber",
  //   //         hex: "0x0de0b6b3a7640000",
  //   //       },
  //   //       {
  //   //         type: "BigNumber",
  //   //         hex: "0x0de0b6b3a7640000",
  //   //       },
  //   //     ],
  //   //     signature,
  //   //   ]
  //   // );
  //   // await campaign.connect(acc1).claimReward2(x);
  //   // console.log("done");
  //   // const poolAmount = 1000;
  //   // await cookieToken
  //   //   .connect(owner)
  //   //   .approve(campaign.address, 1000000 * poolAmount);
  //   // await campaign
  //   //   .connect(owner)
  //   //   .createCampaign(camapaignInfo, [10, 100], [0, 1]);

  //   // let nonce = await campaign.getNonce();
  //   // let signature = await generateSignature(
  //   //   acc1.address,
  //   //   nonce.toNumber(),
  //   //   owner
  //   // );
  //   // let claimInput = {
  //   //   taskIds: [[1]],
  //   //   pointForMultiple: [1],
  //   //   signature: signature,
  //   //   isValidUser: [1],
  //   //   tipToken: ["0x0000000000000000000000000000000000000000"],
  //   //   tipRecipient: ["0x0000000000000000000000000000000000000000"],
  //   //   tipAmount: [0],
  //   // };
  //   // await campaign.connect(acc1).claimReward(claimInput, {
  //   //   value: "261800093811700282",
  //   // });
  // });

  // it("Claim successful", async function () {
  //   const {
  //     owner,
  //     acc1,
  //     acc2,
  //     acc3,
  //     acc4,
  //     acc5,
  //     origin,
  //     campaign,
  //     erc20Token,
  //     chappyToken,
  //     chappyNFT,
  //     cut_receiver,
  //     cookieToken,
  //   } = await loadFixture(deployFixture);
  //   let camapaignInfo = {
  //     rewardToken: cookieToken.address,
  //     collection: chappyNFT.address,
  //     minimumBalance: 10,
  //     amount: 1000,
  //     startAt: Math.floor(Date.now() / 1000),
  //     endAt: Math.floor(Date.now() / 1000 + 86400),
  //     checkNFT: 0,
  //   };
  //   let camapaignInfoEth = {
  //     rewardToken: "0x0000000000000000000000000000000000000000",
  //     collection: "0x0000000000000000000000000000000000000000",
  //     minimumBalance: 10,
  //     amount: 1000,
  //     startAt: Math.floor(Date.now() / 1000),
  //     endAt: Math.floor(Date.now() / 1000 + 86400),
  //     checkNFT: 0,
  //   };

  //   const poolAmount = 1000;
  //   await cookieToken.connect(owner).approve(campaign.address, 10 * poolAmount);
  //   await campaign
  //     .connect(owner)
  //     .createCampaign(camapaignInfo, [10, 100], [0, 0]);

  //   await campaign
  //     .connect(owner)
  //     .createCampaign(camapaignInfoEth, [10, 100, 100, 500], [0, 0, 1, 1], {
  //       value: camapaignInfoEth.amount.toString(),
  //     });

  //   await campaign.connect(owner).fundCampaign(0, 2 * poolAmount);
  //   await campaign.connect(owner).fundCampaign(1, poolAmount, {
  //     value: poolAmount.toString(),
  //   });

  //   let campaignInfo1 = await campaign.getCampaignInfo(0);
  //   expect(campaignInfo1.rewardToken).to.be.equal(cookieToken.address);
  //   expect(campaignInfo1.amount.toNumber()).to.be.equal(2700); // 3*poolAmount - 10% 3*poolAmount

  //   await chappyToken.connect(owner).transfer(acc1.address, 100000);
  //   await chappyToken.connect(owner).transfer(acc2.address, 100000);
  //   await cookieToken.connect(owner).transfer(acc2.address, 100000);

  //   let nonce = await campaign.getNonce();
  //   let signature = await generateSignature(
  //     acc1.address,
  //     nonce.toNumber(),
  //     owner
  //   );

  //   let claimInput = {
  //     taskIds: [[0, 1]],
  //     pointForMultiple: [],
  //     signature: signature,
  //     isValidUser: [0],
  //     tipToken: ["0x0000000000000000000000000000000000000000"],
  //     tipRecipient: ["0x0000000000000000000000000000000000000000"],
  //     tipAmount: [0],
  //   };
  //   await campaign.connect(acc1).claimReward(claimInput, {
  //     value: bufferedFourDolla(),
  //   });

  //   campaignInfo1 = await campaign.getCampaignInfo(0);
  //   expect(campaignInfo1.amount.toNumber()).to.be.equal(2700 - 100 - 10);
  //   expect(await cookieToken.balanceOf(acc1.address)).to.be.equal(110);

  //   cut_receiver_balance = await ethers.provider.getBalance(
  //     cut_receiver.address
  //   );
  //   campaign_balance = await ethers.provider.getBalance(campaign.address);
  //   expect(cut_receiver_balance).to.be.equal("10000016791738547317440");
  //   expect(campaign_balance).to.be.equal("1800");

  //   nonce = await campaign.getNonce();
  //   signature = await generateSignature(acc2.address, nonce.toNumber(), owner);
  //   let claimInputEth = {
  //     taskIds: [[2, 3]],
  //     pointForMultiple: [],
  //     signature: signature,
  //     isValidUser: [1],
  //     tipToken: ["0x0000000000000000000000000000000000000000"],
  //     tipRecipient: ["0x0000000000000000000000000000000000000000"],
  //     tipAmount: [0],
  //   };
  //   await campaign.connect(acc2).claimReward(
  //     claimInputEth
  //     //   , {
  //     //   value: bufferedFourDolla(),
  //     // }
  //   );

  //   let campaignInfo2 = await campaign.getCampaignInfo(1);
  //   expect(campaignInfo2.amount.toNumber()).to.be.equal(1800 - 100 - 10);
  //   cut_receiver_balance = await ethers.provider.getBalance(
  //     cut_receiver.address
  //   );
  //   campaign_balance = await ethers.provider.getBalance(campaign.address);
  //   expect(cut_receiver_balance).to.be.equal("10000016791738547317440");
  //   expect(campaign_balance).to.be.equal(1800 - 100 - 10);

  //   // TODO: Claim multilevel multicampaign tip erc20
  //   nonce = await campaign.getNonce();
  //   signature = await generateSignature(acc3.address, nonce.toNumber(), owner);
  //   let claimInputMultipleAndTipErc20 = {
  //     taskIds: [
  //       [0, 1],
  //       [3, 4],
  //     ],
  //     pointForMultiple: ["500000000000000000"],
  //     signature: signature,
  //     isValidUser: [1, 1],
  //     tipToken: [cookieToken.address],
  //     tipRecipient: [acc5.address],
  //     tipAmount: [10],
  //   };
  //   acc3_balance = await ethers.provider.getBalance(acc3.address);
  //   expect(acc3_balance).to.be.equal("10000000000000000000000");
  //   await campaign.connect(acc3).claimReward(claimInputMultipleAndTipErc20, {
  //     value: bufferedFourDolla(),
  //   });

  //   expect(await cookieToken.balanceOf(acc3.address)).to.be.equal(100);
  //   expect(await cookieToken.balanceOf(acc5.address)).to.be.equal(10);
  //   campaignInfo1 = await campaign.getCampaignInfo(0);
  //   expect(campaignInfo1.amount.toNumber()).to.be.equal(2590 - 100 - 10);
  //   campaignInfo2 = await campaign.getCampaignInfo(1);
  //   expect(campaignInfo2.amount.toNumber()).to.be.equal(1690 - 100 - 100 / 2);
  //   cut_receiver_balance = await ethers.provider.getBalance(
  //     cut_receiver.address
  //   );
  //   campaign_balance = await ethers.provider.getBalance(campaign.address);
  //   expect(cut_receiver_balance).to.be.equal("10000033583477094634680");

  //   // TODO: Claim multilevel multicampaign tip eth
  //   nonce = await campaign.getNonce();
  //   signature = await generateSignature(acc4.address, nonce.toNumber(), owner);
  //   let claimInputMultipleAndTipEth = {
  //     taskIds: [
  //       [0, 1],
  //       [3, 4],
  //     ],
  //     pointForMultiple: ["500000000000000000"],
  //     signature: signature,
  //     isValidUser: [1, 1],
  //     tipToken: ["0x0000000000000000000000000000000000000000"],
  //     tipRecipient: [acc5.address],
  //     tipAmount: [10],
  //   };
  //   acc4_balance = await ethers.provider.getBalance(acc4.address);
  //   expect(acc4_balance).to.be.equal("10000000000000000000000");
  //   await campaign.connect(acc4).claimReward(claimInputMultipleAndTipEth, {
  //     value: bufferedFourDolla(),
  //   });

  //   expect(await cookieToken.balanceOf(acc4.address)).to.be.equal(110);
  //   acc5_balance = await ethers.provider.getBalance(acc5.address);
  //   expect(acc5_balance).to.be.equal("10000000000000000000010");
  //   campaignInfo1 = await campaign.getCampaignInfo(0);
  //   expect(campaignInfo1.amount.toNumber()).to.be.equal(2480 - 100 - 10);
  //   campaignInfo2 = await campaign.getCampaignInfo(1);
  //   expect(campaignInfo2.amount.toNumber()).to.be.equal(1540 - 100 - 100 / 2);
  //   cut_receiver_balance = await ethers.provider.getBalance(
  //     cut_receiver.address
  //   );
  //   campaign_balance = await ethers.provider.getBalance(campaign.address);
  //   expect(cut_receiver_balance).to.be.equal("10000050375215641951920");

  //   nonce = await campaign.getNonce();
  //   signature = await generateSignature(owner.address, nonce.toNumber(), owner);
  //   await campaign.connect(owner).withdrawFundCampaign(0, 590, signature);
  //   campaignInfo1 = await campaign.getCampaignInfo(0);
  //   expect(campaignInfo1.amount.toNumber()).to.be.equal(1780);

  //   await campaign.connect(owner).changeAdmins([acc2.address]);
  //   // NFT case
  //   await cookieToken.connect(acc2).approve(campaign.address, 3 * poolAmount);
  //   let camapaignInfoNft = {
  //     rewardToken: cookieToken.address,
  //     collection: chappyNFT.address,
  //     minimumBalance: 10,
  //     amount: 1000,
  //     startAt: Math.floor(Date.now() / 1000),
  //     endAt: Math.floor(Date.now() / 1000 + 86400),
  //     checkNFT: 1,
  //   };
  //   await campaign
  //     .connect(acc2)
  //     .createCampaign(camapaignInfoNft, [6, 7, 8], [1, 0, 1]);

  //   await campaign.connect(owner).changeCutReceiver(acc5.address);
  //   await campaign.connect(owner).changeSharePercent(100);
  //   await campaign.connect(acc2).fundCampaign(2, 2 * poolAmount);
  //   expect(await cookieToken.balanceOf(acc5.address)).to.be.equal(30);
  //   let campaignInfo3 = await campaign.getCampaignInfo(2);
  //   expect(campaignInfo3.checkNFT).to.be.equal(1);
  //   await chappyNFT.connect(owner).mintTo(acc3.address);
  //   nonce = await campaign.getNonce();
  //   signature = await generateSignature(acc3.address, nonce.toNumber(), owner);
  //   let claimInputNoTip = {
  //     taskIds: [[6, 7, 8]],
  //     pointForMultiple: ["500000000000000000", "250000000000000000"],
  //     signature: signature,
  //     isValidUser: [1],
  //     tipToken: ["0x0000000000000000000000000000000000000000"],
  //     tipRecipient: ["0x0000000000000000000000000000000000000000"],
  //     tipAmount: [0],
  //   };
  //   await campaign.connect(acc3).claimReward(claimInputNoTip, {
  //     value: bufferedFourDolla(),
  //   });

  //   expect(await cookieToken.balanceOf(acc3.address)).to.be.equal(112);
  // });

  // it("Fake signature", async function () {
  //   const {
  //     owner,
  //     acc1,
  //     acc2,
  //     acc3,
  //     origin,
  //     campaign,
  //     erc20Token,
  //     chappyToken,
  //     chappyNFT,
  //     aggregator,
  //   } = await loadFixture(deployFixture);
  //   const poolAmount = 1000;
  //   await chappyToken.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let camapaignInfoNft = {
  //     rewardToken: chappyToken.address,
  //     collection: chappyNFT.address,
  //     minimumBalance: 10,
  //     amount: 1000,
  //     startAt: Math.floor(Date.now() / 1000),
  //     endAt: Math.floor(Date.now() / 1000 + 86400),
  //     checkNFT: 0,
  //   };
  //   await campaign
  //     .connect(owner)
  //     .createCampaign(camapaignInfoNft, [10, 100], [0, 0]);

  //   await campaign.connect(owner).fundCampaign(0, poolAmount);

  //   await chappyToken.connect(owner).transfer(acc1.address, 100000);

  //   let nonce = await campaign.getNonce();
  //   let signature = await generateSignature(
  //     acc1.address,
  //     nonce.toNumber(),
  //     owner
  //   );
  //   let claimInputMultiple = {
  //     taskIds: [[0, 1]],
  //     pointForMultiple: [],
  //     signature: signature,
  //     isValidUser: [0],
  //     tipToken: ["0x0000000000000000000000000000000000000000"],
  //     tipRecipient: ["0x0000000000000000000000000000000000000000"],
  //     tipAmount: [0],
  //   };
  //   await campaign.connect(acc1).claimReward(claimInputMultiple);
  //   await expect(
  //     campaign.connect(acc1).claimReward(claimInputMultiple)
  //   ).to.be.revertedWithCustomError(campaign, "InvalidSignature");
  //   await expect(
  //     campaign.connect(acc2).claimReward(claimInputMultiple)
  //   ).to.be.revertedWithCustomError(campaign, "InvalidSignature");
  //   await expect(
  //     campaign.connect(owner).withdrawFundCampaign(0, 890, signature)
  //   ).to.be.revertedWithCustomError(campaign, "InvalidSignature");
  // });

  // it("Reclaim", async function () {
  //   const {
  //     owner,
  //     acc1,
  //     acc2,
  //     acc3,
  //     origin,
  //     campaign,
  //     erc20Token,
  //     chappyToken,
  //     chappyNFT,
  //   } = await loadFixture(deployFixture);
  //   const poolAmount = 1000;
  //   await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let camapaignInfo = {
  //     rewardToken: erc20Token.address,
  //     collection: chappyNFT.address,
  //     minimumBalance: 10,
  //     amount: 1000,
  //     startAt: Math.floor(Date.now() / 1000),
  //     endAt: 0,
  //     checkNFT: 0,
  //   };
  //   await campaign
  //     .connect(owner)
  //     .createCampaign(camapaignInfo, [10, 100], [0, 0]);

  //   await campaign.connect(owner).fundCampaign(0, poolAmount);

  //   await chappyToken.connect(owner).transfer(acc1.address, 100000);

  //   let nonce = await campaign.getNonce();
  //   let signature = await generateSignature(
  //     acc1.address,
  //     nonce.toNumber(),
  //     owner
  //   );
  //   let claimInputMultiple = {
  //     taskIds: [[0, 1]],
  //     pointForMultiple: [],
  //     signature: signature,
  //     isValidUser: [0],
  //     tipToken: ["0x0000000000000000000000000000000000000000"],
  //     tipRecipient: ["0x0000000000000000000000000000000000000000"],
  //     tipAmount: [0],
  //   };
  //   await campaign.connect(acc1).claimReward(
  //     claimInputMultiple
  //     //   , {
  //     //   value: bufferedFourDolla(),
  //     // }
  //   );
  //   nonce = nonce.toNumber() + 1;
  //   signature = await generateSignature(acc1.address, nonce, owner);
  //   claimInputMultiple = {
  //     taskIds: [[0, 1]],
  //     pointForMultiple: [],
  //     signature: signature,
  //     isValidUser: [0],
  //     tipToken: ["0x0000000000000000000000000000000000000000"],
  //     tipRecipient: ["0x0000000000000000000000000000000000000000"],
  //     tipAmount: [0],
  //   };
  //   await expect(
  //     campaign.connect(acc1).claimReward(
  //       claimInputMultiple
  //       //   , {
  //       //   value: bufferedFourDolla(),
  //       // }
  //     )
  //   ).to.be.revertedWithCustomError(campaign, "ClaimedTask");
  // });

  // it("Insufficent chappy", async function () {
  //   const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyNFT } =
  //     await loadFixture(deployFixture);
  //   const poolAmount = 1000;
  //   await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let camapaignInfo = {
  //     rewardToken: erc20Token.address,
  //     collection: chappyNFT.address,
  //     minimumBalance: 10,
  //     amount: 1000,
  //     startAt: Math.floor(Date.now() / 1000),
  //     endAt: Math.floor(Date.now() / 1000 + 86400),
  //     checkNFT: 0,
  //   };
  //   await campaign.connect(owner).createCampaign(camapaignInfo, [10], [0]);

  //   await campaign.connect(owner).fundCampaign(0, poolAmount);

  //   let nonce = await campaign.getNonce();
  //   let signature = await generateSignature(
  //     acc1.address,
  //     nonce.toNumber(),
  //     owner
  //   );
  //   let claimInputMultiple = {
  //     taskIds: [[0, 1]],
  //     pointForMultiple: [],
  //     signature: signature,
  //     isValidUser: [0],
  //     tipToken: ["0x0000000000000000000000000000000000000000"],
  //     tipRecipient: ["0x0000000000000000000000000000000000000000"],
  //     tipAmount: [0],
  //   };
  //   await expect(
  //     campaign.connect(acc1).claimReward(claimInputMultiple, {
  //       value: bufferedFourDolla(),
  //     })
  //   ).to.be.revertedWithCustomError(campaign, "InsufficentChappy");
  // });

  // it("Insufficent fund", async function () {
  //   const {
  //     owner,
  //     acc1,
  //     acc2,
  //     acc3,
  //     origin,
  //     campaign,
  //     erc20Token,
  //     chappyToken,
  //     chappyNFT,
  //   } = await loadFixture(deployFixture);
  //   const poolAmount = 1000;
  //   await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let camapaignInfo = {
  //     rewardToken: erc20Token.address,
  //     collection: chappyNFT.address,
  //     minimumBalance: 1000,
  //     amount: 1000,
  //     startAt: Math.floor(Date.now() / 1000),
  //     endAt: Math.floor(Date.now() / 1000 + 86400),
  //     checkNFT: 0,
  //   };
  //   await campaign
  //     .connect(owner)
  //     .createCampaign(camapaignInfo, [10, 100], [0, 0]);

  //   await chappyToken.connect(owner).transfer(acc1.address, 100000);

  //   let nonce = await campaign.getNonce();
  //   let signature = await generateSignature(
  //     owner.address,
  //     nonce.toNumber(),
  //     owner
  //   );
  //   await campaign.connect(owner).withdrawFundCampaign(0, 900, signature);

  //   nonce = await campaign.getNonce();
  //   signature = await generateSignature(acc1.address, nonce.toNumber(), owner);
  //   let claimInputMultiple = {
  //     taskIds: [[0, 1]],
  //     pointForMultiple: [],
  //     signature: signature,
  //     isValidUser: [0],
  //     tipToken: ["0x0000000000000000000000000000000000000000"],
  //     tipRecipient: ["0x0000000000000000000000000000000000000000"],
  //     tipAmount: [0],
  //   };
  //   await expect(
  //     campaign.connect(acc1).claimReward(claimInputMultiple, {
  //       value: bufferedFourDolla(),
  //     })
  //   ).to.be.revertedWithCustomError(campaign, "InsufficentFund");
  // });

  // it("Unavailable campaign - early", async function () {
  //   const {
  //     owner,
  //     acc1,
  //     acc2,
  //     acc3,
  //     origin,
  //     campaign,
  //     erc20Token,
  //     chappyToken,
  //     chappyNFT,
  //   } = await loadFixture(deployFixture);
  //   const poolAmount = 1000;
  //   await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let camapaignInfo = {
  //     rewardToken: erc20Token.address,
  //     collection: chappyNFT.address,
  //     minimumBalance: 10,
  //     amount: 1000,
  //     startAt: Math.floor(Date.now() / 1000 + 1000),
  //     endAt: Math.floor(Date.now() / 1000 + 86400),
  //     checkNFT: 0,
  //   };
  //   await campaign
  //     .connect(owner)
  //     .createCampaign(camapaignInfo, [10, 100], [0, 0]);

  //   await campaign.connect(owner).fundCampaign(0, poolAmount);

  //   await chappyToken.connect(owner).transfer(acc1.address, 100000);

  //   let nonce = await campaign.getNonce();
  //   let signature = await generateSignature(
  //     acc1.address,
  //     nonce.toNumber(),
  //     owner
  //   );
  //   let claimInputMultiple = {
  //     taskIds: [[0, 1]],
  //     pointForMultiple: [],
  //     signature: signature,
  //     isValidUser: [0],
  //     tipToken: ["0x0000000000000000000000000000000000000000"],
  //     tipRecipient: ["0x0000000000000000000000000000000000000000"],
  //     tipAmount: [0],
  //   };
  //   await expect(
  //     campaign.connect(acc1).claimReward(claimInputMultiple)
  //   ).to.be.revertedWithCustomError(campaign, "UnavailableCampaign");
  // });

  // it("Unauthorized", async function () {
  //   const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyNFT } =
  //     await loadFixture(deployFixture);
  //   const poolAmount = 1000;
  //   await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let camapaignInfo = {
  //     rewardToken: erc20Token.address,
  //     collection: chappyNFT.address,
  //     minimumBalance: 10,
  //     amount: 1000,
  //     startAt: Math.floor(Date.now() / 1000 + 1000),
  //     endAt: Math.floor(Date.now() / 1000 + 86400),
  //     checkNFT: 0,
  //   };
  //   await expect(
  //     campaign.connect(acc1).createCampaign(camapaignInfo, [10, 100], [0, 0])
  //   ).to.be.revertedWithCustomError(campaign, "Unauthorized");
  // });

  // it("Owner fund", async function () {
  //   const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyNFT } =
  //     await loadFixture(deployFixture);
  //   const poolAmount = 1000;
  //   await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let camapaignInfo = {
  //     rewardToken: erc20Token.address,
  //     collection: chappyNFT.address,
  //     minimumBalance: 10,
  //     amount: 1000,
  //     startAt: Math.floor(Date.now() / 1000 + 1000),
  //     endAt: Math.floor(Date.now() / 1000 + 86400),
  //     checkNFT: 0,
  //   };
  //   await campaign
  //     .connect(owner)
  //     .createCampaign(camapaignInfo, [10, 100], [0, 0]);

  //   await expect(
  //     campaign.connect(acc1).fundCampaign(0, poolAmount)
  //   ).to.be.revertedWithCustomError(campaign, "Unauthorized");
  // });

  // it("Owner withdraw", async function () {
  //   const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyNFT } =
  //     await loadFixture(deployFixture);
  //   const poolAmount = 1000;
  //   await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let camapaignInfo = {
  //     rewardToken: erc20Token.address,
  //     collection: chappyNFT.address,
  //     minimumBalance: 10,
  //     amount: 1000,
  //     startAt: Math.floor(Date.now() / 1000 + 1000),
  //     endAt: Math.floor(Date.now() / 1000 + 86400),
  //     checkNFT: 0,
  //   };
  //   await campaign
  //     .connect(owner)
  //     .createCampaign(camapaignInfo, [10, 100], [0, 0]);

  //   await campaign.connect(owner).fundCampaign(0, poolAmount);
  //   let nonce = await campaign.getNonce();
  //   let signature = await generateSignature(
  //     acc1.address,
  //     nonce.toNumber(),
  //     owner
  //   );
  //   await expect(
  //     campaign.connect(acc1).withdrawFundCampaign(0, 890, signature)
  //   ).to.be.revertedWithCustomError(campaign, "Unauthorized");
  // });

  // it("Claim - have nft - require token", async function () {
  //   const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyNFT } =
  //     await loadFixture(deployFixture);
  //   const poolAmount = 1000;
  //   await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let camapaignInfo = {
  //     rewardToken: erc20Token.address,
  //     collection: chappyNFT.address,
  //     minimumBalance: 10,
  //     amount: 1000,
  //     startAt: Math.floor(Date.now() / 1000 + 1000),
  //     endAt: Math.floor(Date.now() / 1000 + 86400),
  //     checkNFT: 0,
  //   };
  //   await campaign
  //     .connect(owner)
  //     .createCampaign(camapaignInfo, [10, 100], [0, 0]);
  //   await chappyNFT.connect(owner).mintTo(acc1.address);
  //   await campaign.connect(owner).fundCampaign(0, poolAmount);
  //   let nonce = await campaign.getNonce();
  //   let signature = await generateSignature(
  //     acc1.address,
  //     nonce.toNumber(),
  //     owner
  //   );
  //   let claimInputMultiple = {
  //     taskIds: [[0, 1, 2]],
  //     pointForMultiple: [],
  //     signature: signature,
  //     isValidUser: [0],
  //     tipToken: ["0x0000000000000000000000000000000000000000"],
  //     tipRecipient: ["0x0000000000000000000000000000000000000000"],
  //     tipAmount: [0],
  //   };
  //   await expect(
  //     campaign.connect(acc1).claimReward(claimInputMultiple)
  //   ).to.be.revertedWithCustomError(campaign, "InsufficentChappy");
  // });

  // it("Claim - have token - require nft", async function () {
  //   const { owner, acc1, campaign, erc20Token, chappyToken, chappyNFT } =
  //     await loadFixture(deployFixture);
  //   const poolAmount = 1000;
  //   await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let camapaignInfo = {
  //     rewardToken: erc20Token.address,
  //     collection: chappyNFT.address,
  //     minimumBalance: 10,
  //     amount: 1000,
  //     startAt: Math.floor(Date.now() / 1000),
  //     endAt: Math.floor(Date.now() / 1000 + 86400),
  //     checkNFT: 1,
  //   };
  //   await campaign
  //     .connect(owner)
  //     .createCampaign(camapaignInfo, [10, 100], [0, 0]);
  //   await chappyToken.connect(owner).transfer(acc1.address, 100000);
  //   await campaign.connect(owner).fundCampaign(0, poolAmount);
  //   let nonce = await campaign.getNonce();
  //   let signature = await generateSignature(
  //     acc1.address,
  //     nonce.toNumber(),
  //     owner
  //   );
  //   let claimInputMultiple = {
  //     taskIds: [[0, 1]],
  //     pointForMultiple: [],
  //     signature: signature,
  //     isValidUser: [0],
  //     tipToken: ["0x0000000000000000000000000000000000000000"],
  //     tipRecipient: ["0x0000000000000000000000000000000000000000"],
  //     tipAmount: [0],
  //   };
  //   await expect(
  //     campaign.connect(acc1).claimReward(claimInputMultiple)
  //   ).to.be.revertedWithCustomError(campaign, "InsufficentChappyNFT");
  // });

  // it("Generate signature", async function () {
  //   // const iface = new ethers.utils.Interface(abi);
  //   // try {
  //   //   let x = iface.parseError("0x41e55b52");
  //   //   console.log(x);
  //   // } catch (error) {
  //   //   console.log(error);
  //   // }
  //   let owner = new ethers.Wallet(
  //     "82f2875d49e8c831c611db7b7203d5f2b6ae97f730486859fcc9babe1baa954d"
  //   );
  //   let signature = await generateSignature(
  //     "0xf07f07a2A7850b0501d8487Fd548883bC5476186",
  //     4,
  //     owner
  //   );
  //   console.log(signature);
  // });
});
