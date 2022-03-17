import hardhat from 'hardhat'
import { green, yellow } from './colors'
import {
    END_TIMESTAMP_OFFSET,
    EXPIRY_DURATION
} from './constants'

export async function pushDraw1() {
    const { ethers } = hardhat;
    const { getContract, utils } = ethers;
    const { parseUnits } = utils;

    yellow(`\nPushing Prize Tier configuration for Draw 1 onto the Prize Tier History...`)
    const prizeTierHistory = await getContract('PrizeTierHistory')
    try {
        await prizeTierHistory.getNewestDrawId()
    } catch (error) {
        const pushTx = await prizeTierHistory.push({
            drawId: 1,
            bitRangeSize: 2,
            maxPicksPerUser: 2,
            endTimestampOffset: END_TIMESTAMP_OFFSET,
            prize: '17632000000',
            tiers: ['141787658', '85072595', '136116152', '136116152', '108892921', '217785843', '174228675', 0, 0, 0, 0, 0, 0, 0, 0, 0],
            expiryDuration: EXPIRY_DURATION,
            dpr: parseUnits('0.1', '9'),
        })
        await pushTx.wait(1)
        green(`Done!`)
    }
}
