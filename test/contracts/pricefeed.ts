// Swapbox
// Copyright (C) 2019  TrueLevel SA
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
import { ethers, tracer } from 'hardhat';
import { ERC20, ERC20PresetMinterPauser, ERC20__factory, IWETH, IWETH__factory, PriceFeed, PriceFeed__factory, SwapboxUniswapV2, UniswapV2Factory, UniswapV2Factory__factory, UniswapV2Pair, UniswapV2Router02, UniswapV2Router02__factory } from '../../src/typechain';
// @ts-ignore
import { DeployHelper, longDeadline, UNISWAP_FACTORY, UNISWAP_ROUTER, WETH_ADDRESS } from './utils';

chai.use(solidity);
const { expect } = chai;

describe('PriceFeed', () => {
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let machine: SignerWithAddress;

  let swapbox: SwapboxUniswapV2;
  let factory: UniswapV2Factory;
  let router: UniswapV2Router02;
  let tokenStable: ERC20PresetMinterPauser;
  let tokenWETH: IWETH;
  let pair: UniswapV2Pair;
  let pricefeed: PriceFeed;

  const baseLiquidityWETH = ethers.utils.parseEther("10");
  const baseLiquidityToken = ethers.utils.parseEther("20000");

  before(async () => {
    [deployer, user, machine] = await ethers.getSigners();

    tokenWETH = IWETH__factory.connect(WETH_ADDRESS, deployer);
    tokenStable = await DeployHelper.deployToken(deployer, "Random Stable Coin", "RSC");

    // forking uniswap from mainnet with hardhat
    factory = UniswapV2Factory__factory.connect(UNISWAP_FACTORY, deployer);
    tracer.nameTags[UNISWAP_FACTORY] = "UniswapV2Factory";
    router = UniswapV2Router02__factory.connect(UNISWAP_ROUTER, deployer);
    tracer.nameTags[UNISWAP_ROUTER] = "UniswapV2Router02";

    // create a test pair
    pair = await DeployHelper.createPairETH(deployer, factory, router, tokenStable, baseLiquidityToken, baseLiquidityWETH);

    swapbox = await DeployHelper.deploySwapboxUniswapV2(
      deployer,
      tokenStable,
      tokenWETH.address,
      factory.address,
      router.address
    );
    pricefeed = await (new PriceFeed__factory(deployer)).deploy(swapbox.address, factory.address);
  });

  it('getReserves:length', async () => {
    let reserves = await pricefeed.getReserves(tokenStable.address);
    expect(reserves).to.have.lengthOf(0);

    await swapbox.addToken(tokenWETH.address);

    reserves = await pricefeed.getReserves(tokenStable.address);
    expect(reserves).to.have.lengthOf(1);
  });

  it('getReserves:values', async () => {
    const reserves = await pricefeed.getReserves(tokenStable.address);
    const pricefeedReserves = [reserves[0].reserve0, reserves[0].reserve1];
    const baseReserves = [baseLiquidityToken, baseLiquidityWETH];

    // checking reserves without considering order.
    expect(pricefeedReserves).to.have.deep.members(baseReserves);
    expect(reserves[0].token).to.equal(tokenWETH.address);
    expect(reserves[0].pair).to.equal(pair.address);
  });

  it('getReserves:changes after buy order', async () => {
    const reservesBefore = await pricefeed.getReserves(tokenStable.address);

    const amountIn = ethers.utils.parseEther("10");
    const amountOutMin = ethers.utils.parseEther("0.0049");
    await swapbox.authorizeMachine(machine.address);
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

    const reservesAfter = await pricefeed.getReserves(tokenStable.address);
    expect(reservesAfter[0].reserve1).to.equal(reservesBefore[0].reserve1.add(amountIn));
    expect(reservesAfter[0].reserve0).to.be.below(reservesBefore[0].reserve0.sub(amountOutMin));
  });
});
