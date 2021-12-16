const fs = require("fs");

const rinkebyDeployments = `${__dirname}/../deployments/rinkeby`;
const mumbaiDeployments = `${__dirname}/../deployments/mumbai`;
const avalancheFujiDeployments = `${__dirname}/../deployments/fuji`;

const networkDeploymentPaths = [rinkebyDeployments, mumbaiDeployments, avalancheFujiDeployments];

const CURRENT_VERSION = {
  major: 1,
  minor: 1,
  patch: 0,
};

const contractList = {
  name: "Testnet Linked Prize Pool",
  version: CURRENT_VERSION,
  tags: {},
  contracts: [],
};

const formatContract = (chainId, contractName, deploymentBlob) => {
  return {
    chainId,
    address: deploymentBlob.address,
    version: CURRENT_VERSION,
    type: contractName,
    abi: deploymentBlob.abi,
    tags: [],
    extensions: {},
  };
};

networkDeploymentPaths.forEach((networkDeploymentPath) => {
  const contractDeploymentPaths = fs
    .readdirSync(networkDeploymentPath)
    .filter((path) => path.endsWith(".json"));
  const chainId = Number(
    fs.readFileSync(`${networkDeploymentPath}/.chainId`, "utf8")
  );

  contractDeploymentPaths.forEach((contractDeploymentFileName) => {
    const contractName = contractDeploymentFileName.split(".")[0];
    const contractDeployment = JSON.parse(
      fs.readFileSync(
        `${networkDeploymentPath}/${contractDeploymentFileName}`,
        "utf8"
      )
    );
    contractList.contracts.push(
      formatContract(chainId, contractName, contractDeployment)
    );
  });
});

fs.writeFile(
  `${__dirname}/../contracts.json`,
  JSON.stringify(contractList),
  (err) => {
    if (err) {
      console.error(err);
      return;
    }
  }
);
