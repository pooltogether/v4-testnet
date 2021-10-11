import { Contract } from "@ethersproject/contracts";

const chalk = require('chalk');

export function dim(msg: any) {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.dim(msg));
  }
}

export function cyan(msg: any) {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.cyan(msg));
  }
}

export function yellow(msg: any) {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.yellow(msg));
  }
}

export function green(msg: any) {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.green(msg));
  }
}

export function displayResult(name: string, result: Contract) {
  if (!result.newlyDeployed) {
    yellow(`Re-used existing ${name} at ${result.address}`);
  } else {
    green(`${name} deployed at ${result.address}`);
  }
}

module.exports = {
  dim, cyan, yellow, green, displayResult
}