const fs = require('fs');

const goerliDeployments = `${__dirname}/../deployments/goerli`;
const mumbaiDeployments = `${__dirname}/../deployments/mumbai`;
const avalancheFujiDeployments = `${__dirname}/../deployments/fuji`;
const arbitrumGoerliDeployments = `${__dirname}/../deployments/arbitrumGoerli`;
const optimismGoerliDeployments = `${__dirname}/../deployments/optimismGoerli`;

const networkDeploymentPaths = [
  goerliDeployments,
  mumbaiDeployments,
  avalancheFujiDeployments,
  arbitrumGoerliDeployments,
  optimismGoerliDeployments,
];

const CURRENT_VERSION = {
  major: 1,
  minor: 1,
  patch: 0,
};

const contractList = {
  name: 'Testnet Linked Prize Pool',
  version: CURRENT_VERSION,
  tags: {},
  contracts: [],
};

const formatContract = (chainId, contractName, deploymentBlob) => {
  const regex = /V[1-9+]((.[0-9+]){0,2})$/g;
  const version = contractName.match(regex)?.[0]?.slice(1).split('.') || [1, 0, 0];
  const type = contractName.split(regex)[0];
  return {
    chainId,
    address: deploymentBlob.address,
    version: {
      major: Number(version[0]),
      minor: Number(version[1]) || 0,
      patch: Number(version[2]) || 0,
    },
    type: type,
    abi: deploymentBlob.abi,
    tags: [],
    extensions: {},
  };
};

networkDeploymentPaths.forEach((networkDeploymentPath) => {
  const contractDeploymentPaths = fs
    .readdirSync(networkDeploymentPath)
    .filter((path) => path.endsWith('.json'));
  const chainId = Number(fs.readFileSync(`${networkDeploymentPath}/.chainId`, 'utf8'));

  contractDeploymentPaths.forEach((contractDeploymentFileName) => {
    const contractName = contractDeploymentFileName.split('.')[0];
    const contractDeployment = JSON.parse(
      fs.readFileSync(`${networkDeploymentPath}/${contractDeploymentFileName}`, 'utf8'),
    );
    contractList.contracts.push(formatContract(chainId, contractName, contractDeployment));
  });
});

fs.writeFile(`${__dirname}/../contracts.json`, JSON.stringify(contractList), (err) => {
  if (err) {
    console.error(err);
    return;
  }
});
