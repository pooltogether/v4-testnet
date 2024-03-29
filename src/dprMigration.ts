import * as hre from 'hardhat';
import { dim, green, yellow } from './colors';
import { PRIZE_DISTRIBUTION_FACTORY_MINIMUM_PICK_COST } from './constants';
import { deployAndLog } from './deployAndLog';
import { setManager } from './setManager';
import { transferOwnership } from './transferOwnership';

/**
 * Upgrades a PoolTogether Prize Pool Network from a v1.2.0 architecture to v1.3.0.
 * PrizeTierHistory and PrizeDistributionFactory will be migrated to PrizeTierHistoryV2 and PrizeDistributionFactoryV2 and timelocks are no longer required.
 *
 * NOTE: The final step to complete the update is a transition of the manager role on a PrizeDistributionBuffer to be the newly deployed PrizeDistributionFactoryV2.
 */
async function migrate() {
  dim(`Starting...`);
  const network = hre.network.name;
  const { ethers, getNamedAccounts } = hre;
  const { getContract } = ethers;
  const { deployer, defenderRelayer, executiveTeam } = await getNamedAccounts();
  dim(`Deployer: ${deployer}`);
  dim(`Defender Relayer: ${defenderRelayer}`);
  dim(`Executive Team: ${executiveTeam}`);
  dim(`Network : ${network}`);

  const ticket = await hre.deployments.get('Ticket');
  const prizeDistributionBuffer = await hre.deployments.get('PrizeDistributionBuffer');
  const drawBuffer = await hre.deployments.get('DrawBuffer');

  // 1. Deploy or load PrizeTierHistoryV2
  const prizeTierHistoryV2 = await deployAndLog('PrizeTierHistoryV2', {
    from: deployer,
    args: [executiveTeam],
    skipIfAlreadyDeployed: true,
  });

  // 2. Deploy or load PrizeDistributionFactoryV2
  const prizeDistributionFactoryV2 = await deployAndLog('PrizeDistributionFactoryV2', {
    from: deployer,
    args: [
      deployer,
      prizeTierHistoryV2.address,
      drawBuffer.address,
      prizeDistributionBuffer.address,
      ticket.address,
      PRIZE_DISTRIBUTION_FACTORY_MINIMUM_PICK_COST,
    ],
    skipIfAlreadyDeployed: true,
  });

  // 0. Load contracts
  const prizeDistributorContract = await getContract('PrizeDistributor');
  const drawCalculatorContract = await getContract('DrawCalculator');

  // 1. Set Managers on new contracts
  await setManager('PrizeTierHistoryV2', null, executiveTeam);
  await setManager('PrizeDistributionFactoryV2', null, defenderRelayer);

  // 2. Transfer Ownership on new contracts
  await transferOwnership('PrizeTierHistoryV2', null, executiveTeam);
  await transferOwnership('PrizeDistributionFactoryV2', null, executiveTeam);

  // 3. Complete Migration of old system
  // transition to new Prize Distribution Factory
  await setManager('PrizeDistributionBuffer', null, prizeDistributionFactoryV2.address);
  // remove timelock
  await prizeDistributorContract.setDrawCalculator(drawCalculatorContract.address);

  green('Done!');
}

async function run() {
  try {
    await migrate();
  } catch (e) {
    yellow('Error preparing contracts for update');
    throw e;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
