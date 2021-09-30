const { ethers, constants } = require('ethers');
const { green, cyan, yellow } = require('chalk');
const { range } = require('./utils/helpers');
const { drawCalculator, prepareClaims } = require('@pooltogether/draw-calculator-js');

const DECIMALS_FOR_DISTRIBUTIONS = 8;

const toDrawCalcPrizeDistributions = (
  prizeDistributions
) => ({
  ...prizeDistributions,
  numberOfPicks: prizeDistributions.numberOfPicks.toNumber(),
  distributions: prizeDistributions.distributions.map((d) => toDistributionBigNumber(String(d)))
})

const toDistributionNumber = (distributionUnformatted) =>
  Number(ethers.utils.formatUnits(distributionUnformatted, DECIMALS_FOR_DISTRIBUTIONS))

const toDistributionBigNumber = (distribution) =>
ethers.utils.parseUnits(distribution, DECIMALS_FOR_DISTRIBUTIONS)

const toDrawCalcDraw = (draw) => ({
  ...draw,
  drawId: BigNumber.from(draw.drawId)
})

const calculatePrizeForDistributionIndex = (
  prizeDistributionIndex,
  prizeDistributions,
  draw
) => {
  return _calculatePrizeForDistributionIndex(
    prizeDistributionIndex,
    toDrawCalcPrizeDistributions(prizeDistributions),
    toDrawCalcDraw(draw)
  )
}

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
    const prizeDistributionList = (await prizeDistributionHistory.getPrizeDistributions(list))
    .map(pd => (
      {...pd, 
        // numberOfPicks: 1000,
        distributions: pd.distributions.map(dist=> toDistributionNumber(dist)),
        numberOfPicks: pd.numberOfPicks.div(constants.WeiPerEther).toNumber()
      }
    ))
    
    // READ Normalized Balances
    const [balances] = await drawCalculatorContract.functions.getNormalizedBalancesForDrawIds(wallet.address, list) 
    balances.forEach((bal,  idx) => convertBalanceOfToTable(bal, list[idx]))
    
    // CREATE User struct
    const User = {
      address: wallet.address,
      normalizedBalances: balances,
    }

    const results = drawCalculator(prizeDistributionList, drawList, User)
    if(results.length === 0) return console.log(`No Winning PickIndices`)

    console.log(results, 'resultsresults')
    
    const USER_CLAIM = prepareClaims(User, [results])
    await drawPrize.claim(USER_CLAIM.user, USER_CLAIM.drawIds, USER_CLAIM.data)
    return console.log('DrawPrize claim complete...')
 });


 function convertBalanceOfToTable(balance, drawId) {
  console.log('-------------------------------------------------------------------------------------------------------------------------')
  console.log(`Draw ${drawId}:`, `has average balance of ${cyan(ethers.utils.formatEther(balance))}`)
  console.log('-------------------------------------------------------------------------------------------------------------------------')
}
