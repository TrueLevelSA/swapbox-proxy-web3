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

pragma solidity 0.8.9;

import "./Swapbox.sol";
import "./UniswapExchangeInterface.sol";

contract SwapboxUniswapV1 is Swapbox {

    UniswapExchangeInterface private _baseExchange;

    /**
     * @dev The Swapbox Uniswap V1 constructor.
     */
    constructor(address baseCurrency_, address baseExchange_) Swapbox(baseCurrency_){
        _baseExchange = UniswapExchangeInterface(baseExchange_);
    }

    function _buyEth(uint256 amountFiat, uint256 minValue, address to, uint deadline) internal override {
        uint256 fee = (amountFiat * _machineFees[msg.sender].buy) / MAX_FEE;
        uint256 amountLessFee = amountFiat - fee;

        // approve exchange for Swapbox
        _baseToken.approve(address(_baseExchange), amountLessFee);

        //call uniswap
        uint256 ethBought = _baseExchange.tokenToEthTransferInput(
            amountLessFee,
            minValue,
            deadline,
            to
        );

        emit EtherBought(to, amountFiat, ethBought);
    }

    function _sellEth(uint256 amountFiat, uint256 minValue, address to, uint deadline) internal override {
        uint256 fee = (amountFiat * _machineFees[msg.sender].sell) / MAX_FEE;
        uint256 amountLessFee = amountFiat - fee;

        // approve exchange for Swapbox
        _baseToken.approve(address(_baseExchange), amountLessFee);

        //call uniswap
        uint256 ethBought = _baseExchange.ethToTokenTransferInput(
            minValue,
            deadline,
            to
        );

        emit EtherSold(to, amountFiat, ethBought);
    }
}
