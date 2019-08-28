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
import { BlockHeaderResponse } from "web3x/formatters";
import { bufferToHex } from "web3x/utils";

import { Atola } from "./contracts/Atola";
import { PriceFeed } from "./contracts/PriceFeed";

import { Node } from "./node";
import { weiToHuman } from "./utils";
import { IReserves, Zmq } from "./zmq";

import { config } from "../config";
import deployed from "../smart-contract/config/local.json";

const PRICEFEED_CONTRACT_ADDRESS = Address.fromString(deployed.PRICEFEED);
const ATOLA_CONTRACT_ADDRESS = Address.fromString(deployed.ATOLA);

async function main() {
  // Initialization
  const node = new Node(config.websocket_provider.url);
  await node.waitForConnection();

  const atola = new Atola(node.eth, ATOLA_CONTRACT_ADDRESS);
  const priceFeed = new PriceFeed(node.eth, PRICEFEED_CONTRACT_ADDRESS);
  const machineAddress = node.getAccounts()[0];
  let reserves: IReserves;

  const zmq = new Zmq(
    config.zmq.url_pub_price,
    config.zmq.url_pub_status,
    config.zmq.url_replier,
    atola,
    priceFeed,
    machineAddress,
  );

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
