const networks = require('./hardhat.network')
require('hardhat-dependency-compiler')
require('hardhat-deploy')
require('hardhat-deploy-ethers')

const optimizerEnabled = true

module.exports = {
  networks,
  solidity: {
    compilers: [
      {
        version: '0.8.6',
        settings: {
          optimizer: {
            enabled: optimizerEnabled,
            runs: 2000,
          },
          evmVersion: 'berlin',
        },
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0
    },
    owner: {
      default: 0,
      rinkeby: '0x72c9aA4c753fc36cbF3d1fF6fEc0bC44ad41D7f2'
    }
  },
  external: {
    contracts: [
      {
        artifacts: "node_modules/@pooltogether/pooltogether-rng-contracts/build",
      },
      {
        artifacts: "node_modules/@pooltogether/yield-source-interface/artifacts"
      }
    ],
    deployments: {
      rinkeby: ["node_modules/@pooltogether/pooltogether-rng-contracts/deployments/rinkeby"],
      mumbai: ["node_modules/@pooltogether/pooltogether-rng-contracts/deployments/mumbai_80001"],
    },
  },
  dependencyCompiler: {
    paths: [
      "@pooltogether/v4/contracts/DrawBeacon.sol",
      "@pooltogether/v4/contracts/DrawHistory.sol",
      "@pooltogether/v4/contracts/registry/Registry.sol",
      "@pooltogether/v4/contracts/Ticket.sol",
      "@pooltogether/v4/contracts/prize-pool/YieldSourcePrizePool.sol",
      "@pooltogether/v4/contracts/TsunamiDrawCalculator.sol",
      "@pooltogether/v4/contracts/ClaimableDraw.sol"
    ]
  }
};
