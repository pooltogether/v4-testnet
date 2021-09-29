const { DateTime } = require('luxon');
const { green, cyan, yellow } = require('chalk');
const { runDrawCalculator, prepareClaimForUserFromDrawResult } = require('@pooltogether/draw-calculator-js');
const { ethers } = require('ethers');
const { convertErrorToMsg } = require('./utils/messages');

/**
 * @name Ticket.getAccountDetails()
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

 /**
 * @name Ticket.getAverageBalancesBetween()
 */
  task("getAverageBalancesBetween", "")
  .addParam("start", "<number>[]")
  .addParam("end", "<number>[]")
  .addOptionalParam("wallet", "<number>")
  .setAction(async (args, {ethers}) => {
    const { start, end } = args
    const { getSigners } = ethers
    const [ wallet ] = await getSigners();
    const ticket = await ethers.getContract('Ticket')
    const user = args.wallet || wallet.address // Input addres or default hardhat wallet
    const rangeStart = start.split(',')
    const rangeEnd = end.split(',')
    try {   
      const getAverageBalancesBetween = await ticket.getAverageBalancesBetween(user,rangeStart,rangeEnd)
      getAverageBalancesBetween.forEach((balance, idx) =>  convertBalanceToTable(user, balance, rangeStart[idx], rangeEnd[idx]))
      return getAverageBalancesBetween;
    } catch (error) {
      convertErrorToMsg(error, ticket)
    }
  });


/**
 * @name Ticket.transfer()
 */
task("transfer", "")
.addParam("to", "<string>")
.addParam("amount", "<number>[]")
.addOptionalParam("wallet", "<number>")
.setAction(async (args, {ethers}) => {
  const { getSigners } = ethers
  const wallet = (await getSigners())[args.wallet || 0]
  const ticket = await (await ethers.getContract('Ticket')).connect(wallet)
  const bnAmount = ethers.utils.parseUnits(args.amount, await ticket.decimals())
  const tx = await ticket.transfer(args.to, bnAmount)
  console.log(tx)
});

/**
 * @name Ticket.delegate()
 */
task("delegate", "")
.addParam("to", "<string>")
.addOptionalParam("wallet", "<number>")
.setAction(async (args, {ethers}) => {
  const { getSigners } = ethers
  const wallet = (await getSigners())[args.wallet || 0]
  const ticket = await (await ethers.getContract('Ticket')).connect(wallet)
  const tx = await ticket.delegate(args.to)
  console.log(tx)
});

function convertBalanceToTable (user, balance, start, end) {
  const startDate = DateTime.fromMillis(start * 1000);
  const endDate = DateTime.fromMillis(end * 1000);
  const calendarStart = startDate.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS);
  const calendarEnd = endDate.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS);

  console.log('----------------------------------------------------------------')
  console.log(green(`Average Balance: ${yellow(ethers.utils.formatEther(balance))} beween timestamp ${yellow(start)} and timestamp ${yellow(end)} `))
  console.log(green(`Calendar Start: ${cyan(calendarStart)}`))
  console.log(green(`Calendar End: ${cyan(calendarEnd)}`))
  console.log('----------------------------------------------------------------')

}

 function convertUserToTable (account, user, address) {
  console.log('-------------------------------------------------------------------------------------------------------------------------')
  console.log('User:', cyan(account), `Account details retrieved from ${cyan(address)}`)
  console.log('-------------------------------------------------------------------------------------------------------------------------')
  console.log(green(`Balance: ${cyan(ethers.utils.formatEther(user.balance))}`))
  console.log(green(`NextTwabIndex: ${cyan(user.nextTwabIndex)}`))
  console.log(green(`Cardinality: ${cyan(user.cardinality)}`))
  console.log('------------------------------------------------------------------------------\n')
}
