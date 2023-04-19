const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Campaign contract", function () {
    async function deployFixture() {
        [owner, acc1, acc2, acc3] = await ethers.getSigners()

        const MockToken = await ethers.getContractFactory('Chappy')
        const erc20Token = await MockToken.deploy('Wrapped ETH', 'WETH')

        const ChappyToken = await ethers.getContractFactory('Chappy')
        const chappyToken = await ChappyToken.deploy('Chappy', 'CHA')

        const Campaign = await ethers.getContractFactory('Campaign')
        const campaign = await upgrades.deployProxy(Campaign, [chappyToken.address, [owner.address, acc3.address]], {
            initializer: 'initialize',
        })

        return {
            owner,
            acc1,
            acc2,
            acc3,
            campaign,
            erc20Token,
            chappyToken
        }
    }

    async function generateSignature(sender, nonce, signer) {
        let message = ethers.utils.solidityKeccak256(
            ["uint256", "address"],
            [nonce, sender]
        );
        let messageStringBytes = ethers.utils.arrayify(message)
        return await signer.signMessage(messageStringBytes);
    }

    it('Should revert if init again', async function () {
        const { acc1, acc3, campaign } = await loadFixture(deployFixture);
        await expect(campaign.initialize(acc1.address, [acc1.address, acc3.address])).to.be.revertedWith(
            'Initializable: contract is already initialized',
        )
    })

    it('Happy case', async function () {
        const { owner, acc1, acc2, admin1, origin, campaign, erc20Token, chappyToken } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2*poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, 10, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), [10, 100])
        await campaign.connect(owner).createCampaign(erc20Token.address, 10, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), [10, 100, 10])

        await campaign.connect(owner).fundCampaign(0, poolAmount)
        await campaign.connect(owner).fundCampaign(1, poolAmount)

        expect(await campaign.taskToAmountReward(0)).to.be.equal(10)
        expect(await campaign.taskToAmountReward(1)).to.be.equal(100)
        expect(await campaign.taskToAmountReward(2)).to.be.equal(10)
        expect(await campaign.taskToAmountReward(3)).to.be.equal(100)
        expect(await campaign.taskToAmountReward(4)).to.be.equal(10)
        let campaignInfo1 = await campaign.campaignInfos(0);
        expect(campaignInfo1.token).to.be.equal(erc20Token.address)
        expect(campaignInfo1.amount.toNumber()).to.be.equal(poolAmount)
        expect(await campaign.taskToCampaignId(0)).to.be.equal(0)
        expect(await campaign.taskToCampaignId(1)).to.be.equal(0)
        expect(await campaign.claimedTasks(0, acc1.address)).to.be.equal(false)
        expect(await campaign.claimedTasks(1, acc1.address)).to.be.equal(false)

        let campaignInfo2 = await campaign.campaignInfos(0);
        expect(campaignInfo2.token).to.be.equal(erc20Token.address)
        expect(campaignInfo2.amount.toNumber()).to.be.equal(poolAmount)
        expect(await campaign.taskToCampaignId(2)).to.be.equal(1)
        expect(await campaign.taskToCampaignId(3)).to.be.equal(1)
        expect(await campaign.taskToCampaignId(4)).to.be.equal(1)
        expect(await campaign.claimedTasks(2, acc1.address)).to.be.equal(false)
        expect(await campaign.claimedTasks(3, acc1.address)).to.be.equal(false)
        expect(await campaign.claimedTasks(4, acc1.address)).to.be.equal(false)

        await chappyToken.connect(owner).transfer(acc1.address, 100000)
        await chappyToken.connect(owner).transfer(acc2.address, 100000)

        let nonce = await campaign.nonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await campaign.connect(acc1).claimReward(0, [0, 1], signature)

        campaignInfo1 = await campaign.campaignInfos(0);
        expect(campaignInfo1.amount.toNumber()).to.be.equal(poolAmount - 100 - 10)
        expect(await erc20Token.balanceOf(acc1.address)).to.be.equal(110)
        expect(await campaign.claimedTasks(0, acc1.address)).to.be.equal(true)
        expect(await campaign.claimedTasks(1, acc1.address)).to.be.equal(true)
        expect(await erc20Token.balanceOf(campaign.address)).to.be.equal(2*poolAmount - 100 - 10)
        
        campaignInfo2 = await campaign.campaignInfos(1);
        expect(campaignInfo2.token).to.be.equal(erc20Token.address)
        expect(campaignInfo2.amount.toNumber()).to.be.equal(poolAmount)
        expect(await campaign.taskToCampaignId(2)).to.be.equal(1)
        expect(await campaign.taskToCampaignId(3)).to.be.equal(1)
        expect(await campaign.taskToCampaignId(4)).to.be.equal(1)
        expect(await campaign.claimedTasks(2, acc1.address)).to.be.equal(false)
        expect(await campaign.claimedTasks(3, acc1.address)).to.be.equal(false)
        expect(await campaign.claimedTasks(4, acc1.address)).to.be.equal(false)

        nonce = await campaign.nonce();
        signature = await generateSignature(owner.address, nonce.toNumber(), owner)
        await campaign.connect(owner).withdrawFundCampaign(0, 890, signature);
        campaignInfo1 = await campaign.campaignInfos(0);
        expect(campaignInfo1.amount.toNumber()).to.be.equal(0)

        await campaign.connect(owner).changeAdmins([acc2.address])
        await campaign.connect(acc2).createCampaign(erc20Token.address, 10, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), [10, 100, 10])
    })

    it('Fake signature', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyToken } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2*poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, 10, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), [10, 100])

        await campaign.connect(owner).fundCampaign(0, poolAmount)

        await chappyToken.connect(owner).transfer(acc1.address, 100000)

        let nonce = await campaign.nonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await campaign.connect(acc1).claimReward(0, [0, 1], signature)
        await expect(campaign.connect(acc1).claimReward(0, [0, 1], signature)).to.be.revertedWithCustomError(campaign, "InvalidSignature")
        await expect(campaign.connect(acc2).claimReward(0, [0, 1], signature)).to.be.revertedWithCustomError(campaign, "InvalidSignature")
        await expect(campaign.connect(owner).withdrawFundCampaign(0, 890, signature)).to.be.revertedWithCustomError(campaign, "InvalidSignature")
    })

    it('Reclaim', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyToken } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2*poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, 10, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), [10, 100])

        await campaign.connect(owner).fundCampaign(0, poolAmount)

        await chappyToken.connect(owner).transfer(acc1.address, 100000)

        let nonce = await campaign.nonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await campaign.connect(acc1).claimReward(0, [0, 1], signature)
        nonce = nonce.toNumber() + 1
        signature = await generateSignature(acc1.address, nonce, owner)
        await expect(campaign.connect(acc1).claimReward(0, [0, 1], signature)).to.be.revertedWithCustomError(campaign, "ClaimedTask")
    })

    it('Insufficent chappy', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyToken } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2*poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, 10, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), [10, 100])

        await campaign.connect(owner).fundCampaign(0, poolAmount)

        let nonce = await campaign.nonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await expect(campaign.connect(acc1).claimReward(0, [0, 1], signature)).to.be.revertedWithCustomError(campaign, "InsufficentChappy")
    })

    it('Insufficent fund', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyToken } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2*poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, 10, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), [10, 100])

        await chappyToken.connect(owner).transfer(acc1.address, 100000)

        let nonce = await campaign.nonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await expect(campaign.connect(acc1).claimReward(0, [0, 1], signature)).to.be.revertedWithCustomError(campaign, "InsufficentFund")
    })

    it('Unavailable campaign - late', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyToken } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2*poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, 10, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000 + 86400), [10, 100])

        await campaign.connect(owner).fundCampaign(0, poolAmount)

        await chappyToken.connect(owner).transfer(acc1.address, 100000)

        await time.increaseTo(Math.floor(Date.now() / 1000 + 86400*2))
        let nonce = await campaign.nonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await expect(campaign.connect(acc1).claimReward(0, [0, 1], signature)).to.be.revertedWithCustomError(campaign, "UnavailableCampaign")
    })

    it('Unavailable campaign - early', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyToken } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2*poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, 10, Math.floor(Date.now() / 1000 + 1000), Math.floor(Date.now() / 1000 + 86400), [10, 100])

        await campaign.connect(owner).fundCampaign(0, poolAmount)

        await chappyToken.connect(owner).transfer(acc1.address, 100000)

        let nonce = await campaign.nonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), owner)
        await expect(campaign.connect(acc1).claimReward(0, [0, 1], signature)).to.be.revertedWithCustomError(campaign, "UnavailableCampaign")
    })

    it('Unauthorized', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyToken } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2*poolAmount)
        await expect(campaign.connect(acc1).createCampaign(erc20Token.address, 10, Math.floor(Date.now() / 1000 + 1000), Math.floor(Date.now() / 1000 + 86400), [10, 100])).to.be.revertedWithCustomError(campaign, "Unauthorized")
    })

    it('Admin fund', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyToken } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2*poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, 10, Math.floor(Date.now() / 1000 + 1000), Math.floor(Date.now() / 1000 + 86400), [10, 100])

        await expect(campaign.connect(acc1).fundCampaign(0, poolAmount)).to.be.revertedWith("Ownable: caller is not the owner")
    })

    it('Admin withdraw', async function () {
        const { owner, acc1, acc2, acc3, origin, campaign, erc20Token, chappyToken } = await loadFixture(deployFixture);
        const poolAmount = 1000
        await erc20Token.connect(owner).approve(campaign.address, 2*poolAmount)
        await campaign.connect(owner).createCampaign(erc20Token.address, 10, Math.floor(Date.now() / 1000 + 1000), Math.floor(Date.now() / 1000 + 86400), [10, 100])

        await campaign.connect(owner).fundCampaign(0, poolAmount)
        let nonce = await campaign.nonce();
        let signature = await generateSignature(acc1.address, nonce.toNumber(), acc1)
        await expect(campaign.connect(acc1).withdrawFundCampaign(0, 890, signature)).to.be.revertedWith("Ownable: caller is not the owner")
    })
});