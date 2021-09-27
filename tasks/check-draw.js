const {
  runTsunamiDrawCalculatorForSingleDraw,
  prepareClaimForUserFromDrawResult
} = require("@pooltogether/draw-calculator-js")
const debug = require('debug')('pt:check')
const chalk = require('chalk')

const {BigNumber, ethers} = require("ethers")
const encoder = ethers.utils.defaultAbiCoder;

task("check-draw", "Checks whether an address won a draw")
.addParam("address", "The address to check", "0xE0F4217390221aF47855E094F6e112D43C8698fE")
.addParam("drawId", "The draw to check")
.setAction(async (taskArgs, hre) => {
    const { address, drawId } = taskArgs
    const { ethers } = hre
  
    console.log(chalk.dim(`Checking if ${address} won...`))
    
    const drawHistory = await ethers.getContract('DrawHistory')
    console.log("getting draw info for drawId ",drawId, "from ", drawHistory.address)

    const draw = await drawHistory.getDraw(drawId)
    console.log("got draw for drawId ", draw)

    const tsunamiDrawSettingsHistory = await ethers.getContract('TsunamiDrawSettingsHistory')
    const drawSettings = await tsunamiDrawSettingsHistory.getDrawSetting(drawId)
    console.log("drawSettings are: ", drawSettings)

    const drawCalculator = await ethers.getContract('TsunamiDrawCalculator')
    console.log("getting balances from ", drawCalculator.address, " for drawId ", drawId)
    const balances = await drawCalculator.getNormalizedBalancesForDrawIds(address, [drawId])
    console.log("user's balances are ", balances)

    // format BigNUmbers correctly
    let distributionBigNumbers = []
    drawSettings.distributions.forEach(element => {
      distributionBigNumbers.push(BigNumber.from(element))
    })

    tsunamiDrawSettings = {
      ...drawSettings,
      distributions: distributionBigNumbers,
    };
    
    let user = {
      address,
      normalizedBalance: balances[0]
    }
    console.log("running draw calculator...")

    const result = runTsunamiDrawCalculatorForSingleDraw(tsunamiDrawSettings, draw, user)
    console.log("got draw result ", result.prizes)

    const claim = prepareClaimForUserFromDrawResult(user, result)
    console.log("claim is ", claim)


    const claimPickIndices = encoder.encode(['uint256[][]'], [claim.data]);

    const claimableDraw = await ethers.getContract('ClaimableDraw')
    const claimableDrawResult = await claimableDraw.claim(address, [drawId], claimPickIndices)

    console.log("claimed!!")
});
