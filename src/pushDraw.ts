import hardhat from 'hardhat';
import { green, yellow } from './colors';
import { END_TIMESTAMP_OFFSET, EXPIRY_DURATION } from './constants';

export default async function pushDraw(
  drawId: number,
  tiers: Array<number | string>, // 16 tiers values
) {
  const { ethers } = hardhat;
  const { getContract } = ethers;

  yellow(`\nPushing Prize Tier configuration for Draw ${drawId} onto the Prize Tier History...`);
  const prizeTierHistory = await getContract('PrizeTierHistory');
  try {
    await prizeTierHistory.getNewestDrawId();
  } catch (error) {
    const pushTx = await prizeTierHistory.push({
      bitRangeSize: 1,
      drawId,
      maxPicksPerUser: 1,
      expiryDuration: EXPIRY_DURATION,
      endTimestampOffset: END_TIMESTAMP_OFFSET,
      prize: '4802000000',
      tiers,
    });
    await pushTx.wait(1);
    green(`Done!`);
  }
}
