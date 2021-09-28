const { cyan, displayResult } = require('./colors')

async function deployContract(deploy, contract, deployer, args) {
  cyan(`\nDeploying ${contract}...`)
  const result = await deploy(contract, {
    from: deployer,
    args: args 
  })
  displayResult(`${contract}`, result)

  return result
}

module.exports = {
  deployContract
}