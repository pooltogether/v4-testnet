import { cyan, green } from './colors'
import hre from 'hardhat'
import { Contract } from 'ethers'

export async function setTicket(ticketAddress: string, contract?: Contract) {
    if (!contract) {
        // @ts-ignore
        contract = await hre.ethers.getContract('YieldSourcePrizePool')
    }
    if (await contract.getTicket() != ticketAddress) {
        cyan('\nSetting prize strategy on prize pool...')
        const tx = await contract.setTicket(ticketAddress)
        await tx.wait(1)
        green(`Set prize strategy!`)
    }
}
