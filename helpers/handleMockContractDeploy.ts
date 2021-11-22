import { Signer } from "@ethersproject/abstract-signer";
import { deployContract } from './deployContract'

interface handleMockContractDeployConfig {
  decimals: number | string,
}

export async function handleMockContractDeploy(deploy: Function, deployer: Signer, config: handleMockContractDeployConfig) {
  const mockYieldSourceResult = await deployContract(deploy, 'MockYieldSource', deployer, ['Token', 'TOK', config.decimals])
  const yieldSourcePrizePoolResult = await deployContract(deploy, 'YieldSourcePrizePool', deployer, [deployer, mockYieldSourceResult.address])

  return {
    mockYieldSource: mockYieldSourceResult,
    yieldSourcePrizePool: yieldSourcePrizePoolResult,
  }
}

export default handleMockContractDeploy