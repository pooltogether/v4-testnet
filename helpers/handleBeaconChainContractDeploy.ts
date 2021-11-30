import { ethers } from 'hardhat-ethers'
import { deployContract } from './deployContract'

export interface handleBeaconChainContractDeployConfig {
  startingDrawId: string;
  startTimestamp: number;
  beaconPeriodSeconds: number;
  rngTimeoutSeconds: number;
}

export async function handleBeaconChainContractDeploy(deploy: Function, deployer: string, config: handleBeaconChainContractDeployConfig) {
  const drawBuffer = await ethers.getContract('DrawBuffer')
  const rngService = await ethers.getContract('RngService')
  const drawBeaconResult = await deployContract(deploy, 'DrawBeacon', deployer, [
    deployer,
    drawBuffer.address,
    rngService.address,
    config.startingDrawId,
    config.startTimestamp,
    config.beaconPeriodSeconds,
    config.rngTimeoutSeconds
  ]);
  return {
    drawBeacon: drawBeaconResult
  }
}

export default handleBeaconChainContractDeploy