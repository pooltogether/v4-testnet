const { generate } = require('./utils/generate')

task("export-deployments-md", "Exports deployments as a markdown file")
  .setAction(async (taskArgs, hre) => {
    await generate({
      name: "V4 Testnet",
      outputFilePath: `./deployments.md`,
      githubBaseUrl: "https://github.com/pooltogether/v4-rinkeby/tree/master",
    })        
  });
