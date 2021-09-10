const { runTsunamiDrawCalculatorForSingleDraw } = require("@pooltogether/draw-calculator-js-sdk")

task("check-draw", "Checks whether an address won a draw")
  .addParam("address", "The address to check")
  .addParam("drawid", "The draw to check")
  .setAction(async (taskArgs) => {
    const { address, drawid } = taskArgs

    console.log(`checking if ${address} won...`)

    const yieldSource = await ethers.getContract('MockYieldSource')
    const token = await ethers.getContractAt('ERC20Mintable', (await yieldSource.depositToken()))
    const ticket = await ethers.getContract('Ticket')
    const prizePool = await ethers.getContract('YieldSourcePrizePool')
    const claimableDraw = await ethers.getContract('ClaimableDraw')
    const drawHistory = await ethers.getContract('DrawHistory')
    const drawCalculator = await ethers.getContract('TsunamiDrawCalculator')
    
    console.log(`calling drawHistory.getDraw(${drawid})`)
    const drawResult = await drawHistory.getDraw(drawid)
    console.log(`draw: ${drawResult}`)
    console.log(`winning random number was ${drawResult.winningRandomNumber}`)
    const drawSettings = await drawCalculator.getDrawSettings(drawid)


    // const drawSettings = {
    //   distributions: [ethers.utils.parseEther("0.5"),
    //                   ethers.utils.parseEther("0.1"),
    //                   ethers.utils.parseEther("0.2"),
    //                   ethers.utils.parseEther("0.2")
    //                 ],
    //   pickCost: ethers.utils.parseEther("1"),
    //   matchCardinality: BigNumber.from(3),
    //   bitRangeSize : BigNumber.from(4),
    //   prize: BigNumber.from(utils.parseEther("100")),
    // }

    
    const draw = {
      drawId: BigNumber.from(drawid),
      winningRandomNumber: BigNumber.from(drawResult.winningRandomNumber),
    }

    
    const user = {
      address,
      balance,
      pickIndices: [BigNumber.from(1)]
    } 
    // finally call function
    const results = runTsunamiDrawCalculatorForSingleDraw(drawSettings, draw, user)

    console.log(`results: ${JSON.stringify(results)}`)


  });

  module.exports = {}


