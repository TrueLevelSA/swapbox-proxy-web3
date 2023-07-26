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
import chai from 'chai';
import { solidity } from 'ethereum-waffle';
// @ts-ignore
import { ethers, tracer } from "hardhat";
import { ERC20, ERC20__factory, IWETH, IWETH__factory, SwapboxUniswapV2, UniswapV2Factory, UniswapV2Factory__factory, UniswapV2Router02, UniswapV2Router02__factory } from '../../src/typechain';
// @ts-ignore
import { DeployHelper, longDeadline, UNISWAP_FACTORY, UNISWAP_ROUTER, WETH_ADDRESS } from "./utils";

import { ERC20PresetMinterPauser } from '../../src/typechain/ERC20PresetMinterPauser';

chai.use(solidity);
const { expect } = chai;

describe('SwapBox', async () => {
    let deployer: SignerWithAddress;
    let user: SignerWithAddress;
    let machine: SignerWithAddress;

    let swapbox: SwapboxUniswapV2;
    let factory: UniswapV2Factory;
    let router: UniswapV2Router02;
    let tokenStable: ERC20PresetMinterPauser;
    let tokenWETH: IWETH;
    let tokenWETH20: ERC20;


    before(async () => {
        [deployer, user, machine] = await ethers.getSigners();
        tokenWETH = IWETH__factory.connect(WETH_ADDRESS, deployer);
        tokenWETH20 = ERC20__factory.connect(WETH_ADDRESS, deployer);
        tokenStable = await DeployHelper.deployToken(deployer, "Random Stable Coin", "RSC");

        // forking uniswap from mainnet with hardhat
        factory = UniswapV2Factory__factory.connect(UNISWAP_FACTORY, deployer);
        tracer.nameTags[UNISWAP_FACTORY] = "UniswapV2Factory";
        router = UniswapV2Router02__factory.connect(UNISWAP_ROUTER, deployer);
        tracer.nameTags[UNISWAP_ROUTER] = "UniswapV2Router02";

        // create a test pair
        const baseLiquidityWETH = ethers.utils.parseEther("10");
        const baseLiquidityToken = ethers.utils.parseEther("20000");
        await DeployHelper.createPairETH(deployer, factory, router, tokenStable, baseLiquidityToken, baseLiquidityWETH);
    })

    beforeEach(async () => {
        swapbox = await DeployHelper.deploySwapboxUniswapV2(
            deployer,
            tokenStable,
            tokenWETH.address,
            factory.address,
            router.address
        );
    })

    it('should correctly add a new supported token', async () => {
        const monero = await DeployHelper.deployToken(deployer, "Monero", "XMR");

        // static call should confirm it will work
        const added = await swapbox.callStatic.addToken(monero.address);
        expect(added).to.be.true;

        await swapbox.addToken(monero.address);
        const tokenCount = await swapbox.getTokenCount();
        expect(tokenCount).to.equal(1);

        const tokens = await swapbox.supportedTokensList();
        expect(tokens).to.have.length(1);
        expect(tokens.at(0)).to.equal(monero.address);
    });

    it('should remove an existing supported token', async () => {
        const monero = await DeployHelper.deployToken(deployer, "Monero", "XMR");
        await swapbox.addToken(monero.address);

        // static call should confirm it will work
        const removed = await swapbox.callStatic.removeToken(monero.address);
        expect(removed).to.be.true;

        await swapbox.removeToken(monero.address);
        const tokenCount = await swapbox.getTokenCount();
        expect(tokenCount).to.equal(0);
    });

    it('should not remove an non-existing token', async () => {
        const monero = await DeployHelper.deployToken(deployer, "Monero", "XMR");
        await swapbox.addToken(monero.address);
        const removed = await swapbox.callStatic.removeToken(ethers.constants.AddressZero)
        expect(removed).to.be.false;

        await swapbox.removeToken(ethers.constants.AddressZero);
        const tokenCount = await swapbox.getTokenCount();
        expect(tokenCount).to.equal(1);
    });

    it('should emit a `MachineAuthorized` event when authorizing a machine', async () => {
        await expect(swapbox.authorizeMachine(machine.address))
            .to.emit(swapbox, 'MachineAuthorized')
            .withArgs(machine.address);
    });

    it('should emit a `MachineRevoked` event when revoking a machine', async () => {
        await swapbox.authorizeMachine(machine.address);

        await expect(swapbox.revokeMachine(machine.address))
            .to.emit(swapbox, 'MachineRevoked')
            .withArgs(machine.address);
    });

    it('should correctly return a machine authorization status', async () => {
        await swapbox.authorizeMachine(machine.address);
        const isAuthorizedTrue = await swapbox.isAuthorized(machine.address);
        expect(isAuthorizedTrue).to.be.true;

        const isAuthorizedFalse = await swapbox.isAuthorized(ethers.constants.AddressZero);
        expect(isAuthorizedFalse).to.be.false;
    });

    it('should fail to set a fee too high', async () => {
        const feeTooHigh = 10000;
        await expect(swapbox.updateMachineFees(machine.address, feeTooHigh, 0))
            .to.be.revertedWith("Swapbox: buy fee must be under 100%");

        await expect(swapbox.updateMachineFees(machine.address, 0, feeTooHigh))
            .to.be.revertedWith("Swapbox: sell fee must be under 100%");
    });

    it('should buy ETH through a buyEth order', async () => {
        const amountIn = ethers.utils.parseEther("10");
        const amountOutMin = ethers.utils.parseEther("0.0049");

        await swapbox.authorizeMachine(machine.address);

        const userBalanceBefore = await user.getBalance();
        const swapboxTokenBalanceBefore = await tokenStable.balanceOf(swapbox.address);

        swapbox = swapbox.connect(machine);
        await swapbox.buyEth(
            amountIn,
            amountOutMin,
            user.address,
            await longDeadline(),
            {
                gasLimit: 250000
            }
        )

        const userBalanceAfter = await user.getBalance();
        const balanceIncrease = userBalanceAfter.sub(userBalanceBefore);
        const swapboxTokenBalanceAfter = await tokenStable.balanceOf(swapbox.address);
        const tokenBalanceDecrease = swapboxTokenBalanceBefore.sub(swapboxTokenBalanceAfter);

        // user balance must increase of at least the minimum expected output.
        expect(balanceIncrease).to.be.gte(amountOutMin);
        // machine token balance must decrease of exactly fiat input.
        expect(tokenBalanceDecrease).to.eq(amountIn);
    });

    it('emits a `EtherBought` event after a buyEth order', async () => {
        const amountIn = ethers.utils.parseEther("10");
        const amountOutMin = ethers.utils.parseEther("0.0049");

        await swapbox.authorizeMachine(machine.address);

        swapbox = swapbox.connect(machine);
        await expect(
            swapbox.buyEth(
                amountIn,
                amountOutMin,
                user.address,
                await longDeadline(),
                {
                    gasLimit: 250000
                }
            )
        ).to.emit(swapbox, 'EtherBought');
        // can't use .withArgs because we can't know deterministically the amount out.

    });

    it('transfers the full approved amount');

    it('emits a `EtherSold` event after a sellEth order', async () => {
        const amountEth = ethers.utils.parseEther("0.22");
        const amountOut = ethers.utils.parseEther("400");
        await user.sendTransaction({ to: swapbox.address, value: amountEth });
        await swapbox.authorizeMachine(machine.address);
        swapbox = swapbox.connect(machine);
        await expect(swapbox.sellEth(amountEth, amountOut, user.address, await longDeadline()))
            .to.emit(swapbox, 'EtherSold');
    });

    it('sells ETH through a sellEth order', async () => {
        const fees = 50; // 0.5% => 50/10000
        await swapbox.updateMachineFees(
            machine.address,
            fees,
            fees,
        )

        const amountEth = ethers.utils.parseEther("0.22");
        const amountOut = ethers.utils.parseEther("400");
        const amountFees = amountEth.mul(50).div(10000);

        const swapboxBalanceBefore = await ethers.provider.getBalance(swapbox.address);
        const swapboxTokenBalanceBefore = await tokenStable.balanceOf(swapbox.address);

        await user.sendTransaction({ to: swapbox.address, value: amountEth });
        const swapboxBalanceAfterSend = await ethers.provider.getBalance(swapbox.address);
        expect(swapboxBalanceAfterSend).to.equal(swapboxBalanceBefore.add(amountEth));

        await swapbox.authorizeMachine(machine.address);
        swapbox = swapbox.connect(machine);
        await swapbox.sellEth(amountEth, amountOut, user.address, await longDeadline());

        const swapboxTokenBalanceAfter = await tokenStable.balanceOf(swapbox.address);
        expect(swapboxTokenBalanceAfter.sub(swapboxTokenBalanceBefore)).to.equal(amountOut);

        const swapboxBalanceAfterSellEth = await ethers.provider.getBalance(swapbox.address);
        expect(swapboxBalanceAfterSellEth).to.equal(swapboxBalanceBefore.add(amountFees));
    });

    it('swaps less than the transferred amount');

    it('fails to sell ETH if user hasn\'t transferred any ETH yet', async () => {
        const amountEth = ethers.utils.parseEther("0.22");
        const amountOut = ethers.utils.parseEther("400");
        await swapbox.authorizeMachine(machine.address);
        swapbox = swapbox.connect(machine);
        await expect(
            swapbox.sellEth(amountEth, amountOut, user.address, await longDeadline())
        ).to.revertedWith("SwapboxUniswapV2: insufficient customer balance");
    });

    it('fails to buy ETH if the deadline is too short', async () => {
        const amountEth = ethers.utils.parseEther("0.22");
        const amountOut = ethers.utils.parseEther("400");
        await user.sendTransaction({ to: swapbox.address, value: amountEth });
        await swapbox.authorizeMachine(machine.address);
        swapbox = swapbox.connect(machine);
        await expect(
            swapbox.sellEth(amountEth, amountOut, user.address, 0)
        ).to.revertedWith("UniswapV2Router: EXPIRED");

    });
});
