import { Eth } from 'web3x/eth';
import { Net } from 'web3x/net';
import { WebsocketProvider } from 'web3x/providers';
import { Wallet } from 'web3x/wallet';
import * as prompt from 'prompt';
import bip39 from 'bip39';
import { config } from '../config';

async function main() {
  // Construct necessary components.
  const provider = new WebsocketProvider(config.websocket_provider.url);
  const eth = new Eth(provider);
  const net = new Net(eth);

  var properties = [
    {
      name: 'mnemonic',
      hidden: false
    }
  ];

  prompt.start();

  prompt.get(properties, await async function (err: any, result: any) {
    if (err) { console.log("Error: ", err); process.exit(1); }


    if (!bip39.validateMnemonic(result.mnemonic)){
      console.log('Invalid mnemonic.  Exiting');
      provider.disconnect();
      process.exit(1);
    }

    try {
      console.log(`Connected to network: ${await net.getNetworkType()}`);
      console.log(`Network Id: ${await eth.getId()}`);
      console.log(`Node info: ${await eth.getNodeInfo()}`);

      // const decryptedAccount = await Account.fromPrivate(result.privateKey);
      const decryptedWallet = await Wallet.fromMnemonic(result.mnemonic, 1)

      console.log()

      // If you want eth to use your accounts for signing transaction, set the wallet.
      eth.wallet = decryptedWallet;

      // Optionally you can specify a default 'from' address.
      eth.defaultFromAddress = decryptedWallet.accounts[0].address;

      console.log("Added account: ", decryptedWallet.accounts[0].address.toString());

    } finally {
      provider.disconnect();
    }
  });
}

main().catch(console.error);
