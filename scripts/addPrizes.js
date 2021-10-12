const chalk = require('chalk')
const hardhat = require("hardhat")
const { ethers } = hardhat

async function run() {

  const yieldSource = await ethers.getContract('MockYieldSource')
  const token = await ethers.getContractAt('@pooltogether/yield-source-interface/contracts/test/ERC20Mintable.sol:ERC20Mintable', (await yieldSource.depositToken()))
  const ticket = await ethers.getContract('Ticket')
  const prizePool = await ethers.getContract('YieldSourcePrizePool')
  const prizeDistributor = await ethers.getContract('PrizeDistributor')

  const signers = await ethers.getSigners()

  const decimals = await ticket.decimals()

  const amount = ethers.utils.parseUnits('1000000', decimals)

  console.log(chalk.dim(`Minting to ${signers[0].address}...`))
  const mintTx = await token.mint(signers[0].address, amount)
  await mintTx.wait(1)

  console.log(chalk.dim(`Approving prize spend...`))
  const approveTx = await token.approve(prizePool.address, amount)
  await approveTx.wait(1)

  console.log(chalk.dim(`Depositing prizes...`))
  const depositTx = await prizePool.depositTo(prizeDistributor.address, amount)
  await depositTx.wait(1)

}

run()
