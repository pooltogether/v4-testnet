import { dim } from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import configureReceiverChainDeployment from '../helpers/configureReceiverChainDeployment';
import { configureBeaconChainDeployment } from '../helpers/configureBeaconChainDeployment'
import { handleMockContractDeploy, handlePrizePoolCoreDeploy, handlePrizePoolCoreDeployConfig, handleReceiverChainContractDeploy, handlePeripheryContractDeploy } from '../helpers'
import { handleReceiverChainContractDeployConfig } from '../helpers/handleReceiverChainContractDeploy'
import { handlePeripheryContractDeployConfig } from '../helpers/handlePeripheryContractDeploy'
import { handleBeaconChainContractDeployConfig, handleBeaconChainContractDeploy } from '../helpers/handleBeaconChainContractDeploy'
import {
  BEACON_PERIOD_SECONDS,
  RNG_TIMEOUT_SECONDS,
  DRAW_BUFFER_CARDINALITY,
  PRIZE_DISTRIBUTION_BUFFER_CARDINALITY,
  TOKEN_DECIMALS
} from '../helpers/constants'

const deployRinkebyContracts = async (hardhat: HardhatRuntimeEnvironment) => {
  const { ethers, deployments, getNamedAccounts } = hardhat
  const { deployer, manager } = await getNamedAccounts();
  const { deploy } = deployments;

  if (process.env.DEPLOY === 'rinkeby') {
    dim(`Deploying to Ethereum Rinkeby testnet`)
  } else { return }

  const { yieldSourcePrizePool, rngService } = await handleMockContractDeploy(deploy, deployer)

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
    prizeSplitStrategyResult
  } = await handlePrizePoolCoreDeploy(deploy, deployer, ethers, coreConfig)

  const receiverChainConfig: handleBeaconChainContractDeployConfig = {
    drawCalculator: drawCalculatorResult.address,
    drawBuffer: drawBufferResult.address,
    prizeDistributionBuffer: prizeDistributionBufferResult.address,
    rngService: rngService.address,
    startingDrawId: '1',
    startTimestamp: parseInt('' + new Date().getTime() / 1000),
    beaconPeriodSeconds: BEACON_PERIOD_SECONDS,
    rngTimeoutSeconds: RNG_TIMEOUT_SECONDS
  }

  const { drawBeacon, L1TimelockTrigger } = await handleBeaconChainContractDeploy(deploy, deployer, receiverChainConfig)
  await configureBeaconChainDeployment(ethers, manager, drawBeacon.address, L1TimelockTrigger.address)

  const configPeriphery: handlePeripheryContractDeployConfig = {
    prizeDistributor: prizeDistributorResult.address,
    prizeSplitStrategy: prizeSplitStrategyResult.address,
    reserve: reserveResult.address
  }
  await handlePeripheryContractDeploy(deploy, deployer, configPeriphery)
}

export default deployRinkebyContracts;