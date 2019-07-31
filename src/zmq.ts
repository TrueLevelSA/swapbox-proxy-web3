import { socket } from 'zeromq';
import { Address } from 'web3x/address';
import BN from 'bn.js';

import { Atola } from './contracts/Atola';
import { processBuyEthOrder } from './processing/orders';

export class Zmq {
  private readonly pub = socket('pub');
  private readonly rep = socket('rep');

  constructor(
    private publishUrl: string,
    private replierUrl: string,
    private atola: Atola,
    private from: Address
  ) {
    // initialize publisher/responder
    this.pub.bindSync(this.publishUrl);
    this.rep.bindSync(this.replierUrl);

    this.initializeListener();
  }

  private initializeListener = () => {
    this.rep.on('message', async (request) => {
      const message = JSON.parse(request.toString());
      console.log('zmq.onMessage:', message)

      if (message.method == "buy"){
        // send buy oder
        try {
          await processBuyEthOrder(
            this.atola, this.from, message.amount, message.address
          );
          this.rep.send('success');
        } catch {
          this.rep.send('error while processBuyEthOrder');
        }
      } else if (message.method == "sell") {
        // send sell order
        // Need to make a function for startSell (listen for ethrecieved event)
        // Call this function when we get the EthRecieved event
        // const success = await processSellETHOrder(eth, OperatorContract, message.amount, message.address);
        this.rep.send('success');
      } else {
        this.rep.send('invalid method');
      }

    });
  }

  /**
   * Send new prices through ZMQ
   */
  public updatePriceticker = (buyPrice: BN, sellPrice: BN) => {
    this.pub.send(['priceticker', JSON.stringify({buy_price: buyPrice.toString(), sell_price: sellPrice.toString()})])
  }


}
