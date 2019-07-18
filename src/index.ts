import { Address } from 'web3x/address';
import { Eth } from 'web3x/eth';
import { Wallet } from 'web3x/wallet';
import { Subscription } from 'web3x/subscriptions';
import { Net } from 'web3x/net';
import { WebsocketProvider } from 'web3x/providers';
import { fromWei, toWei, recover, sign, bufferToHex, toBN } from 'web3x/utils';
import { BlockHeaderResponse } from 'web3x/formatters';

import BN from 'bn.js';

import { Atola } from './contracts/Atola';
import { UniswapFactory } from './contracts/UniswapFactory';
import { UniswapExchange } from './contracts/UniswapExchange';
import { ERC20TokenContract } from './contracts/ERC20TokenContract';
import { PriceFeed } from './contracts/PriceFeed';

import { config } from '../config';
import { ethPrice, tokenPrice } from './calculatePrice';

import { socket } from 'zeromq';

const s = socket('pub')
const r = socket('rep')

const PRICEFEED_CONTRACT_ADDRESS = Address.fromString('0xD3D3Ecd86d2797De529f2044E949aaE87E9815dE')
const ATOLA_CONTRACT_ADDRESS = Address.fromString('0x2c4bd064b998838076fa341a83d007fc2fa50957'); // not this
const FACTORY_CONTRACT_ADDRESS = Address.fromString('0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95');
const EXCHANGE_CONTRACT_ADDRESS = Address.fromString('0x2c4bd064b998838076fa341a83d007fc2fa50957');
const TOKEN_CONTRACT_ADDRESS = Address.fromString('0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2'); //MKR

// 2%  TO-DO look this up in smart contract
const OPERATOR_FEE = new BN(toWei('0.02', 'ether'));

const getBalances = async (priceFeed: PriceFeed) => {

  const balances = await priceFeed.methods.getBalances().call();

  // "unpack" smart contract response
  const addresses = balances[0].map(address => address.toString());
  const tokenBalances = balances[1].map(tokenBalance => new BN(tokenBalance));
  const ethBalances = balances[2].map(ethBalance => new BN(ethBalance));

  // show balances
  if(config.debug){
    [...Array(addresses.length).keys()].forEach(key => {
      console.log(`Token ${key}`);
      console.log(`  ExchangeAddress: ${addresses[key]}`);
      console.log(`  Token Balance:   ${fromWei(tokenBalances[key], 'ether')}`);
      console.log(`  ETH Balance:     ${fromWei(ethBalances[key], 'ether')}`);
    })
  }

  // sending only baseToken price (which is the first token in the list)
  const outputAmount = toWei(new BN(1), 'ether').divn(2);
  const price = ethPrice(ethBalances[0], tokenBalances[0], outputAmount);
  const sellPrice = outputAmount.sub(OPERATOR_FEE).div(price);
  const buyPrice = outputAmount.add(OPERATOR_FEE).div(price);

  if (config.debug) {
    console.log("Price:");
    console.log(`  exchange:   ${fromWei(price, 'ether')}`);
    console.log(`  atola buy:  ${fromWei(sellPrice, 'ether')}`);
    console.log(`  atola sell: ${fromWei(buyPrice, 'ether')}`);
  }

  // send through zmq
  // s.send(['priceticker', JSON.stringify({buy_price: buyPrice, sell_price: sellPrice})])
}

async function processBuyETHOrder(wallet: Wallet, Contract: Atola, amount: number, address: string){

      // const gasEstimate = await Contract.methods
      //               .FiatToEth(toWei(amount, 'ether'), Address.fromString(address))
      //               .estimateGas();

      // TO-DO: Get sensible gas price estimate
      const gasPrice = 20 * 1000000000;

      // Optionally you can specify a default 'from' address.
      const from = wallet.accounts[0].address;


      const fiatToEth = await Contract.methods
                        .fiatToEth(toWei(toBN(amount), 'ether'), 0, Address.fromString(address))
                        .send({ from }) // , gasPrice
                        .getReceipt();

      if (config.debug) {
        console.log(`fiatToEth: ${fiatToEth}`);
      }
      return true;
}

