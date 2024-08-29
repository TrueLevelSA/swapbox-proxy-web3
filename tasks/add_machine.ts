// SPDX-License-Identifier: AGPL-3.0-only

// Swapbox web3 proxy
// Copyright (C) 2023  TrueLevel SA
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

task("add_machine", "Add Machine")
  .setAction(async ({ }) => {
    if (network.name === "hardhat") {
      console.warn(
        "You are running the add_machine task with Hardhat network, which" +
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
      .authorizeMachine(await test_account_1.getAddress());
    await tx.wait();

    console.log(`Machine ${test_account_1.address} added`);

    const fee_tx = await swapbox.connect(deployer_account)
      .updateMachineFees(await test_account_1.getAddress(), 200, 300);
    await tx.wait();

    console.log(`2% buy fee and 3% sell fee set for ${test_account_1.address}`);
  });
