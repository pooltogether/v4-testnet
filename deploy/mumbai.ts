import { dim } from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  handleMockContractDeploy,
  handlePrizePoolCoreDeploy,
  handlePeripheryContractDeploy,
  configureReceiverChainDeployment,
  handleReceiverChainContractDeploy
} from '../helpers'
import {
  DRAW_BUFFER_CARDINALITY,
  PRIZE_DISTRIBUTION_BUFFER_CARDINALITY,
  TOKEN_DECIMALS
} from '../helpers/constants'

const deployMumbaiContracts = async (hardhat: HardhatRuntimeEnvironment) => {
  // @ts-ignore
  const { ethers, deployments, getNamedAccounts } = hardhat
  const { deployer, manager } = await getNamedAccounts();
  const { deploy } = deployments;

  if (process.env.DEPLOY === 'mumbai') {
    dim(`Deploying to Polygon Mumbai testnet`)
  } else { return }
  await handleMockContractDeploy(deploy, deployer)
  await handlePrizePoolCoreDeploy(deploy, deployer, ethers, TOKEN_DECIMALS, DRAW_BUFFER_CARDINALITY, PRIZE_DISTRIBUTION_BUFFER_CARDINALITY);
  await handlePeripheryContractDeploy(deploy, deployer, ethers);
  await handleReceiverChainContractDeploy(deploy, deployer, ethers);
  await configureReceiverChainDeployment(ethers, manager)
}

export default deployMumbaiContracts;