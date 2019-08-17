import BN from "bn.js";
import { fromWei, toWei } from "web3x/utils";

import { PriceFeed } from "../contracts/PriceFeed";

import { config } from "../../config";
import { weiToHuman } from "../utils";

// 1.2%  TO-DO look this up in smart contract
const OPERATOR_FEE = new BN(120);

export const fetchPrice = async (priceFeed: PriceFeed) => {

  const priceAmount = toWei(new BN(1), "ether");
  const prices = await priceFeed.methods.getPrice(priceAmount, priceAmount).call();
  const exchangeBuyPrice = new BN(prices[0]);
  const exchangeSellPrice = new BN(prices[1]);
  const buyPrice = exchangeBuyPrice.add(computeFee(exchangeBuyPrice));
  const sellPrice = exchangeSellPrice.sub(computeFee(exchangeSellPrice));

  // debug messages
  if (config.debug) {
    console.log();
    console.log(`price for: ${weiToHuman(priceAmount)} CHF`);
    console.log(`buys:      ${weiToHuman(buyPrice)}`);
    console.log(`sells at:  ${weiToHuman(sellPrice)}`);
  }

  return {sellPrice, buyPrice};
};

/**
 * Compute fee for a given amount.
 */
const computeFee = (amount: BN) => {
  return amount.mul(OPERATOR_FEE).divRound(new BN(10000));
};

/**
 * Pricing function for buying ETH with CHF (XCHF).
 *
 * @param inputAmount   Amount of XCHF input
 * @param inputReserve  Input amount of XCHF in exchange reserves.
 * @param outputReserve Output amount of ETH in exchange reserves.
 */
export const inputPrice = (inputAmount: BN, inputReserve: BN, outputReserve: BN) => {
  if (!inputReserve.gtn(0) || !outputReserve.gtn(0)) {
    throw Error("Reserves should be greater than zero");
  }

  const inputAmountWithFee = toWei(inputAmount, "ether").muln(997);

  const numerator = inputAmountWithFee.mul(outputReserve);
  const denominator = inputReserve.muln(1000).add(inputAmountWithFee);
  return fromWei(numerator.div(denominator), "ether");
};

/**
 * Pricing function for selling ETH to get CHF (XCHF).
 *
 * @param outputAmount  Amount of XCHF being bought
 * @param inputReserve  Input amount of XCHF in exchange reserves.
 * @param outputReserve Output amount of ETH in exchange reserves.
 */
export const outputPrice = (outputReserve: BN, outputAmount: BN, inputReserve: BN) => {
  if (!inputReserve.gtn(0) || !outputReserve.gtn(0)) {
    throw Error("Reserves should be greater than zero");
  }

  const numerator = outputAmount.mul(inputReserve).muln(1000);
  const denominator = outputReserve.sub(outputAmount).muln(997);

  return numerator.div(denominator).addn(1);
};
