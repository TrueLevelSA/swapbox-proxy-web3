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

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
// @ts-ignore
import { ethers } from "hardhat";
import { ERC20, ERC20__factory } from '../../src/typechain';
// @ts-ignore
import { WETH_ADDRESS, DeployHelper } from "./utils";


describe('Deploy setup', () => {
    let deployer: SignerWithAddress;
    let tokenWETH: ERC20;

    before(async () => {
        [deployer] = await ethers.getSigners();
    });

    it('should fork main net when needed', async () => {
        tokenWETH = ERC20__factory.connect(WETH_ADDRESS, deployer);
        expect(tokenWETH.address).to.equal(WETH_ADDRESS);
        expect(await tokenWETH.name()).to.equal("Wrapped Ether");
        expect(await tokenWETH.symbol()).to.equal("WETH");
    });

    it('should deploy a test token', async () => {
        const testToken = await DeployHelper.deployToken(deployer, "Test Token", "TTK");
        expect(testToken.address).to.be.a.properAddress;
        expect(await testToken.name()).to.equal("Test Token");
        expect(await testToken.symbol()).to.equal("TTK");
    });

    it('deploy UniswapV2 correctly', async () => {
        const uniswap = await DeployHelper.deployUniswapV2(deployer);
        expect(uniswap.factory.address).to.be.a.properAddress;
        expect(uniswap.router.address).to.be.a.properAddress;
        expect(await uniswap.router.factory()).to.equal(uniswap.factory.address);
        expect(await uniswap.router.WETH()).to.equal(WETH_ADDRESS);
    });


    it('create a pair for token-token', async () => {
        const tokenA = await DeployHelper.deployToken(deployer, "Token A", "TKA");
        const amountA = ethers.utils.parseEther("10");
        const tokenB = await DeployHelper.deployToken(deployer, "Token B", "TKB");
        const amountB = ethers.utils.parseEther("200");
        const uniswap = await DeployHelper.deployUniswapV2(deployer);
        const pair = await DeployHelper.createPair(
            deployer,
            uniswap.factory,
            uniswap.router,
            tokenA,
            amountA,
            tokenB,
            amountB,
        );

        expect(pair.address).to.be.a.properAddress;

    });

    it('create a pair for ETH-Token', async () => {
        const amountETH = ethers.utils.parseEther("20000");
        const amountToken = ethers.utils.parseEther("10");

        const baseToken = await DeployHelper.deployToken(deployer, "Test Token", "TTK");
        const uniswap = await DeployHelper.deployUniswapV2(deployer);
        const pair = await DeployHelper.createPairETH(
            deployer,
            uniswap.factory,
            uniswap.router,
            baseToken,
            amountETH,
            amountToken,
        );

        // Check it's deployed
        expect(pair.address).to.be.a.properAddress;
        expect(pair.address).to.not.equal(ethers.constants.AddressZero);

        // check it's retrievable through uniswap
        const pairAddress = await uniswap.factory.getPair(tokenWETH.address, baseToken.address);
        expect(pairAddress).to.equal(pair.address);

        // check it's the correct pair of tokens and corresponding liquidity
        const token0 = await pair.token0();
        const token1 = await pair.token1();
        const [reserve0, reserve1] = await pair.getReserves();
        if (baseToken.address < tokenWETH.address) {
            expect(token0).to.equal(baseToken.address);
            expect(token1).to.equal(tokenWETH.address);
            expect(reserve0).to.equal(amountETH);
            expect(reserve1).to.equal(amountToken);
        } else {
            expect(token0).to.equal(tokenWETH.address);
            expect(token1).to.equal(baseToken.address);
            expect(reserve0).to.equal(amountToken);
            expect(reserve1).to.equal(amountETH);
        }

    });

    it('should deploy SwapboxUniswapV2', async () => {
        const amountETH = ethers.utils.parseEther("20000");
        const amountToken = ethers.utils.parseEther("10");
        const baseToken = await DeployHelper.deployToken(deployer, "Test Token", "TTK");
        const uniswap = await DeployHelper.deployUniswapV2(deployer);
        const pair = await DeployHelper.createPairETH(
            deployer,
            uniswap.factory,
            uniswap.router,
            baseToken,
            amountETH,
            amountToken,
        );

        const swapbox = await DeployHelper.deploySwapboxUniswapV2(
            deployer,
            baseToken,
            tokenWETH.address,
            uniswap.factory.address,
            uniswap.router.address,
        );

        // check it's deployed
        expect(swapbox.address).to.be.a.properAddress;
        expect(pair.address).to.not.equal(ethers.constants.AddressZero);
    });
});
