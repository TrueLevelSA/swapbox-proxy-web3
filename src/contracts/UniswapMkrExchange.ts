import BN from "bn.js";
import { Address } from "web3x/address";
import { EventLog, TransactionReceipt } from "web3x/formatters";
import { Contract, ContractOptions, TxCall, TxSend, TxDeploy, EventSubscriptionFactory } from "web3x/contract";
import { Eth } from "web3x/eth";
import abi from "./UniswapMkrExchangeAbi";
export type TokenPurchaseEvent = {
    buyer: Address;
    eth_sold: string;
    tokens_bought: string;
};
export type EthPurchaseEvent = {
    buyer: Address;
    tokens_sold: string;
    eth_bought: string;
};
export type AddLiquidityEvent = {
    provider: Address;
    eth_amount: string;
    token_amount: string;
};
export type RemoveLiquidityEvent = {
    provider: Address;
    eth_amount: string;
    token_amount: string;
};
export type TransferEvent = {
    _from: Address;
    _to: Address;
    _value: string;
};
export type ApprovalEvent = {
    _owner: Address;
    _spender: Address;
    _value: string;
};
export interface TokenPurchaseEventLog extends EventLog<TokenPurchaseEvent, "TokenPurchase"> {
}
export interface EthPurchaseEventLog extends EventLog<EthPurchaseEvent, "EthPurchase"> {
}
export interface AddLiquidityEventLog extends EventLog<AddLiquidityEvent, "AddLiquidity"> {
}
export interface RemoveLiquidityEventLog extends EventLog<RemoveLiquidityEvent, "RemoveLiquidity"> {
}
export interface TransferEventLog extends EventLog<TransferEvent, "Transfer"> {
}
export interface ApprovalEventLog extends EventLog<ApprovalEvent, "Approval"> {
}
interface UniswapMkrExchangeEvents {
    TokenPurchase: EventSubscriptionFactory<TokenPurchaseEventLog>;
    EthPurchase: EventSubscriptionFactory<EthPurchaseEventLog>;
    AddLiquidity: EventSubscriptionFactory<AddLiquidityEventLog>;
    RemoveLiquidity: EventSubscriptionFactory<RemoveLiquidityEventLog>;
    Transfer: EventSubscriptionFactory<TransferEventLog>;
    Approval: EventSubscriptionFactory<ApprovalEventLog>;
}
interface UniswapMkrExchangeEventLogs {
    TokenPurchase: TokenPurchaseEventLog;
    EthPurchase: EthPurchaseEventLog;
    AddLiquidity: AddLiquidityEventLog;
    RemoveLiquidity: RemoveLiquidityEventLog;
    Transfer: TransferEventLog;
    Approval: ApprovalEventLog;
}
interface UniswapMkrExchangeTxEventLogs {
    TokenPurchase: TokenPurchaseEventLog[];
    EthPurchase: EthPurchaseEventLog[];
    AddLiquidity: AddLiquidityEventLog[];
    RemoveLiquidity: RemoveLiquidityEventLog[];
    Transfer: TransferEventLog[];
    Approval: ApprovalEventLog[];
}
export interface UniswapMkrExchangeTransactionReceipt extends TransactionReceipt<UniswapMkrExchangeTxEventLogs> {
}
interface UniswapMkrExchangeMethods {
    setup(token_addr: Address): TxSend<UniswapMkrExchangeTransactionReceipt>;
    addLiquidity(min_liquidity: number | string | BN, max_tokens: number | string | BN, deadline: number | string | BN): TxCall<string>;
    removeLiquidity(amount: number | string | BN, min_eth: number | string | BN, min_tokens: number | string | BN, deadline: number | string | BN): TxCall<[string, string]>;
    __default__(): TxSend<UniswapMkrExchangeTransactionReceipt>;
    ethToTokenSwapInput(min_tokens: number | string | BN, deadline: number | string | BN): TxCall<string>;
    ethToTokenTransferInput(min_tokens: number | string | BN, deadline: number | string | BN, recipient: Address): TxCall<string>;
    ethToTokenSwapOutput(tokens_bought: number | string | BN, deadline: number | string | BN): TxCall<string>;
    ethToTokenTransferOutput(tokens_bought: number | string | BN, deadline: number | string | BN, recipient: Address): TxCall<string>;
    tokenToEthSwapInput(tokens_sold: number | string | BN, min_eth: number | string | BN, deadline: number | string | BN): TxCall<string>;
    tokenToEthTransferInput(tokens_sold: number | string | BN, min_eth: number | string | BN, deadline: number | string | BN, recipient: Address): TxCall<string>;
    tokenToEthSwapOutput(eth_bought: number | string | BN, max_tokens: number | string | BN, deadline: number | string | BN): TxCall<string>;
    tokenToEthTransferOutput(eth_bought: number | string | BN, max_tokens: number | string | BN, deadline: number | string | BN, recipient: Address): TxCall<string>;
    tokenToTokenSwapInput(tokens_sold: number | string | BN, min_tokens_bought: number | string | BN, min_eth_bought: number | string | BN, deadline: number | string | BN, token_addr: Address): TxCall<string>;
    tokenToTokenTransferInput(tokens_sold: number | string | BN, min_tokens_bought: number | string | BN, min_eth_bought: number | string | BN, deadline: number | string | BN, recipient: Address, token_addr: Address): TxCall<string>;
    tokenToTokenSwapOutput(tokens_bought: number | string | BN, max_tokens_sold: number | string | BN, max_eth_sold: number | string | BN, deadline: number | string | BN, token_addr: Address): TxCall<string>;
    tokenToTokenTransferOutput(tokens_bought: number | string | BN, max_tokens_sold: number | string | BN, max_eth_sold: number | string | BN, deadline: number | string | BN, recipient: Address, token_addr: Address): TxCall<string>;
    tokenToExchangeSwapInput(tokens_sold: number | string | BN, min_tokens_bought: number | string | BN, min_eth_bought: number | string | BN, deadline: number | string | BN, exchange_addr: Address): TxCall<string>;
    tokenToExchangeTransferInput(tokens_sold: number | string | BN, min_tokens_bought: number | string | BN, min_eth_bought: number | string | BN, deadline: number | string | BN, recipient: Address, exchange_addr: Address): TxCall<string>;
    tokenToExchangeSwapOutput(tokens_bought: number | string | BN, max_tokens_sold: number | string | BN, max_eth_sold: number | string | BN, deadline: number | string | BN, exchange_addr: Address): TxCall<string>;
    tokenToExchangeTransferOutput(tokens_bought: number | string | BN, max_tokens_sold: number | string | BN, max_eth_sold: number | string | BN, deadline: number | string | BN, recipient: Address, exchange_addr: Address): TxCall<string>;
    getEthToTokenInputPrice(eth_sold: number | string | BN): TxCall<string>;
    getEthToTokenOutputPrice(tokens_bought: number | string | BN): TxCall<string>;
    getTokenToEthInputPrice(tokens_sold: number | string | BN): TxCall<string>;
    getTokenToEthOutputPrice(eth_bought: number | string | BN): TxCall<string>;
    tokenAddress(): TxCall<Address>;
    factoryAddress(): TxCall<Address>;
    balanceOf(_owner: Address): TxCall<string>;
    transfer(_to: Address, _value: number | string | BN): TxCall<boolean>;
    transferFrom(_from: Address, _to: Address, _value: number | string | BN): TxCall<boolean>;
    approve(_spender: Address, _value: number | string | BN): TxCall<boolean>;
    allowance(_owner: Address, _spender: Address): TxCall<string>;
    name(): TxCall<string>;
    symbol(): TxCall<string>;
    decimals(): TxCall<string>;
    totalSupply(): TxCall<string>;
}
export interface UniswapMkrExchangeDefinition {
    methods: UniswapMkrExchangeMethods;
    events: UniswapMkrExchangeEvents;
    eventLogs: UniswapMkrExchangeEventLogs;
}
export class UniswapMkrExchange extends Contract<UniswapMkrExchangeDefinition> {
    constructor(eth: Eth, address?: Address, options?: ContractOptions) {
        super(eth, abi, address, options);
    }
}
export var UniswapMkrExchangeAbi = abi;
