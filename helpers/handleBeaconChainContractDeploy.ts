import { deployContract } from './deployContract'

export interface handleBeaconChainContractDeployConfig {
  startingDrawId: string;
  startTimestamp: number;
  beaconPeriodSeconds: number;
  rngTimeoutSeconds: number;
}

export async function handleBeaconChainContractDeploy(deploy: Function, deployer: string, ethers: any, config: handleBeaconChainContractDeployConfig) {
  const drawBuffer = await ethers.getContract('DrawBuffer')
  const prizeDistributionBuffer = await ethers.getContract('PrizeDistributionBuffer')
  const drawCalculator = await ethers.getContract('DrawCalculatorTimelock')
  const rngService = await ethers.getContract('RNGServiceStub')
  const drawBeaconResult = await deployContract(deploy, 'DrawBeacon', deployer, [
    deployer,
    drawBuffer.address,
    rngService.address,
    config.startingDrawId,
    config.startTimestamp,
    config.beaconPeriodSeconds,
    config.rngTimeoutSeconds
  ]);

  const beaconTimelockAndPushRouterResult = await deployContract(deploy, 'BeaconTimelockAndPushRouter', deployer, [deployer, prizeDistributionBuffer.address, drawCalculator.address])
  return {
    drawBeacon: drawBeaconResult,
    beaconTimelockAndPushRouterResult
  }
}

export default handleBeaconChainContractDeploy