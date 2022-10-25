import { BigNumberish } from "ethers";
import { ReplyBase } from "./base";

export interface Price{
  symbol: string
  buy_price: BigNumberish
  buy_fee: BigNumberish
  sell_price: BigNumberish
  sell_fee: BigNumberish
}

export interface ReplyPrices extends ReplyBase {
  prices: Price[]
}
