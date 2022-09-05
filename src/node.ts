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

import { WebSocketProvider } from "@ethersproject/providers";
import * as config from "../config.json";
import { ReplyBackend } from "./messaging/messages/replies";
import { ReplyOrder } from "./messaging/messages/replies/order";
import { BlockchainStatus } from "./messaging/messages/replies/status";
import { RequestBackend, RequestOrder } from "./messaging/messages/requests";
import { SwapboxUniswapV2, SwapboxUniswapV2__factory } from "./typechain";
import { outputSyncingFormatter, Sync } from "./types/eth";


/**
 * Node allows to send and retrieve to/from the Ethereum node.
 *
 * Constructor is private, use static method `connect` in order to get a working Node object.
 *
 * @param path The node websocket url
 */
export class Node {

  /**
   * Returns a connected Node.
   * 
   * @param providerUrl websocket address of the provider.
   * @returns 
   */
  public static connect = async (providerUrl: string): Promise<Node> => {
    let node = new Node(providerUrl);
    await node.init();
    await node.waitForConnection();
    return node;
  }

  private _provider: WebSocketProvider;
  private _accounts: string[];

  readonly swapbox: SwapboxUniswapV2;

  private constructor(private providerUrl: string) {
    this._provider = new WebSocketProvider(this.providerUrl);
    this._accounts = [];
    this.swapbox = SwapboxUniswapV2__factory.connect(config.contracts.swapbox, this._provider.getSigner());
  }

  /**
   * Check node sync status
   * 
   * @returns True if _in sync_, Sync status if _syncing_.
   */
  private isSyncing = async (): Promise<boolean | Sync> => {
    const sync = await this._provider.send('eth_syncing');
    return outputSyncingFormatter(sync);
  }

  /**
   * Check node listening status.
   * 
   * @returns True if is listening, False if not.
   */
  private isListening = async (): Promise<boolean> => {
    return await this._provider.send('net_listening');
  }


  /**
   * Tries to reconnect to the node until count is reached.
   * 
   * @param resolve Callback when connected
   * @param reject Callback when timeout
   * @param tryCount Amount of tries before reject
   */
  private reconnectRoutine = async (resolve: () => void, reject: () => void, tryCount = 0) => {
    // timeout
    if (tryCount >= config.reconnectMaxTries) {
      reject();
      return;
    }
    // try reconnect and check connection. retry after
    await this.reconnect();
    if (await this.isListening()) {
      await this.init();
      resolve();
    } else {
      console.log(`Not connected. Retrying. ${tryCount + 1}/${config.reconnectMaxTries}`);
      setTimeout(this.reconnectRoutine, config.reconnectPeriodMs, resolve, reject, tryCount + 1);
    }
  }

  private reconnect = async () => {
    this._provider = new WebSocketProvider(this.providerUrl);
  }

  private init = async () => {
    this.showInfos();
    this._accounts = await this._provider.listAccounts();
  }

  private showInfos = async () => {
    console.log(`Connected to network: ${await this._provider.getNetwork()}`);
  }

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
      if (await this.isListening()) {
        // init and resolve.
        await this.init();
        resolve();
      } else {
        // start reconnect routine
        this.reconnectRoutine(resolve, reject);
      }
    });
  }

  /**
   * Returns a list of Address representing the accounts of the node.
   *
   * The account in first position should be unlocked and representing the
   * machineAddress
   *
   * @return Address[] accounts
   */
  public accounts = (): string[] => {
    return this._accounts;
  }

  /**
   * Update the `_isSyncing` state of the node and returns the status
   * according to the `INodeStatus` interface.
   *
   * @return Promise<INodeStatus> The status of the node.
   */
  public getStatus = async (): Promise<BlockchainStatus> => {
    const isSyncing = await this.isSyncing();
    const blockNumber = await this._provider.getBlockNumber()
    const blockTimestamp = (await this._provider.getBlock(blockNumber)).timestamp;

    return {
      current_block: {
        number: blockNumber,
        timestamp: blockTimestamp,
      },
      syncing: isSyncing,
    };
  }

  public handleRequestOrder = async (request: RequestOrder): Promise<ReplyOrder> => {
    let reply: ReplyOrder;
    if (request.request === "buy") {
      await this.swapbox.buyEth(
        request.order.amount_in,
        request.order.minimum_amount_out,
        request.order.client,
      );
    } else {
      console.log("order not supported");
    }

    return {
      confirm: true
    };
  }

  public handleRequestBackend = async (request: RequestBackend): Promise<ReplyBackend> => {
    // TODO: Fetch backend
    let backend = new ReplyBackend(
      {
        name: "zkSync",
        baseCurrency: "CHF",
        tokens: [
          {
            symbol: "DAI",
            name: "DAI Stablecoin",
            decimals: 18,
          }
        ]
      }
    );
    return backend;
  }
}
