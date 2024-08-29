import { ReplyBase } from "./base";
import { BigNumberish } from "ethers";

export interface Fees {
  readonly network: BigNumberish;
  readonly operator: number;
  readonly liquidity_provider: string;
}

export interface TransactionReceipt {
    readonly basetoken_decimals: number;
    readonly token_decimals: number;
    readonly token: string;
    readonly amount_bought: BigNumberish;
    readonly url: string;
    readonly fees: Fees | null;
}

export interface ReplyOrder extends ReplyBase {
  status: string;
  tx_confirmed: boolean;
  receipt: TransactionReceipt | null;
}