async function processSellETHOrder(wallet: Wallet, Contract: Atola, amount: number, address: string){

      // const gasEstimate = await Contract.methods
      //               .FiatToEth(toWei(amount, 'ether'), Address.fromString(address))
      //               .estimateGas();

      // TO-DO: Get sensible gas price estimate
      const gasPrice = 20 * 1000000000;

      // Optionally you can specify a default 'from' address.
      const from = wallet.accounts[0].address;

      const ethToFiat = await Contract.methods
                        .ethToFiat(Address.fromString(address), toWei(toBN(amount), 'ether'))
                        .send({ from }) // , gasPrice
                        .getReceipt();

      if (config.debug) {
        console.log(`ethToFiat: ${ethToFiat}`);
      }
      return true;
}

async function main() {
  // Construct necessary components.
  const provider = new WebsocketProvider(config.websocket_provider.url);
  const eth = new Eth(provider);
  const net = new Net(eth);

  let subNewHeads: Subscription;

  if (config.debug) {
    console.log(`Connected to network: ${await net.getNetworkType()}`);
    console.log(`Network Id: ${await eth.getId()}`);
    console.log(`Node info: ${await eth.getNodeInfo()}`);
  }

  const atola = new Atola(eth, ATOLA_CONTRACT_ADDRESS);
  const factory = new UniswapFactory(eth, FACTORY_CONTRACT_ADDRESS);
  const exchange = new UniswapFactory(eth, EXCHANGE_CONTRACT_ADDRESS);
  const baseToken = new ERC20TokenContract(eth, TOKEN_CONTRACT_ADDRESS);
  const priceFeed = new PriceFeed(eth, PRICEFEED_CONTRACT_ADDRESS);

  // //zmq publisher
  // s.bindSync(config.zmq.url);
  // //zmq responder
  // r.bindSync(config.zmq.responder_url);
  //
  // r.on('message', async function(request) {
  //   console.log("Received request: [", request.toString(), "]");
  //   const message = JSON.parse(request.toString())
  //   // do some 'work'
  //   if (message.method == "buy"){
  //     if(eth.wallet){
  //       const success = await processBuyETHOrder(eth.wallet, OperatorContract, message.amount, message.address);
  //     } else {
  //       console.error('eth.wallet is not set');
  //     }
  //     r.send('success');
  //   } else if (message.method == "sell") {
  //     // Need to make a function for startSell (listen for ethrecieved event)
  //
  //     // Call this function when we get the EthRecieved event
  //     // const success = await processSellETHOrder(eth, OperatorContract, message.amount, message.address);
  //     r.send('success');
  //   } else {
  //     r.send('invalid method');
  //   }
  //
  // });

  await getBalances(priceFeed);

  subNewHeads = eth.subscribe('newBlockHeaders').on('data', (blockHeader: BlockHeaderResponse) => {
    if (config.debug) {
      if (blockHeader.hash) {
        console.log("New Block: ", bufferToHex(blockHeader.hash));
      }
    }
    getBalances(priceFeed);
  }).on('error', console.error);

  // Use our type safe auto generated contract.
  //const uniswapExchangeContract = new UniswapExchange(eth, EXCHANGE_CONTRACT_ADDRESS);

  // get balances on launch

  // subscribe to latest block (hopefully faster for price ticker)

  // subNewHeads.unsubscribe();
  //
  // // subscribe to transfer events on token contract (slow)
  // const subscription = await eth.subscribe('logs', {
  //     address: EXCHANGE_CONTRACT_ADDRESS,
  //     topics: [] // [web3.sha3('EthPurchase(address,uint256,uint256)'), ATOLA_CONTRACT_ADDRESS]  // filter for buyer
  // }).on("data", (log: any) => {
  //   if (config.debug) {
  //     console.log(log);
  // }

    // fiat->crypto "buyer" is always atola contract for UniswapExcahange Logs
    //

    // TokenPurchase: event({buyer: indexed(address), eth_sold: indexed(uint256(wei)), tokens_bought: indexed(uint256)})
    // EthPurchase: event({buyer: indexed(address), tokens_sold: indexed(uint256), eth_bought: indexed(uint256(wei))})

    //either add transfer listening here or listen to events on Atola contract instead?
  // }).on("changed", (log: any) => {
  //   console.log("changed .....do something !!");
  //   console.log(log);
  // });
}

main().catch(console.error);
