// Swap-box
// Copyright (C) 2019  TrueLevel SA
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
import { Address } from "web3x/address";
import { Eth } from "web3x/eth";
import { Sync } from "web3x/formatters/output-syncing-formatter";
import { Net } from "web3x/net";
import { WebsocketProvider } from "web3x/providers";

import * as config from "../config.json";

export interface INodeStatus {
  is_syncing: boolean | Sync;
}

/**
 * Node constructor.
 *
 * This simplifies the connection and the calls to the ethereum node.
 * It's necessary to call `node.waitForConnection()` after constructor.
 *
 * @param path The node websocket url
 */
export class Node {
  private _provider: WebsocketProvider;
  private _eth: Eth;
  private _net: Net;
  private _accounts: Address[];

  private _isConnected = false;
  private _isSyncing: boolean | Sync = true;

  constructor(private path: string) {
    this._provider = new WebsocketProvider(this.path);
    this._eth = new Eth(this._provider);
    this._net = new Net(this._eth);

    // avoiding undefined object
    this._accounts = [];
  }

  // PUBLICS.

  /**
   * Wait for connection to node.
   *
   * This needs to be called after the constructor. You can specify the amount
   * of tries and the period between tries in the config.ts file.
   * It will try to reach the node until connection or timeout.
   *
   * @return A Promise<void>, resolved when connected, rejected when timeout.
   */
  public waitForConnection = () => {
    return new Promise<void>(async (resolve, reject) => {
      if (await this.isConnected()) {
        // init and resolve.
        await this.init();
        resolve();
      } else {
        // start reconnect routine
        this.reconnectRoutine(resolve, reject);
      }
    });
  }

  public accounts = () => {
    return this._accounts;
  }

  public getStatus = async (): Promise<INodeStatus> => {
    this._isSyncing = await this._eth.isSyncing();

    return {
      is_syncing: await this._isSyncing,
    };
  }

  // GETTERS.

  public provider = () => {
    return this._provider;
  }

  public eth = () => {
    return this._eth;
  }

  public net = () => {
    return this._net;
  }

  public isSyncing = () => {
    return this._isSyncing;
  }

  // PRIVATES.

  private reconnectRoutine = async (resolve: () => void, reject: () => void, tryCount = 0) => {
    // timeout
    if (tryCount >= config.reconnectMaxTries) {
      reject();
      return;
    }
    // try reconnect and check connection. retry after
    await this.reconnect();
    if (await this.isConnected()) {
      await this.init();
      resolve();
    } else {
      console.log(`Not connected. Retrying. ${tryCount + 1}/${config.reconnectMaxTries}`);
      setTimeout(this.reconnectRoutine, config.reconnectPeriodMs, resolve, reject, tryCount + 1);
    }
  }

  private reconnect = async () => {
    this._provider = new WebsocketProvider(this.path);
    this._eth = new Eth(this._provider);
    this._net = new Net(this._eth);
  }

  private isConnected = async () => {
    try {
      await this._eth.getGasPrice();
      this._isConnected = true;
    } catch (e) {
      this._isConnected = false;
    }
    return this._isConnected;
  }

  private init = async () => {
    this.showInfos();
    this._accounts = await this._eth.getAccounts();
  }

  private showInfos = async () => {
    console.log(`Connected to network: ${await this._net.getNetworkType()}`);
    console.log(`Network Id: ${await this._eth.getId()}`);
    console.log(`Node info: ${await this._eth.getNodeInfo()}`);
  }
}
