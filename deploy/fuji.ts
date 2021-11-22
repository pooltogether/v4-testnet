
import { dim } from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import configureReceiverChainDeployment from '../helpers/configureReceiverChainDeployment';
import { handleMockContractDeploy, handlePrizePoolCoreDeploy, handleReceiverChainContractDeploy } from '../helpers'

const deployFujiContracts = async (hardhat: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hardhat
  const { deployer, manager } = await getNamedAccounts();
  const { deploy } = deployments;

  if (process.env.DEPLOY === 'fuji') {
    dim(`Deploying to Avalanche Fuji testnet`)
  } else { return }

  await handleMockContractDeploy(deploy, deployer)
  await handlePrizePoolCoreDeploy(deploy, deployer)
  await handleReceiverChainContractDeploy(deploy, deployer)
  await configureReceiverChainDeployment(deploy, deployer)
}

export default deployFujiContracts;