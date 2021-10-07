const idx = require('idx')
const hardhat = require('hardhat');
const { ethers} = hardhat

async function getContractAddresses() {
  let DrawBeacon
  let DrawHistory
  let DrawCalculator
  let DrawPrize
  let Reserve
  let PrizePool
  let PrizeFlush
  let PrizeDistributionHistory
  let L1TimelockTrigger
  let L2TimelockTrigger
  let DrawCalculatorTimelock

  try {
    DrawBeacon = await ethers.getContract('DrawBeacon')
    DrawHistory = await ethers.getContract('DrawHistory')
    DrawCalculator = await ethers.getContract('DrawCalculator')
    DrawPrize = await ethers.getContract('DrawPrize')
    Reserve = await ethers.getContract('Reserve')
    PrizeFlush = await ethers.getContract('PrizeFlush')
    PrizePool = await ethers.getContract('PrizePool')
    PrizeDistributionHistory = await ethers.getContract('PrizeDistributionHistory')
    L1TimelockTrigger = await ethers.getContract('L1TimelockTrigger')
    L2TimelockTrigger = await ethers.getContract('L2TimelockTrigger')
    DrawCalculatorTimelock = await ethers.getContract('DrawCalculatorTimelock')
  } catch (error) {
    return {
      DrawBeacon: idx(DrawBeacon, _=>_.address),
      DrawHistory: idx(DrawHistory, _=>_.address),
      DrawCalculator: idx(DrawCalculator, _=>_.address),
      DrawPrize: idx(DrawPrize, _=>_.address),
      PrizeDistributionHistory: idx(PrizeDistributionHistory, _=>_.address),
      Reserve: idx(Reserve, _=>_.address),
      PrizePool: idx(PrizePool, _=>_.address),
      PrizeFlush: idx(PrizeFlush, _=>_.address),
      PrizeDistributionHistory: idx(PrizeDistributionHistory, _=>_.address),
      L1TimelockTrigger: idx(L1TimelockTrigger, _=>_.address),
      L2TimelockTrigger: idx(L2TimelockTrigger, _=>_.address),
      DrawCalculatorTimelock: idx(DrawCalculatorTimelock, _=>_.address)
    }
  }

  return {
    DrawBeacon: idx(DrawBeacon, _=>_.address),
    DrawHistory: idx(DrawHistory, _=>_.address),
    DrawCalculator: idx(DrawCalculator, _=>_.address),
    DrawPrize: idx(DrawPrize, _=>_.address),
    PrizeDistributionHistory: idx(PrizeDistributionHistory, _=>_.address),
    Reserve: idx(Reserve, _=>_.address),
    PrizePool: idx(PrizePool, _=>_.address),
    PrizeFlush: idx(PrizeFlush, _=>_.address),
    PrizeDistributionHistory: idx(PrizeDistributionHistory, _=>_.address),
    L1TimelockTrigger: idx(L1TimelockTrigger, _=>_.address),
    L2TimelockTrigger: idx(L2TimelockTrigger, _=>_.address),
    DrawCalculatorTimelock: idx(DrawCalculatorTimelock, _=>_.address)
  }

}

module.exports = {
  getContractAddresses
}