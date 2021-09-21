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
    manager: {
      default: 0,
      rinkeby: '0x7025879c052bbac44fb24600087fe30a0f32edfe',
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
      "@pooltogether/v4-oracle-timelocks/contracts/DrawSettingsTimelockTrigger.sol",
      "@pooltogether/v4-oracle-timelocks/contracts/FullTimelockTrigger.sol",
      "@pooltogether/v4-oracle-timelocks/contracts/DrawCalculatorTimelock.sol",
      "@pooltogether/v4-core/contracts/DrawBeacon.sol",
      "@pooltogether/v4-core/contracts/DrawHistory.sol",
      "@pooltogether/v4-core/contracts/Ticket.sol",
      "@pooltogether/v4-core/contracts/prize-pool/YieldSourcePrizePool.sol",
      "@pooltogether/v4-core/contracts/TsunamiDrawCalculator.sol",
      "@pooltogether/v4-core/contracts/ClaimableDraw.sol",
      "@pooltogether/v4-core/contracts/test/ERC20Mintable.sol"
    ]
  }
};
