import BN from "bn.js";
import { Address } from "web3x/address";
import { EventLog, TransactionReceipt } from "web3x/formatters";
import { Contract, ContractOptions, TxCall, TxSend, TxDeploy, EventSubscriptionFactory } from "web3x/contract";
import { Eth } from "web3x/eth";
import abi from "./AtolaAbi";
export type OwnershipTransferredEvent = {
    previousOwner: Address;
    newOwner: Address;
};
export type CryptoPurchaseEvent = {
    customerAddress: Address;
    fiatAmount: string;
    cryptoAmount: string;
};
export type CryptoSaleEvent = {
    customerAddress: Address;
    cryptoAmount: string;
};
export type RefundEvent = {
    customerAddress: Address;
    cryptoAmount: string;
};
export interface OwnershipTransferredEventLog extends EventLog<OwnershipTransferredEvent, "OwnershipTransferred"> {
}
export interface CryptoPurchaseEventLog extends EventLog<CryptoPurchaseEvent, "CryptoPurchase"> {
}
export interface CryptoSaleEventLog extends EventLog<CryptoSaleEvent, "CryptoSale"> {
}
export interface RefundEventLog extends EventLog<RefundEvent, "Refund"> {
}
interface AtolaEvents {
    OwnershipTransferred: EventSubscriptionFactory<OwnershipTransferredEventLog>;
    CryptoPurchase: EventSubscriptionFactory<CryptoPurchaseEventLog>;
    CryptoSale: EventSubscriptionFactory<CryptoSaleEventLog>;
    Refund: EventSubscriptionFactory<RefundEventLog>;
}
interface AtolaEventLogs {
    OwnershipTransferred: OwnershipTransferredEventLog;
    CryptoPurchase: CryptoPurchaseEventLog;
    CryptoSale: CryptoSaleEventLog;
    Refund: RefundEventLog;
}
interface AtolaTxEventLogs {
    OwnershipTransferred: OwnershipTransferredEventLog[];
    CryptoPurchase: CryptoPurchaseEventLog[];
    CryptoSale: CryptoSaleEventLog[];
    Refund: RefundEventLog[];
}
export interface AtolaTransactionReceipt extends TransactionReceipt<AtolaTxEventLogs> {
}
interface AtolaMethods {
    transferOwnership(newOwner: Address): TxSend<AtolaTransactionReceipt>;
    modifyBtm(_newBtmAddress: Address, _state: boolean, _buyFee: number | string | BN, _sellFee: number | string | BN): TxSend<AtolaTransactionReceipt>;
    fiatToEth(_amountFiat: number | string | BN, _tolerance: number | string | BN, _userAddress: Address): TxSend<AtolaTransactionReceipt>;
    fiatToBaseTokens(_amountFiat: number | string | BN, _userAddress: Address): TxSend<AtolaTransactionReceipt>;
    withdrawEth(_amount: number | string | BN): TxSend<AtolaTransactionReceipt>;
    withdrawBaseTokens(_amount: number | string | BN): TxSend<AtolaTransactionReceipt>;
    withdrawTokens(token: Address, _amount: number | string | BN): TxSend<AtolaTransactionReceipt>;
    TokenBalanceAmount(): TxCall<string>;
    EthBalanceAmount(): TxCall<string>;
    refund(_user: Address, _amount: number | string | BN): TxSend<AtolaTransactionReceipt>;
    CryptoToFiat(_user: Address, _amountCrypto: number | string | BN, _tolerance: number | string | BN): TxSend<AtolaTransactionReceipt>;
    AmountForAddress(_user: Address): TxCall<string>;
}
export interface AtolaDefinition {
    methods: AtolaMethods;
    events: AtolaEvents;
    eventLogs: AtolaEventLogs;
}
export class Atola extends Contract<AtolaDefinition> {
    constructor(eth: Eth, address?: Address, options?: ContractOptions) {
        super(eth, abi, address, options);
    }
}
export var AtolaAbi = abi;
