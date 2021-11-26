#!/usr/bin/env node
import { verifyAddress } from './helpers/verifyAddress'
const chalk = require('chalk')
const find = require('find')
const fs = require('fs')
const hardhat = require('hardhat')

const info = (msg: any) => console.log(chalk.dim(msg))
const success = (msg: any) => console.log(chalk.green(msg))
const error = (msg: any) => console.error(chalk.red(msg))

async function verifyEtherscanClone() {
  const network = hardhat.network.name

  info(`verifying contracts on Etherscan Clone`)

  const filePath = "./deployments/" + network + "/"

  let toplevelContracts: Array<any> = []

  // read deployment JSON files
  fs.readdirSync(filePath).filter((fileName: any) => {
    if (fileName.includes(".json")) {

      const contractName = (fileName.substring(0, fileName.length - 5)).trim() // strip .json
      const contractDirPath = (find.fileSync(contractName + ".sol", "./node_modules/@pooltogether/"))[0]
      if (!contractDirPath) {
        error(`There is no matching contract for ${contractName}. This is likely becuase the deployment contract name is different from the Solidity contract title.
         Run verification manually. See verifyEtherscanClone() for details`)
        return
      }
      const deployment = JSON.parse(fs.readFileSync(filePath + fileName, "utf8"))

      toplevelContracts.push({
        address: deployment.address,
        contractPath: contractDirPath + ":" + contractName,
        contractName,
        constructorArgs: deployment.args,
      })
    }
  })

  info(`Attempting to verify ${toplevelContracts.length} top level contracts`)
  toplevelContracts.forEach(async (contract: any) => {
    let args = ""
    let argsArray: Array<any> = []
    if (contract.constructorArgs.length > 0) {
      contract.constructorArgs.forEach((arg: any) => {
        args = args.concat("\"", arg, "\" ") // format constructor args in correct form - "arg" "arg"
        argsArray.push(arg)
      })
    }

    await verifyAddress(hardhat, contract.address, argsArray)
  })
}


async function run() {
  const network = hardhat.network.name
  info(`Verifying top-level contracts on network: ${network}`)
  if (network == "matic" || network == "mumbai" || network == "bsc" || network == "polygon" || network == "avalanche" || network == "avalancheFuji") {
    await verifyEtherscanClone()
  }
  // else {
  //   info(`verifying contracts using native Hardhat verify`)
  //   const { stdout, stderr } = await exec(
  //     `npx hardhat --network ${network} etherscan-verify --api-key ${process.env.ETHERSCAN_API_KEY}`
  //   )

  //   console.log(chalk.yellow(stdout))
  //   console.log(chalk.red(stderr))
  // }

  info(`Done top-level contracts`)

  success('Done!')
}

run()
