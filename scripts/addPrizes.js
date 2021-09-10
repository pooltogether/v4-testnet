const chalk = require('chalk')
const hardhat = require("hardhat")
const { ethers } = hardhat

const toWei = ethers.utils.parseEther

async function run() {

  const yieldSource = await ethers.getContract('MockYieldSource')
  const token = await ethers.getContractAt('ERC20Mintable', (await yieldSource.depositToken()))
  const ticket = await ethers.getContract('Ticket')
  const prizePool = await ethers.getContract('YieldSourcePrizePool')
  const claimableDraw = await ethers.getContract('ClaimableDraw')

  const signers = await ethers.getSigners()

  const amount = toWei('10000000')

  console.log(chalk.dim(`Minting to ${signers[0].address}...`))
  await token.mint(signers[0].address, amount)

  console.log(chalk.dim(`Approving prize spend...`))
  await token.approve(prizePool.address, amount)

  console.log(chalk.dim(`Depositing prizes...`))
  await prizePool.depositTo(claimableDraw.address, amount, ticket.address)

}

run()