import config from './hardhat.config'

// @ts-ignore
config.snowtrace = {
  apiKey: process.env.SNOWTRACE_API_KEY
}

export default config;