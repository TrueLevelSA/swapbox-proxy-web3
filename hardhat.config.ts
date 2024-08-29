import { HardhatUserConfig } from "hardhat/config";
import "hardhat-docgen";
import "hardhat-dependency-compiler";
import "hardhat-tracer";
import '@typechain/hardhat'
import '@nomiclabs/hardhat-waffle'
import "hardhat-gas-reporter"
import { env } from "process";

const config: HardhatUserConfig = {
    paths: {
        sources: "./contracts",
        tests: "./test/contracts",
        cache: "./hardhat-cache",
        artifacts: "./hardhat-artifacts"
    },
    docgen: {
        path: './contracts/docs',
        clear: true,
        runOnCompile: true,
    },
    solidity: {
        compilers: [
            {
                version: "0.4.25",
            },
            {
                version: "0.5.16",
            },
            {
                version: "0.6.6",
            },
            {
                version: "0.7.6",
                settings: {
                  optimizer: {
                    enabled: true,
                    runs: 200,
                  },
                },
                dependencyCompilerOptions: {
                  "@openzeppelin/contracts": "3.4.2-solc-0.7",
                },
            },
            {
                version: "0.8.9"
            }
        ],
        overrides: {
          '@uniswap/v3-core/contracts/UniswapV3Factory.sol': {
              version: "0.7.6",
              settings: {
                optimizer: {
                    enabled: true,
                    runs: 200,
                  }
              }
          },
          '@uniswap/v3-core/contracts/UniswapV3Pool.sol': {
              version: "0.7.6"
          },
          '@uniswap/v3-core/contracts/libraries/TickBitmap.sol': {
              version: "0.7.6"
          },
          '@uniswap/v3-core/contracts/libraries/TickMath.sol': {
              version: "0.7.6"
          },
          '@uniswap/v3-periphery/contracts/SwapRouter.sol': {
              version: "0.7.6"
          },
          '@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol': {
              version: "0.7.6"
          },
          '@uniswap/v3-periphery/contracts/NonfungiblePositionManager.sol': {
              version: "0.7.6"
          },
          '@uniswap/v3-periphery/contracts/libraries/ChainId.sol': {
              version: "0.7.6"
          },
          // Repeat for other dependencies
        }
    },
    allowUnlimitedContractSize: true,
    typechain: {
        externalArtifacts: [
            "./node_modules/@uniswap/v2-core/build/!(Combined-Json)*.json",
            "./node_modules/@uniswap/v2-periphery/build/!(Combined-Json|UniswapV1Exchange|UniswapV1Factory)*.json",
            "./node_modules/@uniswap/v3-core/build/!(Combined-Json)*.json",
            "./node_modules/@openzeppelin/contracts/build/contracts/ERC20.json",
            "./node_modules/@openzeppelin/contracts/build/contracts/ERC20PresetMinterPauser.json",
        ],
        outDir: "./src/typechain"
    },
    networks: {
        hardhat: {
            throwOnTransactionFailures: true,
            throwOnCallFailures: true,
            forking: {
                url: "https://eth-mainnet.alchemyapi.io/v2/" + env.SWAPBOX_ALCHEMY_KEY,
            },
            gas: 5000000, //units of gas you are willing to pay, aka gas limit
            gasPrice:  50000000000, //gas is typically in units of gwei, but you must enter it as wei here
        }
    },
    dependencyCompiler: {
        paths: [
            "@uniswap/v2-core/contracts/UniswapV2Factory.sol",
            "@uniswap/v2-core/contracts/UniswapV2Pair.sol",
            "@uniswap/v2-periphery/contracts/UniswapV2Router02.sol",
            "@uniswap/v3-core/contracts/UniswapV3Factory.sol",
            "@uniswap/v3-core/contracts/UniswapV3Pool.sol",
            "@uniswap/v3-periphery/contracts/SwapRouter.sol",
            "@uniswap/v3-periphery/contracts/NonfungiblePositionManager.sol",
            "@uniswap/v3-periphery/contracts/libraries/NFTDescriptor.sol",
            "@uniswap/v3-periphery/contracts/test/MockTimeNonfungiblePositionManager.sol",
            "openzeppelin-4/token/ERC20/ERC20.sol",
            "openzeppelin-4/token/ERC20/presets/ERC20PresetMinterPauser.sol",
        ],
        path: "./deps",
        keep: true
    },
    gasReporter: {
        currency: 'USD',
        L1: "ethereum",
        // coinmarketcap: "abc123...",
    }
};

require("./tasks/add_machine");
require("./tasks/add_token");

export default config;
