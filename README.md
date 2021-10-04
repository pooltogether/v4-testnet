# PoolTogeher V4 Testnet
The V4 testnet repo contains the deployments contracts.

# Tasks
Interact with the V4 testnet deployed contracts through hardhat tasks.

`yarn task [TASK_NAME]`

`yarn task [TASK_NAME] --wallet 0`

`yarn task [TASK_NAME] --user 0x0000000000000000000000000000000000000000`

## Calculations

- **winningPickIndices:** Calclates a users winning picks on target DrawCalculator.

## DrawPrize

- **claim:** Claim winning draw prizes and receive tickets 

## DrawHistory

- **getDraws:** Claim winning draw prizes and receive tickets 
- **getNewestDraw:** Claim winning draw prizes and receive tickets 
- **getOldestDraw:** Claim winning draw prizes and receive tickets 
- **getLiveDraws:** Claim winning draw prizes and receive tickets 
- **pushDraw:** Claim winning draw prizes and receive tickets 
- **setDraw:** Claim winning draw prizes and receive tickets 

## PrizeDistributionHistory

- **getLivePrizeDistributionList:** Claim winning draw prizes and receive tickets 
- **getPrizeDistribution:** Claim winning draw prizes and receive tickets 
- **getOldestPrizeDistribution:** Claim winning draw prizes and receive tickets 
- **getNewestPrizeDistribution:** Claim winning draw prizes and receive tickets 

## Ticket

 - **balanceOf:** Read balance of user address
 - **getAccountDetails:** Read account details of user address
 - **getAverageBalancesBetween:** Read average balance between epoch timestamp of user address
 - **delegate:** Delegate TWAB to delegate address
 - **transfer:** Transfer balance of ticket to recipient address



### Parameters

By default tasks will connect to network specific deployed contracts and use the default wallet/address for reads/writes to the contract.

To change wallets just pass a new index. i.e. 1,2,3, etc...

Certain tasks require a "user" address like `claim` and `calculate`.

In these instances the default the wallet address is used. 

To use pass an alternative user address, without changing the default wallet  pass a new "user" address with the --user flag.

yarn task [TASK_NAME] --user 0x0000000000000000000000000000000000000000 // Default Wallet