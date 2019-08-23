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

import BN from "bn.js";

import { Address } from "web3x/address";
import { Eth } from "web3x/eth";
import { BlockHeaderResponse } from "web3x/formatters";
import { Net } from "web3x/net";
import { WebsocketProvider } from "web3x/providers";
import { bufferToHex } from "web3x/utils";

import { Atola } from "./contracts/Atola";
import { PriceFeed } from "./contracts/PriceFeed";

import { weiToHuman } from "./utils";
import { IReserves, IStatus, Zmq } from "./zmq";

import { config } from "../config";
import deployed from "../smart-contract/config/local.json";

const PRICEFEED_CONTRACT_ADDRESS = Address.fromString(deployed.PRICEFEED);
const ATOLA_CONTRACT_ADDRESS = Address.fromString(deployed.ATOLA);

async function main() {
  // Initialization
  const provider = new WebsocketProvider(config.websocket_provider.url);
  const eth = new Eth(provider);
  const net = new Net(eth);

  const accounts = await eth.getAccounts();

  if (config.debug) {
    console.log(`Connected to network: ${await net.getNetworkType()}`);
    console.log(`Network Id: ${await eth.getId()}`);
    console.log(`Node info: ${await eth.getNodeInfo()}`);
  }

  const atola = new Atola(eth, ATOLA_CONTRACT_ADDRESS);
  const priceFeed = new PriceFeed(eth, PRICEFEED_CONTRACT_ADDRESS);
  const machineAddress = accounts[0];
  let reserves: IReserves;
  let status: IStatus;

  const zmq = new Zmq(
    config.zmq.url,
    config.zmq.url_status,
    config.zmq.responder_url,
    atola,
    priceFeed,
    machineAddress,
  );

  // PRICE TICKER.
  // first time
  zmq.updatePriceticker();
  // update price ticker at each block
  eth.subscribe("newBlockHeaders").on("data", async (blockHeader: BlockHeaderResponse) => {
    reserves = await zmq.updatePriceticker();
    status = await zmq.updateStatus();
    if (config.debug) {
      if (blockHeader.hash) {
        console.log();
        console.log("New Block: ", bufferToHex(blockHeader.hash));
        console.log("Exchange reserves:");
        console.log(`   ETH: ${weiToHuman(reserves.eth_reserve)}`);
        console.log(`   CHF: ${weiToHuman(reserves.token_reserve)}`);
        console.log(`status: ${JSON.stringify(status)}`);
      }
    }
  }).on("error", console.error);

}

main().catch(console.error);
