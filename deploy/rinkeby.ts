import { dim } from 'chalk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  handleMockContractDeploy,
  handlePrizePoolCoreDeploy,
  handleBeaconChainContractDeploy,
  configureBeaconChainDeployment
} from '../helpers'
import { handleBeaconChainContractDeployConfig } from '../helpers/handleBeaconChainContractDeploy'
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
  const beaconChainConfig: handleBeaconChainContractDeployConfig = {
    startingDrawId: '1',
    startTimestamp: parseInt('' + new Date().getTime() / 1000),
    beaconPeriodSeconds: BEACON_PERIOD_SECONDS,
    rngTimeoutSeconds: RNG_TIMEOUT_SECONDS
  }
  await handleMockContractDeploy(deploy, deployer)
  await handlePrizePoolCoreDeploy(deploy, deployer, ethers, TOKEN_DECIMALS, DRAW_BUFFER_CARDINALITY, PRIZE_DISTRIBUTION_BUFFER_CARDINALITY);
  await handleBeaconChainContractDeploy(deploy, deployer, ethers, beaconChainConfig)
  await configureBeaconChainDeployment(ethers, manager)
}

export default deployRinkebyContracts;