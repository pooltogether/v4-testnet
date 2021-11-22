import { deployContract } from './deployContract'

export interface handleReceiverChainContractDeployConfig {
  drawCalculator: string,
  drawBuffer: string,
  prizeDistributionBuffer: string,
}


export async function handleReceiverChainContractDeploy(deploy: Function, deployer: string, config: handleReceiverChainContractDeployConfig = {
  drawCalculator: '',
  drawBuffer: '',
  prizeDistributionBuffer: ''
}) {
  await deployContract(deploy, 'L2TimelockTrigger', deployer, [deployer, config.drawBuffer, config.prizeDistributionBuffer, config.drawCalculator])
}

export default handleReceiverChainContractDeploy