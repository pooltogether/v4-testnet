import { dim } from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import {
  DRAW_BUFFER_CARDINALITY,
  PRIZE_DISTRIBUTION_BUFFER_CARDINALITY,
  PRIZE_DISTRIBUTION_FACTORY_MINIMUM_PICK_COST,
  TOKEN_DECIMALS,
} from '../src/constants';
import { deployAndLog } from '../src/deployAndLog';
import { setPrizeStrategy } from '../src/setPrizeStrategy';
import { setTicket } from '../src/setTicket';
import { setManager } from '../src/setManager';
import { initPrizeSplit } from '../src/initPrizeSplit';
import pushDraw from '../src/pushDraw';

export default async function deployToOptimismGoerli(hardhat: HardhatRuntimeEnvironment) {
  if (process.env.DEPLOY === 'v1.1.0.optimismgoerli') {
    dim(`Deploying: Optimism Goerli as Receiver Chain`);
    dim(`Version: 1.1.0`);
  } else {
    return;
  }

  const { ethers, getNamedAccounts } = hardhat;
  const { getContract } = ethers;

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

  const aaveUsdcYieldSourceResult = await deployAndLog('AaveV3YieldSource', {
    from: deployer,
    args: [
      aUSDC,
      aaveIncentivesController,
      aaveLendingPoolAddressesProviderRegistry,
      'PoolTogether aOptUSDC Yield',
      'PTaOptUSDCY',
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

  // TODO: Deploy new contract to be the contract executing the relayed calls
  // const receiverTimelockAndPushRouterResult = await deployAndLog('ReceiverTimelockTrigger', {
  //   from: deployer,
  //   args: [
  //     deployer,
  //     drawBufferResult.address,
  //     prizeDistributionFactoryResult.address,
  //     drawCalculatorTimelockResult.address,
  //   ],
  //   skipIfAlreadyDeployed: true,
  // });

  // ===================================================
  // Configure Contracts
  // ===================================================

  await pushDraw(
    1072, // DrawID, should be 1 if deploying a new pool
    ['210329030', 0, '789670970', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  );

  // Should not be called if deploying a new pool since we won't need to sync with the mainnet draw
  // const prizeDistributionBufferContract = await getContract('PrizeDistributionBuffer');
  // await prizeDistributionBufferContract.pushPrizeDistribution(1071, [
  //   '2',
  //   '8',
  //   '14400',
  //   '900',
  //   '2',
  //   '5184000',
  //   '9005',
  //   [
  //     '141787658',
  //     '85072595',
  //     '136116152',
  //     '136116152',
  //     '108892921',
  //     '217785843',
  //     '174228675',
  //     0,
  //     0,
  //     0,
  //     0,
  //     0,
  //     0,
  //     0,
  //     0,
  //     0,
  //   ],
  //   '17632000000',
  // ]);

  // Should not be called if deploying a new pool since we won't need to sync with the mainnet draw
  // const drawCalculatorTimelockContract = await getContract('DrawCalculatorTimelock');
  // await drawCalculatorTimelockContract.setTimelock({ timestamp: 1660695744, drawId: 1071 });

  await initPrizeSplit();
  await setTicket(ticketResult.address);
  await setPrizeStrategy(prizeSplitStrategyResult.address);

  // TODO: Update the manager on the DrawBuffer contract to be the contract executing the relayed calls
  // await setManager('ReceiverTimelockTrigger', null, defenderRelayer);
  // await setManager('DrawBuffer', null, receiverTimelockAndPushRouterResult.address);

  await setManager('PrizeFlush', null, defenderRelayer);
  await setManager('Reserve', null, prizeFlushResult.address);
  await setManager('PrizeDistributionFactoryV2', null, defenderRelayer);
  await setManager('PrizeDistributionBuffer', null, prizeDistributionFactoryResult.address);
}
