// import { BigNumberish } from "ethers";
import { ReplyBase } from "./base";

export interface ReplyPrice extends ReplyBase {
    readonly token: string;
    readonly symbol: string;
    readonly buy_price: string;
    readonly buy_amount: string;
    readonly min_buy_amount: string;
    readonly sell_price: string;
    readonly sell_amount: string;
    readonly max_sell_amount: string;
}
