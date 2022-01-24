import { dim, cyan, green } from './colors';
import hre from 'hardhat';
import { constants, Contract } from 'ethers';

const { AddressZero } = constants;

export async function transferOwnership(
  name: string,
  contract: Contract | null,
  desiredOwner: string,
) {
  if (!contract) {
    contract = await hre.ethers.getContract(name);
  }

  const ownerIsSet = async () => {
    const contractOwner = await contract?.owner();
    const pendingOwner = await contract?.pendingOwner();

    return (
      contractOwner !== AddressZero || contractOwner == desiredOwner || pendingOwner == desiredOwner
    );
  };

  if (!(await ownerIsSet())) {
    cyan(`\nTransferring ${name} ownership to ${desiredOwner}...`);
    const tx = await contract?.transferOwnership(desiredOwner);
    await tx.wait(1);
    green(`Transfer complete!`);
  } else {
    dim(`\nOwner for ${name} has already been set`);
  }
}
