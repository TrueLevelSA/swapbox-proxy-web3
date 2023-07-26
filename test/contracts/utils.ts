// Swapbox
// Copyright (C) 2022  TrueLevel SA
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
// @ts-ignore
import { ethers, tracer } from "hardhat";
import {
    ERC20PresetMinterPauser, ERC20PresetMinterPauser__factory,
    SwapboxUniswapV2,
    SwapboxUniswapV2__factory,
    UniswapV2Factory,
    UniswapV2Factory__factory,
    UniswapV2Pair,
    UniswapV2Pair__factory,
    UniswapV2Router02,
    UniswapV2Router02__factory
} from "../../src/typechain";

export const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

export const UNISWAP_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
export const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

export async function longDeadline(): Promise<number> {
    return (await ethers.provider.getBlock(ethers.provider.blockNumber)).timestamp + 100000;
}

export interface UniswapEnv {
    factory: UniswapV2Factory,
    router: UniswapV2Router02
}

/**
 * Holds a bunch of static methods to help deploy a test environment for swapbox and pricefeed.
 */
export class DeployHelper {

    /**
     * Deploy a mintable token.
     *
     * @param deployer  Deployer
     * @param name      Name
     * @param symbol    Symbol
     * @returns         The token interface.
     */
    static deployToken = async (
        deployer: SignerWithAddress,
        name: string,
        symbol: string
    ): Promise<ERC20PresetMinterPauser> => {
        const token = await (new ERC20PresetMinterPauser__factory(deployer)).deploy(name, symbol);
        tracer.nameTags[token.address] = name;
        return token;
    }

    /**
     * Create a Uniswap pair, mint tokens and add liquidity to the newly created pair.
     *
     * @param deployer  Deployer
     * @param tokenA    Token A (must be mintable)
     * @param amountA   Amount for addLiquidity tokenA
     * @param tokenB    Token B (must be mintable)
     * @param amountB   Amount for addLiquidity for tokenB
     */
    static createPair = async (
        deployer: SignerWithAddress,
        factory: UniswapV2Factory,
        router: UniswapV2Router02,
        tokenA: ERC20PresetMinterPauser,
        amountA: BigNumber,
        tokenB: ERC20PresetMinterPauser,
        amountB: BigNumber
    ): Promise<UniswapV2Pair> => {
        await tokenA.mint(deployer.address, amountA);
        await tokenB.mint(deployer.address, amountB);
        await tokenA.approve(router.address, amountA);
        await tokenB.approve(router.address, amountB);

        const pair = DeployHelper.createPairBase(deployer, factory, tokenA.address, tokenB.address);

        await router.addLiquidity(
            tokenA.address,
            tokenB.address,
            amountA,
            amountB,
            amountA.sub(1000),   // arbitrary minimum desired
            amountB.sub(1000),   // arbitrary minimum desired
            deployer.address,
            await longDeadline()
        );

        return pair;
    }

    /**
    * Create a Uniswap pair, mint tokens and add liquidity to the newly created pair.
    *
    * @param deployer       Deployer
    * @param token          Token (must be mintable)
    * @param amountToken    Amount for addLiquidity for token
    * @param amountETH      Amount for addLiquidity for ETH
    */
    static createPairETH = async (
        deployer: SignerWithAddress,
        factory: UniswapV2Factory,
        router: UniswapV2Router02,
        token: ERC20PresetMinterPauser,
        amountToken: BigNumber,
        amountETH: BigNumber
    ): Promise<UniswapV2Pair> => {
        await token.mint(deployer.address, amountToken);
        await token.approve(router.address, amountToken);

        const pair = await DeployHelper.createPairBase(deployer, factory, token.address, WETH_ADDRESS);

        await router.addLiquidityETH(
            token.address,
            amountToken,
            amountToken.sub(1000),  // arbitrary minimum desired
            amountETH.sub(1000),    // arbitrary minimum desired
            deployer.address,
            await longDeadline(),
            { value: amountETH }
        );

        return pair;
    }

    // same for token-ETH and token-token pairs
    private static createPairBase = async (
        deployer: SignerWithAddress,
        factory: UniswapV2Factory,
        tokenA: string,
        tokenB: string,
    ): Promise<UniswapV2Pair> => {
        const tx = await factory.createPair(tokenA, tokenB);
        const m = await tx.wait();
        const basePairAddress = m.events![0].args!['pair'];

        return UniswapV2Pair__factory.connect(basePairAddress, deployer);
    }

    /**
     * Deploy a uniswap factory and exchange.
     *
     * @param deployer      Account for deployment/owner.
     * @param tokenStable   Address of backing token.
     */
    static deployUniswapV2 = async (
        deployer: SignerWithAddress
    ): Promise<UniswapEnv> => {
        const factory = await (new UniswapV2Factory__factory(deployer)).deploy(deployer.address);
        const router = await (new UniswapV2Router02__factory(deployer)).deploy(
            factory.address,
            WETH_ADDRESS
        );

        // tags external contracts when tracer is enabled
        tracer.nameTags[router.address] = "UniswapV2Router02";
        tracer.nameTags[factory.address] = "UniswapV2Factory";

        return {
            factory: factory,
            router: router
        }
    }

    /**
     * Deploy Swapbox contract for UniswapV2 environment. Mints 100.0 Stable coin on
     * swapbox address.
     *
     * @param deployer  Deployer of the contract, owner.
     * @param baseToken Stable coin backing up Swapbox fiat.
     * @param wethToken Wrapped ETH address
     * @param factory   UniswapV2Factory address
     * @param router    UniswapV2Router02 address
     */
    static deploySwapboxUniswapV2 = async (
        deployer: SignerWithAddress,
        baseToken: ERC20PresetMinterPauser,
        wethTokenAddress: string,
        factory: string,
        router: string,
        baseTokenAmount: BigNumber = ethers.utils.parseEther("100.0")
    ): Promise<SwapboxUniswapV2> => {
        const swapbox = await (new SwapboxUniswapV2__factory(deployer)).deploy(
            baseToken.address,
            wethTokenAddress,
            factory,
            router
        );
        await baseToken.mint(swapbox.address, baseTokenAmount);

        return swapbox;
    }
}
