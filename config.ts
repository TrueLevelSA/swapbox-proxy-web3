export const config = {
  debug: true,
  websocket_provider: {
    url: 'ws://127.0.0.1:8546'
  },
  websocket_alt_provider: {
    url: 'wss://mainnet.infura.io/ws'
  },
  zmq: {
    url: 'tcp://127.0.0.1:5556',
    responder_url: 'tcp://127.0.0.1:5557'
  }
}
