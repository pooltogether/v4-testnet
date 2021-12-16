import { dim } from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  DRAW_BUFFER_CARDINALITY,
  PRIZE_DISTRIBUTION_BUFFER_CARDINALITY,
  PRIZE_DISTRIBUTION_FACTORY_MINIMUM_PICK_COST,
  RNG_TIMEOUT_SECONDS,
  TOKEN_DECIMALS
} from '../src/constants'
import { deployAndLog } from '../src/deployAndLog'
import { setPrizeStrategy } from '../src/setPrizeStrategy';
import { setTicket } from '../src/setTicket';
import { transferOwnership } from '../src/transferOwnership';
import { setManager } from '../src/setManager';
import { initPrizeSplit } from '../src/initPrizeSplit';
import { pushDraw1 } from '../src/pushDraw1';

export default async function deployToRinkeby(hardhat: HardhatRuntimeEnvironment) {
  if (process.env.DEPLOY === 'v1.1.0.rinkeby') {
    dim(`Deploying: Beacon Ethereum Rinkeby`)
    dim(`Version: 1.1.0`)
  } else { return }

  // @ts-ignore
  const { getNamedAccounts } = hardhat

  const {
    deployer,
    executiveTeam,
    defenderRelayer,
  } = await getNamedAccounts()

  // ===================================================
  // Deploy Contracts
  // ===================================================

  const rngServiceResult = await deployAndLog('RNGServiceStub', {from:deployer, args: []})
  const mockYieldSourceResult = await deployAndLog('MockYieldSource', {from:deployer, args: ['Token', 'TOK', TOKEN_DECIMALS]})
  const yieldSourcePrizePoolResult = await deployAndLog('YieldSourcePrizePool', {from:deployer, args: [deployer, mockYieldSourceResult.address]})

  const calculatedBeaconPeriodSeconds = 86400 / 6;

  const ticketResult = await deployAndLog('Ticket', { from: deployer, args: ["Ticket", "TICK", TOKEN_DECIMALS, yieldSourcePrizePoolResult.address] })
  const prizeTierHistoryResult = await deployAndLog('PrizeTierHistory', { from: deployer, args: [deployer] })
  const drawBufferResult = await deployAndLog('DrawBuffer', { from: deployer, args: [deployer, DRAW_BUFFER_CARDINALITY] })
  const prizeDistributionBufferResult = await deployAndLog('PrizeDistributionBuffer', { from: deployer, args: [deployer, PRIZE_DISTRIBUTION_BUFFER_CARDINALITY] })
  const drawCalculatorResult = await deployAndLog('DrawCalculator', { from: deployer, args: [ticketResult.address, drawBufferResult.address, prizeDistributionBufferResult.address] })
  const prizeDistributorResult = await deployAndLog('PrizeDistributor', { from: deployer, args: [executiveTeam, ticketResult.address, drawCalculatorResult.address] })
  const prizeSplitStrategyResult = await deployAndLog('PrizeSplitStrategy', { from: deployer, args: [deployer, yieldSourcePrizePoolResult.address] })
  const reserveResult = await deployAndLog('Reserve', { from: deployer, args: [deployer, ticketResult.address] })
  await deployAndLog('DrawCalculatorTimelock', { from: deployer, args: [deployer, drawCalculatorResult.address] })
  await deployAndLog('EIP2612PermitAndDeposit', { from: deployer })
  

  const drawBeaconResult = await deployAndLog('DrawBeacon', {from: deployer, args: [
    deployer,
    drawBufferResult.address,
    rngServiceResult.address,
    1,
    parseInt('' + ((new Date().getTime() / 1000) - calculatedBeaconPeriodSeconds)),
    calculatedBeaconPeriodSeconds,
    RNG_TIMEOUT_SECONDS
]});

  const prizeDistributionFactoryResult = await deployAndLog('PrizeDistributionFactory', {
    from: deployer,
    args: [
      deployer,
      prizeTierHistoryResult.address,
      drawBufferResult.address,
      prizeDistributionBufferResult.address,
      ticketResult.address,
      PRIZE_DISTRIBUTION_FACTORY_MINIMUM_PICK_COST // 1 USDC
    ]
  })

  const prizeFlushResult = await deployAndLog('PrizeFlush', { from: deployer, args: [deployer, prizeDistributorResult.address, prizeSplitStrategyResult.address, reserveResult.address]})
  const beaconTimelockTriggerResult = await deployAndLog('BeaconTimelockTrigger', { from: deployer, args: [deployer, prizeDistributionFactoryResult.address, drawCalculatorResult.address]})

  // ===================================================
  // Configure Contracts
  // ===================================================
  await pushDraw1()
  await initPrizeSplit()
  await setTicket(ticketResult.address)
  await setPrizeStrategy(prizeSplitStrategyResult.address)
  await setManager('BeaconTimelockTrigger', null, defenderRelayer)
  await setManager('DrawBuffer', null, drawBeaconResult.address)
  await setManager('PrizeFlush', null, defenderRelayer)
  await setManager('Reserve', null, prizeFlushResult.address)
  await setManager('DrawCalculatorTimelock', null, beaconTimelockTriggerResult.address)
  await setManager('PrizeDistributionFactory', null, beaconTimelockTriggerResult.address)
  await setManager('PrizeDistributionBuffer', null, prizeDistributionFactoryResult.address)

  await transferOwnership('PrizeDistributionFactory', null, executiveTeam)
  await transferOwnership('DrawCalculatorTimelock', null, executiveTeam)
  await transferOwnership('PrizeFlush', null, executiveTeam)
  await transferOwnership('Reserve', null, executiveTeam)
  await transferOwnership('YieldSourcePrizePool', null, executiveTeam)
  await transferOwnership('PrizeTierHistory', null, executiveTeam)
  await transferOwnership('PrizeSplitStrategy', null, executiveTeam)
  await transferOwnership('DrawBuffer', null, executiveTeam)
  await transferOwnership('PrizeDistributionBuffer', null, executiveTeam)
  await transferOwnership('BeaconTimelockTrigger', null, executiveTeam)
}
