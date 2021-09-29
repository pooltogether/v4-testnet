const { red, green, blue, cyan } = require('./utils/colors');
const { runDrawCalculator, prepareClaimForUserFromDrawResult } = require('@pooltogether/draw-calculator-js');
const { ethers } = require('ethers');

/**
 * @name Ticket.claim()
 */
 task("getAccountDetails", "")
 .addOptionalParam("wallet", "<number>")
 .setAction(async (args, hre) => {
    const { ethers } = hre
    const { getSigners } = ethers
    const [ wallet ] = await getSigners();
    const ticket = await ethers.getContract('Ticket')
    const user = args.wallet || wallet.address // Input addres or default hardhat wallet
    const getAccountDetails = await ticket.getAccountDetails(user)
    convertUserToTable(user, getAccountDetails, ticket.address);
    return getAccountDetails;

 });


 function convertUserToTable (account, user, address) {
  console.log('-------------------------------------------------------------------------------------------------------------------------')
  console.log('User:', cyan(account), `Account details retrieved from ${cyan(address)}`)
  console.log('-------------------------------------------------------------------------------------------------------------------------')
  console.log(green(`Balance: ${cyan(ethers.utils.formatEther(user.balance))}`))
  console.log(green(`NextTwabIndex: ${cyan(user.nextTwabIndex)}`))
  console.log(green(`Cardinality: ${cyan(user.cardinality)}`))
  console.log('------------------------------------------------------------------------------\n')
}
