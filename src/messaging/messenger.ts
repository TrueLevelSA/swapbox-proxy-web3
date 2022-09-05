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

import * as zmq from "zeromq";
import * as config from "../../config.json";
import { ReplyBackend, ReplyOrder, ReplyPrices, ReplyStatus } from "./messages/replies";
import { RequestBackend, RequestBase, RequestOrder } from "./messages/requests";

/**
 * Interface for handling incoming messages.
 */
export interface RequestCallbacks{
  onRequestBackend(request: RequestBackend): Promise<ReplyBackend>;
  onRequestOrder(request: RequestOrder): Promise<ReplyOrder>;
}

export class Messenger {
  private readonly pub = zmq.socket("pub");
  private readonly rep = zmq.socket("rep");

  private static readonly TOPIC_PRICES = "priceticker";
  private static readonly TOPIC_STATUS = "status";

  private _rc: RequestCallbacks;

  constructor(rc: RequestCallbacks) {
    this._rc = rc;

    this.pub.bindSync(config.zmq.url_pub_status);
    this.rep.bindSync(config.zmq.url_replier);

    this.initializeListener();
  }

  /**
   * Publish status.
   * 
   * @param status
   */
  public sendStatus = (status: ReplyStatus) => {
    const msg = [Messenger.TOPIC_STATUS, JSON.stringify(status)];

    if (config.debug) {
      console.log(`ZMQ_SEND: ${msg}`);
    }

    this.pub.send(msg);
  }

  /**
   * Fetch new price and send them through zmq.
   */
  public sendPrices = async (prices: ReplyPrices) => {
    const msg = [Messenger.TOPIC_PRICES, JSON.stringify(prices)];

    if (config.debug) {
      console.log(`ZMQ_SEND: ${msg}`);
    }

    this.pub.send(msg);
  }

  /**
   * Intialize zmq req/rep.
   */
  private initializeListener = () => {
    this.rep.on("message", async (message: string) => {
      if(config.debug) {
        console.log("zmq.onMessage:", message);
      }

      let request: RequestBase;
      try {
        request = JSON.parse(message.toString());
      } catch (e) {
        console.log("Parsing error:", e);
        return;
      }

      let reply: any;
      switch (request.request) {
        case RequestBase.REQUEST_BACKEND: {
          reply = this._rc.onRequestBackend(request as RequestBackend);
          break;
        }
        case RequestBase.REQUEST_ORDER: {
          reply = this._rc.onRequestOrder(request as RequestOrder);
          break;
        }
        default: {
          // log unknown request
          console.log("unknown request");
        }
      }

      if (reply !== undefined) {
        this.rep.send(JSON.stringify(reply));
      }
    });
  }
}
