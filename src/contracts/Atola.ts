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
export type CryptoBoughtEvent = {
    customerAddress: Address;
    fiatAmount: string;
};
export type CryptoSoldEvent = {
    customerAddress: Address;
    cryptoAmount: string;
};
export type CancelledRefundEvent = {
    customerAddress: Address;
    cryptoAmount: string;
};
export interface OwnershipTransferredEventLog extends EventLog<OwnershipTransferredEvent, "OwnershipTransferred"> {
}
export interface CryptoBoughtEventLog extends EventLog<CryptoBoughtEvent, "CryptoBought"> {
}
export interface CryptoSoldEventLog extends EventLog<CryptoSoldEvent, "CryptoSold"> {
}
export interface CancelledRefundEventLog extends EventLog<CancelledRefundEvent, "CancelledRefund"> {
}
interface AtolaEvents {
    OwnershipTransferred: EventSubscriptionFactory<OwnershipTransferredEventLog>;
    CryptoBought: EventSubscriptionFactory<CryptoBoughtEventLog>;
    CryptoSold: EventSubscriptionFactory<CryptoSoldEventLog>;
    CancelledRefund: EventSubscriptionFactory<CancelledRefundEventLog>;
}
interface AtolaEventLogs {
    OwnershipTransferred: OwnershipTransferredEventLog;
    CryptoBought: CryptoBoughtEventLog;
    CryptoSold: CryptoSoldEventLog;
    CancelledRefund: CancelledRefundEventLog;
}
interface AtolaTxEventLogs {
    OwnershipTransferred: OwnershipTransferredEventLog[];
    CryptoBought: CryptoBoughtEventLog[];
    CryptoSold: CryptoSoldEventLog[];
    CancelledRefund: CancelledRefundEventLog[];
}
export interface AtolaTransactionReceipt extends TransactionReceipt<AtolaTxEventLogs> {
}
interface AtolaMethods {
    withdrawTokens(token: Address, _amount: number | string | BN): TxSend<AtolaTransactionReceipt>;
    EthBalanceAmount(): TxCall<string>;
    AmountForAddress(_user: Address): TxCall<string>;
    refund(_user: Address, _amount: number | string | BN): TxSend<AtolaTransactionReceipt>;
    FiatToEth(_amountFiat: number | string | BN, _userAddress: Address): TxSend<AtolaTransactionReceipt>;
    CryptoToFiat(_user: Address, _amountCrypto: number | string | BN): TxSend<AtolaTransactionReceipt>;
    TokenBalanceAmount(): TxCall<string>;
    modifyBtm(_newBtmAddress: Address, _state: boolean, _buyFee: number | string | BN, _sellFee: number | string | BN): TxSend<AtolaTransactionReceipt>;
    FiatToTokens(_amountFiat: number | string | BN, _userAddress: Address): TxSend<AtolaTransactionReceipt>;
    withdrawBaseTokens(_amount: number | string | BN): TxSend<AtolaTransactionReceipt>;
    withdrawEth(_amount: number | string | BN): TxSend<AtolaTransactionReceipt>;
    transferOwnership(newOwner: Address): TxSend<AtolaTransactionReceipt>;
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
