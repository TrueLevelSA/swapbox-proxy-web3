import BN from "bn.js";
import { fromWei } from "web3x/utils";

export const weiToHuman = (weiAmount: BN, fixed = 3) => {
  return Number(fromWei(weiAmount.toString(), "ether")).toFixed(fixed);
};
