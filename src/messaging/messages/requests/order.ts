import { BigNumber } from "ethers";
import { RequestBase } from "./base";

export class RequestOrder extends RequestBase {
  constructor(
    readonly request: string,
    readonly order: {
      method: string,
      blockchain: string,
      token: string,
      amount_in: BigNumber,
      minimum_amount_out: BigNumber,
      client: string
    }
  ){
    super(request);
  }
}
