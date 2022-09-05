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

import { Node } from "./node";

import * as config from "../config.json";
import { Messenger } from "./messaging/messenger";
import { RequestBackend, RequestOrder } from "./messaging/messages/requests";
import { ReplyBackend, ReplyOrder, ReplyStatus } from "./messaging/messages/replies";
import { cpus } from "os";
import { SystemStatus } from "./messaging/messages/replies/status";

async function main() {
  const node = await Node.connect(config.websocket_provider.url);

  const messenger = new Messenger({
    onRequestBackend: (request: RequestBackend): Promise<ReplyBackend> => {
      return node.handleRequestBackend(request);
    },
    onRequestOrder: async (request: RequestOrder): Promise<ReplyOrder> => {
      return node.handleRequestOrder(request);
    }
  });

  const statusUpdates = async () => {
    const nodeStatus = await node.getStatus();
    // TODO: do system status
    const systemStatus = new SystemStatus(9, cpus()[0].speed);
    const status = new ReplyStatus(systemStatus, nodeStatus);
    messenger.sendStatus(status);
    setTimeout(statusUpdates, 1000);
  };
  statusUpdates();

  const pricesUpdate = async () => {
    // TODO: get prices
    let prices: any;
    messenger.sendPrices(prices);
  }
  pricesUpdate();
}

main().catch(console.error);
