const { getUserAndWallet } = require('./utils/getUserAndWallet');
const { contractConnectWallet } = require('./utils/contractConnectWallet');

/**
 * @name PrizeTierHistory.setPrizeTier()
 * @description Set prize tier settings for a particular draw.
 */
 task('setPrizeTier', 'Push prize tier settings to PrizeTierHistory')
   .addOptionalParam('wallet', '<address>')
   .addOptionalParam('override', 'Override prize tier settings for a particular drawId')
   .addParam('drawid', 'The draw ID to set')
   .addParam('bitRangeSize', 'The bitRangeSize for this draw', '2')
   .addParam('maxPicksPerUser', 'The maxPicksPerUser for this draw', '2')
   .addParam('prize', 'The awardable prize for this draw', '13630000000')
   .addParam(
     'tiers',
     'The different tiers for this draw',
     '["183418928", "0", "0", "315480557", "0", "501100513", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0"]',
   )
   .addParam('validityDuration', 'Prize period for this draw', '5259600') // 2 months in seconds
   .setAction(async (args, { ethers }) => {
     const { wallet } = await getUserAndWallet(ethers, args);
     const prizeTierHistory = await contractConnectWallet(ethers, 'PrizeTierHistory', wallet);

     const { override, drawid, bitRangeSize, maxPicksPerUser, prize, tiers, validityDuration } =
       args;

     if (Boolean(override)) {
       await prizeTierHistory.popAndPush({
         drawId: drawid,
         bitRangeSize,
         maxPicksPerUser,
         prize,
         tiers: JSON.parse(tiers),
         validityDuration,
       });
     } else {
       await prizeTierHistory.push({
         drawId: drawid,
         bitRangeSize,
         maxPicksPerUser,
         prize,
         tiers: JSON.parse(tiers),
         validityDuration,
       });
     }
   });
