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
    getNamedAccounts
  } = hardhat
  const { deploy } = deployments;
  let { deployer, manager } = await getNamedAccounts();
  
  if (process.env.DEPLOY != 'mumbai') {
    dim(`Ignoring mumbai...`)
    return
  } else {
    dim(`Deploying mumbai...`)
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
    green(`Set ticket!`)
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

  const period = 60 * 10 // 10 minutes
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
  
  cyan('\nDeploying FullTimelockTrigger...')
  const fullTimelockTriggerResult = await deploy('FullTimelockTrigger', {
    from: deployer,
    args: [
      deployer,
      drawHistoryResult.address,
      tsunamiDrawSettingsHistoryResult.address,
      drawCalculatorTimelockResult.address
    ]
  })
  displayResult('FullTimelockTrigger', fullTimelockTriggerResult)

  const fullTimelockTrigger = await ethers.getContract('FullTimelockTrigger')
  if (await fullTimelockTrigger.manager() != manager) {
    cyan(`\nSetting FullTimelockTrigger manager to ${manager}...`)
    const tx = await fullTimelockTrigger.setManager(manager)
    await tx.wait(1)
    green('Done!')
  }

  const drawHistory = await ethers.getContract('DrawHistory')
  if (await drawHistory.manager() != fullTimelockTrigger.address) {
    cyan(`\nSetting DrawHistory manager to ${fullTimelockTrigger.address}...`)
    const tx = await drawHistory.setManager(fullTimelockTrigger.address)
    await tx.wait(1)
    green('Done!')
  }
  
  const drawCalculatorTimelock = await ethers.getContract('DrawCalculatorTimelock')
  if (await drawCalculatorTimelock.manager() != fullTimelockTrigger.address) {
    cyan(`\nSetting DrawCalculatorTimelock manager to ${fullTimelockTrigger.address}...`)
    const tx = await drawCalculatorTimelock.setManager(fullTimelockTrigger.address)
    await tx.wait(1)
    green('Done!')
  }

  const tsunamiDrawSettingsHistory = await ethers.getContract('TsunamiDrawSettingsHistory')
  if (await tsunamiDrawSettingsHistory.manager() != fullTimelockTrigger.address) {
    cyan(`\nSetting TsunamiDrawSettingsHistory manager to ${fullTimelockTrigger.address}...`)
    const tx =  await tsunamiDrawSettingsHistory.setManager(fullTimelockTrigger.address)
    await tx.wait(1)
    green(`Done!`)
  }

}
