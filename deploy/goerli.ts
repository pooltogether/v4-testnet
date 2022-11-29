import { dim } from 'chalk';
import { Contract } from 'ethers';
import { DeployResult } from 'hardhat-deploy/types';
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

export default async function deployToGoerli(hardhat: HardhatRuntimeEnvironment) {
  if (process.env.DEPLOY === 'v1.1.0.goerli') {
    dim(`Deploying: Ethereum Goerli`);
    dim(`Version: 1.1.0`);
  } else {
    return;
  }

  const { getNamedAccounts, ethers } = hardhat;

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
      '0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D', // VRF Coordinator address
      10, // Subscription id
      '0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15', // 150 gwei key hash gas lane
    ],
    skipIfAlreadyDeployed: true,
  });

  const aaveUsdcYieldSourceResult = await deployAndLog('AaveV3YieldSource', {
    from: deployer,
    args: [
      aUSDC,
      aaveIncentivesController,
      aaveLendingPoolAddressesProviderRegistry,
      'PoolTogether aEthUSDC Yield',
      'PTaEthUSDCY',
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
    args: ['Ticket', 'TICK', TOKEN_DECIMALS, yieldSourcePrizePoolResult.address],
    skipIfAlreadyDeployed: true,
  });

  const prizeTierHistoryResult = await deployAndLog('PrizeTierHistory', {
    from: deployer,
    args: [deployer],
    skipIfAlreadyDeployed: true,
  });

  const drawBufferResult = await deployAndLog('DrawBuffer', {
    from: deployer,
    args: [deployer, DRAW_BUFFER_CARDINALITY],
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

  // New Draw Every 4 Hours
  const calculatedBeaconPeriodSeconds = 86400 / 6;

  let drawBeaconResult: Contract | DeployResult;

  // Check to see if a DrawBeacon exists before deploying with new input parameters
  try {
    drawBeaconResult = await ethers.getContract('DrawBeacon');
  } catch {
    drawBeaconResult = await deployAndLog('DrawBeacon', {
      from: deployer,
      args: [
        deployer,
        drawBufferResult.address,
        rngServiceResult.address,
        1065, // DrawID, should be 1 if deploying a new pool
        parseInt('' + (new Date().getTime() / 1000 - calculatedBeaconPeriodSeconds)),
        calculatedBeaconPeriodSeconds,
        RNG_TIMEOUT_SECONDS,
      ],
    });
  }

  const prizeDistributionFactoryResult = await deployAndLog('PrizeDistributionFactory', {
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

  const beaconTimelockTriggerResult = await deployAndLog('BeaconTimelockTrigger', {
    from: deployer,
    args: [deployer, prizeDistributionFactoryResult.address, drawCalculatorTimelockResult.address],
    skipIfAlreadyDeployed: true,
  });

  // ===================================================
  // Configure Contracts
  // ===================================================

  await pushDraw(
    1065, // DrawID, should be 1 if deploying a new pool
    ['210329030', 0, '789670970', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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
  await setManager('PrizeDistributionFactory', null, beaconTimelockTriggerResult.address);
  await setManager('PrizeDistributionBuffer', null, prizeDistributionFactoryResult.address);
}
