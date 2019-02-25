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
