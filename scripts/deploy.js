const { ethers, upgrades } = require('hardhat')

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
    // Unit Deploy&Verify mock token contract for reward
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

    // Unit Deploy&Verify Chappy token contract for validate user
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

    // Unit Deploy&Verify nft contract for validate user
    // const ChappyNFT = await ethers.getContractFactory('ChappyNFT')
    // const chappyNFT = await ChappyNFT.deploy()
    // await chappyNFT.deployed();
    // console.log("ChappyToken deployed to:", chappyNFT.address);
    // await sleep(9000);
    // await hre.run("verify:verify", {
    //     address: chappyNFT.address,
    //     contract: "contracts/ChappyNFT.sol:ChappyNFT",
    // });

    // Unit Deploy&Verify campaign contract
    // const CampaignContract = await ethers.getContractFactory('Campaign')
    // const Campaign = await upgrades.deployProxy(CampaignContract, ['0x522Fc3fe0Bf5b38D3Ae5b4dEe5Cd76A0c328CcfF', ['0xf705457121591e5a849cc1Ae2f0A1425547df65D'], 250])
    // await Campaign.deployed()
    // console.log('Campaign deployed to:', Campaign.address)

    // implAddress = await upgrades.erc1967.getImplementationAddress(
    //     Campaign.address,
    // )
    // console.log('implCampaign deployed to:', implAddress)
    // await hre.run('verify:verify', {
    //     address: implAddress,
    // })
    
    // Campaign deployed to: 0x65896C432D3ae8edA15094893d02507C7D834e61
    // implCampaign deployed to: 0x9A413E8874E1a5979fB5aFb2F651F99decEd7dE9

    // Unit Upgrade campaign contract
    // const SC_upgarde_master = await ethers.getContractFactory("Campaign");
    // const master_upgrade = await upgrades.upgradeProxy('0xcb9294eCD7b21573eDb97041c4fdD3a8f61DAd30', SC_upgarde_master,{});
    // console.log("upgrades deployed to:", master_upgrade.address);

    // Unit Verify campaign contract
    // await hre.run('verify:verify', {
    //   address: "0xcb9294eCD7b21573eDb97041c4fdD3a8f61DAd30",
    // })
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
