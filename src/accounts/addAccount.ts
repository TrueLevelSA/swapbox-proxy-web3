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

import { WebSocketProvider } from "@ethersproject/providers";
import bip39 from "bip39";
import { Wallet } from "ethers";
import * as prompt from "prompt";
import * as config from "../../config.json";

const promptGet = (properties: object) => {
  return new Promise<any>((resolve, reject) => {
    prompt.get(properties, (err: any, result: any) => {
      if (err) {
        reject();
      } else {
        resolve(result);
      }
    });
  });
};

async function main() {
  // Construct necessary components.
  const provider = new WebSocketProvider(config.websocket_provider.url);
  // user inputs
  let result: any;

  const properties = [
    {
      hidden: false,
      name: "mnemonic",
    },
  ];

  prompt.start();

  // prompt user for mnemonic
  try {
    result = await promptGet(properties);
  } catch (e) {
    console.error("Error while prompting user:", e);
    process.exit(1);
  }

  // validate mnemonic or quit
  if (!bip39.validateMnemonic(result.mnemonic)) {
    console.error("Invalid mnemonic.  Exiting");
    provider.destroy();
    process.exit(1);
  }

  const wallet = Wallet.fromMnemonic(result.mnemonic);
  console.log("Added account: ", wallet.address);

  provider.destroy();
}

main().catch(console.error);
