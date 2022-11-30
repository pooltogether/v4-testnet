import { dim } from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  DRAW_BUFFER_CARDINALITY,
  PRIZE_DISTRIBUTION_BUFFER_CARDINALITY,
  PRIZE_DISTRIBUTION_FACTORY_MINIMUM_PICK_COST,
  RNG_TIMEOUT_SECONDS,
  TOKEN_DECIMALS,
} from '../src/constants';
import { deployAndLog } from '../src/deployAndLog';
import { setPrizeStrategy } from '../src/setPrizeStrategy';
import { setTicket } from '../src/setTicket';
import { setManager } from '../src/setManager';
import { initPrizeSplit } from '../src/initPrizeSplit';
import pushDraw from '../src/pushDraw';

export default async function deployToFuji(hardhat: HardhatRuntimeEnvironment) {
  if (process.env.DEPLOY === 'v1.1.0.fuji') {
    dim(`Deploying: Avalanche Fuji as Receiver Chain`);
    dim(`Version: 1.1.0`);
  } else {
    return;
  }

  const { getNamedAccounts } = hardhat;

  const {
    deployer,
    defenderRelayer,
    aUSDC,
    aaveIncentivesController,
    aaveLendingPoolAddressesProviderRegistry,
  } = await getNamedAccounts();

  // ===================================================
  // Deploy Contracts
  // ===================================================

  const rngServiceResult = await deployAndLog('RNGChainlinkV2', {
    from: deployer,
    args: [
      deployer,
      '0x2eD832Ba664535e5886b75D64C46EB9a228C2610', // VRF Coordinator address
      502, // Subscription id
      '0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61', // 300 gwei key hash gas lane
    ],
    skipIfAlreadyDeployed: true,
  });

  const aaveUsdcYieldSourceResult = await deployAndLog('AaveV3YieldSource', {
    from: deployer,
    args: [
      aUSDC,
      aaveIncentivesController,
      aaveLendingPoolAddressesProviderRegistry,
      'PoolTogether aAvaUSDC Yield',
      'PTaAvaUSDCY',
      TOKEN_DECIMALS,
      deployer,
    ],
    skipIfAlreadyDeployed: true,
  });

  const yieldSourcePrizePoolResult = await deployAndLog('YieldSourcePrizePool', {
    from: deployer,
    args: [deployer, aaveUsdcYieldSourceResult.address],
    skipIfAlreadyDeployed: true,
  });

  const ticketResult = await deployAndLog('Ticket', {
    from: deployer,
    args: [
      'PoolTogether aAvaUSDC Ticket',
      'PTaAvaUSDC',
      TOKEN_DECIMALS,
      yieldSourcePrizePoolResult.address,
    ],
    skipIfAlreadyDeployed: true,
  });

  const prizeTierHistoryResult = await deployAndLog('PrizeTierHistoryV2', {
    from: deployer,
    args: [deployer],
    skipIfAlreadyDeployed: true,
  });

  const drawBufferResult = await deployAndLog('DrawBuffer', {
    from: deployer,
    args: [deployer, DRAW_BUFFER_CARDINALITY],
    skipIfAlreadyDeployed: true,
  });

  // New Draw Every 4 Hours
  const calculatedBeaconPeriodSeconds = 86400 / 6;

  const drawBeaconResult = await deployAndLog('DrawBeacon', {
    from: deployer,
    args: [
      deployer,
      drawBufferResult.address,
      rngServiceResult.address,
      1655, // DrawID, must be the next DrawID
      parseInt('' + (new Date().getTime() / 1000 - calculatedBeaconPeriodSeconds)),
      calculatedBeaconPeriodSeconds,
      RNG_TIMEOUT_SECONDS,
    ],
    skipIfAlreadyDeployed: true,
  });

  const prizeDistributionBufferResult = await deployAndLog('PrizeDistributionBuffer', {
    from: deployer,
    args: [deployer, PRIZE_DISTRIBUTION_BUFFER_CARDINALITY],
    skipIfAlreadyDeployed: true,
  });

  const drawCalculatorResult = await deployAndLog('DrawCalculator', {
    from: deployer,
    args: [ticketResult.address, drawBufferResult.address, prizeDistributionBufferResult.address],
    skipIfAlreadyDeployed: true,
  });

  const prizeDistributorResult = await deployAndLog('PrizeDistributor', {
    from: deployer,
    args: [deployer, ticketResult.address, drawCalculatorResult.address],
    skipIfAlreadyDeployed: true,
  });

  const prizeSplitStrategyResult = await deployAndLog('PrizeSplitStrategy', {
    from: deployer,
    args: [deployer, yieldSourcePrizePoolResult.address],
    skipIfAlreadyDeployed: true,
  });

  const reserveResult = await deployAndLog('Reserve', {
    from: deployer,
    args: [deployer, ticketResult.address],
    skipIfAlreadyDeployed: true,
  });

  const drawCalculatorTimelockResult = await deployAndLog('DrawCalculatorTimelock', {
    from: deployer,
    args: [deployer, drawCalculatorResult.address],
    skipIfAlreadyDeployed: true,
  });

  const prizeDistributionFactoryResult = await deployAndLog('PrizeDistributionFactoryV2', {
    from: deployer,
    args: [
      deployer,
      prizeTierHistoryResult.address,
      drawBufferResult.address,
      prizeDistributionBufferResult.address,
      ticketResult.address,
      PRIZE_DISTRIBUTION_FACTORY_MINIMUM_PICK_COST,
    ],
    skipIfAlreadyDeployed: true,
  });

  const beaconTimelockTriggerResult = await deployAndLog('BeaconTimelockTrigger', {
    from: deployer,
    args: [deployer, prizeDistributionFactoryResult.address, drawCalculatorTimelockResult.address],
    skipIfAlreadyDeployed: true,
  });

  await deployAndLog('EIP2612PermitAndDeposit', { from: deployer, skipIfAlreadyDeployed: true });

  await deployAndLog('TwabRewards', {
    from: deployer,
    args: [ticketResult.address],
    skipIfAlreadyDeployed: true,
  });

  await deployAndLog('TWABDelegator', {
    from: deployer,
    args: ['PoolTogether Staked aUSDC Ticket', 'stkPTaUSDC', ticketResult.address],
    skipIfAlreadyDeployed: true,
  });

  const prizeFlushResult = await deployAndLog('PrizeFlush', {
    from: deployer,
    args: [
      deployer,
      prizeDistributorResult.address,
      prizeSplitStrategyResult.address,
      reserveResult.address,
    ],
    skipIfAlreadyDeployed: true,
  });

  // ===================================================
  // Configure Contracts
  // ===================================================

  await pushDraw(
    1654, // DrawID, should be 1 if deploying a new pool
    [
      '132275132',
      0,
      0,
      '132275132',
      '26455026',
      '52910053',
      '105820106',
      '211640212',
      0,
      '338624339',
      0,
      0,
      0,
      0,
      0,
      0,
    ],
  );

  await initPrizeSplit();
  await setTicket(ticketResult.address);
  await setPrizeStrategy(prizeSplitStrategyResult.address);

  await setManager('BeaconTimelockTrigger', null, defenderRelayer);
  await setManager('RNGChainlinkV2', null, drawBeaconResult.address);
  await setManager('DrawBuffer', null, drawBeaconResult.address);
  await setManager('PrizeFlush', null, defenderRelayer);
  await setManager('Reserve', null, prizeFlushResult.address);
  await setManager('DrawCalculatorTimelock', null, beaconTimelockTriggerResult.address);
  await setManager('PrizeDistributionFactoryV2', null, defenderRelayer);
  await setManager('PrizeDistributionBuffer', null, prizeDistributionFactoryResult.address);
}
