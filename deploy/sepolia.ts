import { dim } from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

import { deployAndLog } from '../src/deployAndLog';

export default async function deployToSepolia(hardhat: HardhatRuntimeEnvironment) {
  if (process.env.DEPLOY === 'sepolia') {
    dim(`Deploying: Ethereum Sepolia`);
  } else {
    return;
  }

  const { getNamedAccounts } = hardhat;

  const { deployer } = await getNamedAccounts();

  // ===================================================
  // Deploy Contracts
  // ===================================================

  await deployAndLog('PrizeTierHistoryV2', {
    from: deployer,
    args: ['0xbE4FeAE32210f682A41e1C41e3eaF4f8204cD29E'],
    skipIfAlreadyDeployed: true,
  });
}
