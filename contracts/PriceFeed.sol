// SPDX-License-Identifier: AGPL-3.0

// Swapbox
// Copyright (C) 2022  TrueLevel SA
//
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

pragma solidity ^0.8.9;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";

interface Token {
    function balanceOf(address who) external view returns (uint256);
}

interface Exchange {function tokenAddress() external view returns (address token);
    function getTokenToEthInputPrice(uint256 tokens_sold) external view returns (uint256);
    function getEthToTokenOutputPrice(uint256 tokens_bought) external view returns (uint256);
}

import "./Swapbox.sol";

contract PriceFeed {

    struct TokenReserve {
        uint112 reserve0;
        uint112 reserve1;
        address pair;
    }

    Swapbox private _swapbox;
    IUniswapV2Factory private _factory;

    /**
     * @dev The PriceFeed constructor sets the address of the SwapBox where
     * we look up supportedTokens
     */
    constructor(address payable swapboxAddress, address factoryAddress) {
        _swapbox = Swapbox(swapboxAddress);
        _factory = IUniswapV2Factory(factoryAddress);
    }

    function getReserves() external view returns(TokenReserve[] memory) {
        address[] memory allpairs = _swapbox.allPairsList();

        TokenReserve[] memory reserves = new TokenReserve[](allpairs.length);

        for (uint i = 0; i< allpairs.length; i++){
            if (allpairs[i] != address(0)) {
                IUniswapV2Pair pair = IUniswapV2Pair(allpairs[i]);
                (uint112 r0, uint112 r1, )  = pair.getReserves();
                reserves[i] = TokenReserve(r0, r1, address(pair));
            } else {
                reserves[i] = TokenReserve(0, 0, address(0));
            }
        }
        return reserves;
    }

    function getFees() external view returns(Swapbox.Fee memory) {
        return _swapbox.getMachineFee(msg.sender);
    }
}
