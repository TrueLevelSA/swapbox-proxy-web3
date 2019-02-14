README
------

A connector to connect to parity light node with web3x and send over zmq (becuase web3.py sucks).

### Install

```
yarn
```

```
yarn build
```


### Runing

Ensure client is running
```
parity --light
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
