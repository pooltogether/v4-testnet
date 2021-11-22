import { deployContract } from './deployContract'

export interface handlePeripheryContractDeployConfig {
  prizeDistributor: string,
  prizeSplitStrategy: string,
  reserve: string,
}

export async function handlePeripheryContractDeploy(deploy: Function, deployer: string, config: handlePeripheryContractDeployConfig = {
  prizeDistributor: '',
  prizeSplitStrategy: '',
  reserve: ''
}) {
  const prizeFlushResult = await deployContract(deploy, 'PrizeFlush', deployer, [deployer, config.prizeDistributor, config.prizeSplitStrategy, config.reserve])

  return {
    prizeFlushResult: prizeFlushResult,
  }
}

export default handlePeripheryContractDeploy