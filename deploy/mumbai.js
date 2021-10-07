const { dim, cyan, green } = require('../colors')
const { deployContract } = require('../deployContract')

const { 
  DRAW_BUFFER_CARDINALITY,
  PRIZE_DISTRIBUTION_BUFFER_CARDINALITY,
  DRAW_CALCULATOR_TIMELOCK,
  TOKEN_DECIMALS 
} = require('../constants')

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
  const ticketResult = await deployContract(deploy, 'Ticket', deployer, ["Ticket","TICK", TOKEN_DECIMALS, yieldSourcePrizePoolResult.address])
  
  const yieldSourcePrizePool = await ethers.getContract('YieldSourcePrizePool')

  if (await yieldSourcePrizePool.getTicket() != ticketResult.address) {
    cyan('\nSetting ticket on prize pool...')
    const tx = await yieldSourcePrizePool.setTicket(ticketResult.address)
    await tx.wait(1)
    green(`\nSet ticket!`)
  }

  const drawBufferResult = await deployContract(deploy, 'DrawBuffer', deployer, [deployer, DRAW_BUFFER_CARDINALITY])
  const prizeDistributionBufferResult = await deployContract(deploy, 'PrizeDistributionBuffer', deployer, [deployer, PRIZE_DISTRIBUTION_BUFFER_CARDINALITY])
  const drawCalculatorResult = await deployContract(deploy, 'DrawCalculator', deployer, [deployer, ticketResult.address, drawBufferResult.address, prizeDistributionBufferResult.address])
  const prizeDistributorResult = await deployContract(deploy, 'PrizeDistributor', deployer, [deployer,ticketResult.address, drawCalculatorResult.address])
  const prizeSplitStrategyResult = await deployContract(deploy, 'PrizeSplitStrategy', deployer, [deployer, yieldSourcePrizePoolResult.address])
  const reserveResult = await deployContract(deploy, 'Reserve', deployer, [deployer, ticketResult.address])
  
  const prizeSplitStrategy = await ethers.getContract('PrizeSplitStrategy')

  if (await yieldSourcePrizePool.getPrizeStrategy() != prizeSplitStrategyResult.address) {
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

  const prizeFlushResult = await deployContract(deploy, 'PrizeFlush', deployer, [deployer,prizeDistributorResult.address,prizeSplitStrategyResult.address,reserveResult.address])
  const drawCalculatorTimelockResult = await deployContract(deploy, 'DrawCalculatorTimelock', deployer, [deployer,drawCalculatorResult.address, DRAW_CALCULATOR_TIMELOCK])
  await deployContract(deploy, 'L2TimelockTrigger', deployer, [deployer,drawBufferResult.address, prizeDistributionBufferResult.address,drawCalculatorTimelockResult.address])
  const l2TimelockTrigger = await ethers.getContract('L2TimelockTrigger')
  const reserve = await ethers.getContract('Reserve')
  const drawBuffer = await ethers.getContract('DrawBuffer')
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

  if (await drawBuffer.manager() != l2TimelockTrigger.address) {
    cyan(`\nSetting DrawBuffer manager to ${l2TimelockTrigger.address}...`)
    const tx = await drawBuffer.setManager(l2TimelockTrigger.address)
    await tx.wait(1)
    green('Done!')
  }
  
  if (await drawCalculatorTimelock.manager() != l2TimelockTrigger.address) {
    cyan(`\nSetting DrawCalculatorTimelock manager to ${l2TimelockTrigger.address}...`)
    const tx = await drawCalculatorTimelock.setManager(l2TimelockTrigger.address)
    await tx.wait(1)
    green('Done!')
  }

  const prizeDistributionBuffer = await ethers.getContract('PrizeDistributionBuffer')
  if (await prizeDistributionBuffer.manager() != l2TimelockTrigger.address) {
    cyan(`\nSetting PrizeDistributionBuffer manager to ${l2TimelockTrigger.address}...`)
    const tx =  await prizeDistributionBuffer.setManager(l2TimelockTrigger.address)
    await tx.wait(1)
    green(`Done!`)
  }

}
