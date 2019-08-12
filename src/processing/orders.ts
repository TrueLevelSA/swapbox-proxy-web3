import BN from "bn.js";
import { Address } from "web3x/address";
import { toWei } from "web3x/utils";

import { Atola, CryptoPurchaseEvent } from "../contracts/Atola";
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
