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

import { Contracts } from "./contracts";
import { Node } from "./node";
import { Zmq } from "./zmq";

import * as config from "../config.json";

async function main() {
  // Initialization
  const node = new Node(config.websocket_provider.url);
  await node.waitForConnection();

  // detect contracts on network if node is in sync
  const contracts = new Contracts(node.eth());
  if (!node.isSyncing() && !await contracts.contractsDeployed()) {
    console.log("Contracts arent deployed to current network. Exiting.");
    return;
  }

  const zmq = new Zmq(node);

  // STATUS UPDATES
  const statusUpdates = async () => {
    const nodeStatus = await node.getStatus();
    zmq.sendStatus(nodeStatus);
    setTimeout(statusUpdates, 1000);
  };
  statusUpdates();

  // PRICE TICKER.
  // first time. only if node is in sync
  if (!node.isSyncing()) {
    zmq.updatePriceticker();
  }
  // update price ticker at each block
  node.eth().subscribe("newBlockHeaders")
    .on("data", async () => {
      await zmq.updatePriceticker();
    },
  ).on("error", console.error);

}

main().catch(console.error);
