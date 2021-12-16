import { deployContract } from './deployContract'

export async function handlePeripheryContractDeploy(deploy: Function, deployer: string, ethers: any) {
  const prizeDistributor = await ethers.getContract('PrizeDistributor')
  const prizeSplitStrategy = await ethers.getContract('PrizeSplitStrategy')
  const reserve = await ethers.getContract('Reserve')
  const EIP2612PermitAndDepositResult = await deployContract(deploy, 'EIP2612PermitAndDeposit', deployer, [])
  const prizeFlushResult = await deployContract(deploy, 'PrizeFlush', deployer, [deployer, prizeDistributor.address, prizeSplitStrategy.address, reserve.address])
  const twabRewardsResult = await deployContract(deploy, 'TwabRewards', deployer, [])

  const peripheryContractDeploy = {
    prizeFlushResult: prizeFlushResult,
    EIP2612PermitAndDeposit: EIP2612PermitAndDepositResult
  };

  if (process.env.DEPLOY === 'fuji') {
    return {
      ...peripheryContractDeploy,
      twabRewardsResult: twabRewardsResult
    }
  } else {
    return peripheryContractDeploy;
  }
}

export default handlePeripheryContractDeploy
