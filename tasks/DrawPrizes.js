const chalk = require('chalk')
const log = console.log

const { range } = require('./helpers')
const { runDrawCalculator, prepareClaimForUserFromDrawResult } = require('@pooltogether/draw-calculator-js')

/**
 * @name DrawPrize.claim()
 */
 task("claim", "Claim prizes from DrawPrizs")
 .addOptionalParam("wallet", "<number>")
 .setAction(async (args, hre) => {
    const { ethers } = hre
    const { getSigners } = ethers
    const [ wallet ] = await getSigners();
    const drawPrize = await ethers.getContract('DrawPrize')
    const drawHistory = await ethers.getContract('DrawHistory')
    const drawCalculator = await ethers.getContract('DrawCalculator')
    const prizeDistributionHistory = await ethers.getContract('PrizeDistributionHistory')
    
    // READ Draw Range
    const newDraw = await drawHistory.getNewestDraw()
    const oldDraw = await drawHistory.getOldestDraw()
    const list = range((newDraw.drawId - oldDraw.drawId), oldDraw.drawId) // Generate Draw.drawId list [1,2,4,5,6,7]
    
    // READ PrizeDistribution list
    const drawList = await drawHistory.getDraws(list)
    const prizeDistributionList = await prizeDistributionHistory.getPrizeDistributions(list)
    
    // READ Normalized Balances
    const balances = await drawCalculator.functions.getNormalizedBalancesForDrawIds(wallet.address, list) 
    
    // CREATE User struct
    const User = {
      address: wallet.address,
      // normalizedBalance: [balances], // NOTE // Ask should this be a list of TWAB balances sorted with draw(s)/prizeDistribution(s)
      normalizedBalance: ethers.utils.parseEther('1000'),
      picks: []
    }
    const result = runDrawCalculator(prizeDistributionList, drawList, User)
    const USER_CLAIM = prepareClaimForUserFromDrawResult(wallet.address, [result])
    await drawPrize.claim(USER_CLAIM.user, USER_CLAIM.drawIds, USER_CLAIM.data)
 });
