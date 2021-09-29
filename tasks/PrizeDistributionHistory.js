const chalk = require('chalk')
const log = console.log

/**
 * @name getPrizeDistribution
 */
 task("getLivePrizeDistributionList", "Read single prize distribution parameters")
 .setAction(async (args, hre) => {
    const { ethers } = hre
    const prizeDistributionHistory = await ethers.getContract('PrizeDistributionHistory')
    const {drawId: drawIdNewest } = await prizeDistributionHistory.getNewestPrizeDistribution()
    const {drawId: drawIdOldest } = await prizeDistributionHistory.getOldestPrizeDistribution()
    const list = range((drawIdNewest - drawIdOldest), drawIdOldest) // Generate Draw.drawId list [1,2,4,5,6,7]
    prizeDistributionList = await prizeDistributionHistory.getPrizeDistributions(list)
    mapIdToObject(
            list,
            prizeDistributionList
        ).forEach(prizeDistributionWithId => 
            convertPrizeDistributionToTable(
                prizeDistributionWithId.drawId, 
                prizeDistributionWithId.prizeDistribution, 
                prizeDistributionHistory.address
            ))
    log(`Total PrizeDistribution(s): ${prizeDistributionList.length}`)
    log('--------------------------')

    return mapIdToObject(
        list,
        prizeDistributionList
    );
 });

/**
 * @name getPrizeDistribution
 */
task("getPrizeDistribution", "Read single prize distribution parameters")
.addParam("id", "")
.setAction(async ({id}, hre) => {
    const { ethers } = hre
    const prizeDistributionHistory = await ethers.getContract('PrizeDistributionHistory')
    const {drawId, prizeDistribution} = await prizeDistributionHistory.getPrizeDistribution(id)
    convertPrizeDistributionToTable(drawId, prizeDistribution, prizeDistributionHistory.address )
});

/**
 * @name getPrizeDistributionList
 */
task("getPrizeDistributionList", "Read list of prize distribution parameters")
.addParam("drawIds", "<string> (1,2,3) ")
.setAction(async ({drawIds}, hre) => {
    const { ethers } = hre
    const prizeDist = await ethers.getContract('PrizeDistributionHistory')
    const range = drawIds.split(',')
    prizeDistributionList = await prizeDist.getPrizeDistributions(range)
    mapIdToObject(range, prizeDistributionList)
        .forEach(prizeDistributionWithId => 
            convertPrizeDistributionToTable(
                prizeDistributionWithId.drawId, 
                prizeDistributionWithId.prizeDistribution, 
                prizeDist.address
            ))
});

/**
 * @name getOldestPrizeDistribution
 */
task("getOldestPrizeDistribution")
.setAction(async (args, hre) => {
    const { ethers } = hre
    const prizeDistributionHistory = await ethers.getContract('PrizeDistributionHistory')
    const {drawId, prizeDistribution}  = await prizeDistributionHistory.getOldestPrizeDistribution()
    convertPrizeDistributionToTable(drawId, prizeDistribution, prizeDistributionHistory.address)
  });

/**
 * @name getNewestPrizeDistribution
 */
task("getNewestPrizeDistribution")
.setAction(async (args, hre) => {
    const { ethers } = hre
    const prizeDistributionHistory = await ethers.getContract('PrizeDistributionHistory')
    const {drawId, prizeDistribution}  = await prizeDistributionHistory.getNewestPrizeDistribution()
    convertPrizeDistributionToTable(drawId, prizeDistribution, prizeDistributionHistory.address)
  });


 function range(size, startAt = 0) {
    return [...Array(size).keys()].map(i => i + startAt);
}


function mapIdToObject(ids, objects) {
    return ids.map((id, idx) => ({
        drawId: id,
        prizeDistribution: objects[idx]
    }))
}

function convertPrizeDistributionToTable (drawId, prizeDistribution, address) {
    log('----------------------------------------------------------------------------')
    log('Draw ID:', drawId, `retrieved from ${address}`)
    log('----------------------------------------------------------------------------')

    log(chalk.green(`Prize: ${ethers.utils.formatEther(prizeDistribution.prize)}`))
    log(chalk.green(`BitRange: ${prizeDistribution.bitRangeSize}`))
    log(chalk.green(`MatchCardinality: ${prizeDistribution.matchCardinality}`))
    log(chalk.green(`Start timestamp offset: ${prizeDistribution.startTimestampOffset}`))
    log(chalk.green(`End timestamp offset: ${prizeDistribution.endTimestampOffset}`))
    log(chalk.green(`Max User Picks: ${prizeDistribution.maxPicksPerUser}`))
    log(chalk.green(`Number of Picks: ${prizeDistribution.numberOfPicks}`))
    log('----------------------------------------------------------------------------\n')
}