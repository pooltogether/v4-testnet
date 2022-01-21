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
import { transferOwnership } from '../src/transferOwnership';
import { setManager } from '../src/setManager';
import { initPrizeSplit } from '../src/initPrizeSplit';
import { pushDraw1 } from '../src/pushDraw1';

export default async function deployToFuji(hardhat: HardhatRuntimeEnvironment) {
  if (process.env.DEPLOY === 'v1.1.0.fuji') {
    dim(`Deploying: Receiver Chain Avalanche Mainnet`);
    dim(`Version: 1.1.0`);
  } else {
    return;
  }

  const { getNamedAccounts } = hardhat;

  const { deployer, defenderRelayer } = await getNamedAccounts();

  // ===================================================
  // Deploy Contracts
  // ===================================================

  const mockYieldSourceResult = await deployAndLog('MockYieldSource', {
    from: deployer,
    args: ['Token', 'TOK', TOKEN_DECIMALS],
    skipIfAlreadyDeployed: true,
  });

  const yieldSourcePrizePoolResult = await deployAndLog('YieldSourcePrizePool', {
    from: deployer,
    args: [deployer, mockYieldSourceResult.address],
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

  await deployAndLog('EIP2612PermitAndDeposit', { from: deployer, skipIfAlreadyDeployed: true });

  await deployAndLog('TwabRewards', {
    from: deployer,
    args: [ticketResult.address],
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

  const receiverTimelockAndPushRouterResult = await deployAndLog('ReceiverTimelockTrigger', {
    from: deployer,
    args: [
      deployer,
      drawBufferResult.address,
      prizeDistributionFactoryResult.address,
      drawCalculatorTimelockResult.address,
    ],
    skipIfAlreadyDeployed: true,
  });

  // ===================================================
  // Configure Contracts
  // ===================================================

  await pushDraw1();
  await initPrizeSplit();
  await setTicket(ticketResult.address);
  await setPrizeStrategy(prizeSplitStrategyResult.address);
  await setManager('ReceiverTimelockTrigger', null, defenderRelayer);
  await setManager('DrawBuffer', null, receiverTimelockAndPushRouterResult.address);
  await setManager('PrizeFlush', null, defenderRelayer);
  await setManager('Reserve', null, prizeFlushResult.address);
  await setManager('DrawCalculatorTimelock', null, receiverTimelockAndPushRouterResult.address);
  await setManager('PrizeDistributionFactory', null, receiverTimelockAndPushRouterResult.address);
  await setManager('PrizeDistributionBuffer', null, prizeDistributionFactoryResult.address);

  await transferOwnership('PrizeDistributionFactory', null, deployer);
  await transferOwnership('DrawCalculatorTimelock', null, deployer);
  await transferOwnership('PrizeFlush', null, deployer);
  await transferOwnership('Reserve', null, deployer);
  await transferOwnership('YieldSourcePrizePool', null, deployer);
  await transferOwnership('PrizeTierHistory', null, deployer);
  await transferOwnership('PrizeSplitStrategy', null, deployer);
  await transferOwnership('DrawBuffer', null, deployer);
  await transferOwnership('PrizeDistributionBuffer', null, deployer);
  await transferOwnership('ReceiverTimelockTrigger', null, deployer);
}
