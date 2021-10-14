const chalk = require('chalk');
const { transferOwnership } = require('../src/transferOwnership')

const { 
  DRAW_BUFFER_CARDINALITY,
  PRIZE_DISTRIBUTION_BUFFER_CARDINALITY,
  BEACON_PERIOD_SECONDS,
  END_TIMESTAMP_OFFSET,
  VALIDITY_DURATION,
  TOKEN_DECIMALS 
} = require('../constants')

const { deployContract } = require('../deployContract')

function dim() {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.dim.call(chalk, ...arguments));
  }
}

function cyan() {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.cyan.call(chalk, ...arguments));
  }
}

function yellow() {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.yellow.call(chalk, ...arguments));
  }
}

function green() {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.green.call(chalk, ...arguments));
  }
}

function displayResult(name, result) {
  if (!result.newlyDeployed) {
    yellow(`Re-used existing ${name} at ${result.address}`);
  } else {
    green(`${name} deployed at ${result.address}`);
  }
}

module.exports = async (hardhat) => {

  const {
    ethers,
    deployments,
    getChainId,
    getNamedAccounts
  } = hardhat
  const { deploy } = deployments;
  let { deployer, manager, owner } = await getNamedAccounts();

  const chainId = parseInt(await getChainId(), 10)
  const isTestEnvironment = chainId === 31337 || chainId === 1337;

  if (process.env.DEPLOY != 'rinkeby' && process.env.DEPLOY != 'goerli') {
    dim(`Ignoring rinkeby and goerli...`)
    return
  } else {
    dim(`Deploying rinkeby or goerli...`)
  }

  /* ========================================= */
  // Phase 0 ---------------------------------
  // Test Contracts to easily test full functionality.
  /* ========================================= */
  let rngServiceAddress
  if (!isTestEnvironment) {
    const rngBlockhash = await ethers.getContract("RNGBlockhash")
    rngServiceAddress = rngBlockhash.address
  } else {
    cyan(`\nDeploying RNGServiceStub...`)
    const rngServiceResult = await deploy('RNGServiceStub', {
      from: deployer
    })
    displayResult('RNGServiceStub', rngServiceResult)
    rngServiceAddress = rngServiceResult.address
  }

  cyan('\nDeploying MockYieldSource...')
  const mockYieldSourceResult = await deploy('MockYieldSource', {
    from: deployer,
    args: ['Token', 'TOK', TOKEN_DECIMALS],
    skipIfAlreadyDeployed: true
  })
  displayResult('MockYieldSource', mockYieldSourceResult)
  
  cyan('\nDeploying YieldSourcePrizePool...')
  const yieldSourcePrizePoolResult = await deploy('YieldSourcePrizePool', {
    from: deployer,
    args: [
      deployer,
      mockYieldSourceResult.address
    ],
    skipIfAlreadyDeployed: true
  })
  displayResult('YieldSourcePrizePool', yieldSourcePrizePoolResult)

  /* ========================================= */
  // Phase 1 ---------------------------------
  // Setup Core Contracts
  /* ========================================= */
  cyan('\nDeploying Ticket...')
  const ticketResult = await deploy('Ticket', {
    from: deployer,
    args: [
      "Ticket",
      "TICK",
      TOKEN_DECIMALS,
      yieldSourcePrizePoolResult.address
    ],
    skipIfAlreadyDeployed: true
  })
  displayResult('Ticket', ticketResult)

  const yieldSourcePrizePool = await ethers.getContract('YieldSourcePrizePool')

  if (await yieldSourcePrizePool.getTicket() != ticketResult.address) {
    cyan('\nSetting ticket on prize pool...')
    const tx = await yieldSourcePrizePool.setTicket(ticketResult.address)
    await tx.wait(1)
    green(`\nSet ticket!`)
  }

  const prizeSplitStrategyResult = await deployContract(deploy, 'PrizeSplitStrategy', deployer, [deployer,yieldSourcePrizePoolResult.address])
  const reserveResult = await deployContract(deploy, 'Reserve', deployer, [deployer,ticketResult.address])
    
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

  cyan('\nDeploying DrawBuffer...')
  const drawBufferResult = await deploy('DrawBuffer', {
    from: deployer,
    args: [
      deployer,
      DRAW_BUFFER_CARDINALITY
    ],
    skipIfAlreadyDeployed: true
  })
  displayResult('DrawBuffer', drawBufferResult)

  cyan('\nDeploying DrawBeacon...')
  const drawBeaconResult = await deploy('DrawBeacon', {
    from: deployer,
    args: [
      deployer,
      drawBufferResult.address,
      rngServiceAddress,
      1, // Starting DrawID
      parseInt('' + new Date().getTime() / 1000),
      BEACON_PERIOD_SECONDS,
      60 * 60 * 6 // RNG timeout = 6 hours
    ],
    skipIfAlreadyDeployed: true
  })
  displayResult('DrawBeacon', drawBeaconResult)


  const drawBuffer = await ethers.getContract('DrawBuffer')
  if (await drawBuffer.manager() != drawBeaconResult.address) {
    cyan('\nSetting DrawBuffer manager to DrawBeacon...')
    const tx = await drawBuffer.setManager(drawBeaconResult.address)
    await tx.wait(1)
    green('Set!')
  }

  cyan('\nDeploying PrizeDistributionBuffer...')
  const prizeDistributionBufferResult = await deploy('PrizeDistributionBuffer', {
    from: deployer,
    args: [
      deployer,
      PRIZE_DISTRIBUTION_BUFFER_CARDINALITY
    ],
    skipIfAlreadyDeployed: true
  })
  displayResult('PrizeDistributionBuffer', prizeDistributionBufferResult)
  
  cyan('\nDeploying DrawCalculator...')
  const drawCalculatorResult = await deploy('DrawCalculator', {
    from: deployer,
    args: [
      ticketResult.address,
      drawBufferResult.address,
      prizeDistributionBufferResult.address
    ],
    skipIfAlreadyDeployed: true
  })
  displayResult('DrawCalculator', drawCalculatorResult)

  cyan('\nDeploying PrizeDistributor...')
  const prizeDistributorResult = await deploy('PrizeDistributor', {
    from: deployer,
    args: [
      deployer,
      ticketResult.address,
      drawCalculatorResult.address
    ],
    skipIfAlreadyDeployed: true
  })
  displayResult('PrizeDistributor', prizeDistributorResult)

  const prizeFlushResult = await deployContract(deploy, 'PrizeFlush', deployer, [deployer,prizeDistributorResult.address,prizeSplitStrategyResult.address,reserveResult.address])

  const prizeFlush = await ethers.getContract('PrizeFlush')
  if (await prizeFlush.manager() != manager) {
    cyan('\nSetting manager on prizeFlush...')
    const tx = await prizeFlush.setManager(manager)
    await tx.wait(1)
    green(`Set prizeFlush manager!`)
  }

  const reserve = await ethers.getContract('Reserve')

  if (await reserve.manager() != prizeFlushResult.address) {
    cyan('\nSetting manager on reserve...')
    const tx = await reserve.setManager(prizeFlushResult.address)
    await tx.wait(1)
    green(`Set reserve manager!`)
  }

  /* ========================================= */
  // Phase 2 ---------------------------------
  // Setup the Timelock contracts
  /* ========================================= */
  
  cyan('\nDeploying DrawCalculatorTimelock...')
  const drawCalculatorTimelockResult = await deploy('DrawCalculatorTimelock', {
    from: deployer,
    args: [
      deployer,
      drawCalculatorResult.address
    ],
    skipIfAlreadyDeployed: true
  })
  displayResult('DrawCalculatorTimelock', drawCalculatorTimelockResult)

  cyan('\nDeploying L1TimelockTrigger...')
  const L1TimelockTriggerResult = await deploy('L1TimelockTrigger', {
    from: deployer,
    args: [
      deployer,
      prizeDistributionBufferResult.address,
      drawCalculatorTimelockResult.address
    ],
    skipIfAlreadyDeployed: true
  })
  displayResult('L1TimelockTrigger', L1TimelockTriggerResult)

  /* ========================================= */
  // Phase 3 ---------------------------------
  // Set the manager(s) of the periphery smart contracts.
  /* ========================================= */

  const prizeDistributionBuffer = await ethers.getContract('PrizeDistributionBuffer')
  if (await prizeDistributionBuffer.manager() != L1TimelockTriggerResult.address) {
    cyan('\nSetting PrizeDistributionBuffer manager...')
    const tx = await prizeDistributionBuffer.setManager(L1TimelockTriggerResult.address)
    await tx.wait(1)
    green('Done!')
  }

  const drawCalculatorTimelock = await ethers.getContract('DrawCalculatorTimelock')
  if (await drawCalculatorTimelock.manager() != L1TimelockTriggerResult.address) {
    cyan('\nSetting DrawCalculatorTimelock manager...')
    const tx = await drawCalculatorTimelock.setManager(L1TimelockTriggerResult.address)
    await tx.wait(1)
    green('Done!')
  }

  const l1TimelockTrigger = await ethers.getContract('L1TimelockTrigger')
  if (await l1TimelockTrigger.manager() != manager) {
    cyan(`\nSetting L1TimelockTrigger manager to ${manager}...`)
    const tx = await l1TimelockTrigger.setManager(manager)
    await tx.wait(1)
    green('Done!')
  }

  // Phase 4 ---------------------------------
  cyan('\nDeploying PrizeTierHistory...')
  const prizeTierHistoryResult = await deploy('PrizeTierHistory', {
    from: deployer,
    args: [
      deployer,
    ],
    skipIfAlreadyDeployed: true
  })
  displayResult('PrizeTierHistory', prizeTierHistoryResult)

  const prizeTierHistory = await ethers.getContract('PrizeTierHistory')
  if (await prizeTierHistory.count() == 0) {
    cyan(`\nSetting draw 1 prize tier history...`)
    const pushTx = await prizeTierHistory.push({
      drawId: 1,
      bitRangeSize: 2,
      maxPicksPerUser: 2,
      endTimestampOffset: END_TIMESTAMP_OFFSET,
      prize: '13630000000',
      tiers: ['183418928', 0, 0, '315480557', 0, '501100513', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      validityDuration: VALIDITY_DURATION
    })
    await pushTx.wait(1)
    green(`Prize tiers for draw 1 set!`)
  }
  await transferOwnership('PrizeTierHistory', prizeTierHistory, owner)

}
