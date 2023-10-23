const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const { abi } = require("../artifacts/contracts/Campaign.sol/Campaign.json");
const {
  abi: abiErc20,
} = require("../artifacts/contracts/mocks/Chappy.sol/Chappy.json");
const {
  abi: abiNft,
} = require("../artifacts/contracts/mocks/ChappyNFT.sol/ChappyNFT.json");

const DEFAULT_ADDRESS = "0x0000000000000000000000000000000000000000";
const BUFFERED_FOUR_DOLLAR = "17000000000000000";

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
    };
  }

  async function generateSignature(sender, nonce, signer, data) {
    let message = ethers.utils.solidityKeccak256(
      ["uint72", "address", "bytes"],
      [nonce, sender, data]
    );
    let messageStringBytes = ethers.utils.arrayify(message);
    return await signer.signMessage(messageStringBytes);
  }

  // it("Check error", async function () {
  //   let nft_address = "0xd14dd51be76e6dc28756a442df786845e03a1d60";
  //   const provider = new ethers.providers.JsonRpcProvider(
  //     "https://api.zan.top/node/v1/eth/goerli/public"
  //   );
  //   const contract = new ethers.Contract(nft_address, abiErc20, provider);
  //   contractName = await contract.balanceOf(
  //     "0x6a4154fb217175B9490699B30231766D13B21058"
  //   );
  //   console.log(contractName);
  // });

  it("Check error", async function () {
    const iface = new ethers.utils.Interface(abi);
    let error = iface.parseError("0x41e55b52");
    console.log(error);
  });

  // it("Should revert if init again", async function () {
  //   const { acc1, acc3, campaign, chappyToken, cookieToken } =
  //     await loadFixture(deployFixture);
  //   await expect(
  //     campaign.initialize(
  //       owner.address,
  //       chappyToken.address,
  //       cookieToken.address,
  //       cut_receiver.address,
  //       [acc1.address, acc3.address],
  //       1000
  //     )
  //   ).to.be.revertedWith("Initializable: contract is already initialized");
  // });

  // it("Simulate", async function () {
  //   const { owner, acc1, campaign, cookieToken } = await loadFixture(
  //     deployFixture
  //   );

  //   let dataEncoded = ethers.utils.defaultAbiCoder.encode(
  //     ["address", "uint256", "uint32", "uint32", "uint8[]"],
  //     [
  //       cookieToken.address,
  //       1000,
  //       Math.floor(Date.now() / 1000),
  //       Math.floor(Date.now() / 1000 + 86400),
  //       [0],
  //     ]
  //   );

  //   const poolAmount = 1000;
  //   await cookieToken.connect(owner).approve(campaign.address, 10 * poolAmount);
  //   await campaign.connect(owner).createCampaign(dataEncoded);
  //   dataEncoded = ethers.utils.defaultAbiCoder.encode(
  //     [
  //       "uint24[][]",
  //       "uint256[]",
  //       "uint256",
  //       "address[]",
  //       "address[]",
  //       "uint256[]",
  //     ],
  //     [[[1]], [10], 10, [DEFAULT_ADDRESS], [DEFAULT_ADDRESS], ["0"]]
  //   );
  //   let nonce = await campaign.getNonce();
  //   let signature = await generateSignature(
  //     acc1.address,
  //     nonce.toNumber(),
  //     owner,
  //     dataEncoded
  //   );
  //   await campaign.connect(acc1).claimReward(dataEncoded, signature, {
  //     value: "10",
  //   });
  // });

  // it("Claim successful", async function () {
  //   const {
  //     owner,
  //     acc1,
  //     acc2,
  //     acc3,
  //     acc5,
  //     campaign,
  //     chappyToken,
  //     cut_receiver,
  //     cookieToken,
  //   } = await loadFixture(deployFixture);
  //   let camapaignInfo = {
  //     amount: 1000,
  //   };
  //   let dataEncodedNonETH = ethers.utils.defaultAbiCoder.encode(
  //     ["address", "uint256", "uint32", "uint32", "uint8[]"],
  //     [
  //       cookieToken.address,
  //       1000,
  //       Math.floor(Date.now() / 1000),
  //       Math.floor(Date.now() / 1000 + 86400),
  //       [1, 0], // 10, 100
  //     ]
  //   );
  //   let dataEncodedETH = ethers.utils.defaultAbiCoder.encode(
  //     ["address", "uint256", "uint32", "uint32", "uint8[]"],
  //     [
  //       DEFAULT_ADDRESS,
  //       1000,
  //       Math.floor(Date.now() / 1000),
  //       Math.floor(Date.now() / 1000 + 86400),
  //       [1, 1, 0], // 10, 100, 500
  //     ]
  //   );
  //   const poolAmount = 1000;
  //   await cookieToken.connect(owner).approve(campaign.address, 10 * poolAmount);
  //   await campaign.connect(owner).createCampaign(dataEncodedNonETH);

  //   await campaign.connect(owner).createCampaign(dataEncodedETH, {
  //     value: camapaignInfo.amount.toString(),
  //   });

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
  //   let dataEncodedClaim = ethers.utils.defaultAbiCoder.encode(
  //     [
  //       "uint24[][]",
  //       "uint256[]",
  //       "uint256",
  //       "address[]",
  //       "address[]",
  //       "uint256[]",
  //     ],
  //     [
  //       [[0, 1]],
  //       [110],
  //       BUFFERED_FOUR_DOLLAR,
  //       [DEFAULT_ADDRESS],
  //       [DEFAULT_ADDRESS],
  //       ["0"],
  //     ]
  //   );
  //   let nonce = await campaign.getNonce();
  //   let signature = await generateSignature(
  //     acc1.address,
  //     nonce.toNumber(),
  //     owner,
  //     dataEncodedClaim
  //   );
  //   await campaign.connect(acc1).claimReward(dataEncodedClaim, signature, {
  //     value: BUFFERED_FOUR_DOLLAR,
  //   });
  //   campaignInfo1 = await campaign.getCampaignInfo(0);
  //   expect(campaignInfo1.amount.toNumber()).to.be.equal(2700 - 10 - 100); // 2590
  //   expect(await cookieToken.balanceOf(acc1.address)).to.be.equal(110);

  //   cut_receiver_balance = await ethers.provider.getBalance(
  //     cut_receiver.address
  //   );
  //   campaign_balance = await ethers.provider.getBalance(campaign.address);
  //   expect(cut_receiver_balance).to.be.equal("10000017000000000000200");
  //   expect(campaign_balance).to.be.equal(1800); // 2*poolAmount - 10% 2*poolAmount

  //   dataEncodedClaim = ethers.utils.defaultAbiCoder.encode(
  //     [
  //       "uint24[][]",
  //       "uint256[]",
  //       "uint256",
  //       "address[]",
  //       "address[]",
  //       "uint256[]",
  //     ],
  //     [[[2, 3]], [110], "0", [DEFAULT_ADDRESS], [DEFAULT_ADDRESS], ["0"]]
  //   );
  //   nonce = await campaign.getNonce();
  //   signature = await generateSignature(
  //     acc2.address,
  //     nonce.toNumber(),
  //     owner,
  //     dataEncodedClaim
  //   );
  //   await campaign.connect(acc2).claimReward(dataEncodedClaim, signature);
  //   let campaignInfo2 = await campaign.getCampaignInfo(1);
  //   expect(campaignInfo2.amount.toNumber()).to.be.equal(1800 - 100 - 10);
  //   cut_receiver_balance = await ethers.provider.getBalance(
  //     cut_receiver.address
  //   );
  //   campaign_balance = await ethers.provider.getBalance(campaign.address);
  //   expect(cut_receiver_balance).to.be.equal("10000017000000000000200");
  //   expect(campaign_balance).to.be.equal(1800 - 100 - 10);

  //   // TODO: Claim multilevel multicampaign
  //   nonce = await campaign.getNonce();
  //   dataEncodedClaim = ethers.utils.defaultAbiCoder.encode(
  //     [
  //       "uint24[][]",
  //       "uint256[]",
  //       "uint256",
  //       "address[]",
  //       "address[]",
  //       "uint256[]",
  //     ],
  //     [
  //       [
  //         [0, 1],
  //         [3, 4],
  //       ],
  //       [110, 600],
  //       BUFFERED_FOUR_DOLLAR,
  //       [DEFAULT_ADDRESS],
  //       [acc5.address],
  //       [10],
  //     ]
  //   );
  //   signature = await generateSignature(
  //     acc3.address,
  //     nonce.toNumber(),
  //     owner,
  //     dataEncodedClaim
  //   );
  //   let acc3_balance = await ethers.provider.getBalance(acc3.address);
  //   expect(acc3_balance).to.be.equal("10000000000000000000000");
  //   await campaign.connect(acc3).claimReward(dataEncodedClaim, signature, {
  //     value: BUFFERED_FOUR_DOLLAR,
  //   });
  //   expect(await cookieToken.balanceOf(acc3.address)).to.be.equal(110);
  //   campaignInfo1 = await campaign.getCampaignInfo(0);
  //   expect(campaignInfo1.amount.toNumber()).to.be.equal(2700 - 10 - 100 - 110);
  //   campaignInfo2 = await campaign.getCampaignInfo(1);
  //   expect(campaignInfo2.amount.toNumber()).to.be.equal(
  //     1800 - 100 - 10 - 100 - 500
  //   );
  //   cut_receiver_balance = await ethers.provider.getBalance(
  //     cut_receiver.address
  //   );
  //   campaign_balance = await ethers.provider.getBalance(campaign.address);
  //   expect(cut_receiver_balance).to.be.equal("10000034000000000000200");
  //   tip_receiver_balance = await ethers.provider.getBalance(acc5.address);
  //   expect(tip_receiver_balance).to.be.equal("10000000000000000000010");

  //   // TODO: Claim multilevel multicampaign
  //   nonce = await campaign.getNonce();
  //   dataEncodedClaim = ethers.utils.defaultAbiCoder.encode(
  //     [
  //       "uint24[][]",
  //       "uint256[]",
  //       "uint256",
  //       "address[]",
  //       "address[]",
  //       "uint256[]",
  //     ],
  //     [
  //       [[0], [2, 3]],
  //       [10, 110],
  //       BUFFERED_FOUR_DOLLAR,
  //       [cookieToken.address],
  //       [acc5.address],
  //       [1],
  //     ]
  //   );
  //   signature = await generateSignature(
  //     acc3.address,
  //     nonce.toNumber(),
  //     owner,
  //     dataEncodedClaim
  //   );
  //   await campaign.connect(acc3).claimReward(dataEncodedClaim, signature, {
  //     value: BUFFERED_FOUR_DOLLAR,
  //   });
  //   expect(await cookieToken.balanceOf(acc3.address)).to.be.equal(110 + 9);
  //   campaignInfo1 = await campaign.getCampaignInfo(0);
  //   expect(campaignInfo1.amount.toNumber()).to.be.equal(
  //     2700 - 10 - 100 - 110 - 10
  //   );
  //   campaignInfo2 = await campaign.getCampaignInfo(1);
  //   expect(campaignInfo2.amount.toNumber()).to.be.equal(
  //     1800 - 100 - 10 - 100 - 500 - 110
  //   );
  //   cut_receiver_balance = await ethers.provider.getBalance(
  //     cut_receiver.address
  //   );
  //   expect(cut_receiver_balance).to.be.equal("10000051000000000000200");
  //   expect(await cookieToken.balanceOf(acc5.address)).to.be.equal(1);

  //   // TODO: Claim multilevel multicampaign
  //   nonce = await campaign.getNonce();
  //   dataEncodedClaim = ethers.utils.defaultAbiCoder.encode(
  //     [
  //       "uint24[][]",
  //       "uint256[]",
  //       "uint256",
  //       "address[]",
  //       "address[]",
  //       "uint256[]",
  //     ],
  //     [
  //       [[0], [2, 3]],
  //       [10, 110],
  //       BUFFERED_FOUR_DOLLAR,
  //       [cookieToken.address],
  //       [acc5.address],
  //       [1],
  //     ]
  //   );
  //   signature = await generateSignature(
  //     acc3.address,
  //     nonce.toNumber(),
  //     owner,
  //     dataEncodedClaim
  //   );
  //   await campaign.connect(acc3).claimMergeReward(dataEncodedClaim, signature, {
  //     value: BUFFERED_FOUR_DOLLAR,
  //   });
  //   expect(await cookieToken.balanceOf(acc3.address)).to.be.equal(110 + 9 + 9);
  //   campaignInfo1 = await campaign.getCampaignInfo(0);
  //   expect(campaignInfo1.amount.toNumber()).to.be.equal(
  //     2700 - 10 - 100 - 110 - 10 - 10
  //   );
  //   campaignInfo2 = await campaign.getCampaignInfo(1);
  //   expect(campaignInfo2.amount.toNumber()).to.be.equal(
  //     1800 - 100 - 10 - 100 - 500 - 110 - 110
  //   );
  //   cut_receiver_balance = await ethers.provider.getBalance(
  //     cut_receiver.address
  //   );
  //   expect(cut_receiver_balance).to.be.equal("10000068000000000000200");
  //   expect(await cookieToken.balanceOf(acc5.address)).to.be.equal(2);

  //   // TODO: Add task
  //   dataEncodedAddTask = ethers.utils.defaultAbiCoder.encode(
  //     ["uint24", "uint8[]"],
  //     [[0], [1]]
  //   );
  //   await campaign.connect(owner).addTasks(dataEncodedAddTask);

  //   // TODO: Claim multilevel multicampaign
  //   nonce = await campaign.getNonce();
  //   dataEncodedClaim = ethers.utils.defaultAbiCoder.encode(
  //     [
  //       "uint24[][]",
  //       "uint256[]",
  //       "uint256",
  //       "address[]",
  //       "address[]",
  //       "uint256[]",
  //     ],
  //     [
  //       [[0]],
  //       [10],
  //       BUFFERED_FOUR_DOLLAR,
  //       [DEFAULT_ADDRESS],
  //       [DEFAULT_ADDRESS],
  //       ["0"],
  //     ]
  //   );
  //   signature = await generateSignature(
  //     acc3.address,
  //     nonce.toNumber(),
  //     owner,
  //     dataEncodedClaim
  //   );
  //   await campaign.connect(acc3).claimReward(dataEncodedClaim, signature, {
  //     value: BUFFERED_FOUR_DOLLAR,
  //   });
  //   expect(await cookieToken.balanceOf(acc3.address)).to.be.equal(
  //     110 + 9 + 9 + 10
  //   );
  // });

  // it("Fake signature", async function () {
  //   const { owner, acc1, acc2, campaign, chappyToken } = await loadFixture(
  //     deployFixture
  //   );
  //   const poolAmount = 1000;
  //   await chappyToken.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let dataEncodedNonETH = ethers.utils.defaultAbiCoder.encode(
  //     ["address", "uint256", "uint32", "uint32", "uint8[]"],
  //     [
  //       chappyToken.address,
  //       1000,
  //       Math.floor(Date.now() / 1000),
  //       Math.floor(Date.now() / 1000 + 86400),
  //       [0],
  //     ]
  //   );
  //   await campaign.connect(owner).createCampaign(dataEncodedNonETH);

  //   await campaign.connect(owner).fundCampaign(0, poolAmount);

  //   await chappyToken.connect(owner).transfer(acc1.address, 100000);

  //   let nonce = await campaign.getNonce();
  //   let dataEncodedClaim = ethers.utils.defaultAbiCoder.encode(
  //     [
  //       "uint24[][]",
  //       "uint256[]",
  //       "uint256",
  //       "address[]",
  //       "address[]",
  //       "uint256[]",
  //     ],
  //     [[[0, 1]], [110], "0", [DEFAULT_ADDRESS], [DEFAULT_ADDRESS], ["0"]]
  //   );
  //   let signature = await generateSignature(
  //     acc1.address,
  //     nonce.toNumber(),
  //     owner,
  //     dataEncodedClaim
  //   );
  //   await campaign.connect(acc1).claimReward(dataEncodedClaim, signature);
  //   await expect(
  //     campaign.connect(acc1).claimReward(dataEncodedClaim, signature)
  //   ).to.be.revertedWithCustomError(campaign, "InvalidSignature");
  //   await expect(
  //     campaign.connect(acc2).claimReward(dataEncodedClaim, signature)
  //   ).to.be.revertedWithCustomError(campaign, "InvalidSignature");
  // });

  // it("Reclaim", async function () {
  //   const { owner, acc1, campaign, erc20Token, chappyToken } =
  //     await loadFixture(deployFixture);
  //   const poolAmount = 1000;
  //   await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let dataEncodedNonETH = ethers.utils.defaultAbiCoder.encode(
  //     ["address", "uint256", "uint32", "uint32", "uint8[]"],
  //     [erc20Token.address, 1000, Math.floor(Date.now() / 1000), 0, [0]]
  //   );
  //   await campaign.connect(owner).createCampaign(dataEncodedNonETH);

  //   await campaign.connect(owner).fundCampaign(0, poolAmount);

  //   await chappyToken.connect(owner).transfer(acc1.address, 100000);

  //   let nonce = await campaign.getNonce();
  //   let dataEncodedClaim = ethers.utils.defaultAbiCoder.encode(
  //     [
  //       "uint24[][]",
  //       "uint256[]",
  //       "uint256",
  //       "address[]",
  //       "address[]",
  //       "uint256[]",
  //     ],
  //     [[[0, 1]], [110], "0", [DEFAULT_ADDRESS], [DEFAULT_ADDRESS], ["0"]]
  //   );
  //   let signature = await generateSignature(
  //     acc1.address,
  //     nonce.toNumber(),
  //     owner,
  //     dataEncodedClaim
  //   );
  //   await campaign.connect(acc1).claimReward(dataEncodedClaim, signature);
  //   nonce = nonce.toNumber() + 1;
  //   dataEncodedClaim = ethers.utils.defaultAbiCoder.encode(
  //     [
  //       "uint24[][]",
  //       "uint256[]",
  //       "uint256",
  //       "address[]",
  //       "address[]",
  //       "uint256[]",
  //     ],
  //     [[[0, 1]], [110], "0", [DEFAULT_ADDRESS], [DEFAULT_ADDRESS], ["0"]]
  //   );
  //   signature = await generateSignature(
  //     acc1.address,
  //     nonce,
  //     owner,
  //     dataEncodedClaim
  //   );
  //   claimInputMultiple = {
  //     taskIds: [[0, 1]],
  //     pointForMultiple: [[]],
  //     signature: signature,
  //     isValidUser: [0],
  //     tipToken: [DEFAULT_ADDRESS],
  //     tipRecipient: [DEFAULT_ADDRESS],
  //     tipAmount: [0],
  //   };
  //   await expect(
  //     campaign.connect(acc1).claimReward(dataEncodedClaim, signature)
  //   ).to.be.revertedWithCustomError(campaign, "ClaimedTask");
  // });

  // it("Insufficent fund", async function () {
  //   const { owner, acc1, campaign, erc20Token } = await loadFixture(
  //     deployFixture
  //   );
  //   const poolAmount = 1000;
  //   await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let dataEncodedNonETH = ethers.utils.defaultAbiCoder.encode(
  //     ["address", "uint256", "uint32", "uint32", "uint8[]"],
  //     [
  //       erc20Token.address,
  //       1000,
  //       Math.floor(Date.now() / 1000),
  //       Math.floor(Date.now() / 1000 + 86400),
  //       [0],
  //     ]
  //   );
  //   await campaign.connect(owner).createCampaign(dataEncodedNonETH);

  //   await campaign.connect(owner).fundCampaign(0, poolAmount);

  //   let nonce = await campaign.getNonce();
  //   dataEncodedClaim = ethers.utils.defaultAbiCoder.encode(
  //     [
  //       "uint24[][]",
  //       "uint256[]",
  //       "uint256",
  //       "address[]",
  //       "address[]",
  //       "uint256[]",
  //     ],
  //     [
  //       [[0, 1]],
  //       [11000000],
  //       "17000000000000000",
  //       [DEFAULT_ADDRESS],
  //       [DEFAULT_ADDRESS],
  //       ["0"],
  //     ]
  //   );
  //   let signature = await generateSignature(
  //     acc1.address,
  //     nonce,
  //     owner,
  //     dataEncodedClaim
  //   );
  //   await expect(
  //     campaign.connect(acc1).claimReward(dataEncodedClaim, signature, {
  //       value: BUFFERED_FOUR_DOLLAR,
  //     })
  //   ).to.be.revertedWithCustomError(campaign, "InsufficentFund");
  // });

  // it("Unavailable campaign - early", async function () {
  //   const { owner, acc1, campaign, erc20Token, chappyToken } =
  //     await loadFixture(deployFixture);
  //   const poolAmount = 1000;
  //   await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let dataEncodedNonETH = ethers.utils.defaultAbiCoder.encode(
  //     ["address", "uint256", "uint32", "uint32", "uint8[]"],
  //     [
  //       erc20Token.address,
  //       1000,
  //       Math.floor(Date.now() / 1000 + 1000),
  //       Math.floor(Date.now() / 1000 + 86400),
  //       [0],
  //     ]
  //   );
  //   await campaign.connect(owner).createCampaign(dataEncodedNonETH);

  //   await campaign.connect(owner).fundCampaign(0, poolAmount);

  //   await chappyToken.connect(owner).transfer(acc1.address, 100000);

  //   let nonce = await campaign.getNonce();
  //   let dataEncodedClaim = ethers.utils.defaultAbiCoder.encode(
  //     [
  //       "uint24[][]",
  //       "uint256[]",
  //       "uint256",
  //       "address[]",
  //       "address[]",
  //       "uint256[]",
  //     ],
  //     [[[0, 1]], [110], "0", [DEFAULT_ADDRESS], [DEFAULT_ADDRESS], ["0"]]
  //   );
  //   let signature = await generateSignature(
  //     acc1.address,
  //     nonce,
  //     owner,
  //     dataEncodedClaim
  //   );
  //   await expect(
  //     campaign.connect(acc1).claimReward(dataEncodedClaim, signature)
  //   ).to.be.revertedWithCustomError(campaign, "UnavailableCampaign");
  // });

  // it("Operator", async function () {
  //   const { owner, acc1, campaign, acc2 } = await loadFixture(deployFixture);
  //   await campaign.connect(owner).addOperator(acc1.address);
  //   await campaign.connect(acc1).changeAdmins([acc2.address]);
  //   await campaign.connect(owner).removeOperator(acc1.address);
  //   await expect(
  //     campaign.connect(acc1).changeAdmins([acc2.address])
  //   ).to.be.revertedWithCustomError(campaign, "Unauthorized");
  // });

  // it("Unauthorized", async function () {
  //   const { owner, acc1, campaign, erc20Token } = await loadFixture(
  //     deployFixture
  //   );
  //   const poolAmount = 1000;
  //   await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let dataEncodedNonETH = ethers.utils.defaultAbiCoder.encode(
  //     ["address", "uint256", "uint32", "uint32", "uint8[]"],
  //     [
  //       erc20Token.address,
  //       1000,
  //       Math.floor(Date.now() / 1000 + 1000),
  //       Math.floor(Date.now() / 1000 + 86400),
  //       [0],
  //     ]
  //   );
  //   await expect(
  //     campaign.connect(acc1).createCampaign(dataEncodedNonETH)
  //   ).to.be.revertedWithCustomError(campaign, "Unauthorized");
  // });

  // it("Owner deposit", async function () {
  //   const { owner, acc1, campaign, erc20Token } = await loadFixture(
  //     deployFixture
  //   );
  //   const poolAmount = 1000;
  //   await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let dataEncodedNonETH = ethers.utils.defaultAbiCoder.encode(
  //     ["address", "uint256", "uint32", "uint32", "uint8[]"],
  //     [
  //       erc20Token.address,
  //       1000,
  //       Math.floor(Date.now() / 1000 + 1000),
  //       Math.floor(Date.now() / 1000 + 86400),
  //       [0],
  //     ]
  //   );
  //   await campaign.connect(owner).createCampaign(dataEncodedNonETH);

  //   await expect(
  //     campaign.connect(acc1).fundCampaign(0, poolAmount)
  //   ).to.be.revertedWithCustomError(campaign, "Unauthorized");
  // });

  // it("Owner withdraw", async function () {
  //   const { owner, acc1, campaign, erc20Token } = await loadFixture(
  //     deployFixture
  //   );
  //   const poolAmount = 1000;
  //   await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount);
  //   let dataEncodedNonETH = ethers.utils.defaultAbiCoder.encode(
  //     ["address", "uint256", "uint32", "uint32", "uint8[]"],
  //     [
  //       erc20Token.address,
  //       1000,
  //       Math.floor(Date.now() / 1000 + 1000),
  //       Math.floor(Date.now() / 1000 + 86400),
  //       [0],
  //     ]
  //   );
  //   await campaign.connect(owner).createCampaign(dataEncodedNonETH);

  //   await campaign.connect(owner).fundCampaign(0, poolAmount);
  //   let nonce = await campaign.getNonce();
  //   let dataEncodedWithdraw = ethers.utils.defaultAbiCoder.encode(
  //     ["uint24", "uint256"],
  //     [0, "890"]
  //   );
  //   let signature = await generateSignature(
  //     acc1.address,
  //     nonce.toNumber(),
  //     owner,
  //     dataEncodedWithdraw
  //   );
  //   await expect(
  //     campaign
  //       .connect(acc1)
  //       .withdrawFundCampaign(dataEncodedWithdraw, signature)
  //   ).to.be.revertedWithCustomError(campaign, "Unauthorized");
  // });
});
