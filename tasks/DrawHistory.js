const chalk = require('chalk');
const { DateTime } = require('luxon');
const { range } = require('./helpers');
const { red, green, blue, cyan } = require('./colors');
const { convertErrorToMsg } = require('./utils/messages');

/**
 * @name DrawHistory.getNewestDraw()
 * @description Read newest Draws from DrawHistory
 */
 task("getNewestDraw", "Read newest Draws from DrawHistory")
 .setAction(async (args, {ethers}) => {
    const drawHistory = await ethers.getContract('DrawHistory')
    convertDrawToTable(await drawHistory.getNewestDraw(), drawHistory.address)
 });

 /**
 * @name DrawHistory.getOldestDraw()
 * @description Read oldest Draws from DrawHistory
 */
  task("getOldestDraw", "Read oldest Draws from DrawHistory")
  .setAction(async ({ids}, {ethers}) => {
     const drawHistory = await ethers.getContract('DrawHistory')
     convertDrawToTable(await drawHistory.getOldestDraw(), drawHistory.address)
  });

/**
 * @name DrawHistory.getDraws()
 * @description Read list of Draws from DrawHistory
 */
 task("getDraws", "Read list of Draws from DrawHistory")
 .addParam('ids')
 .setAction(async ({ids}, {ethers}) => {
    const drawHistory = await ethers.getContract('DrawHistory')
    const list = ids.split(',')
    const oldDraw = await drawHistory.getOldestDraw()
    const newDraw = await drawHistory.getNewestDraw()
    const expiredList = list.filter((id, idx) => { if(id < oldDraw.drawId || id > newDraw.drawId) return true} )
    if(expiredList.length > 0) {
      console.log(red(`Draw IDs expired: ${expiredList} `))
      console.log(red('Remove expired ID(s) from passed --ids param'))
      console.log(green(`Run ${blue('yarn task getActiveDraws')} to fetch all active Draws\n`))
      return;
    }
    try {
      const drawList = await drawHistory.getDraws(list)
      drawList.forEach(draw => convertDrawToTable(draw, drawHistory.address))
      return drawList;
    } catch (error) {
      console.log(red('Error: Draw Expired'))
      console.log(error)
    }
 });

/**
 * @name getLiveDraws()
 * @description Reads the curren draws range and reads list of Draws
 */
 task("getLiveDraws", "Read live DrawHistory draw range")
 .setAction(async (args, {ethers}) => {
    const drawHistory = await ethers.getContract('DrawHistory')
    const oldDraw = await drawHistory.getOldestDraw()
    const newDraw = await drawHistory.getNewestDraw()
    const listEnforced = range((newDraw.drawId - oldDraw.drawId), oldDraw.drawId) // Generate Draw.drawId list [1,2,4,5,6,7]
    try {
      const drawList = await drawHistory.getDraws(listEnforced)
      drawList.forEach(draw => convertDrawToTable(draw, drawHistory.address));
      return drawList;
    } catch (error) {
      console.log(chalk.red('Error: Draw Expired'))
    }
 });

 /**
 * @name DrawHistory.pushDraw()
 * @description Push Draw onto DrawHistory ring buffer
  */
  task("pushDraw", "Set Draws in DrawHistory")
  .addParam('id')
  .addParam('time')
  .addParam('wrn')
  .addParam('startedAt')
  .setAction(async (args, {ethers}) => {
    const { id, time, wrn, startedAt, seconds} = args
    const drawHistory = await ethers.getContract('DrawHistory')
    const drawBeacon = await ethers.getContract('DrawBeacon')
    const beaconPeriodSeconds = await drawBeacon.beaconPeriodSeconds();
    try {
      const newDraw = {
        drawId: id,
        timestamp: time,
        winningRandomNumber: wrn,
        beaconPeriodStartedAt: startedAt,
        beaconPeriodSeconds: beaconPeriodSeconds
      }
      const tx = await drawHistory.pushDraw(newDraw);
      console.log(tx)
      return tx
    } catch (error) {
      convertErrorToMsg(error, drawHistory)
    }
  });

 /**
 * @name DrawHistory.setDraw()
 * @description Set Draws in DrawHistory
  */
  task("setDraw", "Set Draws in DrawHistory")
  .addParam('id')
  .addParam('timestamp')
  .addParam('wrn')
  .setAction(async (args, {ethers}) => {
    const { id, timestamp, winningRandomNumber} = args
    const drawHistory = await ethers.getContract('DrawHistory')
    try {
      const drawCurrent = await drawHistory.getDraw(id)
      const newDraw = {
        drawId: id,
        timestamp: timestamp || drawCurrent.timestamp,
        winningRandomNumber: winningRandomNumber || drawCurrent.winningRandomNumber,
        beaconPeriodStartedAt: drawCurrent.beaconPeriodStartedAt,
        beaconPeriodSeconds: drawCurrent.beaconPeriodSeconds,
      }
      const tx = await drawHistory.setDraw(newDraw);
      console.log(tx)
      return tx
    } catch (error) {
      convertErrorToMsg(error, drawHistory)
    }
  });


 function convertDrawToTable (draw, address) {
  console.log('----------------------------------------------------------------------------')
  console.log('Draw ID:', draw.drawId, `retrieved from ${address}`)
  console.log('----------------------------------------------------------------------------')

  const date = DateTime.fromMillis(draw.timestamp * 1000);
  const calendar = date.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS);

  console.log(green(`Timestamp: ${cyan(draw.timestamp)} (${red(calendar)}) `))
  console.log(green(`RandomNumber: ${cyan(draw.winningRandomNumber)}`))
  console.log('------------------------------------------------------------------------------\n')
}