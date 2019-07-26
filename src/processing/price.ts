import BN from 'bn.js';
import { toWei, fromWei } from 'web3x/utils';

import { PriceFeed } from '../contracts/PriceFeed';

import { ethPrice } from '../calculatePrice';
import { config } from '../../config';

// 1.2%  TO-DO look this up in smart contract
const OPERATOR_FEE = new BN(120);

export const fetchPrice = async (priceFeed: PriceFeed) => {

  const balances = await priceFeed.methods.getBalances().call();

  // "unpack" smart contract response
  const addresses = balances[0].map(address => address.toString());
  const tokenBalances = balances[1].map(tokenBalance => new BN(tokenBalance));
  const ethBalances = balances[2].map(ethBalance => new BN(ethBalance));

  // sending only baseToken price (which is the first token in the list)
  const outputAmount = toWei(new BN(1), 'ether');
  const price = ethPrice(tokenBalances[0], ethBalances[0], outputAmount);
  const fee = computeFee(price);
  const sellPrice = price.sub(fee);
  const buyPrice = price.add(fee);

  // debug messages
  if (config.debug) {
    console.log(`exchange:   ${fromWei(price.toString(), 'ether')}`);
    console.log(`atola buy:  ${fromWei(buyPrice.toString(), 'ether')}`);
    console.log(`atola sell: ${fromWei(sellPrice.toString(), 'ether')}`);
  }

  return {sellPrice, buyPrice};
}

/**
 * Compute fee for a given amount.
 */
const computeFee = (amount: BN) => {
  return amount.mul(OPERATOR_FEE).divn(10000);
}
