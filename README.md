# PoolTogether V4 Testnet
The V4 testnet deployed contracts and essential hardhat tasks.

# Getting Started
Install `direnv` module.

We use [direnv](https://direnv.net/) to manage environment variables.  You'll likely need to install it.

```sh
cp .envrc.example .envrc
```

To run fork scripts, deploy or perform any operation with a mainnet/testnet node you will need an Infura API key.

### Disbursement Address
To `disburse` and `deposit` you will need to add a list of address(es) to DISBURSE_ADDRESSES.


**Example**
```.sh
export DISBURSE_ADDRESSES='0x0000000000000000000000000000000000000000,0x0000000000000000000000000000000000000001'
```

# Setup
```.sh
yarn
```

## New Deployments
```.sh
yarn deploy:rinkeby
```

```.sh
yarn deploy:mumbai
```

```.sh
yarn deploy:fuji
```

## Acquire Tokens & Tickets

```.sh
yarn disburse rinkeby
```

```sh
yarn disburse mumbai
```

```sh
yarn disburse fuji
```

```sh
yarn deposit rinkeby
```

```sh
yarn deposit mumbai
```

```sh
yarn deposit fuji
```

## Test Deployment Scripts

```.sh
yarn node:rinkeby
```

```.sh
yarn node:mumbai
```


```.sh
yarn node:fuji
```
