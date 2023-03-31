import { BigNumberish } from "ethers";
import { ReplyBase } from "./base";

export interface Price {
    readonly token: string,
    readonly symbol: string,
    readonly buy_price: BigNumberish,
    readonly buy_fee: BigNumberish,
    readonly sell_price: BigNumberish,
    readonly sell_fee: BigNumberish,
}

export interface ReplyPrices extends ReplyBase {
    readonly prices: {[key: string]: Price}
}
