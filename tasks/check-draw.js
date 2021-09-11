const {
  generatePicks,
  computeDrawResults
} = require("@pooltogether/draw-calculator-js-sdk")
const debug = require('debug')('pt:check')
const chalk = require('chalk')

task("check-draw", "Checks whether an address won a draw")
.addParam("address", "The address to check", "0xE0F4217390221aF47855E094F6e112D43C8698fE")
.addParam("draw", "The draw to check")
.setAction(async (taskArgs, hre) => {
    const { address } = taskArgs
    const { ethers } = hre
  
    console.log(chalk.dim(`Checking if ${address} won...`))

    const ticket = await ethers.getContract('Ticket')
    const drawHistory = await ethers.getContract('DrawHistory')
    const drawCalculator = await ethers.getContract('TsunamiDrawCalculator')
    
    const draw = await drawHistory.getDraw(taskArgs.draw)
    const drawSettings = await drawCalculator.getDrawSettings(taskArgs.draw)

    const balance = await ticket.getBalanceAt(address, draw.timestamp)
    console.log(chalk.dim(`Ticket Balance was ${ethers.utils.formatEther(balance)}`))
    console.log(chalk.dim(`Number of picks: `, balance.div(drawSettings.pickCost)))

    if (balance.gt(0)) {
      const picks = generatePicks(drawSettings.pickCost, address, balance)
      // finally call function
      const results = computeDrawResults(drawSettings, draw, picks)
      console.log(chalk.dim(`They won ${ethers.utils.formatEther(results.totalValue)} over ${results.prizes.length} prizes`))
    } else {
      console.log(chalk.dim(`no balance`))
    }
  });
