import { ChainId, Token as UniToken, WETH9, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core'
import { Route, Pair, Trade } from '@uniswap/v2-sdk'
import { Token, TokenPair } from "../messaging/messages/replies/backend";
import config from "../config";

import { BigNumber, ethers } from "ethers";

export const computePrice = (baseToken: string, baseTokenDecimals: number, token: Token, reserve0: BigNumber, reserve1: BigNumber): { quoteTokenPrice: any, baseTokenPrice: any } => {

    const BASE_TOKEN = new UniToken(ChainId.MAINNET, baseToken, baseTokenDecimals);
    const TOKEN = new UniToken(ChainId.MAINNET, token.address, token.decimals);

    const tokens = [BASE_TOKEN, TOKEN];
    const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]];

    const pair = new Pair(
        CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
        CurrencyAmount.fromRawAmount(token1, reserve1.toString())
    );

    const route = new Route([pair], BASE_TOKEN, TOKEN);
 
    return {
        quoteTokenPrice: route.midPrice.invert().toFixed(baseTokenDecimals),
        baseTokenPrice: route.midPrice.toFixed(token.decimals)
    };
  }

export const getPairAddress = (
    tokenIn: Token,
    tokenOut: Token
): string => {
    const TOKEN_IN = new UniToken(ChainId.MAINNET, tokenIn.address, tokenIn.decimals, tokenIn.symbol, tokenIn.name);
    const TOKEN_OUT = new UniToken(ChainId.MAINNET, tokenOut.address, tokenOut.decimals, tokenOut.symbol, tokenOut.name);

    const pair = Pair.getAddress(TOKEN_IN, TOKEN_OUT);

    return pair;
}

export const computePriceThroughPairs = (
    baseToken: string,
    baseTokenDecimals: number,
    tokenPairs: TokenPair[],
): { quoteTokenPrice: string, baseTokenPrice: string } => {
    // Initialize the base token
    const BASE_TOKEN = new UniToken(ChainId.MAINNET, baseToken, baseTokenDecimals);

    // Initialize an empty array for the pairs
    const pairs: Pair[] = [];

    // Construct pairs from the provided token pairs information
    tokenPairs.forEach(({ tokenA, tokenB, reserve0, reserve1 }) => {
        const UNI_TOKEN_A = new UniToken(ChainId.MAINNET, tokenA.address, tokenA.decimals);
        const UNI_TOKEN_B = new UniToken(ChainId.MAINNET, tokenB.address, tokenB.decimals);

        const tokens = [UNI_TOKEN_A, UNI_TOKEN_B];
        const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]];
      
        const pair = new Pair(
            CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
            CurrencyAmount.fromRawAmount(token1, reserve1.toString()),
        );

        pairs.push(pair);
    });

    // Assume the last token of the last pair is the final quote token
    const finalQuoteToken = new UniToken(ChainId.MAINNET, tokenPairs[tokenPairs.length - 1].tokenB.address, tokenPairs[tokenPairs.length - 1].tokenB.decimals);
    // Create a route through all the pairs
    const route = new Route(pairs, BASE_TOKEN, finalQuoteToken);

    return {
        quoteTokenPrice: route.midPrice.invert().toFixed(finalQuoteToken.decimals),
        baseTokenPrice: route.midPrice.toFixed(baseTokenDecimals),
    };
};

export const quoteBuyPrice = (
    baseToken: string, 
    baseTokenDecimals: number, 
    token: Token, 
    reserve0: BigNumber, 
    reserve1: BigNumber, 
    amount: BigNumber
): { buyPrice: any, buyAmount: any, minBuyAmount: any } => {

    const BASE_TOKEN = new UniToken(ChainId.MAINNET, baseToken, baseTokenDecimals);
    const TOKEN = new UniToken(ChainId.MAINNET, token.address, token.decimals)

    const tokens = [BASE_TOKEN, TOKEN]
    const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]]

    const pair = new Pair(
        CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
        CurrencyAmount.fromRawAmount(token1, reserve1.toString())
    );

    const route = new Route([pair], BASE_TOKEN, TOKEN);
    const trade = new Trade(route, CurrencyAmount.fromRawAmount(BASE_TOKEN, amount.toString()), TradeType.EXACT_INPUT)
    const slippage = new Percent(3, 100);

    return {
        buyPrice: trade.executionPrice.invert().toFixed(baseTokenDecimals),
        buyAmount: trade.outputAmount.toFixed(token.decimals),
        minBuyAmount: trade.minimumAmountOut(slippage).toFixed(token.decimals)
    };

  }

