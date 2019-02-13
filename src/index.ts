import { Address } from 'web3x/address';
import { Eth } from 'web3x/eth';
import { Net } from 'web3x/net';
import { WebsocketProvider } from 'web3x/providers';
import { fromWei, recover, sign } from 'web3x/utils';
import { UniswapMkrExchange } from './contracts/UniswapMkrExchange';
import { MkrContract } from './contracts/MkrContract';

import { config } from '../config';
import { ethPrice, tokenPrice } from './calculatePrice';

import { socket } from 'zeromq';

const s = socket('pub')

const EXCHANGE_CONTRACT_ADDRESS = Address.fromString('0x2c4bd064b998838076fa341a83d007fc2fa50957');
const TOKEN_CONTRACT_ADDRESS = Address.fromString('0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'); //MKR

async function getBalances(eth, s, MkrContract){

      // Simple balance query.
      const balance = await eth.getBalance(EXCHANGE_CONTRACT_ADDRESS);
      console.log(`Balance of 0 address ETH: ${fromWei(balance, 'ether')}`);

      const tokenBalance = await MkrContract.methods.balanceOf(EXCHANGE_CONTRACT_ADDRESS).call();
      console.log(`Balance of exchange address MKR: ${fromWei(tokenBalance, 'ether')}`);

      const price = ethPrice(balance, tokenBalance, 1);
      console.log("THE PRICe");
      console.log(price);

      const tokenprice = tokenPrice(balance, tokenBalance, 1);
      console.log("TOKEN PRICE");
      console.log(tokenprice);
      s.send(price)
}

async function main() {
  // Construct necessary components.
  const provider = new WebsocketProvider(config.websocket_provider.url);
  const eth = new Eth(provider);
  const net = new Net(eth);

  try {
    console.log(`Connected to network: ${await net.getNetworkType()}`);
    console.log(`Network Id: ${await eth.getId()}`);
    console.log(`Node info: ${await eth.getNodeInfo()}`);

    // Use our type safe auto generated contract.
    //const uniswapExchangeContract = new UniswapMkrExchange(eth, EXCHANGE_CONTRACT_ADDRESS);
    const MkrContract = new UniswapMkrExchange(eth, TOKEN_CONTRACT_ADDRESS);

    //zmq publisher
    s.bindSync(config.zmq.url);

    // get balances on launch
    await getBalances(eth, s, MkrContract);

    const subscription = await eth.subscribe('logs', {
        address: EXCHANGE_CONTRACT_ADDRESS,
        topics: []
    }, (error, result) => {
        if (!error) {
          console.log("result (shouldnt end up here)");
            console.log(result);
        }

        console.error(error);
    })
    .on("data", (log) => {
        if (config.debug) {
          console.log(log);
        }
        getBalances(eth, s, MkrContract);

        //either add transfer listening here or listen to events on Atola contract instead?
    })
    .on("changed", (log) => {
      console.log("changed .....do something !!");
        console.log(log);
    });

  } finally {
    //provider.disconnect();
  }
}

main().catch(console.error);
