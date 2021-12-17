import hre from 'hardhat'
import { Contract } from 'ethers'
import { cyan, green } from './colors'

export async function setPrizeStrategy(prizeStrategyAddress: string, contract?: Contract) {
    if (!contract) {
        // @ts-ignore
        contract = await hre.ethers.getContract('YieldSourcePrizePool')
    }
    if (await contract.getPrizeStrategy() != prizeStrategyAddress) {
        cyan('\nSetting prize strategy on prize pool...')
        const tx = await contract.setPrizeStrategy(prizeStrategyAddress)
        await tx.wait(1)
        green(`Set prize strategy!`)
    }
}
