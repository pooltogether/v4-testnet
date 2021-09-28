const chalk = require('chalk');

const { PERIOD_IN_SECONDS } = require('../constants')
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
  let { deployer, manager } = await getNamedAccounts();

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
    from: deployer
  })
  displayResult('MockYieldSource', mockYieldSourceResult)
  
  cyan('\nDeploying YieldSourcePrizePool...')
  const yieldSourcePrizePoolResult = await deploy('YieldSourcePrizePool', {
    from: deployer,
    args: [
      deployer,
      mockYieldSourceResult.address
    ]
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
      18,
      yieldSourcePrizePoolResult.address
    ]
  })
  displayResult('Ticket', ticketResult)

  const yieldSourcePrizePool = await ethers.getContract('YieldSourcePrizePool')

  if (await yieldSourcePrizePool.ticket() != ticketResult.address) {
    cyan('\nSetting ticket on prize pool...')
    const tx = await yieldSourcePrizePool.setTicket(ticketResult.address)
    await tx.wait(1)
    green(`\nSet ticket!`)
  }

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

  const cardinality = 8

  cyan('\nDeploying DrawHistory...')
  const drawHistoryResult = await deploy('DrawHistory', {
    from: deployer,
    args: [
      deployer,
      cardinality
    ]
  })
  displayResult('DrawHistory', drawHistoryResult)

  cyan('\nDeploying DrawBeacon...')
  const drawBeaconResult = await deploy('DrawBeacon', {
    from: deployer,
    args: [
      deployer,
      drawHistoryResult.address,
      rngServiceAddress,
      1, // Starting DrawID
      parseInt('' + new Date().getTime() / 1000),
      PERIOD_IN_SECONDS
    ],
    skipIfAlreadyDeployed: true
  })
  displayResult('DrawBeacon', drawBeaconResult)

  const drawHistory = await ethers.getContract('DrawHistory')
  if (await drawHistory.manager() != drawBeaconResult.address) {
    cyan('\nSetting DrawHistory manager to DrawBeacon...')
    const tx = await drawHistory.setManager(drawBeaconResult.address)
    await tx.wait(1)
    green('Set!')
  }

  cyan('\nDeploying PrizeDistributionHistory...')
  const prizeDistributionHistoryResult = await deploy('PrizeDistributionHistory', {
    from: deployer,
    args: [
      deployer,
      cardinality
    ]
  })
  displayResult('PrizeDistributionHistory', prizeDistributionHistoryResult)
  
  cyan('\nDeploying DrawCalculator...')
  const drawCalculatorResult = await deploy('DrawCalculator', {
    from: deployer,
    args: [
      deployer,
      ticketResult.address,
      drawHistoryResult.address,
      prizeDistributionHistoryResult.address
    ]
  })
  displayResult('DrawCalculator', drawCalculatorResult)

  cyan('\nDeploying DrawPrize...')
  const drawPrizeResult = await deploy('DrawPrize', {
    from: deployer,
    args: [
      deployer,
      ticketResult.address,
      drawCalculatorResult.address
    ]
  })
  displayResult('DrawPrize', drawPrizeResult)

  const prizeFlushResult = await deployContract(deploy, 'PrizeFlush', deployer, [deployer,drawPrizeResult.address,prizeSplitStrategyResult.address,reserveResult.address])

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
  
  const period = 60 * 10 // five mins
  const timelockDuration = period * 0.5 // five mins
  
  cyan('\nDeploying DrawCalculatorTimelock...')
  const drawCalculatorTimelockResult = await deploy('DrawCalculatorTimelock', {
    from: deployer,
    args: [
      deployer,
      drawCalculatorResult.address,
      timelockDuration
    ]
  })
  displayResult('DrawCalculatorTimelock', drawCalculatorTimelockResult)

  cyan('\nDeploying L1TimelockTrigger...')
  const L1TimelockTriggerResult = await deploy('L1TimelockTrigger', {
    from: deployer,
    args: [
      deployer,
      prizeDistributionHistoryResult.address,
      drawCalculatorTimelockResult.address
    ]
  })
  displayResult('L1TimelockTrigger', L1TimelockTriggerResult)


  /* ========================================= */
  // Phase 3 ---------------------------------
  // Set the manager(s) of the periphery smart contracts.
  /* ========================================= */

  const prizeDistributionHistory = await ethers.getContract('PrizeDistributionHistory')
  if (await prizeDistributionHistory.manager() != L1TimelockTriggerResult.address) {
    cyan('\nSetting PrizeDistributionHistory manager...')
    const tx = await prizeDistributionHistory.setManager(L1TimelockTriggerResult.address)
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
}
