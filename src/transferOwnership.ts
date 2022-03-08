// @ts-nocheck
import { dim, cyan, green } from './colors'
import hre from 'hardhat'
import { Contract } from 'ethers'


export async function transferOwnership(name: string, contract: Contract | null, desiredOwner: string) {
    if (!contract) {
        // @ts-ignore
        contract = await hre.ethers.getContract(name)
    }
    const ownerIsSet = (
        await contract.owner() == desiredOwner ||
        await contract.pendingOwner() == desiredOwner
    )

    if (!ownerIsSet) {
        cyan(`\nTransferring ${name} ownership to ${desiredOwner}...`)
        const tx = await contract.transferOwnership(desiredOwner)
        await tx.wait(1)
        green(`Transfer complete!`)
    } else {
        dim(`\nOwner for ${name} has been set`)
    }
}
