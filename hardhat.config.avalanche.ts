import config from './hardhat.config'
import depenendencies from './hardhat.config.dependencies'

config.etherscan = {
  apiKey: process.env.SNOWTRACE_API_KEY
}
config.dependencyCompiler = depenendencies.dependencyCompiler
config.external = depenendencies.external

export default config;