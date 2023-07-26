// SPDX-License-Identifier: AGPL-3.0

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

pragma solidity ^0.8.0;

import "./Swapbox.sol";

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

import "hardhat/console.sol";


contract SwapboxUniswapV2 is Swapbox {

    address public immutable WETH;

    IUniswapV2Factory private _factory;
    IUniswapV2Router02 private _router;

    IUniswapV2Pair private _pair;

    /**
     * @dev The Swapbox Uniswap V2 constructor.
     */
    constructor(address baseToken, address WETH_, address factory, address router) Swapbox(baseToken){
        WETH = WETH_;
        _factory = IUniswapV2Factory(factory);
        _router = IUniswapV2Router02(router);

        _pair = IUniswapV2Pair(_factory.getPair(WETH, address(_baseToken)));
    }

    /**
     * @dev Swap an exact amount of its own base tokens for ETH, which will be
     * transferred to the user.
     *
     * @param   amountIn        Cash in
     * @param   amountOutMin    Min amount user should receive, revert if not able to do so
     * @param   to              Address that will receive ETH
     */
    function _buyEth(uint256 amountIn, uint256 amountOutMin, address to, uint deadline) internal override {
        uint256 fee = (amountIn * _machineFees[msg.sender].buy) / MAX_FEE;
        uint256 amountInLessFee = amountIn - fee;

        require(_baseToken.approve(address(_router), amountInLessFee), "SwapboxUniswapV2: approve failed.");

        // Path: Base Token -> ETH
        address[] memory path = new address[](2);
        path[0] = address(_baseToken);
        path[1] = WETH;

        require(path[path.length - 1] == WETH, 'UniswapV2Router: INVALID_PATH');

        uint[] memory amounts = _router.swapExactTokensForETH(
            amountInLessFee,
            amountOutMin,
            path,
            to,
            deadline
        );

        emit EtherBought(to, amounts[0], amounts[1]);
    }

    /**
     * @dev Swap ETH for an exact amount of base tokens. User must have sent the
     * ETH in advance for this to work. User will be refunded all its remaining
     * balance.
     *
     * @param   amountInEth     Amount of ETH to be swapped.
     * @param   amountOut       Amount of base tokens to receive.
     * @param   to              Address that will be refunded if needed.
     */
    function _sellEth(uint256 amountInEth, uint256 amountOut, address to, uint deadline) internal override {
        uint256 fee = (amountInEth * _machineFees[msg.sender].sell) / MAX_FEE;
        uint256 amountInLessFee = amountInEth - fee;

        require(_customerBalance[to] >= amountInEth, "SwapboxUniswapV2: insufficient customer balance");

        // Path: WETH -> Base Token
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = address(_baseToken);
        uint[] memory amounts = _router.swapETHForExactTokens{
            value: amountInLessFee
        }(
            amountOut,
            path,
            address(this),
            deadline
        );


        uint256 remainingBalance = _customerBalance[to] - amounts[0] - fee;
        _customerBalance[to] = 0;
        if (remainingBalance > 0) {
            payable(to).transfer(remainingBalance);
        }



        emit EtherSold(to, amounts[0], amounts[1]);
    }
}
