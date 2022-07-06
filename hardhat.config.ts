import { HardhatUserConfig } from 'hardhat/config';
import 'hardhat-dependency-compiler';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@pooltogether/hardhat-deploy-markdown-export';
import networks from './hardhat.network';
import { dependencyCompiler, external } from './hardhat.config.dependencies';

const optimizerEnabled = true;
const config: HardhatUserConfig = {
  networks,
  external,
  dependencyCompiler,
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    defenderRelayer: {
      default: 0,
      rinkeby: '0x7025879C052BBac44fB24600087FE30A0F32edfe', // Ethereum (Rinkeby) Defender Relayer
      mumbai: '0xbCE45a1C2c1eFF18E77f217A62a44f885b26099f', // Polygon (Mumbai) Defender Relayer
      fuji: '0x2d38318C873b7965Ff3cB660461b04561CC487d1', // Avalanche (Fuji) Defender Relayer
      optimismkovan: '0xc7040B24293c7D85f976A6c0A2B739099D4cBA38', // Optimism (Kovan) Defender Relayer
    },
    aUSDC: {
      default: 0,
      69: '0x0849Cd326DC590bF313a0b1E5a04790CBb4eE387',
    },
    aaveIncentivesController: {
      default: 0,
      69: '0x12d8A50922f634E2c153DcD4D2c67b963644729F',
    },
    aaveLendingPoolAddressesProviderRegistry: {
      default: 0,
      69: '0x3179C833fF0035D3BD42654f3aCAE4B0908af7A7',
    },
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
      {
        version: '0.8.10',
        settings: {
          optimizer: {
            enabled: optimizerEnabled,
            runs: 2000,
          },
          evmVersion: 'london',
        },
      },
    ],
  },
};

export default config;
