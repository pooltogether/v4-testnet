import { HardhatUserConfig } from 'hardhat/config';
import networks from './hardhat.network';
import 'hardhat-dependency-compiler';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import "@nomiclabs/hardhat-etherscan";
import '@pooltogether/hardhat-deploy-markdown-export';
import './tasks/calculations';
import './tasks/administrative';
import './tasks/DrawBuffer';
import './tasks/PrizeDistributor';
import './tasks/PrizeDistributionBuffer';
import './tasks/PrizePool';
import './tasks/Ticket';
import './tasks/PrizeTierHistory';

const optimizerEnabled = true

const config: HardhatUserConfig = {
  networks,
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
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
      rinkeby: "0x72c9aA4c753fc36cbF3d1fF6fEc0bC44ad41D7f2",
      fuji: "0x0fB374787B0bB7e62bD82A1B020b12fa239aB788"
    },
    manager: {
      default: 0, // Wallet 0 is the default account
      rinkeby: '0x7025879c052bbac44fb24600087fe30a0f32edfe', // Ethereum(Rinkeby) Defender Relayer Address
      mumbai: '0xbce45a1c2c1eff18e77f217a62a44f885b26099f', // Polygon(Mumbai) Defender Relayer Address
      avalancheMainnet: '0x2d38318c873b7965ff3cb660461b04561cc487d1', // Avalanche(Mainnet) Defender Relayer Address
      avalancheFuji: '0x2d38318c873b7965ff3cb660461b04561cc487d1' //  Avalanche(Fuji) Defender Relayer Address
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
      "@pooltogether/v4-core/contracts/permit/EIP2612PermitAndDeposit.sol",
      // Timelock
      "@pooltogether/v4-timelocks/contracts/L1TimelockTrigger.sol",
      "@pooltogether/v4-timelocks/contracts/L2TimelockTrigger.sol",
      "@pooltogether/v4-timelocks/contracts/DrawCalculatorTimelock.sol",
      "@pooltogether/v4-timelocks/contracts/BeaconTimelockAndPushRouter.sol",
      "@pooltogether/v4-timelocks/contracts/ReceiverTimelockAndPushRouter.sol",
      // Periphery
      "@pooltogether/v4-periphery/contracts/PrizeFlush.sol",
      "@pooltogether/v4-periphery/contracts/PrizeTierHistory.sol",
      "@pooltogether/v4-periphery/contracts/PrizeDistributionFactory.sol",
      "@pooltogether/v4-periphery/contracts/TwabRewards.sol",
      // mock yield source
      "@pooltogether/yield-source-interface/contracts/test/MockYieldSource.sol"

    ]
  }
};

export default config;