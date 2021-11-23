import { deployContract } from './deployContract'

export interface handleBeaconChainContractDeployConfig {
  rngService: string;
  drawBuffer: string;
  drawCalculator: string;
  prizeDistributionBuffer: string;
  startingDrawId: string;
  startTimestamp: number;
  beaconPeriodSeconds: number;
  rngTimeoutSeconds: number;
}

export async function handleBeaconChainContractDeploy(deploy: Function, deployer: string, config: handleBeaconChainContractDeployConfig) {
  const drawBeaconResult = await deployContract(deploy, 'DrawBeacon', deployer, [
    deployer,
    config.drawBuffer,
    config.rngService,
    config.startingDrawId,
    config.startTimestamp,
    config.beaconPeriodSeconds,
    config.rngTimeoutSeconds
  ]);

  const drawCalculatorTimelockResult = await deployContract(deploy, 'DrawCalculatorTimelock', deployer, [deployer,
    config.drawCalculator
  ]);

  const L1TimelockTriggerResult = await deployContract(deploy, 'L1TimelockTrigger', deployer, [deployer,
    config.prizeDistributionBuffer,
    drawCalculatorTimelockResult.address
  ]);

  return {
    drawBeacon: drawBeaconResult,
    drawCalculatorTimelock: drawCalculatorTimelockResult,
    L1TimelockTrigger: L1TimelockTriggerResult
  }
}

export default handleBeaconChainContractDeploy