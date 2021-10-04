const hardhat = require('hardhat');
const { ethers } = hardhat

async function getDrawBeacnDetails() {
  const [wallet] = await ethers.getSigners()
  const DrawBeacon = await ethers.getContract('DrawBeacon')
  const beaconPeriodSeconds = await DrawBeacon.getBeaconPeriodSeconds()
  const beaconPeriodStartedAt = await DrawBeacon.getBeaconPeriodStartedAt()
  const drawHistory = await DrawBeacon.getDrawHistory()
  const nextDrawId = await DrawBeacon.getNextDrawId()
  const lastRngLockBlock = await DrawBeacon.getLastRngLockBlock()
  const lastRngRequestId = await DrawBeacon.getLastRngRequestId()
  const rngService = await DrawBeacon.getRngService()
  const rngTimeout = await DrawBeacon.getRngTimeout()

  return {
    beaconPeriodSeconds,
    beaconPeriodStartedAt,
    drawHistory,
    nextDrawId,
    lastRngLockBlock,
    lastRngRequestId,
    rngService,
    rngTimeout,

  }

}

module.exports = {
  getDrawBeacnDetails
}