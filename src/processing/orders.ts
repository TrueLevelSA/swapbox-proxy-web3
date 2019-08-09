import BN from "bn.js";
import { Address } from "web3x/address";
import { toWei } from "web3x/utils";

import { Atola } from "../contracts/Atola";
import { addressToHuman } from "../utils";

/**
 * Send a buy order to the Atola contract.
 *
 * @param atola        Atola contract instance.
 * @param from         Address from which the tx are sent (machine address).
 * @param amount       The amount of Fiat money received in the machine.
 * @param userAddress  Address on which the exchange will deposit the Eth.
 */
export async function processBuyEthOrder(atola: Atola, from: Address, amount: BN, userAddress: Address) {
  console.log();
  console.log(`order: ${amount} ETH from: ${addressToHuman(from)} to: ${addressToHuman(userAddress)}`);
  try {
    const estimate = await atola.methods.fiatToEth(toWei(amount, "ether"), 10000, userAddress).estimateGas();

    const fiatToEth = await atola.methods.fiatToEth(
      toWei(amount, "ether"), 10000, userAddress,
    ).send({ from }).getReceipt();
    console.log(fiatToEth.events);

  } catch (e) {
    console.error("Error while processBuyEthOrder");
    console.error(e);
  }
  // TODO: wait for Atola event `CryptoPurchase` and return bought ETH amount.
  return new BN(1234);
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
