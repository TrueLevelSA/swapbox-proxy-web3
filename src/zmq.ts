import BN from "bn.js";
import { Address } from "web3x/address";
import { socket } from "zeromq";

import { Atola } from "./contracts/Atola";
import { processBuyEthOrder } from "./processing/orders";

interface IReply {
  status: "success" | "error";
  result: string;
}

export class Zmq {
  private readonly pub = socket("pub");
  private readonly rep = socket("rep");

  private readonly PUB_TOPIC = "priceticker";

  constructor(
    private publishUrl: string,
    private replierUrl: string,
    private atola: Atola,
    private from: Address,
  ) {
    // initialize publisher/responder
    this.pub.bindSync(this.publishUrl);
    this.rep.bindSync(this.replierUrl);

    this.initializeListener();
  }

  /**
   * Send new prices through ZMQ
   */
  public updatePriceticker = (buyPrice: BN, sellPrice: BN) => {
    this.pub.send([this.PUB_TOPIC, JSON.stringify({buy_price: buyPrice.toString(), sell_price: sellPrice.toString()})]);
  }

  private initializeListener = () => {
    this.rep.on("message", async (request) => {
      const reply: IReply = {status: "error", result: "undefined"};
      const message = JSON.parse(request.toString());
      console.log('zmq.onMessage:', message);

      if (message.method === "buy") {
        // send buy oder
        try {
          const ethBought = await processBuyEthOrder(
            this.atola, this.from, message.amount, message.address,
          );
          reply.status = "success";
          reply.result = ethBought.toString();
        } catch {
          reply.result = "error while processBuyEthOrder";
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
