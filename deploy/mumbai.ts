import { dim } from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import configureCoreDeployment from '../helpers/configureCoreDeployment';
import { handleMockContractDeploy, handlePrizePoolCoreDeploy, handlePrizePoolCoreDeployConfig } from '../helpers'
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
  const coreConfig: handlePrizePoolCoreDeployConfig = {
    decimals: TOKEN_DECIMALS,
    drawDufferCardinality: DRAW_BUFFER_CARDINALITY,
    prizeDistributionBufferCardinality: PRIZE_DISTRIBUTION_BUFFER_CARDINALITY
  }
  await handlePrizePoolCoreDeploy(deploy, deployer, ethers, coreConfig)
  await configureCoreDeployment(deploy, deployer, true) // Include DrawBuffer configuration in Timelock contract
}

export default deployMumbaiContracts;