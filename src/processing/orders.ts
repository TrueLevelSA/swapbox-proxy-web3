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
import { toWei } from "web3x/utils";

import { Atola } from "../contracts/Atola";
import { addressToHuman, weiToHuman } from "../utils";

/**
 * Send a buy order to the Atola contract.
 *
 * @param atola           Atola contract instance.
 * @param machineAddress  Address from which the tx are sent (machine address).
 * @param amount          The amount of Fiat money received in the machine.
 * @param userAddress     Address on which the exchange will deposit the Eth.
 */
export async function processBuyEthOrder(
  atola: Atola,
  machineAddress: Address,
  amount: BN,
  minEth: BN,
  userAddress: Address,
) {
  console.log();
  console.log(`order: ${weiToHuman(amount)} ETH for: ${addressToHuman(userAddress)}`);

  try {
    const fiatToEth = await atola.methods.fiatToEth(
      amount, minEth, userAddress,
    ).send({ from: machineAddress }).getReceipt();
    console.log(fiatToEth.events);
    if (fiatToEth.events) {
      return fiatToEth.events.CryptoPurchase[0].returnValues;
    }
  } catch (e) {
    console.error("Error while processBuyEthOrder");
    console.error(e);
  }
}

/**
 * Send a sell order to the Atola contract.
 *
 * @param atola        Atola contract instance.
 * @param from         Address from which the tx are sent (machine address).
 * @param amount       The amount of Fiat money received in the machine.
 * @param userAddress  Address on which the exchange will deposit the Eth.
 */
export async function processSellEthOrder(atola: Atola, from: Address, amount: BN, userAddress: Address) {
  const ethToFiat = await atola.methods.ethToFiat(
    userAddress,
    toWei(amount, "ether"),
  ).send({ from }).getReceipt();
  // wait for event and return bought Fiat amount.
}
