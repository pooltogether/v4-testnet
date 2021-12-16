
import { cyan, green } from "chalk";

export async function configureReceiverChainDeployment(ethers: any, manager: string) {
  const receiverTimelockTrigger = await ethers.getContract('ReceiverTimelockTrigger')
  const drawBuffer = await ethers.getContract('DrawBuffer')
  const drawCalculatorTimelock = await ethers.getContract('DrawCalculatorTimelock')
  const prizeDistributionFactory = await ethers.getContract('PrizeDistributionFactory')
  const prizeDistributionBuffer = await ethers.getContract('PrizeDistributionBuffer')
  const prizeTierHistory = await ethers.getContract('PrizeTierHistory')

  /**
    * Set Initial PrizeTierHistory
   */
  let pthDrawId = 0;
  try {
    pthDrawId = await prizeTierHistory.getNewestDrawId()
  } catch (error) {
    console.log('PrizeTierHistory: No PrizeTiers')
  }

  let nextPrizeTier = {
    bitRangeSize: 2,
    drawId: 1,
    maxPicksPerUser: 2,
    expiryDuration: 5184000,
    endTimestampOffset: 900,
    prize: 15000000000,
    tiers: [141787658, 85072595, 136116152, 136116152, 108892921, 217785843, 174228675, 0, 0, 0, 0, 0, 0, 0, 0, 0,],
  }
  if (pthDrawId === 0) {
    console.log(cyan('\nPush PrizeTierHistory first PrizeTier'))
    await prizeTierHistory.push(nextPrizeTier)
  } else {
    console.log(cyan('\nPopAndPush PrizeTierHistory first PrizeTier'))
    await prizeTierHistory.popAndPush(nextPrizeTier)
  }

  /**
   * MockYieldSource Configuration
   * Sets the mock YieldSource.ticket to the MintableToken contract.
   */
  const yieldSourcePrizePool = await ethers.getContract('YieldSourcePrizePool')
  const ticket = await ethers.getContract('Ticket')
  if (await yieldSourcePrizePool.getTicket() != ticket.address) {
    console.log(console.log(cyan('\nSetting ticket on prize pool...')))
    const tx = await yieldSourcePrizePool.setTicket(ticket.address)
    await tx.wait(1)
    console.log(green(`\nSet ticket!`))
  }

  /**
   * Management Hierarchy
   * --------------------
   * Defender Autotask                 (EOA)
   * ReceiverTimelockTrigger     (Manager => Defender Autotask)
   *   DrawBuffer                      (Manager => ReceiverTimelockTrigger)
   *   DrawCalculatorTimelock          (Manager => ReceiverTimelockTrigger)
   *   PrizeDistributionFactory        (Manager => ReceiverTimelockTrigger)
   *     PrizeDistributionBuffer       (Manager => PrizeDistributionFactory)
   */

  /**
   * @dev The ReceiverTimelockTrigger contract will be managed by a Defender Autotask
   */
  if (await receiverTimelockTrigger.manager() != manager) {
    console.log(console.log(cyan(`\nSetting ReceiverTimelockTrigger manager to ${manager}`)))
    const tx = await receiverTimelockTrigger.setManager(manager)
    await tx.wait(1)
    console.log(green('Done!'))
  }

  /**
   * @dev The DrawBuffer contract will be managed by ReceiverTimelockTrigger
   */
  if (await drawBuffer.manager() != receiverTimelockTrigger.address) {
    console.log(cyan(`\nSetting DrawBuffer manager to ${receiverTimelockTrigger.address}`))
    const tx = await drawBuffer.setManager(receiverTimelockTrigger.address)
    await tx.wait(1)
    console.log(green('Done!'))
  }

  /**
   * @dev The DrawCalculatorTimelock contract will be managed by ReceiverTimelockTrigger
   */
  if (await drawCalculatorTimelock.manager() != receiverTimelockTrigger.address) {
    console.log(cyan(`\nSetting DrawCalculatorTimelock manager to ${receiverTimelockTrigger.address}`))
    const tx = await drawCalculatorTimelock.setManager(receiverTimelockTrigger.address)
    await tx.wait(1)
    console.log(green('Done!'))
  }

  /**
   * @dev The PrizeDistributionFactory contract will be managed by ReceiverTimelockTrigger
   */
  if (await prizeDistributionFactory.manager() != receiverTimelockTrigger.address) {
    console.log(cyan(`\nSetting PrizeDistributionFactory manager to ${receiverTimelockTrigger.address}`))
    const tx = await prizeDistributionFactory.setManager(receiverTimelockTrigger.address)
    await tx.wait(1)
    console.log(green('Done!'))
  }

  /**
   * @dev The PrizeDistributionBuffer contract will be managed by PrizeDistributionFactory
   */
  if (await prizeDistributionBuffer.manager() != prizeDistributionFactory.address) {
    console.log(cyan(`\nSetting PrizeDistributionBuffer manager to ${prizeDistributionFactory.address}`))
    const tx = await prizeDistributionBuffer.setManager(prizeDistributionFactory.address)
    await tx.wait(1)
    console.log(green('Done!'))
  }

}

export default configureReceiverChainDeployment