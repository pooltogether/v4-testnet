const hardhat = require('hardhat');
const { range } = require('../utils/helpers');
const { ethers} = hardhat

async function getDrawHistoryAndPrizeDistributionHistory() {
  const drawPrize = await ethers.getContract('DrawPrize')
  const drawHistory = await ethers.getContract('DrawHistory')
  const prizeDistributionHistory = await ethers.getContract('PrizeDistributionHistory')
  
  // READ Draw Range
  const newDraw = await drawHistory.getNewestDraw()
  const oldDraw = await drawHistory.getOldestDraw()
  const list = range((newDraw.drawId - oldDraw.drawId), oldDraw.drawId) // Generate Draw.drawId list [1,2,4,5,6,7]
  
  // READ PrizeDistribution list
  const drawList = await drawHistory.getDraws(list)
  const prizeDistributionList = (await prizeDistributionHistory.getPrizeDistributions(list))
  return [drawList, prizeDistributionList]
}

module.exports = {
  getDrawHistoryAndPrizeDistributionHistory
}