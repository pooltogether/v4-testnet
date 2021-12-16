import { HardhatUserConfig } from 'hardhat/config';
import networks from './hardhat.network';
import { dependencyCompiler, external } from './hardhat.config.dependencies'
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
  external,
  dependencyCompiler,
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0
    },
    defenderRelayer: {
      default: 0
    },
    executiveTeam: {
      default: 0,
    },
    owner: {
      default: 0,
      rinkeby: "0x72c9aA4c753fc36cbF3d1fF6fEc0bC44ad41D7f2",
      fuji: "0x0fB374787B0bB7e62bD82A1B020b12fa239aB788"
    },
    manager: {
      default: 0,
      rinkeby: '0x7025879c052bbac44fb24600087fe30a0f32edfe', // Ethereum (Rinkeby) Defender Relayer Address
      mumbai: '0xbce45a1c2c1eff18e77f217a62a44f885b26099f', // Polygon (Mumbai) Defender Relayer Address
      avalancheFuji: '0x2d38318c873b7965ff3cb660461b04561cc487d1' //  Avalanche (Fuji) Defender Relayer Address
    }
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
};

export default config;