import BN from "bn.js";
import { Address } from "web3x/address";
import { EventLog, TransactionReceipt } from "web3x/formatters";
import { Contract, ContractOptions, TxCall, TxSend, TxDeploy, EventSubscriptionFactory } from "web3x/contract";
import { Eth } from "web3x/eth";
import abi from "./UniswapFactoryAbi";
export type NewExchangeEvent = {
    token: Address;
    exchange: Address;
};
export interface NewExchangeEventLog extends EventLog<NewExchangeEvent, "NewExchange"> {
}
interface UniswapFactoryEvents {
    NewExchange: EventSubscriptionFactory<NewExchangeEventLog>;
}
interface UniswapFactoryEventLogs {
    NewExchange: NewExchangeEventLog;
}
interface UniswapFactoryTxEventLogs {
    NewExchange: NewExchangeEventLog[];
}
export interface UniswapFactoryTransactionReceipt extends TransactionReceipt<UniswapFactoryTxEventLogs> {
}
interface UniswapFactoryMethods {
    initializeFactory(template: Address): TxSend<UniswapFactoryTransactionReceipt>;
    createExchange(token: Address): TxCall<Address>;
    getExchange(token: Address): TxCall<Address>;
    getToken(exchange: Address): TxCall<Address>;
    getTokenWithId(token_id: number | string | BN): TxCall<Address>;
    exchangeTemplate(): TxCall<Address>;
    tokenCount(): TxCall<string>;
}
export interface UniswapFactoryDefinition {
    methods: UniswapFactoryMethods;
    events: UniswapFactoryEvents;
    eventLogs: UniswapFactoryEventLogs;
}
export class UniswapFactory extends Contract<UniswapFactoryDefinition> {
    constructor(eth: Eth, address?: Address, options?: ContractOptions) {
        super(eth, abi, address, options);
    }
}
export var UniswapFactoryAbi = abi;
