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

import { cpuCurrentSpeed, cpuTemperature } from "systeminformation";
import config from "./config";
import { ReplyBackend, ReplyOrder, ReplyStatus } from "./messaging/messages/replies";
import { SystemStatus } from "./messaging/messages/replies/status";
import { RequestBackend, RequestOrder } from "./messaging/messages/requests";
import { Messenger } from "./messaging/messenger";

const getSystemStatus = async (): Promise<SystemStatus> => {
  const speed = await cpuCurrentSpeed();
  const temp = await cpuTemperature();
  return new SystemStatus(temp.main, speed.avg);
}

async function main() {
  const node = await Node.connect(config.websocket_provider.url);
  if (config.debug) {
    const network = await node.network();
    console.log(`Connected to network: ${network.name}:${network.chainId}`);
  }

  const messenger = new Messenger({
    onRequestBackend: (request: RequestBackend): Promise<ReplyBackend> => {
      return node.handleRequestBackend(request);
    },
    onRequestOrder: async (request: RequestOrder): Promise<ReplyOrder> => {
      return node.handleRequestOrder(request);
    }
  });

  const publishStatusPeriodMs = config.messenger.publish.status_period_s * 1000;
  const statusUpdates = async () => {
    const nodeStatus = await node.getStatus();
    const systemStatus = await getSystemStatus();
    const status = new ReplyStatus(systemStatus, nodeStatus);
    messenger.sendStatus(status);
    setTimeout(statusUpdates, publishStatusPeriodMs);
  };
  statusUpdates();

  const pricesUpdate = async () => {
    
    let prices: any;
    messenger.sendPrices(prices);
  }
  pricesUpdate();
}

main().catch(console.error);
