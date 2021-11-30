import { cyan, green } from "chalk"

export async function configureCoreDeployment(ethers: any, manager: string, includeDrawBuffer: boolean) {
  const drawAndPrizeDistributionTimelock = await ethers.getContract('DrawAndPrizeDistributionTimelock')
  const drawCalculatorTimelock = await ethers.getContract('DrawCalculatorTimelock')
  const prizeDistributionFactory = await ethers.getContract('PrizeDistributionFactory')
  const prizeDistributionBuffer = await ethers.getContract('PrizeDistributionBuffer')

  /**
   * Management Hierarchy
   * --------------------
   * Defender Autotask                    (EOA)
   * DrawAndPrizeDistributionTimelock     (Manager => Defender Autotask)
   *   DrawBuffer (Optional)              (Manager => DrawAndPrizeDistributionTimelock)
   *   DrawCalculatorTimelock             (Manager => DrawAndPrizeDistributionTimelock)
   *   PrizeDistributionFactory           (Manager => DrawAndPrizeDistributionTimelock)
   *     PrizeDistributionBuffer          (Manager => PrizeDistributionFactory)
   */

  /**
   * @dev The DrawAndPrizeDistributionTimelock contract will be managed by a Defender Autotask
   */
  if (await drawAndPrizeDistributionTimelock.manager() != manager) {
    cyan(`\nSetting DrawAndPrizeDistributionTimelock manager to ${manager}...`)
    const tx = await drawAndPrizeDistributionTimelock.setManager(manager)
    await tx.wait(1)
    green('Done!')
  }
  /**
   * @dev The DrawBuffer is optional, but if it exists, it will be managed by the DrawAndPrizeDistributionTimelock
   * @dev Beacon chains will not have a DrawBuffer requirement when configuring the core deployment
   */
  if (includeDrawBuffer) {
    const drawBuffer = await ethers.getContract('DrawBuffer')
    /**
     * @dev The DrawBuffer contract will be managed by DrawAndPrizeDistributionTimelock
     */
    if (await drawBuffer.manager() != drawBuffer.address) {
      cyan(`\nSetting DrawBuffer manager to ${drawAndPrizeDistributionTimelock.address}`)
      const tx = await drawBuffer.setManager(drawAndPrizeDistributionTimelock.address)
      await tx.wait(1)
      green('Done!')
    }
  }

  /**
   * @dev The DrawCalculatorTimelock contract will be managed by DrawAndPrizeDistributionTimelock
   */
  if (await drawCalculatorTimelock.manager() != drawAndPrizeDistributionTimelock.address) {
    cyan(`\nSetting DrawCalculatorTimelock manager to ${drawAndPrizeDistributionTimelock.address}`)
    const tx = await drawCalculatorTimelock.setManager(drawAndPrizeDistributionTimelock.address)
    await tx.wait(1)
    green('Done!')
  }

  /**
   * @dev The PrizeDistributionFactory contract will be managed by DrawAndPrizeDistributionTimelock
   */
  if (await prizeDistributionFactory.manager() != drawAndPrizeDistributionTimelock.address) {
    cyan(`\nSetting PrizeDistributionFactory manager to ${drawAndPrizeDistributionTimelock.address}`)
    const tx = await prizeDistributionFactory.setManager(drawAndPrizeDistributionTimelock.address)
    await tx.wait(1)
    green('Done!')
  }

  /**
   * @dev The PrizeDistributionBuffer contract will be managed by PrizeDistributionFactory
   */
  if (await prizeDistributionBuffer.manager() != prizeDistributionFactory.address) {
    cyan(`\nSetting PrizeDistributionBuffer manager to ${prizeDistributionFactory.address}`)
    const tx = await prizeDistributionBuffer.setManager(prizeDistributionFactory.address)
    await tx.wait(1)
    green('Done!')
  }

}

export default configureCoreDeployment