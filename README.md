# Testing
Script: npx hardhat test

Tested all happy cases and exceptions

# Deploy
Script: npx hardhat run script/deploy.js --network arbitrumTestnet

CampaignContract has 3 parameter:
- address _chappy_token: token chappy to validate valid user
- address[] memory _admins: ones who can create campaign and fund to that campaign
- uint16 _share_percent: amount of token sent to owner each time admin fund campaign, 10000 = 100%