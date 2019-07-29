import { socket } from 'zeromq';
import { Address } from 'web3x/address';
import BN from 'bn.js';

import { Atola } from './contracts/Atola';
import { processBuyEthOrder } from './processing/orders';

export class Zmq {
  private readonly pub = socket('pub');
  private readonly sub = socket('sub');

  constructor(
    private publishUrl: string,
    private subscribeUrl: string,
    private atola: Atola,
    private from: Address
  ) {
    // initialize publisher/responder
    this.pub.bindSync(this.publishUrl);
    this.sub.connect(this.subscribeUrl);
    this.sub.subscribe('something');

    this.initializeListener();
  }

  private initializeListener = () => {
    this.sub.on('message', async (request) => {
      const message = JSON.parse(request.toString());
      console.log('zmq.onMessage:', message)

      if (message.method == "buy"){
        // send buy oder
        try {
          await processBuyEthOrder(
            this.atola, this.from, message.amount, message.address
          );
          this.pub.send('success');
        } catch {
          this.pub.send('error while processBuyEthOrder');
        }
      } else if (message.method == "sell") {
        // send sell order
        // Need to make a function for startSell (listen for ethrecieved event)
        // Call this function when we get the EthRecieved event
        // const success = await processSellETHOrder(eth, OperatorContract, message.amount, message.address);
        this.pub.send('success');
      } else {
        this.pub.send('invalid method');
      }

    });
  }

  /**
   * Send new prices through ZMQ
   */
  public updatePriceticker = (buyPrice: BN, sellPrice: BN) => {
    this.pub.send(['priceticker', JSON.stringify({buy_price: buyPrice, sell_price: sellPrice})])
  }


}
