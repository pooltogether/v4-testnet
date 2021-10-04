const { range } = require('../utils/helpers');

async function getDrawAndPrizeDistributionHistory(ethers) {
  const drawHistory = await ethers.getContract('DrawHistory')
  const prizeDistributionHistory = await ethers.getContract('PrizeDistributionHistory')
  
  // READ Draw Range
  const newDraw = await drawHistory.getNewestDraw()
  const oldDraw = await drawHistory.getOldestDraw()
  const list = range((newDraw.drawId - oldDraw.drawId), oldDraw.drawId) // Generate Draw.drawId list [1,2,4,5,6,7]
  
  // READ PrizeDistribution list
  const drawList = await drawHistory.getDraws(list)
  const prizeDistributionList = (await prizeDistributionHistory.getPrizeDistributions(list))
  
  return [drawList, prizeDistributionList, oldDraw.drawId, newDraw.drawId]
}

module.exports = {
  getDrawAndPrizeDistributionHistory
}