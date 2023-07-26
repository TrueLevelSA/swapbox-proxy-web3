[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)



# README

A connector to connect to parity light node with ethers.js and send data over ZMQ.


## Install

# Install project dependencies and build
```shell
yarn install && yarn build
```

The first account returned by the `eth_accounts` response is used to sign transactions.
To make the signing work, you must unlock this account.

To be able to create orders, you must call `swapbox.addMachine(<address>)` first.
You need to unlock the `account[0]` of your node,
this is the `machineAddress` that will be used in the contracts.

## Configuration

The default configuration is in `./config/default.json`.

You can add your own JSON configuration file in the `./config` folder.  
To use your config file, specify its name (without the `.json` extension)
via the `NODE_CONFIG_ENV` when running the Web3 proxy.

> For development, configurations files other than the `default.json` are ignored from git.

For example if you have the config file `./config/custom.json`,
then you can the Web3 proxy with:

```shell
NODE_CONFIG_ENV=custom yarn start
```

## Running

Ensure an ethereum client is running, such as parity.

```shell
parity --light
```

Start the Web3 proxy

```shell
yarn start
```

## Private network (hardhat)

You can run the proxy over hardhat for tests and development.

> You will need an [Alchemy key](https://docs.alchemy.com/docs/alchemy-quickstart-guide#1key-create-an-alchemy-key).  
> The key will be passed accordingly via the `SWAPBOX_ALCHEMY_KEY`.

1. Run a hardhat network with your Alchemy key (from a separate terminal):

   ```shell
   SWAPBOX_ALCHEMY_KEY="<alchemy_key>" yarn hardhat node
   ```

2. Deploy the contracts on the hardhat network.

   > This must be repeated every time the network is restarted.

   ```shell
   yarn deploy
   ```

3. Start the Web3 proxy with `nodemon` (auto-reload on change):

   ```shell
   yarn start:dev
   ```

   > If you get an `UnhandledPromiseRejectionWarning: Error: call revert exception`,
   > It is likely one of the smart contract address has changed.  
   > Check the output of `yarn deploy` or the log of `hardhat node` for the correct addresses.
   > Then update the values in your config file (by default: `config/default.json`).


### Tests

Hardhat is also used to run tests related to the smart contracts.

> Unlike when running the Web3 proxy, no need to manually start the hardhat network.  
> However you will still need your alchemy key.

```shell
SWAPBOX_ALCHEMY_KEY="<alchemy_key>" yarn test
```

## TO-DO

- Point machine operator fee to value set in smart contract
- Add ZMQ authentication (https://github.com/zeromq/pyzmq/blob/master/examples/security/ironhouse.py??)
- Add methods for listening to transaction events for the purpose of advancing transaction process
- Add methods for calling contract?
