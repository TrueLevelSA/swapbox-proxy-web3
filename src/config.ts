import nodeConfig from 'config';

interface Config {
  debug: string,
  reconnect_period_ms: number,
  reconnect_max_tries: number,
  ipc_provider: {
    url: string
  },
  websocket_provider: {
    url: string,
  },
  messenger: {
    publish: {
      url: string,
      status_period_s: number,
      prices_period_s: number,
    },
    request: {
      url: string,
    }
  },
  contracts: {
    swapbox: string,
    pricefeed: string,
    factory: string,
    router: string,
    base_token: string,
  }
}

const config: Config = {
  debug: nodeConfig.get<string>('debug'),
  reconnect_period_ms: nodeConfig.get<number>('reconnect_period_ms'),
  reconnect_max_tries: nodeConfig.get<number>('reconnect_max_tries'),
  ipc_provider: {
    url: nodeConfig.get<string>('ipc_provider.url'),
  },
  websocket_provider: {
    url: nodeConfig.get<string>('websocket_provider.url'),
  },
  messenger: {
    publish: {
      url: nodeConfig.get<string>('messenger.publish.url'),
      status_period_s: nodeConfig.get<number>('messenger.publish.status_period_s'),
      prices_period_s: nodeConfig.get<number>('messenger.publish.prices_period_s'),
    },
    request: {
      url: nodeConfig.get<string>('messenger.request.url'),
    }
  },
  contracts: {
    swapbox: nodeConfig.get<string>('contracts.swapbox'),
    pricefeed: nodeConfig.get<string>('contracts.pricefeed'),
    factory: nodeConfig.get<string>('contracts.factory'),
    router: nodeConfig.get<string>('contracts.router'),
    base_token: nodeConfig.get<string>('contracts.base_token'),
  }
};

export default config;
