const debug = require('debug')('pt:check')
const chalk = require('chalk')

task("deposit", "Deposits into the pool")
  .addParam("signer", "The index of the signer to use", '0')
  .addParam("amount", "The amount to deposit", '100')
  .setAction(async (taskArgs, hre) => {
      const { ethers } = hre
      const signers = await ethers.getSigners()
      const signer = signers[taskArgs.signer]
      const amount = ethers.utils.parseEther(taskArgs.amount)
      console.log(chalk.dim(`Depositing with signer ${signer.address}...`))
    
      const yieldSource = await ethers.getContract('MockYieldSource')
      const token = await ethers.getContractAt('ERC20Mintable', await yieldSource.depositToken())

      const balance = await token.balanceOf(signer.address)
      if (!balance.gte(amount)) {
        debug(`Insufficient balance; minting...`)
        await token.mint(signer.address, amount)
      }

      const prizePool = await ethers.getContract('YieldSourcePrizePool')
      debug(`Approving...`)
      await token.connect(signer).approve(prizePool.address, amount)

      debug(`Depositing...`)
      const ticket = await ethers.getContract('Ticket')
      await prizePool.connect(signer).depositTo(signer.address, amount, ticket.address)
    });