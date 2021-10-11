const chalk = require('chalk')
const hardhat = require("hardhat")
const { TOKEN_DECIMALS } = require('../constants')

const { ethers } = hardhat

const toWei = ethers.utils.parseEther

async function run() {

  const yieldSource = await ethers.getContract('MockYieldSource')
  const token = await ethers.getContractAt('@pooltogether/v4-core/contracts/test/ERC20Mintable.sol:ERC20Mintable', (await yieldSource.depositToken()))

  const signers = await ethers.getSigners()

  const addresses = process.env.DISBURSE_ADDRESSES.split(',')

  const mintTokenTo = [
    signers[0].address,
    ...addresses
  ]

  console.log(chalk.yellow(`Disbursing token ${token.address}...`))

  for (let index = 0; index < mintTokenTo.length; index++) {
    console.log(chalk.dim(`Minting to ${mintTokenTo[index]}...`))
    await token.mint(mintTokenTo[index], ethers.utils.parseUnits('100000000', TOKEN_DECIMALS))
  }
}

run()