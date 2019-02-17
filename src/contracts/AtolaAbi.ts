import { ContractAbi} from 'web3x/contract';
export default new ContractAbi([
  {
    "constant": false,
    "inputs": [
      {
        "name": "token",
        "type": "address"
      },
      {
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "withdrawTokens",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "EthBalanceAmount",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_user",
        "type": "address"
      }
    ],
    "name": "AmountForAddress",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_user",
        "type": "address"
      },
      {
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "refund",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_amountFiat",
        "type": "uint256"
      },
      {
        "name": "_userAddress",
        "type": "address"
      }
    ],
    "name": "FiatToEth",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_user",
        "type": "address"
      },
      {
        "name": "_amountCrypto",
        "type": "uint256"
      }
    ],
    "name": "CryptoToFiat",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "TokenBalanceAmount",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_newBtmAddress",
        "type": "address"
      },
      {
        "name": "_state",
        "type": "bool"
      },
      {
        "name": "_buyFee",
        "type": "uint256"
      },
      {
        "name": "_sellFee",
        "type": "uint256"
      }
    ],
    "name": "modifyBtm",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_amountFiat",
        "type": "uint256"
      },
      {
        "name": "_userAddress",
        "type": "address"
      }
    ],
    "name": "FiatToTokens",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "withdrawBaseTokens",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "withdrawEth",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "name": "_baseCurrency",
        "type": "address"
      },
      {
        "name": "_baseExchange",
        "type": "address"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "payable": true,
    "stateMutability": "payable",
    "type": "fallback"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "customerAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "fiatAmount",
        "type": "uint256"
      }
    ],
    "name": "CryptoBought",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "customerAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "cryptoAmount",
        "type": "uint256"
      }
    ],
    "name": "CryptoSold",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "name": "customerAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "cryptoAmount",
        "type": "uint256"
      }
    ],
    "name": "CancelledRefund",
    "type": "event"
  }
]);