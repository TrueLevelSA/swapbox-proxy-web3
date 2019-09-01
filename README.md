[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)



README
------

A connector to connect to parity light node with web3x and send over zmq (becuase web3.py sucks).

### Dependencies
- [vyper v0.1.0b4](https://github.com/ethereum/vyper/releases/tag/v0.1.0-beta.4r)
- [geth](https://github.com/ethereum/go-ethereum)

### Install

```
yarn install && yarn build
```

You need to unlock the `account[0]` of your node, this is the `machineAddress` that will be used in the code. You also need to call `Atola.addMachine(machineAddress)` from the Atola's `owner` address before being able to perform buy/sell orders.

### Running

Ensure ethereum client is running
```bash
parity --light
```

You can edit `config.json` at your tastes before starting.

Start the connector
```bash
yarn start
```

### Private network
For testing purpose.

Run geth with the following:
```bash
geth --dev --ws --wsport=8546 --wsorigins="*" --wsapi personal,eth,net,rpc,shh,web3 --allow-insecure-unlock
```

And then run this from another terminal `smart-contract/` folder:
```bash
cd smart-contract/
geth --exec "loadScript('scripts/unlock.js')" attach ipc://tmp/geth.ipc
```
It will unlock 9 more accounts (so 10 in total) and prefund them with 1000 ETH each.

You will also need to deploy the contract:
```bash
yarn deploy
```

You can start with nodemon using:
```bash
yarn start:dev
```

### Accounts management
Generate key:
```
yarn genkey
```

Add key (needs ethereum client running)
```
yarn addkey
```


TO-DO
-----

- Point machine operator fee to value set in smart contract
- Add ZMQ authentication (https://github.com/zeromq/pyzmq/blob/master/examples/security/ironhouse.py??)
- Add methods for listening to transaction events for the purpose of advancing transaction process
- Add methods for calling contract?
