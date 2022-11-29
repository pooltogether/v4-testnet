import chalk from 'chalk';

export function dim(...args: string[]) {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.dim.call(chalk, ...args));
  }
}

export function cyan(...args: string[]) {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.cyan.call(chalk, ...args));
  }
}

export function yellow(...args: string[]) {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.yellow.call(chalk, ...args));
  }
}

export function green(...args: string[]) {
  if (!process.env.HIDE_DEPLOY_LOG) {
    console.log(chalk.green.call(chalk, ...args));
  }
}
