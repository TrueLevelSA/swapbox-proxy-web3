import { Address } from "web3x/address";
import { Eth } from "web3x/eth";
import { Sync } from "web3x/formatters/output-syncing-formatter";
import { Net } from "web3x/net";
import { WebsocketProvider } from "web3x/providers";

export interface INodeStatus {
  is_syncing: boolean | Sync;
}

export class Node {
  public readonly provider: WebsocketProvider;
  public readonly eth: Eth;
  public readonly net: Net;

  private accounts: Address[];

  constructor(providerUrl: string) {
    this.provider = new WebsocketProvider(providerUrl);
    this.eth = new Eth(this.provider);
    this.net = new Net(this.eth);

    // avoiding undefined object
    this.accounts = [];

    this.showInfos();
  }

  public init = async () => {
    this.accounts = await this.eth.getAccounts();
  }

  public getAccounts = () => {
    return this.accounts;
  }

  public getStatus = async (): Promise<INodeStatus> => {
    const isSyncing = await this.eth.isSyncing();

    return {
      is_syncing: isSyncing,
    };
  }

  private showInfos = async () => {
    console.log(`Connected to network: ${await this.net.getNetworkType()}`);
    console.log(`Network Id: ${await this.eth.getId()}`);
    console.log(`Node info: ${await this.eth.getNodeInfo()}`);
  }
}
