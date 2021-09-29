const { BigNumber } = require("@ethersproject/bignumber")
const {computePicks } = require("@pooltogether/draw-calculator-js")
const { green, cyan } = require("chalk")
const { ethers } = require("ethers")
const { range } = require("./utils/helpers")


/**
 * @name DrawCalculatorJs.generatePicks()
*/
task("generatePicks", "")
.addParam("address", "", "")
.addOptionalParam("start", "", "")
.addOptionalParam("end", "", "")
.setAction(async (args, hre) => {
  console.log('-------------------------------------------------------------------------------------------------------------------------')
  console.log(`Generang Picks for  ${cyan(args.address)}`)
  console.log('-------------------------------------------------------------------------------------------------------------------------')
  const paddedAddressBytes32 = ethers.utils.defaultAbiCoder.encode([ "address"], [ args.address])
  computePicks(paddedAddressBytes32, range((args.end - args.start) || 101, args.start || 0)
    .map(i => BigNumber.from(i)))
    .forEach(pick => convertPickToTable(pick, args.address))

})


function convertPickToTable (pick, address) {
  console.log(green(`Pick ${pick.index}: ${BigNumber.from(pick.hash).toString()}`))

}