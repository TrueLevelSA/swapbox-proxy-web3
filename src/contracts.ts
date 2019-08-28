import { readFileSync } from "fs";
import { Address } from "web3x/address";
import { Eth } from "web3x/eth";

import { Atola } from "./contracts/Atola";
import { PriceFeed } from "./contracts/PriceFeed";

import * as config from "../config.json";

interface IDeployedAddresses {
  XCHF: string;
  UNISWAP_FACTORY: string;
  XCHF_EXCHANGE: string;
  ATOLA: string;
  PRICEFEED: string;
}

export class Contracts {
  private static readonly EMPTY_BYTECODE = "0x";

  public readonly ADDRESS_ATOLA: Address;
  public readonly ADDRESS_PRICEFEED: Address;

  private chain: string;

  constructor(private eth: Eth) {
    this.chain = config.chain;

    const path = "./smart-contract/config/" + this.chain + ".json";
    const deployed: IDeployedAddresses = JSON.parse(readFileSync(path, "utf8"));

    this.ADDRESS_ATOLA = Address.fromString(deployed.ATOLA);
    this.ADDRESS_PRICEFEED = Address.fromString(deployed.PRICEFEED);
  }

  public atola = () => {
    return new Atola(this.eth, this.ADDRESS_ATOLA);
  }

  public priceFeed = () => {
    return new PriceFeed(this.eth, this.ADDRESS_PRICEFEED);
  }

  public contractsDeployed = async () => {
    const isAtolaDeployed = await this.eth.getCode(this.ADDRESS_ATOLA) !== Contracts.EMPTY_BYTECODE;
    const isPriceFeedDeployed = await this.eth.getCode(this.ADDRESS_PRICEFEED) !== Contracts.EMPTY_BYTECODE;
    return isAtolaDeployed && isPriceFeedDeployed;
  }
}
