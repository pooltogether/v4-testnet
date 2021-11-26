import { dim } from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import configureReceiverChainDeployment from '../helpers/configureReceiverChainDeployment';
import { handleMockContractDeploy, handlePrizePoolCoreDeploy, handlePrizePoolCoreDeployConfig, handleReceiverChainContractDeploy, handlePeripheryContractDeploy } from '../helpers'
import { handleReceiverChainContractDeployConfig } from '../helpers/handleReceiverChainContractDeploy'
import { handlePeripheryContractDeployConfig } from '../helpers/handlePeripheryContractDeploy'
import {
  DRAW_BUFFER_CARDINALITY,
  PRIZE_DISTRIBUTION_BUFFER_CARDINALITY,
  TOKEN_DECIMALS
} from '../helpers/constants'
const deployFujiContracts = async (hardhat: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hardhat
  const { deployer, manager } = await getNamedAccounts();
  const { deploy } = deployments;

  if (process.env.DEPLOY === 'fuji') {
    dim(`Deploying to Avalanche Fuji testnet`)
  } else { return }

  const { yieldSourcePrizePool } = await handleMockContractDeploy(deploy, deployer)
  const coreConfig: handlePrizePoolCoreDeployConfig = {
    decimals: TOKEN_DECIMALS,
    yieldSourcePrizePool: yieldSourcePrizePool.address,
    drawDufferCardinality: DRAW_BUFFER_CARDINALITY,
    prizeDistributionBufferCardinality: PRIZE_DISTRIBUTION_BUFFER_CARDINALITY
  }

  const {
    drawBufferResult,
    prizeDistributionBufferResult,
    drawCalculatorResult,
    prizeDistributorResult,
    reserveResult,
    prizeSplitStrategyResult,
    drawCalculatorTimelockResult
  } = await handlePrizePoolCoreDeploy(deploy, deployer, ethers, coreConfig)

  const receiverChainConfig: handleReceiverChainContractDeployConfig = {
    drawCalculator: drawCalculatorTimelockResult.address,
    drawBuffer: drawBufferResult.address,
    prizeDistributionBuffer: prizeDistributionBufferResult.address
  }

  await handleReceiverChainContractDeploy(deploy, deployer, receiverChainConfig)
  const configPeriphery: handlePeripheryContractDeployConfig = {
    prizeDistributor: prizeDistributorResult.address,
    prizeSplitStrategy: prizeSplitStrategyResult.address,
    reserve: reserveResult.address
  }
  await handlePeripheryContractDeploy(deploy, deployer, configPeriphery)
  await configureReceiverChainDeployment(ethers, manager)
}

export default deployFujiContracts;