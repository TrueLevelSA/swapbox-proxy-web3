[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)



README
------

A connector to connect to parity light node with web3x and send over zmq (becuase web3.py sucks).

### Dependencies
- `vyper`
- `geth` (go-ethereum)

### Install

```
yarn install
```

```
yarn build
```

### Configure
Generate key:
```
yarn genkey
```

Add key (needs ethereum client running)
```
yarn addkey
```

### Runing

Ensure ethereum client is running
```
parity --light
```
Testing with `geth` (unsafe because of `wsorigins` and `rpccorsdomain` accepting all sources)
```
geth --dev --rpc --rpcport=8545 --ws --wsport=8546 --wsorigins="*" --rpccorsdomain="*"
```

Start the connector
```
yarn start:dev
```


TO-DO
-----

- Point machine operator fee to value set in smart contract
- Add ZMQ authentication (https://github.com/zeromq/pyzmq/blob/master/examples/security/ironhouse.py??)
- Add methods for listening to transaction events for the purpose of advancing transaction process
- Add methods for calling contract?
