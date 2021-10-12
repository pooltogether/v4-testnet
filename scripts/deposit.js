const chalk = require('chalk')
const hardhat = require("hardhat")
const { ethers } = hardhat

async function run() {

  const yieldSource = await ethers.getContract('MockYieldSource')
  const token = await ethers.getContractAt('ERC20Mintable', (await yieldSource.depositToken()))
  const prizePool = await ethers.getContract('YieldSourcePrizePool')

  const signers = await ethers.getSigners()

  const decimals = await ticket.decimals()

  const amount = ethers.utils.parseUnits('10000', decimals)

  console.log(chalk.dim(`Minting to ${signers[0].address}...`))
  await token.mint(signers[0].address, amount)

  console.log(chalk.dim(`Approving prize spend...`))
  const tx = await token.approve(prizePool.address, amount)
  await tx.wait(1)

  console.log(chalk.dim(`Depositing for myself...`))
  await prizePool.depositTo(signers[0].address, amount)

}

run()