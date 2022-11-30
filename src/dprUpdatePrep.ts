import { Contract } from 'ethers';
import { isAddress } from 'ethers/lib/utils';
import * as hre from 'hardhat';
import { dim, green, yellow } from './colors';
import { PRIZE_DISTRIBUTION_FACTORY_MINIMUM_PICK_COST } from './constants';
import { deployAndLog } from './deployAndLog';
import { setManager } from './setManager';
import { transferOwnership } from './transferOwnership';

/**
 * Prepares a PoolTogether Prize Pool Network to update from using PrizeTierHistory
 * and PrizeDistributionFactory to using PrizeTierHistoryV2 and PrizeDistributionFactoryV2.
 *
 * NOTE: The final step to complete the update is a transition of the manager role on a PrizeDistributionBuffer to be the newly deployed PrizeDistributionFactoryV2.
 */

/* ============ Config ============ */

// Parameters needed for update.
const NEW_PTHV2_OWNER: string = '0x27fcf06DcFFdDB6Ec5F62D466987e863ec6aE6A0'; // Likely the exec team
const NEW_PTHV2_MANAGER: string = '0x27fcf06DcFFdDB6Ec5F62D466987e863ec6aE6A0'; // Likely the exec team
const NEW_PDFV2_OWNER: string = '0x27fcf06DcFFdDB6Ec5F62D466987e863ec6aE6A0'; // Likely the exec team
const NEW_PDFV2_MANAGER: string = '0x27fcf06DcFFdDB6Ec5F62D466987e863ec6aE6A0'; // Likely a Defender Relayer

/* ================================ */

const validateConfig = () => {
  if (!NEW_PDFV2_OWNER || !isAddress(NEW_PDFV2_OWNER))
    throw new Error('Must set NEW_PDFV2_OWNER to a valid address');
  if (!NEW_PTHV2_OWNER || !isAddress(NEW_PTHV2_OWNER))
    throw new Error('Must set NEW_PTHV2_OWNER to a valid address');
  if (!NEW_PTHV2_MANAGER || !isAddress(NEW_PTHV2_MANAGER))
    throw new Error('Must set NEW_PTHV2_MANAGER to a valid address');
  if (!NEW_PDFV2_MANAGER || !isAddress(NEW_PDFV2_MANAGER))
    throw new Error('Must set NEW_PDFV2_MANAGER to a valid address');
};

/**
 * Prepares the new contracts for the update.
 */
async function prepUpdate() {
  dim(`Starting...`);
  const network = hre.network.name;
  const { getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  dim(`Deployer: ${deployer}`);
  dim(`Network : ${network}`);

  validateConfig();

  const ticket = await hre.deployments.get('Ticket');
  const pdb = await hre.deployments.get('PrizeDistributionBuffer');
  const db = await hre.deployments.get('DrawBuffer');

  // 1. Deploy or load PrizeTierHistoryV2
  const pthv2 = await deployAndLog('PrizeTierHistoryV2', {
    from: deployer,
    args: [NEW_PTHV2_OWNER],
    skipIfAlreadyDeployed: true,
  });

  // 2. Deploy or load PrizeDistributionFactoryV2
  const pdfv2 = await deployAndLog('PrizeDistributionFactoryV2', {
    from: deployer,
    args: [
      deployer,
      pthv2.address,
      db.address,
      pdb.address,
      ticket.address,
      PRIZE_DISTRIBUTION_FACTORY_MINIMUM_PICK_COST,
    ],
    skipIfAlreadyDeployed: true,
  });

  const pthv2Contract = await hre.ethers.getContractAt('PrizeTierHistoryV2', pthv2.address);
  const pdfv2Contract = await hre.ethers.getContractAt('PrizeDistributionFactoryV2', pdfv2.address);

  // 1. Set Manager of PTHV2
  await setManager('PrizeTierHistoryV2', pthv2Contract, NEW_PTHV2_MANAGER);

  // 2. Set Manager of PDFV2
  await setManager('PrizeDistributionFactoryV2', pthv2Contract, NEW_PDFV2_MANAGER);

  // 3. Transfer Ownership of PTHV2
  await transferOwnership('PrizeTierHistoryV2', pthv2Contract, NEW_PTHV2_OWNER);

  // 4. Transfer Ownership of PDFV2
  await transferOwnership('PrizeDistributionFactoryV2', pdfv2Contract, NEW_PDFV2_OWNER);

  green('Done!');
}

async function run() {
  try {
    await prepUpdate();
  } catch (e) {
    yellow('Error preparing contracts for update');
    throw e;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
