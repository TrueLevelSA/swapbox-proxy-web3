import { Address } from 'web3x/address';
import { toWei } from 'web3x/utils';
import BN from 'bn.js';

import { Atola } from '../contracts/Atola';

import { config } from '../../config';

/**
 * Send a buy order to the Atola contract.
 *
 * @param atola        Atola contract instance.
 * @param from         Address from which the tx are sent (machine address).
 * @param amount       The amount of Fiat money received in the machine.
 * @param userAddress  Address on which the exchange will deposit the Eth.
 */
export async function processBuyEthOrder(atola: Atola, from: Address, amount: BN, userAddress: Address)
{
  const fiatToEth = await atola.methods.fiatToEth(
    toWei(amount, 'ether'),
    0,
    userAddress,
  ).send({ from: from }).getReceipt();

  if (config.debug) {
    console.log(`fiatToEth: ${fiatToEth}`);
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
export async function processSellEthOrder(atola: Atola, from: Address, amount: BN, userAddress: Address)
{
  const ethToFiat = await atola.methods.ethToFiat(
    userAddress,
    toWei(amount, 'ether'),
  ).send({ from: from }).getReceipt();

  if (config.debug) {
    console.log(`ethToFiat: ${ethToFiat}`);
  }
}
