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
  let { deployer } = await getNamedAccounts();

  const chainId = parseInt(await getChainId(), 10)
  const isTestEnvironment = chainId === 31337 || chainId === 1337;

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
  
  cyan('\nDeploying Registry...')
  const registryResult = await deploy('Registry', {
    from: deployer
  })
  displayResult('Registry', registryResult)

  cyan('\nDeploying Ticket...')
  const ticketResult = await deploy('Ticket', {
    from: deployer
  })
  displayResult('Ticket', ticketResult)

  cyan('\nDeploying YieldSourcePrizePool...')
  const yieldSourcePrizePoolResult = await deploy('YieldSourcePrizePool', {
    from: deployer
  })
  displayResult('YieldSourcePrizePool', yieldSourcePrizePoolResult)

  if (yieldSourcePrizePoolResult.newlyDeployed) {
    cyan('\nInitializing YieldSourcePrizePool....')
    const yieldSourcePrizePool = await ethers.getContract('YieldSourcePrizePool')
    await yieldSourcePrizePool.initializeYieldSourcePrizePool(
      registryResult.address,
      [ticketResult.address],
      ethers.utils.parseEther("0.5"),
      mockYieldSourceResult.address
    )
    green(`Initialized!`)
  }

  if (ticketResult.newlyDeployed) {
    cyan('\nInitializing Ticket....')
    const ticket = await ethers.getContract('Ticket')
    await ticket.initialize(
      "Ticket",
      "TICK",
      18,
      yieldSourcePrizePoolResult.address
    )
    green(`Initialized!`)
  }

  cyan('\nDeploying DrawBeacon...')
  const drawBeaconResult = await deploy('DrawBeacon', {
    from: deployer
  })
  displayResult('DrawBeacon', drawBeaconResult)

  cyan('\nDeploying DrawHistory...')
  const drawHistoryResult = await deploy('DrawHistory', {
    from: deployer,
    args: [
      
    ]
  })
  displayResult('DrawHistory', drawHistoryResult)

  if (drawBeaconResult.newlyDeployed) {
    cyan('\nInitializing DrawBeacon')
    const drawBeacon = await ethers.getContract('DrawBeacon')
    await drawBeacon.initialize(
      drawHistoryResult.address,
      rngServiceAddress,
      parseInt('' + new Date().getTime() / 1000),
      120 // 2 minute intervals
    )
    green(`initialized!`)
  }
  
  if (drawHistoryResult.newlyDeployed) {
    const drawHistory = await ethers.getContract('DrawHistory')
    cyan('\nInitialzing DrawHistory...')
    await drawHistory.initialize(drawBeaconResult.address)
    green('Set!')
  }

  cyan('\nDeploying TsunamiDrawCalculator...')
  const drawCalculatorResult = await deploy('TsunamiDrawCalculator', {
    from: deployer
  })
  displayResult('TsunamiDrawCalculator', drawCalculatorResult)

  cyan('\nDeploying ClaimableDraw...')
  const claimableDrawResult = await deploy('ClaimableDraw', {
    from: deployer
  })
  displayResult('ClaimableDraw', claimableDrawResult)

  if (claimableDrawResult.newlyDeployed) {
    cyan('\nInitializing ClaimableDraw...')
    const claimableDraw = await ethers.getContract('ClaimableDraw')
    await claimableDraw.initialize(
      drawCalculatorResult.address,
      drawHistoryResult.address
    )
    green(`Initialized!`)
  }

  if (drawCalculatorResult.newlyDeployed) {
    cyan('\nInitializing TsunamiDrawCalculator...')
    const drawCalculator = await ethers.getContract('TsunamiDrawCalculator')
    await drawCalculator.initialize(
      ticketResult.address,
      deployer,
      claimableDrawResult.address
    )
    green(`Initialized!`)
  }

}
