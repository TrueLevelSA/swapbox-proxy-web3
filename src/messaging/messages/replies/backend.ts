export class ReplyBackend {
  constructor(
    readonly backend: {
      name: string,
      baseCurrency: string,
      tokens: {
        symbol: string,
        name: string,
        decimals: number,
      }[]
    }
  ) { }
}
