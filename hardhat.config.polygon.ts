import config from './hardhat.config'

config.etherscan = {
  apiKey: process.env.POLYGONSCAN_API_KEY
}

export default config;