export const quoteBuyPriceThroughPairs = (
    baseToken: string,
    baseTokenDecimals: number,
    tokenPairs: TokenPair[],
    amount: BigNumber,
): { buyPrice: any, buyAmount: any, minBuyAmount: any } => {
    // Initialize the base token
    const BASE_TOKEN = new UniToken(ChainId.MAINNET, baseToken, baseTokenDecimals);

    // Initialize an empty array for the pairs
    const pairs: Pair[] = [];

    // Construct pairs from the provided token pairs information
    tokenPairs.forEach(({ tokenA, tokenB, reserve0, reserve1 }) => {
        const UNI_TOKEN_A = new UniToken(ChainId.MAINNET, tokenA.address, tokenA.decimals);
        const UNI_TOKEN_B = new UniToken(ChainId.MAINNET, tokenB.address, tokenB.decimals);

        const tokens = [UNI_TOKEN_A, UNI_TOKEN_B];
        const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]];
      
        const pair = new Pair(
            CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
            CurrencyAmount.fromRawAmount(token1, reserve1.toString()),
        );

        pairs.push(pair);
    });

    // Assume the last token of the last pair is the final quote token
    const finalQuoteToken = new UniToken(ChainId.MAINNET, tokenPairs[tokenPairs.length - 1].tokenB.address, tokenPairs[tokenPairs.length - 1].tokenB.decimals);
    // Create a route through all the pairs
    const route = new Route(pairs, BASE_TOKEN, finalQuoteToken);
    const trade = new Trade(route, CurrencyAmount.fromRawAmount(BASE_TOKEN, amount.toString()), TradeType.EXACT_INPUT)
    const slippage = new Percent(3, 100);

    return {
        buyPrice: trade.executionPrice.invert().toFixed(baseTokenDecimals),
        buyAmount: trade.outputAmount.toFixed(finalQuoteToken.decimals),
        minBuyAmount: trade.minimumAmountOut(slippage).toFixed(finalQuoteToken.decimals)
    };
};

export const quoteSellPrice = (baseToken: string, baseTokenDecimals: number, token: Token, reserve0: BigNumber, reserve1: BigNumber, amount: BigNumber): { sellPrice: any, sellAmount: any, maxSellAmount: any } => {

    const BASE_TOKEN = new UniToken(ChainId.MAINNET, baseToken, baseTokenDecimals);
    const TOKEN = new UniToken(ChainId.MAINNET, token.address, token.decimals)

    const tokens = [BASE_TOKEN, TOKEN]
    const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]]

    const pair = new Pair(
        CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
        CurrencyAmount.fromRawAmount(token1, reserve1.toString())
    );

    const route = new Route([pair], TOKEN, BASE_TOKEN);
    const trade = new Trade(route, CurrencyAmount.fromRawAmount(BASE_TOKEN, amount.toString()), TradeType.EXACT_OUTPUT)
    const slippage = new Percent(3, 100);

    return {
        sellPrice: trade.executionPrice.toFixed(baseTokenDecimals),
        sellAmount: trade.inputAmount.toFixed(token.decimals),
        maxSellAmount: trade.maximumAmountIn(slippage).toFixed(token.decimals)
    };

  }

export const quoteSellPriceThroughPairs = (
    baseToken: string,
    baseTokenDecimals: number,
    tokenPairs: TokenPair[],
    amount: BigNumber,
): { sellPrice: any, sellAmount: any, maxSellAmount: any } => {
    // Initialize the base token
    const BASE_TOKEN = new UniToken(ChainId.MAINNET, baseToken, baseTokenDecimals);

    // Initialize an empty array for the pairs
    const pairs: Pair[] = [];

    // Construct pairs from the provided token pairs information
    tokenPairs.forEach(({ tokenA, tokenB, reserve0, reserve1 }) => {
        const UNI_TOKEN_A = new UniToken(ChainId.MAINNET, tokenA.address, tokenA.decimals);
        const UNI_TOKEN_B = new UniToken(ChainId.MAINNET, tokenB.address, tokenB.decimals);

        const tokens = [UNI_TOKEN_A, UNI_TOKEN_B];
        const [token0, token1] = tokens[0].sortsBefore(tokens[1]) ? tokens : [tokens[1], tokens[0]];
      
        const pair = new Pair(
            CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
            CurrencyAmount.fromRawAmount(token1, reserve1.toString()),
        );

        pairs.push(pair);
    });

    // Assume the last token of the last pair is the final quote token
    const finalQuoteToken = new UniToken(ChainId.MAINNET, tokenPairs[tokenPairs.length - 1].tokenB.address, tokenPairs[tokenPairs.length - 1].tokenB.decimals);
    // Create a route through all the pairs
    const route = new Route(pairs, finalQuoteToken, BASE_TOKEN);
    const trade = new Trade(route, CurrencyAmount.fromRawAmount(BASE_TOKEN, amount.toString()), TradeType.EXACT_OUTPUT)
    const slippage = new Percent(3, 100);

    return {
        sellPrice: trade.executionPrice.invert().toFixed(baseTokenDecimals),
        sellAmount: trade.outputAmount.toFixed(finalQuoteToken.decimals),
        maxSellAmount: trade.minimumAmountOut(slippage).toFixed(finalQuoteToken.decimals)
    };
};
