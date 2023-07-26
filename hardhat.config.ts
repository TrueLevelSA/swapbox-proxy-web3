import { HardhatUserConfig } from "hardhat/config";
import "hardhat-docgen";
import "hardhat-dependency-compiler";
import "hardhat-tracer";
import '@typechain/hardhat'
import '@nomiclabs/hardhat-waffle'
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
                version: "0.8.9"
            }
        ],
    },
    typechain: {
        externalArtifacts: [
            "./node_modules/@uniswap/v2-core/build/!(Combined-Json)*.json",
            "./node_modules/@uniswap/v2-periphery/build/!(Combined-Json|UniswapV1Exchange|UniswapV1Factory)*.json",
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
            }
        }
    },
    dependencyCompiler: {
        paths: [
            "@uniswap/v2-core/contracts/UniswapV2Factory.sol",
            "@uniswap/v2-core/contracts/UniswapV2Pair.sol",
            "@uniswap/v2-periphery/contracts/UniswapV2Router02.sol",
            "@openzeppelin/contracts/token/ERC20/ERC20.sol",
            "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol",
        ],
        path: "./deps",
        keep: true
    }
};

export default config;
