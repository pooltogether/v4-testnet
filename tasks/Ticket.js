const { DateTime } = require('luxon');
const { green, cyan, yellow } = require('chalk');
const { ethers, utils } = require('ethers');
const { getUserAndWallet } = require('./utils/getUserAndWallet');
const { convertErrorToMsg } = require('./utils/messages');
const { contractConnectWallet } = require('./utils/contractConnectWallet');

/**
 * @name Ticket.balanceOf()
 */
 task("balanceOf", "")
 .addOptionalParam("user", "<address>")
 .addOptionalParam("wallet", "<address>")
 .setAction(async (args, {ethers}) => {
    const { user, wallet } = await getUserAndWallet(ethers, args)
    const ticket = await contractConnectWallet(ethers, 'Ticket', wallet)
    const balanceOf = await ticket.balanceOf(user)
    convertBalanceOfToTable(user, balanceOf)
    return balanceOf
 });

/**
 * @name Ticket.getAccountDetails()
 */
 task("getAccountDetails", "")
 .addOptionalParam("user", "<address>")
 .addOptionalParam("wallet", "<address>")
 .setAction(async (args, {ethers}) => {
    const { user, wallet } = await getUserAndWallet(ethers, args)
    const ticket = contractConnectWallet(ethers, 'Ticket', wallet)
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
  .addOptionalParam("user", "<address>")
  .addOptionalParam("wallet", "<address>")
  .setAction(async (args, {ethers}) => {
    const { user, wallet } = await getUserAndWallet(ethers, args)
    const ticket = contractConnectWallet(ethers, 'Ticket', wallet)
    const { start, end } = args
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


function convertBalanceOfToTable(account, balance) {
  console.log('-------------------------------------------------------------------------------------------------------------------------')
  console.log('User:', cyan(account), `has a balance of ${cyan(utils.formatEther(balance))}`)
  console.log('-------------------------------------------------------------------------------------------------------------------------')
}

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
