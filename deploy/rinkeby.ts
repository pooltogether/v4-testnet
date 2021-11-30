import { dim } from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { configureCoreDeployment } from '../helpers/configureCoreDeployment'
import { configureBeaconChainDeployment } from '../helpers/configureBeaconChainDeployment'
import { handleMockContractDeploy, handlePrizePoolCoreDeploy, handlePrizePoolCoreDeployConfig, handlePeripheryContractDeploy } from '../helpers'
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
  // @ts-ignore
  const { ethers, deployments, getNamedAccounts } = hardhat
  const { deployer, manager } = await getNamedAccounts();
  const { deploy } = deployments;

  if (process.env.DEPLOY === 'rinkeby') {
    dim(`Deploying to Ethereum Rinkeby testnet`)
  } else { return }

  await handleMockContractDeploy(deploy, deployer)

  const coreConfig: handlePrizePoolCoreDeployConfig = {
    decimals: TOKEN_DECIMALS,
    drawDufferCardinality: DRAW_BUFFER_CARDINALITY,
    prizeDistributionBufferCardinality: PRIZE_DISTRIBUTION_BUFFER_CARDINALITY
  }
  const receiverChainConfig: handleBeaconChainContractDeployConfig = {
    startingDrawId: '1',
    startTimestamp: parseInt('' + new Date().getTime() / 1000),
    beaconPeriodSeconds: BEACON_PERIOD_SECONDS,
    rngTimeoutSeconds: RNG_TIMEOUT_SECONDS
  }
  await handleBeaconChainContractDeploy(deploy, deployer, receiverChainConfig)
  await handlePrizePoolCoreDeploy(deploy, deployer, ethers, coreConfig)
  await handlePeripheryContractDeploy(deploy, deployer)
  await configureCoreDeployment(deploy, deployer, false) // Exclude DrawBuffer configuration in Timelock contract
}

export default deployRinkebyContracts;