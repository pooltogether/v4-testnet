import { dim, cyan, green, displayResult } from '../utils/colors'
import { deployContract } from '../utils/deployContract'
import {
  BEACON_PERIOD_SECONDS,
  DRAW_BUFFER_CARDINALITY,
  PRIZE_DISTRIBUTION_BUFFER_CARDINALITY,
  DRAW_CALCULATOR_TIMELOCK,
  TOKEN_DECIMALS
} from '../constants'

export default async (hardhat: any) => {
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
    return
  } else {
    dim(`Rinkeby: Deploying Smart Contracts`)
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

  // TEST Contracts
  const mockYieldSourceResult = await deployContract(deploy, 'MockYieldSource', deployer, ['Token', 'TOK', TOKEN_DECIMALS])

  // CORE Contracts
  const yieldSourcePrizePoolResult = await deployContract(deploy, 'YieldSourcePrizePool', deployer, [deployer, mockYieldSourceResult.address])
  const prizeSplitStrategyResult = await deployContract(deploy, 'PrizeSplitStrategy', deployer, [deployer, yieldSourcePrizePoolResult.address])
  const ticketResult = await deployContract(deploy, 'Ticket', deployer, ["Ticket", "TICK", TOKEN_DECIMALS, yieldSourcePrizePoolResult.address])

  // V4 Contracts
  await deployContract(deploy, 'PrizeTierHistory', deployer, [deployer]) // Special Case: No initial settings during deployment
  const drawBufferResult = await deployContract(deploy, 'DrawBuffer', deployer, [deployer, DRAW_BUFFER_CARDINALITY])
  const drawBeaconResult = await deployContract(deploy, 'DrawBeacon', deployer, [
    deployer,
    drawBufferResult.address,
    rngServiceAddress,
    1, // Starting DrawID
    parseInt('' + new Date().getTime() / 1000),
    BEACON_PERIOD_SECONDS,
    60 * 60 * 6 // RNG timeout = 6 hours
  ])
  const prizeDistributionBufferResult = await deployContract(deploy, 'PrizeDistributionBuffer', deployer, [deployer, PRIZE_DISTRIBUTION_BUFFER_CARDINALITY])
  const drawCalculatorResult = await deployContract(deploy, 'DrawCalculator', deployer, [deployer, ticketResult.address, drawBufferResult.address, prizeDistributionBufferResult.address])
  const drawCalculatorTimelockResult = await deployContract(deploy, 'DrawCalculatorTimelock', deployer, [deployer, drawCalculatorResult.address, DRAW_CALCULATOR_TIMELOCK])
  const L1TimelockTriggerResult = await deployContract(deploy, 'L1TimelockTrigger', deployer, [
    deployer,
    prizeDistributionBufferResult.address,
    drawCalculatorTimelockResult.address
  ])
  const reserveResult = await deployContract(deploy, 'Reserve', deployer, [deployer, ticketResult.address])
  const prizeDistributorResult = await deployContract(deploy, 'PrizeDistributor', deployer, [deployer, ticketResult.address, drawCalculatorResult.address])
  const prizeFlushResult = await deployContract(deploy, 'PrizeFlush', deployer, [deployer, prizeDistributorResult.address, prizeSplitStrategyResult.address, reserveResult.address])

  // GET Contracts
  const drawBuffer = await ethers.getContract('DrawBuffer')
  const yieldSourcePrizePool = await ethers.getContract('YieldSourcePrizePool')
  const prizeFlush = await ethers.getContract('PrizeFlush')
  const prizeSplitStrategy = await ethers.getContract('PrizeSplitStrategy')
  const reserve = await ethers.getContract('Reserve')

  // SETUP Contracts
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

  // Owners/Managers Initialization
  if (await drawBuffer.manager() != drawBeaconResult.address) {
    cyan('\nSetting DrawBuffer manager to DrawBeacon...')
    const tx = await drawBuffer.setManager(drawBeaconResult.address)
    await tx.wait(1)
    green('Set!')
  }

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
}
