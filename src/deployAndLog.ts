import { cyan } from './colors';
import { displayResult } from './displayResult';
import hre from 'hardhat';
import { DeployOptions } from 'hardhat-deploy/dist/types';

const { deployments } = hre;
const { deploy } = deployments;

export async function deployAndLog(name: string, options: DeployOptions) {
  cyan(`\nDeploying ${name}...`);
  const result = await deploy(name, options);
  displayResult(name, result);
  return result;
}
