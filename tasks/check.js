const hardhat = require('hardhat')
require("@nomiclabs/hardhat-ethers");
const { runTsunamiDrawCalculatorForSingleDraw } = require("@pooltogether/draw-calculator-js-sdk")

task("check", "Checks whether an address won a draw")
  .addParam("address", "The address to check")
  .addParam("drawId", "The draw to check")
  .setAction(async (taskArgs) => {
    const { address, drawId } = taskArgs

    const yieldSource = await ethers.getContract('MockYieldSource')
    const token = await ethers.getContractAt('ERC20Mintable', (await yieldSource.depositToken()))
    const ticket = await ethers.getContract('Ticket')
    const prizePool = await ethers.getContract('YieldSourcePrizePool')
    const claimableDraw = await ethers.getContract('ClaimableDraw')
    const drawHistory = await ethers.getContract('DrawHistory')
    
    const draw = await drawHistory.getDraw(drawId)
  });
