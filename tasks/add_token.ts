// SPDX-License-Identifier: AGPL-3.0-only

// Swapbox web3 proxy
// Copyright (C) 2023  Thomas Saman Shababi
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, version 3 of the License.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import config from "../src/config";

task("add_token", "Add Token")
  .addPositionalParam("token", "The token address")
  .setAction(async ({ token }) => {
    if (network.name === "hardhat") {
      console.warn(
        "You are running the add_token task with Hardhat network, which" +
          "gets automatically created and destroyed every time. Use the Hardhat" +
          " option '--network localhost'"
      );
    }

    if ((await ethers.provider.getCode(config.contracts.swapbox)) === "0x") {
      console.error("You need to deploy your contract first");
      return;
    }

    const swapbox = await ethers.getContractAt("Swapbox", config.contracts.swapbox);
    const [deployer_account, test_account_1] = await ethers.getSigners();

    const tx = await swapbox.connect(deployer_account)
      .addToken(await token);
    await tx.wait();

    console.log(`Token: ${token} added`);

  });
