import { BigNumber, ethers } from "ethers";

export const computeBuyPrice = (decimals: number, reserve0: BigNumber, reserve1: BigNumber): BigNumber => {
    const oneUnit = ethers.BigNumber.from(10).pow(decimals);
    const awf = oneUnit.mul(997);
    const n = awf.mul(reserve0);
    const d = reserve1.mul(1000).add(oneUnit);
    return n.div(d);
  }

export const computeSellPrice = (decimals: number, reserve0: BigNumber, reserve1: BigNumber): BigNumber => {
    const oneUnit = ethers.BigNumber.from(10).pow(decimals);
    const awf = oneUnit.mul(997);
    const n = awf.mul(reserve0);
    const d = reserve1.mul(1000).add(oneUnit);
    return n.div(d);
  }
