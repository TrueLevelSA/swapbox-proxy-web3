import { ReplyBase } from "./base"
import { BigNumber, BigNumberish } from "ethers";

export interface Token {
  address: string;
  pairAddress: string | null;
  symbol: string;
  name: string;
  decimals: number;
  supported: boolean;
  path: string;
}

export interface TokenPair {
    tokenA: Token;
    tokenB: Token;
    reserve0: BigNumberish;
    reserve1: BigNumberish;
}

export interface TokenPool {
    tokenA: Token;
    tokenB: Token;
    sqrtPriceX96: BigNumberish;
    tickCurrent: number;
}

export interface ReplyBackend extends ReplyBase {
  backend: {
    name: string;
    baseCurrency: string;
    tokens: Token[];
  }
}
