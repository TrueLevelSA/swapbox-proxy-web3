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

export interface IStatus {
  blockchain: {
    is_in_sync: boolean;
    best_block: BN;
    node_latency: number;
    peers: number;
  };
}

export class Zmq {
  private readonly pub = socket("pub");
  private readonly pubStatus = socket("pub");
  private readonly rep = socket("rep");

  private readonly TOPIC_PRICETICKER = "priceticker";
  private readonly TOPIC_STATUS = "status";

  constructor(
    private publishUrl: string,
    private publishStatusUrl: string,
    private replierUrl: string,
    private atola: Atola,
    private priceFeed: PriceFeed,
    private machineAddress: Address,
  ) {
    // initialize publisher/responder
    this.pub.bindSync(this.publishUrl);
    this.pubStatus.bindSync(this.publishStatusUrl);
    this.rep.bindSync(this.replierUrl);

    this.initializeListener();
  }

  public updateStatus = async () => {
    const status = await this.fetchStatus();
    this.pubStatus.send([this.TOPIC_STATUS, JSON.stringify(status)]);
    return status;
  }

  /**
   * Fetch new price and send them through zmq.
   */
  public updatePriceticker = async () => {
    const reserves = await this.fetchReserves();
    this.pub.send([this.TOPIC_PRICETICKER, JSON.stringify(reserves)]);
    return reserves;
  }

  private fetchStatus = async () => {
    // TODO: Implement
    const status: IStatus = {
      blockchain: {
        is_in_sync: true,
        best_block: new BN("12345678"),
        node_latency: 42,
        peers: 1337,
      },
    };
    return status;
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
