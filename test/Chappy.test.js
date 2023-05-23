const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Campaign contract", function () {
    async function deployFixture() {
        [owner, acc1, acc2, acc3, acc4, acc5, treasury, cut_receiver] = await ethers.getSigners()

        const MockToken = await ethers.getContractFactory('Chappy')
        const erc20Token = await MockToken.deploy('Wrapped ETH', 'WETH')

        const ChappyToken = await ethers.getContractFactory('Chappy')
        const chappyToken = await ChappyToken.deploy('Chappy', 'CHA')

        const ChappyNFT = await ethers.getContractFactory('ChappyNFT')
        const chappyNFT = await ChappyNFT.deploy()

        const Campaign = await ethers.getContractFactory('Campaign')
        const campaign = await upgrades.deployProxy(Campaign, [chappyToken.address, treasury.address, cut_receiver.address, [owner.address, acc3.address], 1000], {
            initializer: 'initialize',
        })

        return {
            owner,
            acc1,
            acc2,
            acc3,
            acc4,
            acc5,
            treasury,
            cut_receiver,
            campaign,
            erc20Token,
            chappyToken,
            chappyNFT
        }
    }

    async function generateSignature(sender, nonce, signer) {
        let message = ethers.utils.solidityKeccak256(
            ["uint72", "address"],
            [nonce, sender]
        );
        let messageStringBytes = ethers.utils.arrayify(message)
        return await signer.signMessage(messageStringBytes);
    }

    it('Should revert if init again', async function () {
        const { acc1, acc3, treasury, campaign, chappyNFT, chappyToken, cut_receiver } = await loadFixture(deployFixture);
        await expect(campaign.initialize(chappyToken.address, treasury.address, cut_receiver.address, [acc1.address, acc3.address], 1000)).to.be.revertedWith(
            'Initializable: contract is already initialized',
        )
    })

    it('Happy case', async function () {
        const { owner, acc1, acc2, acc3, acc4, acc5, origin, campaign, erc20Token, chappyToken, chappyNFT } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 10 * poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, chappyNFT.address, 10, 1000, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), 0, [10, 100])
        await campaign.connect(owner).createCampaign(erc20Token.address, chappyNFT.address, 10, 1000, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), 0, [10, 100, 10])

        await campaign.connect(owner).fundCampaign(0, 2 * poolAmount)
        await campaign.connect(owner).fundCampaign(1, poolAmount)

        let campaignInfo1 = await campaign.getCampaignInfo(0);
        expect(campaignInfo1.rewardToken).to.be.equal(erc20Token.address)
        expect(campaignInfo1.amount.toNumber()).to.be.equal(2700) // 3*poolAmount - 10% 3*poolAmount

        await chappyToken.connect(owner).transfer(acc1.address, 100000)
        await chappyToken.connect(owner).transfer(acc2.address, 100000)
        await erc20Token.connect(owner).transfer(acc2.address, 100000)

        let nonce = await campaign.getNonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await campaign.connect(acc1).claimReward([[0, 1]], signature, [0])

        campaignInfo1 = await campaign.getCampaignInfo(0);
        expect(campaignInfo1.amount.toNumber()).to.be.equal(2700 - 100 - 10)
        expect(await erc20Token.balanceOf(acc1.address)).to.be.equal(110)
        expect(await erc20Token.balanceOf(campaign.address)).to.be.equal(4500 - 100 - 10) // 5*poolAmount - 10% 5*poolAmount

        let campaignInfo2 = await campaign.getCampaignInfo(1);
        expect(campaignInfo2.rewardToken).to.be.equal(erc20Token.address)
        expect(campaignInfo2.amount.toNumber()).to.be.equal(1800) // 2*poolAmount - 10% 2*poolAmount

        nonce = await campaign.getNonce();
        signature = await generateSignature(owner.address, nonce.toNumber(), owner)
        await campaign.connect(owner).withdrawFundCampaign(0, 590, signature);
        campaignInfo1 = await campaign.getCampaignInfo(0);
        expect(campaignInfo1.amount.toNumber()).to.be.equal(2000)

        await campaign.connect(owner).changeAdmins([acc2.address])

        // NFT case
        await erc20Token.connect(acc2).approve(campaign.address, 3 * poolAmount)
        await campaign.connect(acc2).createCampaign(erc20Token.address, chappyNFT.address, 10, 1000, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), 1, [6, 7, 8])

        await campaign.connect(owner).changeCutReceiver(acc5.address)
        await campaign.connect(owner).changeSharePercent(100)
        await campaign.connect(acc2).fundCampaign(2, 2 * poolAmount)
        expect(await erc20Token.balanceOf(acc5.address)).to.be.equal(20)

        let campaignInfo3 = await campaign.getCampaignInfo(2);
        expect(campaignInfo3.checkNFT).to.be.equal(1)
        await chappyNFT.connect(owner).mintTo(acc3.address)
        nonce = await campaign.getNonce();
        signature = await generateSignature(acc3.address, nonce.toNumber(), owner)
        await campaign.connect(acc3).claimReward([[5, 6, 7]], signature, [0])
        expect(await erc20Token.balanceOf(acc3.address)).to.be.equal(21)

        // claim multiple
        await chappyToken.connect(owner).transfer(acc4.address, 100000)
        await chappyNFT.connect(owner).mintTo(acc4.address)
        nonce = await campaign.getNonce();
        signature = await generateSignature(acc4.address, nonce.toNumber(), owner)
        await campaign.connect(acc4).claimReward([[0, 1], [2, 3], [5]], signature, [0, 0, 0])
        expect(await erc20Token.balanceOf(acc4.address)).to.be.equal(226)

        // claim multiple
        nonce = await campaign.getNonce();
        signature = await generateSignature(acc5.address, nonce.toNumber(), owner)
        await campaign.connect(acc5).claimReward([[0, 1], [2, 3], [5]], signature, [1, 1, 1])
        expect(await erc20Token.balanceOf(acc5.address)).to.be.equal(226 + 20)
    })

    it('Happy case - eth case', async function () {
        const { owner, acc1, acc2, acc3, acc4, acc5, origin, campaign, erc20Token, chappyToken, chappyNFT, treasury, cut_receiver } = await loadFixture(deployFixture);
        const poolAmount = "1000"
        let defaut_treasury_balance = await ethers.provider.getBalance(treasury.address);
        let balance_treasury
        await campaign.connect(owner).createCampaign("0x0000000000000000000000000000000000000000", chappyNFT.address, 10, ethers.utils.parseEther(poolAmount), Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), 0, [ethers.utils.parseEther("100")], {
            value: ethers.utils.parseEther(poolAmount)
        })
        await campaign.connect(owner).createCampaign("0x0000000000000000000000000000000000000000", chappyNFT.address, 10, ethers.utils.parseEther(poolAmount), Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), 0, [ethers.utils.parseEther("10"), ethers.utils.parseEther("100"), ethers.utils.parseEther("10")], {
            value: ethers.utils.parseEther(poolAmount)
        })

        await campaign.connect(owner).fundCampaign(0, ethers.utils.parseEther((parseInt(poolAmount) * 2).toString()), {
            value: ethers.utils.parseEther((parseInt(poolAmount) * 2).toString())
        })
        await campaign.connect(owner).fundCampaign(1, ethers.utils.parseEther(poolAmount), {
            value: ethers.utils.parseEther(poolAmount)
        })

        let campaignInfo1 = await campaign.getCampaignInfo(0);
        expect(campaignInfo1.amount.toString()).to.be.equal(ethers.utils.parseEther("2700").toString()) // 3*poolAmount - 10% 3*poolAmount
        balance_treasury = await ethers.provider.getBalance(treasury.address);
        expect(balance_treasury.sub(defaut_treasury_balance).toString()).to.be.equal(ethers.utils.parseEther("4500").toString()) // 5*poolAmount - 10% 5*poolAmount
        balance_treasury = await ethers.provider.getBalance(cut_receiver.address);
        expect(balance_treasury.sub(defaut_treasury_balance).toString()).to.be.equal(ethers.utils.parseEther("500").toString())

        let nonce = await campaign.getNonce();
        let signature = await generateSignature(treasury.address, nonce.toNumber(), owner)
        await campaign.connect(treasury).claimRewardFromTreasury([[0]], signature, acc1.address, [1], {
            value: ethers.utils.parseEther(poolAmount)
        })

        campaignInfo1 = await campaign.getCampaignInfo(0);
        expect(campaignInfo1.amount.toString()).to.be.equal(ethers.utils.parseEther("2600").toString())
        balance_treasury = await ethers.provider.getBalance(acc1.address);
        expect(balance_treasury.sub(defaut_treasury_balance).toString()).to.be.equal(ethers.utils.parseEther("1000").toString())

        let campaignInfo2 = await campaign.getCampaignInfo(1);
        expect(campaignInfo2.amount.toString()).to.be.equal(ethers.utils.parseEther("1800").toString()) // 2*poolAmount - 10% 2*poolAmount

        nonce = await campaign.getNonce();
        signature = await generateSignature(treasury.address, nonce.toNumber(), owner)
        await campaign.connect(treasury).withdrawFundCampaign(0, ethers.utils.parseEther("600"), signature, {
            value: ethers.utils.parseEther("600")
        });
        campaignInfo1 = await campaign.getCampaignInfo(0);
        expect(campaignInfo1.amount.toString()).to.be.equal(ethers.utils.parseEther("2000"))
    })

    it('Fake signature', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyToken, chappyNFT } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, chappyNFT.address, 10, 1000, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), 0, [10, 100])

        await campaign.connect(owner).fundCampaign(0, poolAmount)

        await chappyToken.connect(owner).transfer(acc1.address, 100000)

        let nonce = await campaign.getNonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await campaign.connect(acc1).claimReward([[0, 1]], signature, [0])
        await expect(campaign.connect(acc1).claimReward([[0, 1]], signature, [0])).to.be.revertedWithCustomError(campaign, "InvalidSignature")
        await expect(campaign.connect(acc2).claimReward([[0, 1]], signature, [0])).to.be.revertedWithCustomError(campaign, "InvalidSignature")
        await expect(campaign.connect(owner).withdrawFundCampaign(0, 890, signature)).to.be.revertedWithCustomError(campaign, "InvalidSignature")
    })

    it('Reclaim', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyToken, chappyNFT } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, chappyNFT.address, 10, 1000, Math.floor(Date.now() / 1000), 0, 0, [10, 100])

        await campaign.connect(owner).fundCampaign(0, poolAmount)

        await chappyToken.connect(owner).transfer(acc1.address, 100000)

        let nonce = await campaign.getNonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await campaign.connect(acc1).claimReward([[0, 1]], signature, [0])
        nonce = nonce.toNumber() + 1
        signature = await generateSignature(acc1.address, nonce, owner)
        await expect(campaign.connect(acc1).claimReward([[0, 1]], signature, [0])).to.be.revertedWithCustomError(campaign, "ClaimedTask")
    })

    it('Insufficent chappy', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyNFT } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, chappyNFT.address, 10, 1000, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), 0, [10, 100])

        await campaign.connect(owner).fundCampaign(0, poolAmount)

        let nonce = await campaign.getNonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await expect(campaign.connect(acc1).claimReward([[0, 1]], signature, [0])).to.be.revertedWithCustomError(campaign, "InsufficentChappy")
    })

    it('Insufficent fund', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyToken, chappyNFT } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, chappyNFT.address, 1000, 1000, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), 0, [10, 100])

        await chappyToken.connect(owner).transfer(acc1.address, 100000)

        let nonce = await campaign.getNonce();
        let signature = await generateSignature(owner.address, nonce.toNumber(), owner)
        await campaign.connect(owner).withdrawFundCampaign(0, 900, signature);

        nonce = await campaign.getNonce();
        signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await expect(campaign.connect(acc1).claimReward([[0, 1]], signature, [0])).to.be.revertedWithCustomError(campaign, "InsufficentFund")
    })

    it('Unavailable campaign - early', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyToken, chappyNFT } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, chappyNFT.address, 10, 1000, Math.floor(Date.now() / 1000 + 1000), Math.floor(Date.now() / 1000 + 86400), 0, [10, 100])

        await campaign.connect(owner).fundCampaign(0, poolAmount)

        await chappyToken.connect(owner).transfer(acc1.address, 100000)

        let nonce = await campaign.getNonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await expect(campaign.connect(acc1).claimReward([[0, 1]], signature, [0])).to.be.revertedWithCustomError(campaign, "UnavailableCampaign")
    })

    it('Unauthorized', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyNFT } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount)
        await expect(campaign.connect(acc1).createCampaign(erc20Token.address, chappyNFT.address, 10, 1000, Math.floor(Date.now() / 1000 + 1000), Math.floor(Date.now() / 1000 + 86400), 0, [10, 100])).to.be.revertedWithCustomError(campaign, "Unauthorized")
    })

    it('Owner fund', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyNFT } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, chappyNFT.address, 10, 1000, Math.floor(Date.now() / 1000 + 1000), Math.floor(Date.now() / 1000 + 86400), 0, [10, 100])

        await expect(campaign.connect(acc1).fundCampaign(0, poolAmount)).to.be.revertedWithCustomError(campaign, "Unauthorized")
    })

    it('Owner withdraw', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyNFT } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, chappyNFT.address, 10, 1000, Math.floor(Date.now() / 1000 + 1000), Math.floor(Date.now() / 1000 + 86400), 0, [10, 100])

        await campaign.connect(owner).fundCampaign(0, poolAmount)
        let nonce = await campaign.getNonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await expect(campaign.connect(acc1).withdrawFundCampaign(0, 890, signature)).to.be.revertedWithCustomError(campaign, "Unauthorized")
    })

    it('Claim - have nft - require token', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyNFT } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, chappyNFT.address, 10, 1000, Math.floor(Date.now() / 1000 + 1000), Math.floor(Date.now() / 1000 + 86400), 0, [10, 100])
        await chappyNFT.connect(owner).mintTo(acc1.address)
        await campaign.connect(owner).fundCampaign(0, poolAmount)
        let nonce = await campaign.getNonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await expect(campaign.connect(acc1).claimReward([[0, 1, 2]], signature, [0])).to.be.revertedWithCustomError(campaign, "InsufficentChappy")
    })

    it('Claim - have token - require nft', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyToken, chappyNFT } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2 * poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, chappyNFT.address, 10, 1000, Math.floor(Date.now() / 1000 + 1000), Math.floor(Date.now() / 1000 + 86400), 1, [10, 100])
        await chappyToken.connect(owner).transfer(acc1.address, 100000)
        await campaign.connect(owner).fundCampaign(0, poolAmount)
        let nonce = await campaign.getNonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await expect(campaign.connect(acc1).claimReward([[0, 1, 2]], signature, [0])).to.be.revertedWithCustomError(campaign, "InsufficentChappyNFT")
    })

    it('Generate signature', async function () {
        let owner = new ethers.Wallet('82f2875d49e8c831c611db7b7203d5f2b6ae97f730486859fcc9babe1baa954d')
        let signature = await generateSignature('0x554a0c1f9C1E7160FE716DC793716001b12c9061', 1, owner)
        console.log(signature);
    })
});