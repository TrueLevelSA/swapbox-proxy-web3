// @ts-ignore
import { ethers } from "hardhat";
import { SwapboxUniswapV2__factory, PriceFeed__factory } from "../src/typechain";

const override = {
    gasLimit: 9999999
}

async function main() {
    const [deployer] = await ethers.getSigners();

    // That's mainnet addresses.
    // const baseToken = "0xb4272071ecadd69d933adcd19ca99fe80664fc08"; // XCHF
    const baseToken = "0xdac17f958d2ee523a2206206994597c13d831ec7"; // USDT
    const wethToken = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    const factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    const router = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    const swapboxFactory = new SwapboxUniswapV2__factory(deployer);
    const pricefeedFactory = new PriceFeed__factory(deployer);

    const swapbox = await swapboxFactory.deploy(
        baseToken,
        wethToken,
        factory,
        router,
        override
    );
    await swapbox.deployTransaction.wait();
    console.log(`Deployed Swapbox at: ${swapbox.address}`);

    await swapbox.addToken(wethToken, override);
    console.log(`Added token: ${wethToken}`);

    // get some basetoken for testing
    const usdt_signer = await ethers.getImpersonatedSigner("0x5754284f345afc66a98fbB0a0Afe71e0F007B949");
    const amount = ethers.utils.parseUnits("1000", 6); // USDT typically has 6 decimals
    const usdtAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7";
    const usdtABI = ["function transfer(address to, uint amount) returns (bool)"];
    const usdtContract = new ethers.Contract(usdtAddress, usdtABI, usdt_signer);

    await usdtContract.transfer(swapbox.address, amount);
    console.log(`Transferred ${amount} USDT to ${swapbox.address}`);

    const pricefeed = await pricefeedFactory.deploy(
        swapbox.address,
        factory,
        override
    );
    await pricefeed.deployTransaction.wait();
    console.log(`Deployed PriceFeed at: ${pricefeed.address}`);
}

process.on('unhandledRejection', e => console.error(e));

main().then();
