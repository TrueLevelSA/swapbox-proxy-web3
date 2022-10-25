import { ReplyBase } from "./base"

export interface Token {
  address: string,
  pairAddress: string,
  symbol: string,
  name: string,
  decimals: number
}

export interface ReplyBackend extends ReplyBase {
  backend: {
    name: string,
    baseCurrency: string,
    tokens: Token[]
  }
}
