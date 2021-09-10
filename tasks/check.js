const { runTsunamiDrawCalculatorForSingleDraw } = require("@pooltogether/draw-calculator-js-sdk")

const {BigNumber, utils} = require("ethers")
const toWei = utils.parseEther


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
    const drawSettingsResult = await drawCalculator.getDrawSettings(drawid)
    console.log(`draw settings for drawId ${drawid}: ${drawSettingsResult} at address ${drawCalculator.address}`)

    // const balance = await ticket.getBalanceAt(address, drawResult.timestamp) // not the correct function
    const balance = ethers.utils.parseEther("10")
    // console.log(`user has balance ${balance}`)

    const draw = {
      drawId: BigNumber.from(drawid),
      winningRandomNumber: BigNumber.from(drawResult.winningRandomNumber),
    }

    const drawSettings = {
      drawId: BigNumber.from(drawid),
      matchCardinality: BigNumber.from(4),
      bitRangeSize: BigNumber.from(3),
      prize: ethers.utils.parseEther('10000'),
      distributions: [toWei('0.5'), toWei('0.1'), toWei('0.2'), toWei('0.2')],
      pickCost : ethers.utils.parseEther('1'),
    }

    const user = {
      address,
      balance,
      pickIndices: [BigNumber.from(1), BigNumber.from(2)] // populate appropriately
    } 
    // finally call function
    const results = runTsunamiDrawCalculatorForSingleDraw(drawSettings, draw, user)

    console.log(`results: ${JSON.stringify(results)}`)


  });

  module.exports = {}


