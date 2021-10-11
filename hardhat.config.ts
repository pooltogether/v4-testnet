
import { HardhatUserConfig } from 'hardhat/config';
import { DeployFunction } from 'hardhat-deploy/types';

const networks = require('./hardhat.network')
require('hardhat-dependency-compiler')
require('hardhat-deploy')
require('hardhat-deploy-ethers')
require('@pooltogether/hardhat-deploy-markdown-export')

// Tasks
require('./tasks/calculations')
require('./tasks/administrative')
require('./tasks/DrawBuffer')
require('./tasks/PrizeDistributor')
require('./tasks/PrizeDistributionBuffer')
require('./tasks/PrizePool')
require('./tasks/Ticket')
require('./tasks/PrizeTierHistory')

const optimizerEnabled = true

interface HardhatUserConfigExtended extends HardhatUserConfig {
  namedAccounts: any;
  external: any;
  dependencyCompiler: any;
}

const config: HardhatUserConfigExtended = {
  networks,
  defaultNetwork: "rinkeby",
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
      rinkeby: "0x72c9aA4c753fc36cbF3d1fF6fEc0bC44ad41D7f2"
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
      // Core
      "@pooltogether/v4-core/contracts/DrawBeacon.sol",
      "@pooltogether/v4-core/contracts/DrawCalculator.sol",
      "@pooltogether/v4-core/contracts/DrawBuffer.sol",
      "@pooltogether/v4-core/contracts/PrizeDistributor.sol",
      "@pooltogether/v4-core/contracts/PrizeDistributionBuffer.sol",
      "@pooltogether/v4-core/contracts/Ticket.sol",
      "@pooltogether/v4-core/contracts/prize-strategy/PrizeSplitStrategy.sol",
      "@pooltogether/v4-core/contracts/Reserve.sol",
      "@pooltogether/v4-core/contracts/prize-pool/YieldSourcePrizePool.sol",
      "@pooltogether/v4-core/contracts/test/ERC20Mintable.sol",
      // Timelock
      "@pooltogether/v4-timelocks/contracts/L1TimelockTrigger.sol",
      "@pooltogether/v4-timelocks/contracts/L2TimelockTrigger.sol",
      "@pooltogether/v4-timelocks/contracts/DrawCalculatorTimelock.sol",
      // Periphery
      "@pooltogether/v4-periphery/contracts/PrizeFlush.sol",
      "@pooltogether/v4-periphery/contracts/PrizeTierHIstory.sol",
      // mock yield source
      "@pooltogether/yield-source-interface/contracts/test/MockYieldSource.sol"

    ]
  }
};

export default config;