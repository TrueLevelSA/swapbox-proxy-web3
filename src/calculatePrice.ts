import BN from 'bn.js';
import { fromWei, toWei } from 'web3x/utils';

/**
 * Pricing function for Token price.
 *
 * @param inputReserve  Input amount of ETH in exchange reserves.
 * @param outputReserve Output amount of Token in exchange reserves.
 * @param inputAmount   Amount of ETH being sold
 */
export const tokenPrice = (inputReserve: BN, outputReserve: BN, inputAmount: BN) => {
  if (!inputReserve.gtn(0) || !outputReserve.gtn(0)) {
    throw Error('Reserves should be greater than zero');
  }

  const inputAmount_with_fee = toWei(inputAmount, 'ether').muln(997);

  const numerator = inputAmount_with_fee.mul(outputReserve);
  const denominator = inputReserve.muln(1000).add(inputAmount_with_fee);
  return fromWei(numerator.div(denominator), 'ether');
}

/**
 * Pricing function for ETH price.
 *
 * @param inputReserve  Input amount of ETH in exchange reserves.
 * @param outputReserve Output amount of Token in exchange reserves.
 * @param outputAmount  Amount of ETH being bought
 */
export const ethPrice = (inputReserve: BN, outputReserve: BN, outputAmount: BN) => {
  if (!inputReserve.gtn(0) || !outputReserve.gtn(0)) {
    throw Error('Reserves should be greater than zero');
  }

  const outputAmountInt = toWei(outputAmount, 'ether')
  const numerator = inputReserve.mul(outputAmountInt).muln(1000);
  const denominator = outputReserve.sub(outputAmountInt).muln(997);

  return fromWei(numerator.div(denominator).addn(1), 'ether');
}
