import { Address } from 'web3x/address';
import { Eth } from 'web3x/eth';
import { Net } from 'web3x/net';
import { WebsocketProvider } from 'web3x/providers';
import { fromWei, toWei, recover, sign, bufferToHex } from 'web3x/utils';

// import { Atola } from './contracts/Atola';
import { UniswapFactory } from './contracts/UniswapFactory';
import { UniswapExchange } from './contracts/UniswapExchange';
import { MkrContract } from './contracts/MkrContract';

import { config } from '../config';
import { ethPrice, tokenPrice } from './calculatePrice';

import { socket } from 'zeromq';

const s = socket('pub')
const r = socket('rep')

const ATOLA_CONTRACT_ADDRESS = Address.fromString('0x2c4bd064b998838076fa341a83d007fc2fa50957'); // not this
const FACTORY_CONTRACT_ADDRESS = Address.fromString('0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95');
const EXCHANGE_CONTRACT_ADDRESS = Address.fromString('0x2c4bd064b998838076fa341a83d007fc2fa50957');
const TOKEN_CONTRACT_ADDRESS = Address.fromString('0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'); //MKR

const OPERATOR_FEE = 0.02;  // 2%

async function getBalances(eth, s, Contract){

      // Simple balance query.
      const balance = await eth.getBalance(EXCHANGE_CONTRACT_ADDRESS);
      if (config.debug) {
        console.log(`Balance of exchange address ETH: ${fromWei(balance, 'ether')}`);
      }

      const tokenBalance = await Contract.methods.balanceOf(EXCHANGE_CONTRACT_ADDRESS).call();
      if (config.debug) {
        console.log(`Balance of exchange address Token: ${fromWei(tokenBalance, 'ether')}`);
      }

      const price = ethPrice(balance, tokenBalance, 1);
      const sellPrice = (1 - OPERATOR_FEE) / price;
      const buyPrice = (1 + OPERATOR_FEE) / price;

      if (config.debug) {
        console.log("Price:");
        console.log(price);
      }

      s.send(['priceticker', JSON.stringify({buy_price: buyPrice, sell_price: sellPrice})])
}

async function processBuyETHOrder(eth, Contract, amount, address){

      const fiatToEth = await Contract.methods.FiatToEth(toWei(amount, 'ether'), Address.fromString(address)).call();
      if (config.debug) {
        console.log(`fiatToEth: ${fiatToEth}`);
      }
      return true;
}


async function main() {
  // Construct necessary components.
  const provider = new WebsocketProvider(config.websocket_provider.url);
  const eth = new Eth(provider);
  const net = new Net(eth);

  const infuraProvider = new WebsocketProvider(config.websocket_alt_provider.url);
  const infuraeth = new Eth(provider);
  const infuranet = new Net(eth);

  try {
    console.log(`Connected to network: ${await net.getNetworkType()}`);
    console.log(`Network Id: ${await eth.getId()}`);
    console.log(`Node info: ${await eth.getNodeInfo()}`);

    // Use our type safe auto generated contract.
    //const uniswapExchangeContract = new UniswapExchange(eth, EXCHANGE_CONTRACT_ADDRESS);
    // const OperatorContract = new Atola(eth, ATOLA_CONTRACT_ADDRESS);
    const FactoryContract = new UniswapFactory(infuraeth, FACTORY_CONTRACT_ADDRESS);
    const TokenContract = new MkrContract(infuraeth, TOKEN_CONTRACT_ADDRESS);

    //zmq publisher
    s.bindSync(config.zmq.url);
    //zmq responder
    r.bindSync(config.zmq.responder_url);

    r.on('message', async function(request) {
      console.log("Received request: [", request.toString(), "]");

      // do some 'work'
      // const success = await processBuyETHOrder(eth, OperatorContract, 10, "address");
      r.send('success');
    });
    // get balances on launch
    await getBalances(eth, s, TokenContract);

    // subscribe to latest block (hopefully faster for price ticker)
    eth.subscribe('newBlockHeaders', {}, (error, result) => {
      if (!error) {
        console.log("new block: ", result);
      }
    })
    .on("data", (log) => {
        if (config.debug) {
          console.log("New Block: ", bufferToHex(log.hash));
        }
        getBalances(eth, s, TokenContract);
    })

    // subscribe to transfer events on token contract (slow)
    const subscription = await eth.subscribe('logs', {
        address: EXCHANGE_CONTRACT_ADDRESS,
        topics: [] // [web3.sha3('EthPurchase(address,uint256,uint256)'), ATOLA_CONTRACT_ADDRESS]  // filter for buyer
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

        // fiat->crypto "buyer" is always atola contract for UniswapExcahange Logs
        //

        // TokenPurchase: event({buyer: indexed(address), eth_sold: indexed(uint256(wei)), tokens_bought: indexed(uint256)})
        // EthPurchase: event({buyer: indexed(address), tokens_sold: indexed(uint256), eth_bought: indexed(uint256(wei))})

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
