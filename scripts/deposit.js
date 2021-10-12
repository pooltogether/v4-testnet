const chalk = require('chalk')
const hardhat = require("hardhat")
const { ethers } = hardhat

async function run() {

  const yieldSource = await ethers.getContract('MockYieldSource')
  const token = await ethers.getContractAt('@pooltogether/yield-source-interface/contracts/test/ERC20Mintable.sol:ERC20Mintable', (await yieldSource.depositToken()))
  const prizePool = await ethers.getContract('YieldSourcePrizePool')

  const signers = await ethers.getSigners()

  const decimals = await token.decimals()

  const amount = ethers.utils.parseUnits('100', decimals)

  console.log(chalk.dim(`Minting to ${signers[0].address}...`))
  const mintTx = await token.mint(signers[0].address, amount)
  await mintTx.wait(1)

  console.log(chalk.dim(`Approving prize spend...`))
  const tx = await token.approve(prizePool.address, amount)
  await tx.wait(1)

  console.log(chalk.dim(`Depositing for myself...`))
  const depositTx = await prizePool.depositTo(signers[0].address, amount)
  await depositTx.wait(1)

}

run()
