const { range } = require('./utils/helpers');
const { drawCalculator, prepareClaims } = require('@pooltogether/draw-calculator-js')

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
    const drawCalculatorContract = await ethers.getContract('DrawCalculator')
    const prizeDistributionHistory = await ethers.getContract('PrizeDistributionHistory')
    
    // READ Draw Range
    const newDraw = await drawHistory.getNewestDraw()
    const oldDraw = await drawHistory.getOldestDraw()
    const list = range((newDraw.drawId - oldDraw.drawId), oldDraw.drawId) // Generate Draw.drawId list [1,2,4,5,6,7]
    
    // READ PrizeDistribution list
    const drawList = await drawHistory.getDraws(list)
    const prizeDistributionList = await prizeDistributionHistory.getPrizeDistributions(list)
    
    // READ Normalized Balances
    const balances = await drawCalculatorContract.functions.getNormalizedBalancesForDrawIds(wallet.address, list) 
    // CREATE User struct
    const User = {
      address: wallet.address,
      normalizedBalances: balances[0],
    }

    const results = drawCalculator(prizeDistributionList, drawList, User)
    if(results.length === 0) return console.log(`No Winning PickIndices`)
    const USER_CLAIM = prepareClaims(User, [results])
    await drawPrize.claim(USER_CLAIM.user, USER_CLAIM.drawIds, USER_CLAIM.data)
    return console.log('DrawPrize claim complete...')
 });
