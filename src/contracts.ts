import { Address } from "web3x/address";
import { Eth } from "web3x/eth";

import { Atola } from "./contracts/Atola";
import { PriceFeed } from "./contracts/PriceFeed";

import deployed from "../smart-contract/config/local.json";

export const ADDRESS_ATOLA = Address.fromString(deployed.ATOLA);
export const ADDRESS_PRICEFEED = Address.fromString(deployed.PRICEFEED);

export const getAtola = (eth: Eth) => {
  return new Atola(eth, ADDRESS_ATOLA);
};

export const getPriceFeed = (eth: Eth) => {
  return new PriceFeed(eth, ADDRESS_PRICEFEED);
};

export const contractsDeployed = async (eth: Eth) => {
  const isAtolaDeployed = await eth.getCode(ADDRESS_ATOLA) !== "0x";
  const isPriceFeedDeployed = await eth.getCode(ADDRESS_PRICEFEED) !== "0x";
  return isAtolaDeployed && isPriceFeedDeployed;
};
