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
      goerli: '0x22f928063d7FA5a90f4fd7949bB0848aF7C79b0A', // Ethereum (Goerli) Defender Relayer
      mumbai: '0xbCE45a1C2c1eFF18E77f217A62a44f885b26099f', // Polygon (Mumbai) Defender Relayer
      fuji: '0x2d38318C873b7965Ff3cB660461b04561CC487d1', // Avalanche (Fuji) Defender Relayer
      optimismGoerli: '0x7edb3772c952C0Eb22E156f443A6B91829237592', // Optimism (Goerli) Defender Relayer
    },
    aUSDC: {
      default: 0,
      5: '0x1Ee669290939f8a8864497Af3BC83728715265FF',
      420: '0xa0c014681515cB33176A885a0fCE0c458aC5de2d',
    },
    aaveIncentivesController: {
      default: 0,
      5: '0x0C501fB73808e1BD73cBDdd0c99237bbc481Bb58',
      420: '0x0C501fB73808e1BD73cBDdd0c99237bbc481Bb58',
    },
    aaveLendingPoolAddressesProviderRegistry: {
      default: 0,
      5: '0xC87385b5E62099f92d490750Fcd6C901a524BBcA',
      420: '0xA33cB62d453891A1DC80F4A092F4990539e5FA07',
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
