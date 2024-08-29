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
import "openzeppelin-4/utils/structs/EnumerableSet.sol";
import "./libs/Path.sol";


contract SwapboxUniswapV2 is Swapbox {

    using Path for bytes;
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    address public immutable WETH;

    IUniswapV2Factory private _factory;
    IUniswapV2Router02 private _router;

    /**
     * @dev The Swapbox Uniswap V2 constructor.
     */
    constructor(address baseToken, address WETH_, address factory, address router) Swapbox(baseToken){
        WETH = WETH_;
        _factory = IUniswapV2Factory(factory);
        _router = IUniswapV2Router02(router);
    }

    /**
     * @dev Allows the owner to add a trusted token address.
     *
     * @param tokenAddress  The address of the token contract (warning: make sure it's compliant)
     */
    function _addToken(address tokenAddress, bytes memory path) internal override returns (bool) {

        bytes memory path2 = path;
        address lastTokenOut;
        if (path.hasMultiplePools()){
            for (uint i = 0; i < path.numPools(); i++) {
                (address tokenIn, address tokenOut, uint24 fee) = path2.decodeFirstPool();
                address pair = _factory.getPair(tokenIn, tokenOut);
                require(pair != address(0), "SwapboxUniswapV2: pair doesnt exist");
                lastTokenOut = tokenOut;
                _usedTokens.add(tokenOut);
                _allPairs.add(pair);
                path2 = path2.skipToken();
            }
        } else {
            address pair = _factory.getPair(tokenAddress, address(_baseToken));
            require(pair != address(0) || tokenAddress == address(_baseToken), "SwapboxUniswapV2: pair doesn't exist and no path set");
            _allPairs.add(_factory.getPair(tokenAddress, address(_baseToken)));
        }

        require(lastTokenOut == tokenAddress || path.hasMultiplePools() == false, "SwapboxUniswapV2: tokenOut doesn't match tokenAddress");

        _tokenPath[tokenAddress] = path;
        return _supportedTokens.add(tokenAddress);
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

        _baseToken.safeApprove(address(_router), 0);
        _baseToken.safeApprove(address(_router), amountInLessFee);

        // Path: Base Token -> ETH
        address[] memory path = new address[](2);
        path[0] = address(_baseToken);
        path[1] = WETH;

        uint[] memory amounts = _router.swapExactTokensForETH(
            amountInLessFee,
            amountOutMin,
            path,
            to,
            block.timestamp
        );

        emit CryptoBought(to, amounts[0], amounts[1], fee);
    }

    /**
     * @dev Swap an exact amount of its own base tokens for tokens, which will be
     * transferred to the user.
     *
     * @param   amountIn        Cash in
     * @param   amountOutMin    Min amount user should receive, revert if not able to do so
     * @param   to              Address that will receive tokens
     */
    function _buyTokens(address token, uint256 amountIn, uint256 amountOutMin, address to, uint256 deadline) internal override {
        // require(deadline >= block.timestamp, 'SwapboxUniswapV2: DEADLINE EXPIRED');
        uint256 fee = (amountIn * _machineFees[msg.sender].buy) / MAX_FEE;
        uint256 amountInLessFee = amountIn - fee;

        if (token != address(_baseToken)) {
            bytes storage path = _tokenPath[token];

            _baseToken.safeApprove(address(_router), 0);
            _baseToken.safeApprove(address(_router), amountInLessFee);

            address[] memory p = new address[](path.numPools() > 0 ? path.numPools()+1 : 2);

            bytes memory path2 = path;
            if (path.numPools() > 0){
                for (uint i = 0; i < path.numPools(); i++) {
                    (address tokenIn, address tokenOut, uint24 fee) = path2.decodeFirstPool();
                    p[i] = tokenIn;
                    p[i+1] = tokenOut;
                    path2 = path2.skipToken();
                }
            }else{
                // Path: Base Token -> token
                p[0] = address(_baseToken);
                p[1] = token;
            }

            uint[] memory amounts = _router.swapExactTokensForTokens(
                amountInLessFee,
                amountOutMin,
                p,
                to,
                block.timestamp
            );
            emit CryptoBought(to, amounts[0], amounts[1], fee);
        } else {
            _baseToken.safeTransfer(address(to), amountInLessFee);
            emit CryptoBought(to, amountInLessFee, amountInLessFee, fee);
        }


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



        emit EtherSold(to, amounts[0], amounts[1], fee);
    }
}
