# Presequite
Script: npm i

# Testing
Script: npx hardhat test

Tested all happy cases and exceptions

# Deploy
To deploy and verify token contracts, uncomment corresponding unit block code in deploy.js and comment other units  

To deploy and verify Campaign contract, uncomment Unit Deploy&Verify campaign contract and comment other units
CampaignContract has 3 parameter:
- address _chappy_token: token chappy to validate valid user
- address[] memory _admins: ones who can create campaign and fund to that campaign
- uint16 _share_percent: amount of token sent to owner each time admin fund campaign, 10000 = 100%

To upgrade and verfy campaign contract (make sure storage layout stay the same)
- uncomment Unit Upgrade campaign contract and comment other units
- run script to upgrade contract
- uncomment Unit Verify campaign contract and comment other units
- replace the address field with the address of the campaign contract just deployed
- run script to verify contract

Script: npx hardhat run script/deploy.js --network arbitrumTestnet