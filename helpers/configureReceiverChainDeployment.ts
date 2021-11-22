
import { cyan, green } from "chalk";

export async function configureReceiverChainDeployment(ethers: any, manager: string) {
  const l2TimelockTrigger = await ethers.getContract('L2TimelockTrigger')
  const reserve = await ethers.getContract('Reserve')
  const drawBuffer = await ethers.getContract('DrawBuffer')
  const drawCalculatorTimelock = await ethers.getContract('DrawCalculatorTimelock')
  const prizeFlush = await ethers.getContract('PrizeFlush')

  if (await prizeFlush.manager() != manager) {
    cyan('\nSetting manager on prizeFlush...')
    const tx = await prizeFlush.setManager(manager)
    await tx.wait(1)
    green(`Set prizeFlush manager!`)
  }

  if (await reserve.manager() != prizeFlush.address) {
    cyan('\nSetting manager on reserve...')
    const tx = await reserve.setManager(prizeFlush.address)
    await tx.wait(1)
    green(`Set reserve manager!`)
  }

  if (await l2TimelockTrigger.manager() != manager) {
    cyan(`\nSetting L2TimelockTrigger manager to ${manager}...`)
    const tx = await l2TimelockTrigger.setManager(manager)
    await tx.wait(1)
    green('\nDone!')
  }

  if (await drawBuffer.manager() != l2TimelockTrigger.address) {
    cyan(`\nSetting DrawBuffer manager to ${l2TimelockTrigger.address}...`)
    const tx = await drawBuffer.setManager(l2TimelockTrigger.address)
    await tx.wait(1)
    green('Done!')
  }

  if (await drawCalculatorTimelock.manager() != l2TimelockTrigger.address) {
    cyan(`\nSetting DrawCalculatorTimelock manager to ${l2TimelockTrigger.address}...`)
    const tx = await drawCalculatorTimelock.setManager(l2TimelockTrigger.address)
    await tx.wait(1)
    green('Done!')
  }

  const prizeDistributionBuffer = await ethers.getContract('PrizeDistributionBuffer')
  if (await prizeDistributionBuffer.manager() != l2TimelockTrigger.address) {
    cyan(`\nSetting PrizeDistributionBuffer manager to ${l2TimelockTrigger.address}...`)
    const tx = await prizeDistributionBuffer.setManager(l2TimelockTrigger.address)
    await tx.wait(1)
    green(`Done!`)
  }
}

export default configureReceiverChainDeployment