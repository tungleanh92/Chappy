const { ethers, upgrades } = require('hardhat')

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    const MockToken = await ethers.getContractFactory('Chappy')
    const erc20Token = await MockToken.deploy('Wrapped ETH', 'WETH')
    await erc20Token.deployed();
    console.log("MockToken deployed to:", erc20Token.address);
    await sleep(9000);
    await hre.run("verify:verify", {
        address: erc20Token.address,
        contract: "contracts/Chappy.sol:Chappy",
        constructorArguments: ['Wrapped ETH', 'WETH'],
    });

    const ChappyToken = await ethers.getContractFactory('Chappy')
    const chappyToken = await ChappyToken.deploy('Chappy', 'CHA')
    await chappyToken.deployed();
    console.log("ChappyToken deployed to:", chappyToken.address);
    await sleep(9000);
    await hre.run("verify:verify", {
        address: chappyToken.address,
        contract: "contracts/Chappy.sol:Chappy",
        constructorArguments: ['Chappy', 'CHA'],
    });

    const CampaignContract = await ethers.getContractFactory('Campaign')
    const Campaign = await upgrades.deployProxy(CampaignContract, [chappyToken.address, ['0xf705457121591e5a849cc1Ae2f0A1425547df65D']])
    await Campaign.deployed()
    console.log('Campaign deployed to:', Campaign.address)

    implAddress = await upgrades.erc1967.getImplementationAddress(
        Campaign.address,
    )
    console.log('implCampaign deployed to:', implAddress)
    await hre.run('verify:verify', {
        address: implAddress,
    })

    //upgrading

    // const SC_upgarde_master = await hre.ethers.getContractFactory("CollectionMaster");
    // const master_upgrade = await upgrades.upgradeProxy('0xA95141b613E1bAa653B56f1A00D77b42d51c84f4', SC_upgarde_master,{});
    // console.log("upgrades deployed to:", master_upgrade.address);

    // await hre.run('verify:verify', {
    //   address:  "0x5a3972c88612f4a220e85d040c911ae5e4bf99ae ",
    // })
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
