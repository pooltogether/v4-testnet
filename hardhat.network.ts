import { HardhatUserConfig } from 'hardhat/config';
const alchemyUrl = process.env.ALCHEMY_URL;
const infuraApiKey = process.env.INFURA_API_KEY;
const mnemonic = process.env.HDWALLET_MNEMONIC;
const avalanche = process.env.AVALANCHE_ENABLED;
const arbitrumGoerliRPCUrl = process.env.ARBITRUM_GOERLI_RPC_URL;
const optimismGoerliRPCUrl = process.env.OPTIMISM_GOERLI_RPC_URL;
const mumbaiRPCUrl = process.env.MUMBAI_RPC_URL;

const networks: HardhatUserConfig['networks'] = {
  localhost: {
    chainId: 1,
    url: 'http://127.0.0.1:8545',
    allowUnlimitedContractSize: true,
  },
};

if (alchemyUrl && process.env.FORK_ENABLED && mnemonic) {
  networks.hardhat = {
    chainId: 1,
    allowUnlimitedContractSize: true,
    gas: 12000000,
    blockGasLimit: 0x1fffffffffffff,
    forking: {
      url: alchemyUrl,
    },
    accounts: {
      mnemonic,
    },
  };
} else {
  networks.hardhat = {
    allowUnlimitedContractSize: true,
    gas: 12000000,
    blockGasLimit: 0x1fffffffffffff,
  };
}

if (!!avalanche) {
  networks.fuji = {
    chainId: 43113,
    url: 'https://api.avax-test.network/ext/bc/C/rpc',
    accounts: {
      mnemonic,
    },
  };
}

if (infuraApiKey && mnemonic) {
  networks.arbitrumGoerli = {
    chainId: 421613,
    url: arbitrumGoerliRPCUrl
      ? arbitrumGoerliRPCUrl
      : `https://arbitrum-goerli.infura.io/v3/${infuraApiKey}`,
    accounts: {
      mnemonic,
    },
  };

  networks.optimismGoerli = {
    chainId: 420,
    url: optimismGoerliRPCUrl
      ? optimismGoerliRPCUrl
      : `https://optimism-goerli.infura.io/v3/${infuraApiKey}`,
    accounts: {
      mnemonic,
    },
  };

  networks.polygonMumbai = {
    chainId: 80001,
    url: mumbaiRPCUrl
      ? mumbaiRPCUrl
      : `https://polygon-mumbai.infura.io/v3/${infuraApiKey}`,
    accounts: {
      mnemonic,
    },
  };

  networks.goerli = {
    chainId: 5,
    url: `https://goerli.infura.io/v3/${infuraApiKey}`,
    accounts: {
      mnemonic,
    },
  };

  networks.mainnet = {
    url: alchemyUrl,
    accounts: {
      mnemonic,
    },
  };
} else {
  console.warn('No infura or hdwallet available for testnets');
}

export default networks;
