import { BigNumber } from "ethers";
import { RequestBase } from "./base";

export class RequestPrice extends RequestBase {
  constructor(
    readonly method: string,
      // blockchain: string,
    readonly token: string,
    readonly fiat_amount: BigNumber
  ){
    super(method);
  }
}
