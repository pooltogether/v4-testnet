import { cyan } from './colors';
import { displayResult } from './displayResult';
import hre from 'hardhat';

const { deployments } = hre;
const { deploy } = deployments;

export async function deployAndLog(name: string, options: any) {
  cyan(`\nDeploying ${name}...`);
  const result = await deploy(name, options);
  displayResult(name, result);
  return result;
}
