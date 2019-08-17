export const config = {
  debug: true,
  ipc_provider: {
    url: "/tmp/geth.ipc",
  },
  websocket_provider: {
    url: "ws://127.0.0.1:8546",
  },
  zmq: {
    url: "tcp://0.0.0.0:5556",
    responder_url: "tcp://0.0.0.0:5557",
  },
};
