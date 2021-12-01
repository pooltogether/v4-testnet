import { deployContract } from './deployContract'

export async function handleReceiverChainContractDeploy(deploy: Function, deployer: string, ethers: any) {
  const drawBuffer = await ethers.getContract('DrawBuffer')
  const prizeDistributionBuffer = await ethers.getContract('PrizeDistributionBuffer')
  const drawCalculator = await ethers.getContract('DrawCalculatorTimelock')
  await deployContract(deploy, 'ReceiverTimelockAndPushRouter', deployer, [deployer, drawBuffer.address, prizeDistributionBuffer.address, drawCalculator.address])
}

export default handleReceiverChainContractDeploy