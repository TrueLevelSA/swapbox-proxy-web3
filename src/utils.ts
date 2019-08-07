import BN from "bn.js";
import { Address } from "web3x/address";
import { fromWei } from "web3x/utils";

export const weiToHuman = (weiAmount: BN, fixed = 3) => {
  return Number(fromWei(weiAmount.toString(), "ether")).toFixed(fixed);
};

export const addressToHuman = (address: Address) => {
  const a = address.toString();
  const len = a.length;
  return a.slice(0, 5) + "..." + a.slice(len - 5);
};
