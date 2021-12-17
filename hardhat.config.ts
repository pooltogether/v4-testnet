import { HardhatUserConfig } from 'hardhat/config';
import 'hardhat-dependency-compiler';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import "@nomiclabs/hardhat-etherscan";
import '@pooltogether/hardhat-deploy-markdown-export';
import networks from './hardhat.network';
import { dependencyCompiler, external } from './hardhat.config.dependencies'

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
      default: 0,
      rinkeby: '0x7025879c052bbac44fb24600087fe30a0f32edfe',  // Ethereum (Rinkeby) Defender Relayer
      mumbai: '0xbce45a1c2c1eff18e77f217a62a44f885b26099f',   // Polygon (Mumbai) Defender Relayer
      fuji: '0x2d38318c873b7965ff3cb660461b04561cc487d1'      // Avalanche (Fuji) Defender Relayer
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
    ],
  },
};

export default config;