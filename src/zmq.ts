import BN from "bn.js";
import { Address } from "web3x/address";
import { socket } from "zeromq";

import { Atola } from "./contracts/Atola";
import { PriceFeed } from "./contracts/PriceFeed";
import { processBuyEthOrder } from "./processing/orders";

interface IReply {
  status: "success" | "error";
  result: string;
}

interface IMessage {
  method: "buy";
  amount: string;
  min_eth: string;
  address: string;
}

export interface IReserves {
  token_reserve: BN;
  eth_reserve: BN;
}

export class Zmq {
  private readonly pub = socket("pub");
  private readonly rep = socket("rep");

  private readonly PUB_TOPIC = "priceticker";

  constructor(
    private publishUrl: string,
    private replierUrl: string,
    private atola: Atola,
    private priceFeed: PriceFeed,
    private machineAddress: Address,
  ) {
    // initialize publisher/responder
    this.pub.bindSync(this.publishUrl);
    this.rep.bindSync(this.replierUrl);

    this.initializeListener();
  }

  /**
   * Fetch new price and send them through zmq.
   */
  public updatePriceticker = async () => {
    const reserves = await this.fetchReserves();
    this.pub.send([this.PUB_TOPIC, JSON.stringify(reserves)]);
    return reserves;
  }

  /**
   * Fetch exchange reserves using priceFeed contract.
   *
   * @returns reserves A promise of an IReserves interface
   */
  private fetchReserves = async (): Promise<IReserves> => {
    const raw = await this.priceFeed.methods.getReserves().call();
    return {
      token_reserve: new BN(raw[0]),
      eth_reserve: new BN(raw[1]),
    };
  }

  /**
   * Intialize zmq req/rep.
   */
  private initializeListener = () => {
    this.rep.on("message", async (request) => {
      const reply: IReply = {status: "error", result: "undefined"};
      const message: IMessage = JSON.parse(request.toString());
      console.log("zmq.onMessage:", message);

      if (message.method === "buy") {
        // send buy oder
        try {
          const ethBought = await processBuyEthOrder(
            this.atola,
            this.machineAddress,
            new BN(message.amount),
            new BN(message.min_eth),
            Address.fromString(message.address),
          );
          if (ethBought) {
            reply.status = "success";
            reply.result = ethBought.cryptoAmount;
          }
        } catch (error) {
          reply.result = "error while processBuyEthOrder";
          console.error(error);
        }
      } else if (message.method === "sell") {
        // send sell order
        // Need to make a function for startSell (listen for ethrecieved event)
        // Call this function when we get the EthRecieved event
        // const success = await processSellETHOrder(eth, OperatorContract, message.amount, message.address);
        reply.result = "Sell not supported yet";
      } else {
        reply.result = "Invalid method";
      }

      // reply
      this.rep.send(JSON.stringify(reply));
    });
  }
}
