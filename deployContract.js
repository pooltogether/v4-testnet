const { cyan, displayResult } = require('./colors')

async function deployContract(deploy, contract, deployer, args) {
  cyan(`\nDeploying ${contract}...`)
  const result = await deploy(contract, {
    from: deployer,
    args: args,
    skipIfAlreadyDeployed: true,
  })
  displayResult(`${contract}`, result)

  return result
}

module.exports = {
  deployContract
}