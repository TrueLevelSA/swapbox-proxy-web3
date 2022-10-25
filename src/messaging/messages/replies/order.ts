import { ReplyBase } from "./base";

export interface ReplyOrder extends ReplyBase {
  tx_confirmed: boolean
}
