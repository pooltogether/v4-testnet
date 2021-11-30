import { Signer } from "@ethersproject/abstract-signer";
import { cyan, green } from "chalk";
import { deployContract } from './deployContract'

export interface handlePrizePoolCoreDeployConfig {
  decimals: number | string,
  yieldSourcePrizePool: string,
  drawDufferCardinality: number | string,
  prizeDistributionBufferCardinality: number | string,
}

export async function handlePrizePoolCoreDeploy(
  deploy: Function,
  deployer: string,
  ethers: any,
  config: handlePrizePoolCoreDeployConfig = {
    decimals: 18,
    yieldSourcePrizePool: '',
    drawDufferCardinality: "",
    prizeDistributionBufferCardinality: ""
  }
) {
  const ticketResult = await deployContract(deploy, 'Ticket', deployer, ["Ticket", "TICK", config.decimals, config.yieldSourcePrizePool])
  const yieldSourcePrizePool = await ethers.getContract('YieldSourcePrizePool')

  if (await yieldSourcePrizePool.getTicket() != ticketResult.address) {
    cyan('\nSetting ticket on prize pool...')
    const tx = await yieldSourcePrizePool.setTicket(ticketResult.address)
    await tx.wait(1)
    green(`\nSet ticket!`)
  }

  const drawBufferResult = await deployContract(deploy, 'DrawBuffer', deployer, [deployer, config.drawDufferCardinality])
  const prizeDistributionBufferResult = await deployContract(deploy, 'PrizeDistributionBuffer', deployer, [deployer, config.prizeDistributionBufferCardinality])
  const drawCalculatorResult = await deployContract(deploy, 'DrawCalculator', deployer, [ticketResult.address, drawBufferResult.address, prizeDistributionBufferResult.address])
  const prizeDistributorResult = await deployContract(deploy, 'PrizeDistributor', deployer, [deployer, ticketResult.address, drawCalculatorResult.address])
  const prizeSplitStrategyResult = await deployContract(deploy, 'PrizeSplitStrategy', deployer, [deployer, config.yieldSourcePrizePool])
  const reserveResult = await deployContract(deploy, 'Reserve', deployer, [deployer, ticketResult.address])
  const prizeSplitStrategy = await ethers.getContract('PrizeSplitStrategy')
  const drawCalculatorTimelockResult = await deployContract(deploy, 'DrawCalculatorTimelock', deployer, [deployer, drawCalculatorResult.address])
  const prizeDistributionFactoryResult = await deployContract(deploy, 'PrizeDistributionFactory', deployer, [deployer, drawCalculatorResult.address])
  const drawAndPrizeDistributionTimelockResult = await deployContract(deploy, 'DrawAndPrizeDistributionTimelock', deployer, [deployer, drawBufferResult.address, prizeDistributionFactoryResult.address, drawCalculatorTimelockResult.address])

  return {
    drawBufferResult,
    prizeDistributionBufferResult,
    drawCalculatorResult,
    prizeDistributorResult,
    reserveResult,
    ticketResult,
    prizeSplitStrategyResult,
    prizeSplitStrategy,
    drawCalculatorTimelockResult,
    prizeDistributionFactoryResult,
    drawAndPrizeDistributionTimelockResult
  }
}

export default handlePrizePoolCoreDeploy