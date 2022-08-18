import config from './hardhat.config';
import { dependencyCompiler, external } from './hardhat.config.dependencies';

config.etherscan = {
  apiKey: process.env.ARB_ETHERSCAN_API_KEY,
};

config.dependencyCompiler = dependencyCompiler;
config.external = external;

export default config;
