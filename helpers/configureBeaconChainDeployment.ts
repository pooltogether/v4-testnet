import { cyan, green } from "chalk"

export async function configureBeaconChainDeployment(ethers: any, manager: string, drawBeacon: string, L1TimelockTrigger: string) {
  const drawBuffer = await ethers.getContract('DrawBuffer')
  const prizeDistributionBuffer = await ethers.getContract('PrizeDistributionBuffer')
  const drawCalculatorTimelock = await ethers.getContract('DrawCalculatorTimelock')
  const l1TimelockTrigger = await ethers.getContract('L1TimelockTrigger')

  if (await drawBuffer.manager() != drawBeacon) {
    cyan('\nSetting DrawBuffer manager to DrawBeacon...')
    const tx = await drawBuffer.setManager(drawBeacon)
    await tx.wait(1)
    green('Set!')
  }

  if (await prizeDistributionBuffer.manager() != L1TimelockTrigger) {
    cyan('\nSetting PrizeDistributionBuffer manager...')
    const tx = await prizeDistributionBuffer.setManager(L1TimelockTrigger)
    await tx.wait(1)
    green('Done!')
  }

  if (await drawCalculatorTimelock.manager() != L1TimelockTrigger) {
    cyan('\nSetting DrawCalculatorTimelock manager...')
    const tx = await drawCalculatorTimelock.setManager(L1TimelockTrigger)
    await tx.wait(1)
    green('Done!')
  }

  if (await l1TimelockTrigger.manager() != manager) {
    cyan(`\nSetting L1TimelockTrigger manager to ${manager}...`)
    const tx = await l1TimelockTrigger.setManager(manager)
    await tx.wait(1)
    green('Done!')
  }

}

export default configureBeaconChainDeployment