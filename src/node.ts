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


import { Signer, BigNumber, utils } from "ethers";
import { WebSocketProvider, Network } from "@ethersproject/providers";
import config from "./config";
import { ReplyBackend, ReplyOrder, ReplyPrice } from "./messaging/messages/replies";
import { Token, TokenPair, TokenPool } from "./messaging/messages/replies/backend";
import { Price } from "./messaging/messages/replies/prices";
import { Fees } from "./messaging/messages/replies/order";
import { BlockchainStatus } from "./messaging/messages/replies/status";
import { RequestBackend, RequestOrder, RequestPrice } from "./messaging/messages/requests";
import { ERC20, ERC20__factory, PriceFeed, PriceFeed__factory, SwapboxUniswapV2, SwapboxUniswapV2__factory } from "./typechain";
import { outputSyncingFormatter, Sync } from "./types/eth";
import { computePrice, computePriceThroughPairs, getPairAddress, quoteBuyPrice, quoteBuyPriceThroughPairs } from "./utils/uniswap_prices";
import { decodePathData, pathLength } from "./utils/decode_path";
import { ChainId, WETH9 } from '@uniswap/sdk-core'

type FeeData = {
    buy: BigNumber,
    sell: BigNumber
}

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
  private _chain: Network | null;

  private _tokens: Token[]

  readonly swapbox: SwapboxUniswapV2;
  readonly pricefeed: PriceFeed;
  readonly basetoken: ERC20;
  private _baseTokenDecimals: number;
  private _lastReserves: PriceFeed.TokenReserveStructOutput[];

  private constructor(private providerUrl: string) {
    this._provider = new WebSocketProvider(this.providerUrl);
    this._accounts = [];
    this._chain = null;
    this._tokens = [];
    this._lastReserves = [];

    const deployer = this._provider.getSigner();
    const machine = this._provider.getSigner(1);

    // Using an IIFE for async operations
    (async () => {
      console.log("Deployer address: ", await this.getAddress(deployer));
      console.log("Machine address: ", await this.getAddress(machine));
    })().catch(console.error); // Handle errors

    this.swapbox = SwapboxUniswapV2__factory.connect(config.contracts.swapbox, machine);
    this.pricefeed = PriceFeed__factory.connect(config.contracts.pricefeed, machine);

    this.basetoken = ERC20__factory.connect(config.contracts.base_token, machine);
    this._baseTokenDecimals = 18;
  }

  /**
   * Get address from Signer.
   *
   * @returns Address.
   */
  private getAddress = async (signer: Signer): Promise<string> => {
    return await signer.getAddress();
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
   * Reconnect.
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
    this._chain = await this._provider.getNetwork();
    this._baseTokenDecimals = await this.basetoken.decimals();
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
    console.log("Retreive Tokens");
    const tokens: Token[] = [];

    const allTokenAddresses = await this.swapbox.allTokensList();
    const supportTokenAddresses = await this.swapbox.supportedTokensList();

    for (const tokenAddress of allTokenAddresses) {
      const token = ERC20__factory.connect(tokenAddress, this._provider.getSigner());
      const symbol = await token.symbol();
      const name = await token.name();
      const decimals = await token.decimals();
      let pairAddress = null;
      const path = await this.swapbox.tokenPath(tokenAddress);
      const supported = supportTokenAddresses.filter(t => t == tokenAddress).length > 0 ? true : false;
      if (utils.getAddress(tokenAddress) != utils.getAddress(this.basetoken.address) && supported) {
        pairAddress = getPairAddress({
          address: tokenAddress,
          pairAddress: "0x",
          symbol: "",
          name: "",
          decimals: 0,
          supported: false,
          path: "0x"
        },
        {
          address: this.basetoken.address,
          pairAddress: "0x",
          symbol: "",
          name: "",
          decimals: 0,
          supported: false,
          path: "0x"
        });
      }

      tokens.push({
        address: tokenAddress,
        pairAddress: pairAddress,
        symbol: symbol,
        name: name,
        decimals: decimals,
        supported: supported,
        path: path
      });
      // if (config.debug) {
      console.log(`Token: ${symbol} (${tokenAddress}) : ${supported}`);
      // }
    }
    return tokens;
  }

  /**
   * Get token object from its address
   */
  private getToken(tokenAddress: string): Token {
    // return this._tokens.filter(t => t.pairAddress == pairAddress)[0];
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
   * Checks if a blockchain network is set.
   * @returns {boolean} True if the network is set, false otherwise.
   */
  public isChainSet(): boolean {
    return this._chain !== null;
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

    const prices: Price[] = [];

    let reserves: PriceFeed.TokenReserveStructOutput[];
    let fees: FeeData;

    reserves = await this.pricefeed.getReserves();
    this._lastReserves = reserves;
    fees = await this.pricefeed.getFees();

      for (const token of this._tokens.filter(t => t.supported == true)) {
        let quoteTokenPrice = "1";
        let baseTokenPrice = "1";
        const path_length = pathLength(token.path);

        if (path_length > 1) {
          const decodedpath = decodePathData(token.path);
          let tokenPairs: TokenPair[] = [];

          for (const pool of decodedpath) {
            const tokenIn = this.getToken(pool.tokenIn);
            const tokenOut = this.getToken(pool.tokenOut);
            const pair = getPairAddress(tokenIn, tokenOut);
            const pr = reserves.find(t => t.pair == pair);

            if(pr){
              tokenPairs.push({ tokenA: tokenIn, tokenB: tokenOut, reserve0: pr.reserve0, reserve1: pr.reserve1 });
            } else {
              console.log("ERROR: reserve for pair not found: ", pair);
              console.log(reserves);
            }
          }
          ({ quoteTokenPrice, baseTokenPrice } = computePriceThroughPairs(this.basetoken.address, this._baseTokenDecimals, tokenPairs));

        } else if (utils.getAddress(token.address) != utils.getAddress(this.basetoken.address)) {
          const p_r = reserves.find(t => t.pair == token.pairAddress);
          if(p_r){
            ({ quoteTokenPrice, baseTokenPrice } = computePrice(this.basetoken.address, this._baseTokenDecimals, token, p_r.reserve0, p_r.reserve1));
          }
        }

        prices.push({
          token: token.address,
          symbol: token.symbol,
          buy_price: quoteTokenPrice,
          buy_fee: fees.buy.toString(),
          sell_price: quoteTokenPrice,
          sell_fee: fees.sell.toString(),
        });

      }

    return prices;
  }

  /**
   * Handle a price quote request.
   *
   * @param request
   * @returns
   */
  public handleRequestPriceQuote = async (request: RequestPrice): Promise<ReplyPrice> => {

      const amount = BigNumber.from(request.fiat_amount).mul(BigNumber.from(10).pow(this._baseTokenDecimals));
      const token = this.getToken(request.token);
      const fees = await this.pricefeed.getFees();
      const fee = amount.mul(fees.buy).div(10000);
      const amountLessFee = amount.sub(fee);
      const amountLessFeeStr = amountLessFee.toString()
      const amountLessFeeDec = amountLessFeeStr.slice(0, amountLessFeeStr.length-this._baseTokenDecimals) + "." + amountLessFeeStr.slice(amountLessFeeStr.length-this._baseTokenDecimals);

      let buyPrice = "1";
      let buyAmount = amountLessFeeDec;
      let minBuyAmount = amountLessFeeDec;
      let sellPrice = "1";
      let sellAmount = amountLessFeeDec;
      let maxSellAmount = amountLessFeeDec;

      //test
      let quoteTokenPrice;
      let baseTokenPrice;

      if (utils.getAddress(token.address) != utils.getAddress(this.basetoken.address)) {
        quoteTokenPrice = "1";
        baseTokenPrice = "1";
      }

      const path_length = pathLength(token.path);

      if (path_length > 1) {
        const decodedpath = decodePathData(token.path);
        let tokenPairs: TokenPair[] = [];

        for (const pool of decodedpath) {

          const tokenIn = this.getToken(pool.tokenIn);
          const tokenOut = this.getToken(pool.tokenOut);
          const pair = getPairAddress(tokenIn, tokenOut);
          const pr = this._lastReserves.find( (t) => (t as any).pair == pair);
          if(pr){
            tokenPairs.push({ tokenA: tokenIn, tokenB: tokenOut, reserve0: pr.reserve0, reserve1: pr.reserve1 });
          }
        }

        // too slow ?? to use on insert cash screen, maybe just use on final confirmation (tbd)
        ({ buyPrice, buyAmount, minBuyAmount } = quoteBuyPriceThroughPairs(this.basetoken.address, this._baseTokenDecimals, tokenPairs, amountLessFee));

      } else if (utils.getAddress(token.address) != utils.getAddress(this.basetoken.address)) {
        // TO-DO
        const p_r = this._lastReserves.find(t => t.pair == token.pairAddress);
        if (p_r) {
          ({ buyPrice, buyAmount, minBuyAmount } = await quoteBuyPrice(this.basetoken.address, this._baseTokenDecimals, token, p_r.reserve0, p_r.reserve1, amountLessFee));
        }
      }

      return {
        token: token.address,
        success: true,
        symbol: token.symbol,
        buy_price: buyPrice,
        buy_amount: buyAmount,
        min_buy_amount: minBuyAmount,
        sell_price: sellPrice,
        sell_amount: sellAmount,
        max_sell_amount: maxSellAmount
      }

  }

  /**
   * Handle an order request.
   * 
   * @param request 
   * @returns 
   */
  public handleRequestOrder = async (request: RequestOrder): Promise<ReplyOrder> => {
    let confirm = false;
    let tx;
    let tx_receipt = null;
    let fees = null;
    let amountBought = null;
    let baseTokenDecimals = 6;
    const tokenDecimals = this.getToken(request.token).decimals;

    if (request.method === "buy") {
      const fiatAmount = BigNumber.from(request.fiat_amount).mul(BigNumber.from(10).pow(baseTokenDecimals));

      let liquidityFee = ((utils.getAddress(request.token) == utils.getAddress(this.basetoken.address)) ? '0' : '0.003');

      if(utils.getAddress(request.token) == WETH9[ChainId.MAINNET].address.toString()) {

        console.log("call buyEth(fiatAmount: ", fiatAmount.toString(), ", minimum_buy_amount: ", request.minimum_buy_amount);
        tx = await this.swapbox.buyEth(
          fiatAmount,
          request.minimum_buy_amount,
          utils.getAddress(request.client_address),
          0, // FIX: add deadline to request
          {gasLimit: 1000000}
        );

      } else {

        console.log("call buyTokens(token: ", utils.getAddress(request.token), ", fiatAmount: ", fiatAmount.toString(), ", minimum_buy_amount: ", request.minimum_buy_amount);
        tx = await this.swapbox.buyTokens(
          utils.getAddress(request.token),
          fiatAmount,
          request.minimum_buy_amount,
          utils.getAddress(request.client_address),
          0, // FIX: add deadline to request
          {gasLimit: 1000000}
        );

      }

      // TODO: Check tx went through without revert and event was triggered.
      tx_receipt = await tx.wait();

      confirm = true;

      const eventSignature = utils.id("CryptoBought(address,uint256,uint256,uint256)");
      const relevantLogs = tx_receipt.logs.filter(log => log.topics[0] === eventSignature);
      const decodedEvents = relevantLogs.map(log => this.swapbox.interface.decodeEventLog("CryptoBought", log.data, log.topics));

      amountBought = decodedEvents[0].cryptoAmount.toString();

      fees = { 
        network: tx_receipt.gasUsed.toString(),
        operator: decodedEvents[0].fee / 10 ** baseTokenDecimals,
        liquidity_provider: liquidityFee,
      } as Fees

      console.log("TX Sent: ", tx_receipt.transactionHash);
      console.log("TX amountBought: ", amountBought);
      console.log("TX fiatAmount: ", decodedEvents[0].fiatAmount.toString());
      console.log("TX fees: ", fees);

      return {
        status: 'success',
        success: true,
        tx_confirmed: confirm,
        receipt: {
          basetoken_decimals: baseTokenDecimals,
          token_decimals: tokenDecimals,
          token: request.client_address,
          amount_bought: amountBought,
          url: tx_receipt.transactionHash,
          fees: fees,
        }
      }

    } else {
      console.log("order not supported");
    }


    return {
      status: 'fail',
      success: false,
      tx_confirmed: false,
      receipt: null
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
        baseCurrency: "USD",
        tokens: this._tokens,
      }
    };
  }
}
