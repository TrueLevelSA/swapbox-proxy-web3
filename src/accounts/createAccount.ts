// Swap-box
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

import { Wallet } from 'web3x/wallet';
import * as prompt from 'prompt';
import bip39 from 'bip39';

async function main() {

  var properties = [
    {
      name: 'password',
      hidden: true
    }
  ];

  prompt.start();

  prompt.get(properties, await async function (err: any, result: any) {
    if (err) { console.log("Error: ", err); process.exit(1); }

    if (result.password.length < 10){
      console.log('Password too short.  Exiting');
      process.exit(1);
    }

    try {

      var mnemonic = bip39.generateMnemonic()
      const decryptedWallet = await Wallet.fromMnemonic(mnemonic, 1)

      const keystore = await decryptedWallet.encrypt(result.password);


      console.log();
      console.log("---mnemonic phrase start---");
      console.log(mnemonic);
      console.log("---mnemonic phrase end---");
      console.log();

      console.log("---encryptedWallet start SAVE THIS SOMEWHERE (and don't forget your password) !---");
      console.log(JSON.stringify(keystore[0]));
      console.log("---encryptedWallet end ---");
      console.log();

      console.log("---decryptedWallet start---");
      console.log("0x"+decryptedWallet.accounts[0].privateKey.toString('hex'));
      console.log("---decryptedWallet end---");



    } finally {

    }
  });
}

main().catch(console.error);
