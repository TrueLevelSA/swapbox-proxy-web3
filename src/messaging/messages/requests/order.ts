import { BigNumber } from "ethers";
import { RequestBase } from "./base";

export class RequestOrder extends RequestBase {
  constructor(
    readonly method: string,
      // blockchain: string,
    readonly token: string,
    readonly fiat_amount: BigNumber,
    readonly client_address: string,
    readonly minimum_buy_amount: BigNumber
  ){
    super(method);
  }
}
