import BN from 'bn.js';
import { toWei, fromWei } from 'web3x/utils';

import { PriceFeed } from '../contracts/PriceFeed';

import { config } from '../../config';

// 1.2%  TO-DO look this up in smart contract
const OPERATOR_FEE = new BN(120);

export const fetchPrice = async (priceFeed: PriceFeed) => {

  const priceAmount = toWei(new BN(1), 'ether');
  const prices = await priceFeed.methods.getPrice(priceAmount, priceAmount).call();
  const exchangeBuyPrice = new BN(prices[0]);
  const exchangeSellPrice = new BN(prices[1]);
  const buyPrice = exchangeBuyPrice.add(computeFee(exchangeBuyPrice));
  const sellPrice = exchangeSellPrice.sub(computeFee(exchangeSellPrice));

  // debug messages
  if (config.debug) {
    console.log(`${fromWei(priceAmount, 'ether')} CHF`);
    console.log(`buys:     ${fromWei(buyPrice.toString(), 'ether')}`);
    console.log(`sells at: ${fromWei(sellPrice.toString(), 'ether')}`);
  }

  return {sellPrice, buyPrice};
}

/**
 * Compute fee for a given amount.
 */
const computeFee = (amount: BN) => {
  return amount.mul(OPERATOR_FEE).divRound(new BN(10000));
}

/**
 * Pricing function for buying ETH with CHF (XCHF).
 *
 * @param inputAmount   Amount of XCHF input
 * @param inputReserve  Input amount of XCHF in exchange reserves.
 * @param outputReserve Output amount of ETH in exchange reserves.
 */
const inputPrice = (inputAmount: BN, inputReserve: BN, outputReserve: BN) => {
  if (!inputReserve.gtn(0) || !outputReserve.gtn(0)) {
    throw Error('Reserves should be greater than zero');
  }

  const inputAmount_with_fee = toWei(inputAmount, 'ether').muln(997);

  const numerator = inputAmount_with_fee.mul(outputReserve);
  const denominator = inputReserve.muln(1000).add(inputAmount_with_fee);
  return fromWei(numerator.div(denominator), 'ether');
}

/**
 * Pricing function for selling ETH to get CHF (XCHF).
 *
 * @param outputAmount  Amount of XCHF being bought
 * @param inputReserve  Input amount of XCHF in exchange reserves.
 * @param outputReserve Output amount of ETH in exchange reserves.
 */
const outputPrice = (outputReserve: BN, outputAmount: BN, inputReserve: BN) => {
  if (!inputReserve.gtn(0) || !outputReserve.gtn(0)) {
    throw Error('Reserves should be greater than zero');
  }

  const numerator = outputAmount.mul(inputReserve).muln(1000);
  const denominator = outputReserve.sub(outputAmount).muln(997);

  return numerator.div(denominator).addn(1);
}
