import { deployContract } from './deployContract'

export interface handleBeaconChainContractDeployConfig {
  startingDrawId: string;
  startTimestamp: number;
  beaconPeriodSeconds: number;
  rngTimeoutSeconds: number;
}

export async function handleBeaconChainContractDeploy(deploy: Function, deployer: string, ethers: any, config: handleBeaconChainContractDeployConfig) {
  const drawBuffer = await ethers.getContract('DrawBuffer')
  const prizeDistributionFactory = await ethers.getContract('PrizeDistributionFactory')
  const drawCalculatorTimelock = await ethers.getContract('DrawCalculatorTimelock')
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

  const beaconTimelockTriggerResult = await deployContract(deploy, 'BeaconTimelockTrigger', deployer, [
    deployer,
    prizeDistributionFactory.address,
    drawCalculatorTimelock.address
  ])
  return {
    drawBeacon: drawBeaconResult,
    beaconTimelockTriggerResult
  }
}

export default handleBeaconChainContractDeploy