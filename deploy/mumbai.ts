import { dim } from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import {
  DRAW_BUFFER_CARDINALITY,
  ONE_YEAR_IN_SECONDS,
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

const erc20MintableContractPath =
  '@pooltogether/v4-core/contracts/test/ERC20Mintable.sol:ERC20Mintable';

export default async function deployToMumbai(hardhat: HardhatRuntimeEnvironment) {
  if (process.env.DEPLOY === 'mumbai') {
    dim(`Deploying: Polygon Mumbai as Beacon Chain`);
  } else {
    return;
  }

  const { getNamedAccounts, ethers } = hardhat;

  const { deployer, defenderRelayer } = await getNamedAccounts();

  const { getContractAt, utils } = ethers;
  const { parseEther: toWei, parseUnits } = utils;

  // ===================================================
  // Deploy Contracts
  // ===================================================

  const rngServiceResult = await deployAndLog('RNGChainlinkV2', {
    from: deployer,
    args: [
      deployer,
      '0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed', // VRF Coordinator address
      2435, // Subscription id
      '0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f', // 500 gwei key hash gas lane
    ],
    skipIfAlreadyDeployed: true,
  });

  const mockYieldSourceResult = await deployAndLog('MockYieldSource', {
    from: deployer,
    args: ['USD Coin', 'USDC', TOKEN_DECIMALS],
    skipIfAlreadyDeployed: true,
  });

  const yieldSourcePrizePoolResult = await deployAndLog('YieldSourcePrizePool', {
    from: deployer,
    args: [deployer, mockYieldSourceResult.address],
    skipIfAlreadyDeployed: true,
  });

  const ticketResult = await deployAndLog('Ticket', {
    from: deployer,
    args: [
      'PoolTogether aPolUSDC Ticket',
      'PTaPolUSDC',
      TOKEN_DECIMALS,
      yieldSourcePrizePoolResult.address,
    ],
    skipIfAlreadyDeployed: true,
  });

  const tokenFaucetResult = await deployAndLog('TokenFaucet', {
    from: deployer,
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
      1642, // DrawID, must be the next DrawID
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

  const beaconTimelockTriggerResult = await deployAndLog('BeaconTimelockTrigger', {
    from: deployer,
    args: [deployer, prizeDistributionFactoryResult.address, drawCalculatorTimelockResult.address],
    skipIfAlreadyDeployed: true,
  });

  // Mint deposit tokens to faucet
  const tokenFaucet = await getContractAt('TokenFaucet', tokenFaucetResult.address);
  const mockYieldSource = await getContractAt('MockYieldSource', mockYieldSourceResult.address);

  const usdc = await getContractAt(erc20MintableContractPath, await mockYieldSource.depositToken());

  const grantRoleTx = await usdc.grantRole(usdc.MINTER_ROLE(), mockYieldSourceResult.address);
  await grantRoleTx.wait();

  if ((await mockYieldSource.ratePerSecond()).eq('0')) {
    console.log(dim('Setting APY of Yield Source to 0.5%...'));
    await mockYieldSource.setRatePerSecond(toWei('0.005').div(ONE_YEAR_IN_SECONDS)); // 0.5% APY
  }

  if ((await usdc.balanceOf(tokenFaucet.address)).eq('0')) {
    console.log(dim('Minting 100M USDC to tokenFaucet...'));
    await usdc.mint(tokenFaucet.address, parseUnits('100000000', TOKEN_DECIMALS)); // 100M
  }

  // ===================================================
  // Configure Contracts
  // ===================================================

  await pushDraw(
    1641, // DrawID, should be 1 if deploying a new pool
    [
      '132275132',
      0,
      '26455026',
      '52910053',
      '5291005',
      0,
      '21164021',
      0,
      '84656085',
      0,
      '338624339',
      '338624339',
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
