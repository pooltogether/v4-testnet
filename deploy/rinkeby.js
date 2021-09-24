const chalk = require('chalk');

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

  if (process.env.DEPLOY != 'rinkeby') {
    dim(`Ignoring rinkeby...`)
    return
  } else {
    dim(`Deploying rinkeby...`)
  }

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

  const period = 60 * 10 // 10 minutes

  cyan('\nDeploying DrawBeacon...')
  const drawBeaconResult = await deploy('DrawBeacon', {
    from: deployer,
    args: [
      deployer,
      drawHistoryResult.address,
      rngServiceAddress,
      1,
      parseInt('' + new Date().getTime() / 1000),
      period // 2 minute intervals
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

  cyan('\nDeploying TsunamiDrawSettingsHistory...')
  const tsunamiDrawSettingsHistoryResult = await deploy('TsunamiDrawSettingsHistory', {
    from: deployer,
    args: [
      deployer,
      cardinality
    ]
  })
  displayResult('TsunamiDrawSettingsHistory', tsunamiDrawSettingsHistoryResult)
  
  cyan('\nDeploying TsunamiDrawCalculator...')
  const drawCalculatorResult = await deploy('TsunamiDrawCalculator', {
    from: deployer,
    args: [
      deployer,
      ticketResult.address,
      drawHistoryResult.address,
      tsunamiDrawSettingsHistoryResult.address
    ]
  })
  displayResult('TsunamiDrawCalculator', drawCalculatorResult)

  cyan('\nDeploying ClaimableDraw...')
  const claimableDrawResult = await deploy('ClaimableDraw', {
    from: deployer,
    args: [
      deployer,
      ticketResult.address,
      drawCalculatorResult.address
    ]
  })
  displayResult('ClaimableDraw', claimableDrawResult)

  cyan('\nDeploying PrizeSplitStrategy...')
  const prizeSplitStrategyResult = await deploy('PrizeSplitStrategy', {
    from: deployer,
    args: [
      deployer,
      yieldSourcePrizePoolResult.address
    ]
  })
  displayResult('PrizeSplitStrategy', prizeSplitStrategyResult)

  if (await yieldSourcePrizePool.prizeStrategy() != prizeSplitStrategyResult.address) {
    cyan('\nSetting prize strategy on prize pool...')
    const tx = await yieldSourcePrizePool.setPrizeStrategy(prizeSplitStrategyResult.address)
    await tx.wait(1)
    green(`Set prize strategy!`)
  }

  cyan('\nDeploying Reserve...')
  const reserveResult = await deploy('Reserve', {
    from: deployer,
    args: [
      deployer,
      ticketResult.address
    ]
  })
  displayResult('Reserve', reserveResult)

  const prizeSplitStrategy = await ethers.getContract('PrizeSplitStrategy')
  if ((await prizeSplitStrategy.prizeSplits()).length == 0) {
    cyan('\n adding split...')
    const tx = await prizeSplitStrategy.setPrizeSplits([
      { target: reserveResult.address, percentage: 1000 }
    ])
    await tx.wait(1)
    green('Done!')
  }

  cyan('\nDeploying PrizeFlush...')
  const prizeFlushResult = await deploy('PrizeFlush', {
    from: deployer,
    args: [
      deployer,
      claimableDrawResult.address,
      prizeSplitStrategyResult.address,
      reserveResult.address
    ]
  })
  displayResult('PrizeFlush', prizeFlushResult)

  const reserve = await ethers.getContract('Reserve')
  if (await reserve.manager() != prizeFlushResult.address) {
    cyan('\nSetting manager on reserve...')
    const tx = await reserve.setManager(prizeFlushResult.address)
    await tx.wait(1)
    green(`Set reserve manager!`)
  }

  const prizeFlush = await ethers.getContract('PrizeFlush')
  if (await prizeFlush.manager() != manager) {
    cyan('\nSetting manager on prizeFlush...')
    const tx = await prizeFlush.setManager(manager)
    await tx.wait(1)
    green(`Set prizeFlush manager!`)
  }

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
  
  cyan('\nDeploying DrawSettingsTimelockTrigger...')
  const drawSettingsTimelockTriggerResult = await deploy('DrawSettingsTimelockTrigger', {
    from: deployer,
    args: [
      deployer,
      tsunamiDrawSettingsHistoryResult.address,
      drawCalculatorTimelockResult.address
    ]
  })
  displayResult('DrawSettingsTimelockTrigger', drawSettingsTimelockTriggerResult)

  const tsunamiDrawSettingsHistory = await ethers.getContract('TsunamiDrawSettingsHistory')
  if (await tsunamiDrawSettingsHistory.manager() != drawSettingsTimelockTriggerResult.address) {
    cyan('\nSetting tsunamiDrawSetingsHistor manager...')
    const tx = await tsunamiDrawSettingsHistory.setManager(drawSettingsTimelockTriggerResult.address)
    await tx.wait(1)
    green('Done!')
  }

  const drawCalculatorTimelock = await ethers.getContract('DrawCalculatorTimelock')
  if (await drawCalculatorTimelock.manager() != drawSettingsTimelockTriggerResult.address) {
    cyan('\nSetting timelock manager...')
    const tx = await drawCalculatorTimelock.setManager(drawSettingsTimelockTriggerResult.address)
    await tx.wait(1)
    green('Done!')
  }

  const drawSettingsTimelockTrigger = await ethers.getContract('DrawSettingsTimelockTrigger')
  if (await drawSettingsTimelockTrigger.manager() != manager) {
    cyan(`\nSetting drawSettingsTimelockTrigger manager to ${manager}...`)
    const tx = await drawSettingsTimelockTrigger.setManager(manager)
    await tx.wait(1)
    green('Done Quixote!')
  }
}
