import { BigNumberish } from "ethers";

export class Price {
  constructor(
    readonly symbol: string,
    readonly buy_price: BigNumberish,
    readonly buy_fee: BigNumberish,
    readonly sell_price: BigNumberish,
    readonly sell_fee: BigNumberish,
  ) { }
}

export class ReplyPrices {
  constructor(
    readonly prices: Price[]
  ) { }
}
