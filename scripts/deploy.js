const { ethers, upgrades } = require('hardhat')

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    // const MockToken = await ethers.getContractFactory('Chappy')
    // const erc20Token = await MockToken.deploy('Wrapped ETH', 'WETH')
    // await erc20Token.deployed();
    // console.log("MockToken deployed to:", erc20Token.address);
    // await sleep(9000);
    // await hre.run("verify:verify", {
    //     address: erc20Token.address,
    //     contract: "contracts/Chappy.sol:Chappy",
    //     constructorArguments: ['Wrapped ETH', 'WETH'],
    // });

    // const ChappyToken = await ethers.getContractFactory('Chappy')
    // const chappyToken = await ChappyToken.deploy('Chappy', 'CHA')
    // await chappyToken.deployed();
    // console.log("ChappyToken deployed to:", chappyToken.address);
    // await sleep(9000);
    // await hre.run("verify:verify", {
    //     address: chappyToken.address,
    //     contract: "contracts/Chappy.sol:Chappy",
    //     constructorArguments: ['Chappy', 'CHA'],
    // });

    // const ChappyNFT = await ethers.getContractFactory('ChappyNFT')
    // const chappyNFT = await ChappyNFT.deploy()
    // await chappyNFT.deployed();
    // console.log("ChappyToken deployed to:", chappyNFT.address);
    // await sleep(9000);
    // await hre.run("verify:verify", {
    //     address: chappyNFT.address,
    //     contract: "contracts/ChappyNFT.sol:ChappyNFT",
    // });

    const CampaignContract = await ethers.getContractFactory('Campaign')
    const Campaign = await upgrades.deployProxy(CampaignContract, ['0x930AfCaFF099647FEd7c6399F6E03e8E9feecb47', '0xAd7D361c09c96Dbc960F9493363cC08300b41a3B', ['0xf705457121591e5a849cc1Ae2f0A1425547df65D']])
    await Campaign.deployed()
    console.log('Campaign deployed to:', Campaign.address)

    implAddress = await upgrades.erc1967.getImplementationAddress(
        Campaign.address,
    )
    console.log('implCampaign deployed to:', implAddress)
    await hre.run('verify:verify', {
        address: implAddress,
    })
    
    // Campaign deployed to: 0x69446A1220a4D97Ae7A8fe77777017DEa6425ffb
    // implCampaign deployed to: 0x84cC77C56E632924d7870F1dDc0b21027b6373f2

    // //upgrading
    // const SC_upgarde_master = await ethers.getContractFactory("Campaign");
    // const master_upgrade = await upgrades.upgradeProxy('0x69446A1220a4D97Ae7A8fe77777017DEa6425ffb', SC_upgarde_master,{});
    // console.log("upgrades deployed to:", master_upgrade.address);

    // await hre.run('verify:verify', {
    //   address:  "0x84cC77C56E632924d7870F1dDc0b21027b6373f2 ",
    // })
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
