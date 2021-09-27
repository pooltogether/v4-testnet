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
