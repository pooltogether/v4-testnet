const chalk = require('chalk');
const { dim, cyan, green } = require('../colors')
const { PERIOD_IN_SECONDS } = require('../constants')
const { deployContract } = require('../deployContract')

module.exports = async (hardhat) => {

  const {
    ethers,
    deployments,
    getNamedAccounts
  } = hardhat

  const { deploy } = deployments;
  const {
    deployer,
    manager
  } = await getNamedAccounts();
  
  if (process.env.DEPLOY != 'mumbai') {
    dim(`Ignoring mumbai...`)
    return
  } else {
    dim(`Deploying mumbai...`)
  }

  const mockYieldSourceResult = await deployContract(deploy, 'MockYieldSource', deployer, [])
  const yieldSourcePrizePoolResult = await deployContract(deploy, 'YieldSourcePrizePool', deployer, [deployer,mockYieldSourceResult.address])
  const ticketResult = await deployContract(deploy, 'Ticket', deployer, ["Ticket","TICK",18,yieldSourcePrizePoolResult.address])
  
  const yieldSourcePrizePool = await ethers.getContract('YieldSourcePrizePool')

  const timelockDuration = PERIOD_IN_SECONDS * 0.5 // five mins

  if (await yieldSourcePrizePool.ticket() != ticketResult.address) {
    cyan('\nSetting ticket on prize pool...')
    const tx = await yieldSourcePrizePool.setTicket(ticketResult.address)
    await tx.wait(1)
    green(`\nSet ticket!`)
  }

  const cardinality = 8
  const drawHistoryResult = await deployContract(deploy, 'DrawHistory', deployer, [deployer, cardinality])
  const prizeDistributionHistoryResult = await deployContract(deploy, 'PrizeDistributionHistory', deployer, [deployer,cardinality])
  const drawCalculatorResult = await deployContract(deploy, 'DrawCalculator', deployer, [deployer, ticketResult.address,drawHistoryResult.address,prizeDistributionHistoryResult.address])
  const drawPrizeResult = await deployContract(deploy, 'DrawPrize', deployer, [deployer,ticketResult.address,drawCalculatorResult.address])
  const prizeSplitStrategyResult = await deployContract(deploy, 'PrizeSplitStrategy', deployer, [deployer,yieldSourcePrizePoolResult.address])
  const reserveResult = await deployContract(deploy, 'Reserve', deployer, [deployer,ticketResult.address])
  
  const prizeSplitStrategy = await ethers.getContract('PrizeSplitStrategy')

  if (await yieldSourcePrizePool.prizeStrategy() != prizeSplitStrategyResult.address) {
    cyan('\nSetting prize strategy on prize pool...')
    const tx = await yieldSourcePrizePool.setPrizeStrategy(prizeSplitStrategyResult.address)
    await tx.wait(1)
    green(`Set prize strategy!`)
  }

  if ((await prizeSplitStrategy.getPrizeSplits()).length == 0) {
    cyan('\n adding split...')
    const tx = await prizeSplitStrategy.setPrizeSplits([
      { target: reserveResult.address, percentage: 1000 }
    ])
    await tx.wait(1)
    green('Done!')
  }

  const prizeFlushResult = await deployContract(deploy, 'PrizeFlush', deployer, [deployer,drawPrizeResult.address,prizeSplitStrategyResult.address,reserveResult.address])
  const drawCalculatorTimelockResult = await deployContract(deploy, 'DrawCalculatorTimelock', deployer, [deployer,drawCalculatorResult.address,timelockDuration])
  await deployContract(deploy, 'L2TimelockTrigger', deployer, [deployer,drawHistoryResult.address, prizeDistributionHistoryResult.address,drawCalculatorTimelockResult.address])
  const l2TimelockTrigger = await ethers.getContract('L2TimelockTrigger')
  const reserve = await ethers.getContract('Reserve')
  const drawHistory = await ethers.getContract('DrawHistory')
  const drawCalculatorTimelock = await ethers.getContract('DrawCalculatorTimelock')

  const prizeFlush = await ethers.getContract('PrizeFlush')
  if (await prizeFlush.manager() != manager) {
    cyan('\nSetting manager on prizeFlush...')
    const tx = await prizeFlush.setManager(manager)
    await tx.wait(1)
    green(`Set prizeFlush manager!`)
  }

  if (await reserve.manager() != prizeFlushResult.address) {
    cyan('\nSetting manager on reserve...')
    const tx = await reserve.setManager(prizeFlushResult.address)
    await tx.wait(1)
    green(`Set reserve manager!`)
  }
  
  /* ========================================= */
  // Phase 3 ---------------------------------
  // Set the manager(s) of the periphery smart contracts.
  /* ========================================= */
  if (await l2TimelockTrigger.manager() != manager) {
    cyan(`\nSetting L2TimelockTrigger manager to ${manager}...`)
    const tx = await l2TimelockTrigger.setManager(manager)
    await tx.wait(1)
    green('\nDone!')
  }

  if (await drawHistory.manager() != l2TimelockTrigger.address) {
    cyan(`\nSetting DrawHistory manager to ${l2TimelockTrigger.address}...`)
    const tx = await drawHistory.setManager(l2TimelockTrigger.address)
    await tx.wait(1)
    green('Done!')
  }
  
  if (await drawCalculatorTimelock.manager() != l2TimelockTrigger.address) {
    cyan(`\nSetting DrawCalculatorTimelock manager to ${l2TimelockTrigger.address}...`)
    const tx = await drawCalculatorTimelock.setManager(l2TimelockTrigger.address)
    await tx.wait(1)
    green('Done!')
  }

  const prizeDistributionHistory = await ethers.getContract('PrizeDistributionHistory')
  if (await prizeDistributionHistory.manager() != l2TimelockTrigger.address) {
    cyan(`\nSetting PrizeDistributionHistory manager to ${l2TimelockTrigger.address}...`)
    const tx =  await prizeDistributionHistory.setManager(l2TimelockTrigger.address)
    await tx.wait(1)
    green(`Done!`)
  }

}
