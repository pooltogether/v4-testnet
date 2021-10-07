const { cyan } = require('chalk');
const emoji = require('node-emoji');
const debug = require('debug')('tasks')
const { getUserAndWallet } = require('./utils/getUserAndWallet');

task("deposit", "Deposits into the pool")
.addOptionalParam("user", "<address>")
.addOptionalParam("wallet", "<address>")
.addParam("amount", "The amount to deposit", '0')
.setAction(async (args, { ethers }) => {
    const { user, wallet } = await getUserAndWallet(ethers, args)
    debug(user, wallet)
  
    const yieldSource = await ethers.getContract('MockYieldSource')
    const prizePool = await ethers.getContract('YieldSourcePrizePool')
    const token = await ethers.getContractAt('ERC20Mintable', await yieldSource.depositToken())

    const balance = await token.balanceOf(wallet.address)
    if (!balance.gte(ethers.utils.parseEther(args.amount))) {
      debug(`Insufficient balance; minting...`)
      const txMint = await token.mint(wallet.address, ethers.utils.parseEther(args.amount))
      await txMint.wait()
    }

    debug(`Approving...`)
    const txApprove = await token.connect(wallet).approve(prizePool.address, ethers.utils.parseEther(args.amount))
    console.log(cyan(emoji.find('🕰️').emoji, ` Approving Deposit to PrizePool`))
    await txApprove.wait()

    debug(`Depositing...`)
    await prizePool.connect(wallet).depositTo(wallet.address, ethers.utils.parseEther(args.amount))

    console.log(cyan(emoji.find('✅').emoji, `Deposited ${args.amount} tokens and received ${args.amount} tickets`))
  });