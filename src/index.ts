import BN from "bn.js";

import { Address } from "web3x/address";
import { Eth } from "web3x/eth";
import { BlockHeaderResponse } from "web3x/formatters";
import { Net } from "web3x/net";
import { WebsocketProvider } from "web3x/providers";
import { bufferToHex, toWei } from "web3x/utils";

import { Atola } from "./contracts/Atola";
import { PriceFeed } from "./contracts/PriceFeed";

import { processBuyEthOrder } from "./processing/orders";
import { fetchPrice } from "./processing/price";
import { Zmq } from "./zmq";

import { config } from "../config";
import deployed from "../smart-contract/config/local.json";

const PRICEFEED_CONTRACT_ADDRESS = Address.fromString(deployed.PRICEFEED);
const ATOLA_CONTRACT_ADDRESS = Address.fromString(deployed.ATOLA);

/**
 * Fetch new price and send them through zmq.
 *
 * @param priceFeed PriceFeed contract instance
 * @param zmq       Zmq instance
 */
const updatePriceticker = async (priceFeed: PriceFeed, zmq: Zmq) => {
  const reserves = await priceFeed.methods.getReserves().call();
  zmq.updatePriceticker(new BN(reserves[0]), new BN(reserves[1]));
};

async function main() {
  // Initialization
  const provider = new WebsocketProvider(config.websocket_provider.url);
  const eth = new Eth(provider);
  const net = new Net(eth);

  const accounts = await eth.getAccounts();

  if (config.debug) {
    console.log(`Connected to network: ${await net.getNetworkType()}`);
    console.log(`Network Id: ${await eth.getId()}`);
    console.log(`Node info: ${await eth.getNodeInfo()}`);
  }

  const atola = new Atola(eth, ATOLA_CONTRACT_ADDRESS);
  const priceFeed = new PriceFeed(eth, PRICEFEED_CONTRACT_ADDRESS);
  const machineAddress = accounts[2];
  const userAddress = accounts[3];

  const zmq = new Zmq(
    config.zmq.url,
    config.zmq.responder_url,
    atola,
    machineAddress,
  );
  // Set up price ticker
  updatePriceticker(priceFeed, zmq);
  const subNewHeads = eth.subscribe("newBlockHeaders").on("data", async (blockHeader: BlockHeaderResponse) => {
    if (config.debug) {
      if (blockHeader.hash) {
        console.log("New Block: ", bufferToHex(blockHeader.hash));
      }
    }
    updatePriceticker(priceFeed, zmq);
  }).on("error", console.error);

  // Use our type safe auto generated contract.
  // const uniswapExchangeContract = new UniswapExchange(eth, EXCHANGE_CONTRACT_ADDRESS);

  // get balances on launch

  // subscribe to latest block (hopefully faster for price ticker)

  // subNewHeads.unsubscribe();u
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

  // either add transfer listening here or listen to events on Atola contract instead?
  // }).on("changed", (log: any) => {
  //   console.log("changed .....do something !!");
  //   console.log(log);
  // });
}

main().catch(console.error);
