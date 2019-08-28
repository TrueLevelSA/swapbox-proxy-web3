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

import { Address } from "web3x/address";
import { Eth } from "web3x/eth";
import { BlockHeaderResponse } from "web3x/formatters";
import { bufferToHex } from "web3x/utils";

import { contractsDeployed, getAtola, getPriceFeed } from "./contracts";
import { Node } from "./node";
import { weiToHuman } from "./utils";
import { IReserves, Zmq } from "./zmq";

import { config } from "../config";
import deployed from "../smart-contract/config/local.json";

async function main() {
  // Initialization
  const node = new Node(config.websocket_provider.url);
  await node.waitForConnection();

  // retrieve atola and pricefeed contracts.
  const atola = getAtola(node.eth());
  const priceFeed = getPriceFeed(node.eth());

  // detect contracts on network.
  if (!await contractsDeployed(node.eth())) {
    console.log("Contracts arent deployed to current network. Exiting.");
    return;
  }

  // STATUS UPDATES
  setTimeout(async () => {
    const nodeStatus = await node.getStatus();
    zmq.sendStatus(nodeStatus);
  }, 1000);

  // PRICE TICKER.
  // first time
  zmq.updatePriceticker();
  // update price ticker at each block
  node.eth.subscribe("newBlockHeaders").on("data", async (blockHeader: BlockHeaderResponse) => {
    reserves = await zmq.updatePriceticker();
    if (config.debug) {
      if (blockHeader.hash) {
        console.log();
        console.log("New Block: ", bufferToHex(blockHeader.hash));
        console.log("  Exchange reserves:");
        console.log(`     ETH: ${weiToHuman(reserves.eth_reserve)}`);
        console.log(`     CHF: ${weiToHuman(reserves.token_reserve)}`);
      }
    }
  }).on("error", console.error);

}

main().catch(console.error);
