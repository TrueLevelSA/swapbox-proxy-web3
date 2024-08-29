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
    const usdtToken = "0xdac17f958d2ee523a2206206994597c13d831ec7"; // USDT
    const wethToken = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    const daiToken = "0x6b175474e89094c44da98b954eedeac495271d0f";
    const usdcToken = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    const wBTCToken = "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599";
    const hezToken = "0xeef9f339514298c6a857efcfc1a762af84438dee"; // hermez
    const factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
    const router = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

    // v3 paths
    const wBTCpath = ethers.utils.solidityPack(
    ["address", "uint24", "address", "uint24", "address"],
    [usdcToken, "3000", wethToken, "3000", wBTCToken]);

    const hezpath = ethers.utils.solidityPack(
    ["address", "uint24", "address", "uint24", "address"],
    [usdcToken, "3000", wethToken, "3000", hezToken]);

    // const wETHpath = ethers.utils.solidityPack(
    // ["address", "uint24", "address"],
    // [usdcToken, "3000", wethToken]);

    // const daipath = ethers.utils.solidityPack(
    // ["address", "uint24", "address"],
    // [usdcToken, "3000", daiToken]);


    const swapboxFactory = new SwapboxUniswapV2__factory(deployer);
    const pricefeedFactory = new PriceFeed__factory(deployer);

    const swapbox = await swapboxFactory.deploy(
        usdcToken,
        wethToken,
        factory,
        router,
        override
    );
    await swapbox.deployTransaction.wait();

    console.log(`Deployed Swapbox at: ${swapbox.address}`);

    const emptyBytes = ethers.utils.formatBytes32String("");

    // add WETH token
    await swapbox.addToken(wethToken, emptyBytes, override);
    console.log(`Added token: ${wethToken}`);

    // add USDT token
    await swapbox.addToken(usdtToken, emptyBytes, override);
    console.log(`Added token: ${usdtToken}`);

    // add DAI token
    await swapbox.addToken(daiToken, emptyBytes, override);
    console.log(`Added token: ${daiToken}`);

    // add USDC token
    await swapbox.addToken(usdcToken, emptyBytes, override);
    console.log(`Added token: ${usdcToken}`);

    // add tBTC token
    await swapbox.addToken(wBTCToken, wBTCpath, override);
    console.log(`Added token: ${wBTCToken} w/ custom path:`);
    console.log(wBTCpath);
    // set path for WBTC (base -> WETH -> WBTC)
    // await swapbox.updatePath([usdcToken, wethToken, wBTCToken]);
    // console.log(`Set token path: ${[daiToken, wethToken, wBTCToken]}`);
    // await swapbox.updatePath2(wBTCToken, wBTCpath);
    // console.log(`Set token path: ${[wethToken, wBTCToken]} == ${wBTCpath}`);


    // add HEZ (no direct USDC pair)
    await swapbox.addToken(hezToken, hezpath, override);
    console.log(`Added token: ${hezToken}`);

    // get some USDT basetoken for testing
    const usdt_signer = await ethers.getImpersonatedSigner("0x5754284f345afc66a98fbB0a0Afe71e0F007B949");
    const usdtAmount = ethers.utils.parseUnits("1000", 6); // USDT has 6 decimals
    const erc20ABI = ["function transfer(address to, uint amount) returns (bool)"];
    const usdtContract = new ethers.Contract(usdtToken, erc20ABI, usdt_signer);

    await usdtContract.transfer(swapbox.address, usdtAmount);
    console.log(`Transferred ${usdtAmount} USDT to ${swapbox.address}`);

    // get some USDC basetoken for testing
    const usdc_signer = await ethers.getImpersonatedSigner("0xd6153f5af5679a75cc85d8974463545181f48772");
    const usdcAmount = ethers.utils.parseUnits("1000", 6); // USDC has 6 decimals
    const usdcContract = new ethers.Contract(usdcToken, erc20ABI, usdc_signer);

    await usdcContract.transfer(swapbox.address, usdcAmount);
    console.log(`Transferred ${usdcAmount} USDC to ${swapbox.address}`);

    // get some DAI basetoken for testing
    const dai_signer = await ethers.getImpersonatedSigner("0xD1668fB5F690C59Ab4B0CAbAd0f8C1617895052B");
    const daiAmount = ethers.utils.parseUnits("1000", 18); // DAI has 18 decimals
    const daiContract = new ethers.Contract(daiToken, erc20ABI, dai_signer);

    await daiContract.transfer(swapbox.address, daiAmount);
    console.log(`Transferred ${daiAmount} DAI to ${swapbox.address}`);


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
