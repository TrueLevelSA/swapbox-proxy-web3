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
import config from "../config";
import { ReplyBackend, ReplyOrder, ReplyPrices, ReplyStatus } from "./messages/replies";
import { ERROR_BAD_REQUEST } from "./messages/replies/base";
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

    this.pub.bindSync(config.messenger.publish.url);
    this.rep.bindSync(config.messenger.request.url);
    this.rep.on("message", this.handleIncomingMessage);
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
  public sendPrices = (prices: ReplyPrices) => {
    const msg = [Messenger.TOPIC_PRICES, JSON.stringify(prices)];

    if (config.debug) {
      console.log(`ZMQ_SEND: ${msg}`);
    }

    this.pub.send(msg);
  }

  /**
   * Handle incoming messages.
   *
   * @param message
   */
  public handleIncomingMessage = async (message: Buffer) => {
    if(config.debug) {
      console.log("zmq.onMessage:", message.toString());
    }

    let request: RequestBase;
    try {
      request = JSON.parse(message.toString());
    } catch (e) {
      console.log("Parsing error:", e);
      this.rep.send(JSON.stringify({success: false, error: ERROR_BAD_REQUEST}));
      return;
    }

    let reply: ReplyBackend | ReplyOrder | undefined;
    switch (request.request) {
      case RequestBase.REQUEST_BACKEND: {
        reply = await this._rc.onRequestBackend(request as RequestBackend);
        break;
      }
      case RequestBase.REQUEST_ORDER: {
        reply = await this._rc.onRequestOrder(request as RequestOrder);
        break;
      }
      default: {
        this.rep.send(JSON.stringify({success: false, error: ERROR_BAD_REQUEST}));
        return;
      }
    }

    if (reply) {
      this.rep.send(JSON.stringify(reply));
    }
  }
}
