const networks = require('./hardhat.network')
require('./tasks/check-draw')
require('./tasks/deposit')
require('./tasks/pool-stats')
require('./tasks/draw-stats')
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
    },
    manager: {
      rinkeby: '0xb889e88c6dc2f652ad319e1c0d9a30f5b08b9354',
      mumbai: '0xbce45a1c2c1eff18e77f217a62a44f885b26099f'
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
      // "@pooltogether/v4/contracts/registry/Registry.sol",
      "@pooltogether/v4/contracts/Ticket.sol",
      "@pooltogether/v4/contracts/prize-pool/YieldSourcePrizePool.sol",
      "@pooltogether/v4/contracts/TsunamiDrawCalculator.sol",
      "@pooltogether/v4/contracts/ClaimableDraw.sol",
      "@pooltogether/v4/contracts/test/ERC20Mintable.sol"
    ]
  }
};
