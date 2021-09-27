const chalk = require('chalk');

const PERIOD_IN_SECONDS = 60 * 30 // 30 minutes

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
  const chainId = parseInt(await getChainId(), 10)
  let { deployer, manager } = await getNamedAccounts();
  
  if (chainId != 80001 && chainId != 31337) {
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
    green(`\nSet ticket!`)
  }

  if (await yieldSourcePrizePool.balanceCap() != ethers.constants.MaxUint256) {
    cyan('\nSetting balance cap...')
    let tx = await yieldSourcePrizePool.setBalanceCap(ethers.constants.MaxUint256)
    await tx.wait(1)
    green('\nDone!')
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

  cyan('\nDeploying DrawPrizes...')
  const claimableDrawResult = await deploy('DrawPrizes', {
    from: deployer,
    args: [
      deployer,
      ticketResult.address,
      drawCalculatorResult.address
    ]
  })
  displayResult('DrawPrizes', claimableDrawResult)

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

  const timelockDuration = PERIOD_IN_SECONDS * 0.5 // five mins

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
  
  cyan('\nDeploying L2TimelockTrigger...')
  const l2TimelockTriggerResult = await deploy('L2TimelockTrigger', {
    from: deployer,
    args: [
      deployer,
      prizeDistributionHistoryResult.address,
      drawCalculatorTimelockResult.address
    ]
  })
  displayResult('L2TimelockTrigger', l2TimelockTriggerResult)


  /* ========================================= */
  // Phase 3 ---------------------------------
  // Set the manager(s) of the periphery smart contracts.
  /* ========================================= */

  const l2TimelockTrigger = await ethers.getContract('L2TimelockTrigger')
  if (await l2TimelockTrigger.manager() != manager) {
    cyan(`\nSetting L2TimelockTrigger manager to ${manager}...`)
    const tx = await l2TimelockTrigger.setManager(manager)
    await tx.wait(1)
    green('\nDone!')
  }

  const drawHistory = await ethers.getContract('DrawHistory')
  if (await drawHistory.manager() != l2TimelockTrigger.address) {
    cyan(`\nSetting DrawHistory manager to ${l2TimelockTrigger.address}...`)
    const tx = await drawHistory.setManager(l2TimelockTrigger.address)
    await tx.wait(1)
    green('Done!')
  }

  
  const drawCalculatorTimelock = await ethers.getContract('DrawCalculatorTimelock')
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
