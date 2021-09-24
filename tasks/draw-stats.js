const {
  generatePicks,
  computeDrawResults
} = require("@pooltogether/draw-calculator-js")
const chalk = require('chalk')

task("draw-stats", "Checks whether an address won a draw")
.addParam("draw", "The draw to check")
.setAction(async (taskArgs, hre) => {
    const { ethers } = hre

    const ticket = await ethers.getContract('Ticket')
    const drawHistory = await ethers.getContract('DrawHistory')
    const drawCalculator = await ethers.getContract('TsunamiDrawCalculator')
    
    const draw = await drawHistory.getDraw(taskArgs.draw)
    console.log(chalk.dim(`Winning Number: `, draw.winningRandomNumber))
    console.log(chalk.dim(`Timestamp: `, new Date(draw.timestamp*1000).toString()))

    const drawSettings = await drawCalculator.getDrawSettings(taskArgs.draw)
    console.log(chalk.dim(`Bit range: `, drawSettings.bitRangeSize))
    console.log(chalk.dim(`Cardinality: `, drawSettings.matchCardinality))
    console.log(chalk.dim(`Prize: `, ethers.utils.formatEther(drawSettings.prize)))
    console.log(chalk.dim(`Distributions: `, drawSettings.distributions.map(dist => ethers.utils.formatEther(dist))))
    console.log(chalk.dim(`Total picks: ${(2**drawSettings.bitRangeSize)**drawSettings.matchCardinality}`))
    console.log(chalk.dim(`Pick cost (tickets / pick): `, drawSettings.pickCost.toString()))
    for (let i = 0; i < drawSettings.distributions.length; i++) {
      const numberOfPrizes = (2**drawSettings.bitRangeSize)**i
      const fraction = parseFloat(ethers.utils.formatEther(drawSettings.distributions[i]))
      const payout = fraction * parseFloat(ethers.utils.formatEther(drawSettings.prize))
      console.log(chalk.dim(`Prize ${i}: ${payout / numberOfPrizes} tokens with ${numberOfPrizes} winners`))
    }
  });
