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

  const mintTokenTo = [signers[0].address]

  for (let index = 0; index < mintTokenTo.length; index++) {
    console.log(chalk.dim(`Minting to ${mintTokenTo[index]}...`))
    await token.mint(mintTokenTo[index], toWei('100000000'))
  }

  console.log(chalk.dim(`Approving...`))
  await token.approve(prizePool.address, toWei('100000'))
  console.log(chalk.dim(`Depositing...`))
  await prizePool.depositTo(claimableDraw.address, toWei('100000'), ticket.address, ethers.constants.AddressZero)

}

run()