import { cyan, green } from "chalk"

export async function configureCoreDeployment(ethers: any, manager: string) {
  const prizeDistributionBuffer = await ethers.getContract('PrizeDistributionBuffer')
  const prizeDistributionFactory = await ethers.getContract('PrizeDistributionFactory')
  const drawAndPrizeDistributionTimelock = await ethers.getContract('DrawAndPrizeDistributionTimelock')

  /**
   * Management Hierarchy
   * --------------------
   * Defender Autotask                (Manager => EOA)
   * DrawAndPrizeDistributionTimelock (Manager => Defender Autotask)
   * PrizeDistributionFactory         (Manager => DrawAndPrizeDistributionTimelock)
   * PrizeDistributionBuffer          (Manager => PrizeDistributionFactory)
   */

  /**
   * @dev The DrawAndPrizeDistributionTimelock contract will be managed by a Defender Autotask
   */
  if (await drawAndPrizeDistributionTimelock.manager() != manager) {
    cyan(`\nSetting L1TimelockTrigger manager to ${manager}...`)
    const tx = await drawAndPrizeDistributionTimelock.setManager(manager)
    await tx.wait(1)
    green('Done!')
  }

  /**
   * @dev The PrizeDistributionFactory contract will be managed by DrawAndPrizeDistributionTimelock
   */
  if (await prizeDistributionFactory.manager() != drawAndPrizeDistributionTimelock.address) {
    cyan('\nSetting DrawCalculatorTimelock manager...')
    const tx = await prizeDistributionFactory.setManager(drawAndPrizeDistributionTimelock.address)
    await tx.wait(1)
    green('Done!')
  }

  /**
   * @dev The PrizeDistributionBuffer contract will be managed by PrizeDistributionFactory
   */
  if (await prizeDistributionBuffer.manager() != prizeDistributionFactory.address) {
    cyan('\nSetting PrizeDistributionBuffer manager...')
    const tx = await prizeDistributionBuffer.setManager(prizeDistributionFactory.address)
    await tx.wait(1)
    green('Done!')
  }

}

export default configureCoreDeployment