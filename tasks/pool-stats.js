const chalk = require('chalk')

task("pool-stats", "Prints pool stats")
  .setAction(async (taskArgs, hre) => {
      const { ethers } = hre
    
      const claimableDraw = await ethers.getContract("ClaimableDraw")
      const history = await ethers.getContract('DrawHistory')
      const ticket = await ethers.getContract('Ticket')

      const totalSupply = await ticket.totalSupply()
      const prizes = await ticket.balanceOf(claimableDraw.address)
      const eligibleTickets = totalSupply.sub(prizes)

      console.log(chalk.green(`Last draw: ${(await history.getLastDraw()).drawId}`))
      console.log(chalk.green(`Total Eligible Tickets: ${ethers.utils.formatEther(eligibleTickets)}`))
      console.log(chalk.green(`Prizes: ${ethers.utils.formatEther(prizes)}`))
    });