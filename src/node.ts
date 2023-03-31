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
import config from "./config";
import { ReplyBackend, ReplyOrder } from "./messaging/messages/replies";
import { Token } from "./messaging/messages/replies/backend";
import { Price } from "./messaging/messages/replies/prices";
import { BlockchainStatus } from "./messaging/messages/replies/status";
import { RequestBackend, RequestOrder } from "./messaging/messages/requests";
import { ERC20__factory, PriceFeed, PriceFeed__factory, SwapboxUniswapV2, SwapboxUniswapV2__factory, UniswapV2Factory, UniswapV2Factory__factory, UniswapV2Router02, UniswapV2Router02__factory } from "./typechain";
import { outputSyncingFormatter, Sync } from "./types/eth";
import { computeBuyPrice, computeSellPrice } from "./utils/prices";

/**
 * Node allows to send and retrieve to/from the Ethereum node.
 *
 * Constructor is private, use static method `connect` in order to get a working Node object.
 *
 * @param path The node websocket url
 */
export class Node {

  private _provider: WebSocketProvider;
  private _accounts: string[];

  private _tokens: Token[]

  readonly swapbox: SwapboxUniswapV2;
  readonly pricefeed: PriceFeed;
  readonly factory: UniswapV2Factory;
  readonly router: UniswapV2Router02;
  private _baseToken: string;

  private constructor(private providerUrl: string) {
    this._provider = new WebSocketProvider(this.providerUrl);
    this._accounts = [];
    this._tokens = [];

    const signer = this._provider.getSigner();
    this.swapbox = SwapboxUniswapV2__factory.connect(config.contracts.swapbox, signer);
    this.pricefeed = PriceFeed__factory.connect(config.contracts.pricefeed, signer);
    this.factory = UniswapV2Factory__factory.connect(config.contracts.factory, signer);
    this.router = UniswapV2Router02__factory.connect(config.contracts.router, signer);
    this._baseToken = config.contracts.base_token;
  }

  /**
   * Returns a connected Node.
   *
   * @param providerUrl websocket address of the provider.
   * @returns A node
   */
  public static connect = async (providerUrl: string): Promise<Node> => {
    const node = new Node(providerUrl);
    await node.waitForConnection();
    return node;
  }

  /**
   * Gives network infos
   *
   * @returns
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
    if (tryCount >= config.reconnect_max_tries) {
      reject();
      return;
    }
    // try reconnect and check connection. retry after
    await this.reconnect();
    if (await this.isListening()) {
      await this.postConnection();
      resolve();
    } else {
      console.log(`Not connected. Retrying. ${tryCount + 1}/${config.reconnect_max_tries}`);
      setTimeout(this.reconnectRoutine, config.reconnect_period_ms, resolve, reject, tryCount + 1);
    }
  }
  /**
   * Re
   */
  private reconnect = async () => {
    this._provider = new WebSocketProvider(this.providerUrl);
  }

  /**
   * Post connection hook.
   */
  private postConnection = async () => {
    this._accounts = await this._provider.listAccounts();
    this._tokens = await this.retrieveTokens();

    if (config.debug) {
      this.showInfos();
    }
  }

  private showInfos = async () => {
    const network = await this._provider.getNetwork();
    console.log(`Network:`);
    console.log(`  Name: ${network.name}:${network.chainId}`);
    console.log(`  Provider: ${this._provider.connection}`);
    console.log(`Swapbox:`);
    console.log(`  Address: ${this.swapbox.address}`);
  }

  /**
   * Retrieve tokens from blockchain
   * @returns
   */
  private retrieveTokens = async (): Promise<Token[]> => {
    const tokens: Token[] = [];

    const supportTokenAddresses = await this.swapbox.supportedTokensList();

    for (const tokenAddress of supportTokenAddresses) {
      const token = ERC20__factory.connect(tokenAddress, this._provider.getSigner());
      const symbol = await token.symbol();
      const name = await token.name();
      const decimals = await token.decimals();
      const pairAddress = await this.factory.getPair(tokenAddress, this._baseToken);
      tokens.push({
        address: tokenAddress,
        pairAddress: pairAddress,
        symbol: symbol,
        name: name,
        decimals: decimals,
      });
    }

    return tokens;
  }

  /**
   * Get token object from its address
   */
  private getToken(tokenAddress: string): Token {
    return this._tokens.filter(t => t.address == tokenAddress)[0];
  }

  /**
   * Wait for connection to node.
   *
   * This needs to be called after the constructor. You can specify the amount
   * of tries and the period between tries in the config.ts file.
   * It will try to reach the node until connection or timeout.
   */
  public waitForConnection = () => {
    return new Promise<void>(async (resolve, reject) => {
      if (await this.isListening()) {
        await this.postConnection();
        resolve();
      } else {
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

  /**
   * Get prices of supported tokens
   *
   * @return Promise<Price[]> An array of token prices.
   */
  public getPrices = async (): Promise<Price[]> => {
    const reserves = await this.pricefeed.getReserves(this._baseToken);

    const prices: Price[] = [];
    for (const reserve of reserves) {
      const token = this.getToken(reserve.token);
      const buyPrice = computeBuyPrice(token.decimals, reserve.reserve0, reserve.reserve1);
      const sellPrice = computeSellPrice(token.decimals, reserve.reserve0, reserve.reserve1);

      // TODO: get fees
      const fees = 0;

      prices.push({
        token: reserve.token,
        symbol: token.symbol,
        buy_price: buyPrice,
        buy_fee: fees,
        sell_price: sellPrice,
        sell_fee: fees,
      });
    }

    return prices;
  }

  /**
   * Handle an order request.
   * 
   * @param request 
   * @returns 
   */
  public handleRequestOrder = async (request: RequestOrder): Promise<ReplyOrder> => {
    let confirm = false;

    if (request.request === "buy") {
      await this.swapbox.buyEth(
        request.order.amount_in,
        request.order.minimum_amount_out,
        request.order.client,
        0, // FIX: add deadline to request
      );
      // TODO: Check tx went through without revert and event was triggered.
      confirm = true;
    } else {
      console.log("order not supported");
    }

    return {
      success: true,
      tx_confirmed: confirm,
    }
  }

  /**
   * Handle a backend request.
   * 
   * @param request 
   * @returns 
   */
  public handleRequestBackend = async (request: RequestBackend): Promise<ReplyBackend> => {
    // TODO: Use and read global config
    return {
      success: true,
      backend: {
        name: "zkSync",
        baseCurrency: "CHF",
        tokens: this._tokens,
      }
    };
  }
}
