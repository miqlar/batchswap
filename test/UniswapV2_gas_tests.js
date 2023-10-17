const {expect} = require('chai');
const { ethers } = require('hardhat');

const {
    UniswapV2Deployer,
    IUniswapV2Factory,
    IUniswapV2Pair__factory,
    IUniswapV2Router02,
  } = require('uniswap-v2-deploy-plugin');


function eth(n) {
  return ethers.utils.parseEther(n.toString());
}

async function getEtherBalance(address) {
    const provider = ethers.provider; // Use the Hardhat provider
  
    const balance = await provider.getBalance(address);
    const etherBalance = hre.ethers.utils.formatEther(balance);
  
    console.log(`Address ${address} has an Ether balance of ${etherBalance} ETH`);
  }

describe("uniswapV2 gas tests", () => {
    let Token, tokenA, tokenB, tokenC, factory, router, tokens;

    beforeEach(async () => {
        [owner, addr1, addr2, addr3, _] = await ethers.getSigners();

        ({ factory, router } = await UniswapV2Deployer.deploy(owner));

        Token = await ethers.getContractFactory('BasicToken');

        tokenA = await Token.deploy("tokenA", "TOK1");
        tokenB = await Token.deploy("tokenB", "TOK2");
        tokenC = await Token.deploy("tokenC", "TOK3");

        tokens = [
            { name: "tokenA", instance: tokenA },
            { name: "tokenB", instance: tokenB },
            { name: "tokenC", instance: tokenC },
          ];

        addresses = [
            { name: "Addr1", instance: addr1 },
            { name: "Addr2", instance: addr2 },
            { name: "Addr3", instance: addr3 }
        ]

        weth_address = await router.WETH()

        for (let token of [tokenA, tokenB, tokenC]){
            await factory.createPair(token.address, weth_address);
            await token.approve(router.address, (10000));
            await router.addLiquidityETH(
                token.address,
                (10000),
                0,
                0,
                owner.address,
                ethers.constants.MaxUint256,
                { value: eth(5) }
            );
        }

    });

    describe('uniswap v2 gas tests', () => {

        it.only("gas usage of ETH->Token swap", async () => {
  
            for (let addr of addresses){
                for (let token of tokens){

                    let tx = await router.connect(addr.instance).swapExactETHForTokens(
                        0,
                        [weth_address, token.instance.address],
                        addr.instance.address,
                        ethers.constants.MaxUint256,
                        { value: eth(0.1) }
                    );
                    let receipt = await tx.wait();
                    console.log(`[${addr.name}] ETH->${token.name} swap gas (Buyer address token balance=0): ${receipt.gasUsed.toString()}`);
    
                    // Perform the transaction
                    tx = await router.connect(addr.instance).swapExactETHForTokens(
                        0,
                        [weth_address, token.instance.address],
                        addr.instance.address,
                        ethers.constants.MaxUint256,
                        { value: eth(0.1) }
                    );
    
                    receipt = await tx.wait();
                    console.log(`[${addr.name}] ETH->${token.name} swap gas (Buyer address token balance>0): ${receipt.gasUsed.toString()}`);
                }
                console.log("---")
            }
          });


          it("gas usage of Token->ETH swap", async () => {

            for (let addr of addresses){
                for (let token of tokens){

                    await token.instance.transfer(addr.instance.address, 1000)
        
                    // Set up the path for the token to WETH to ETH
                    const path = [token.instance.address, weth_address];
                    await token.instance.connect(addr.instance).approve(router.address, 1000);

                    let tx = await router.connect(addr.instance).swapExactTokensForETH(
                        100,           // Amount of tokens to sell
                        0,             // Minimum amount of ETH to receive (can be adjusted)
                        path,          // Path from token to ETH
                        addr.instance.address, // Recipient address for ETH
                        ethers.constants.MaxUint256, // Deadline
                    );

                    // Get the transaction receipt
                    let receipt = await tx.wait();
                    console.log(`[${addr.name}] ${token.name}->ETH swap gas (Buyer address end token balance>0):`, receipt.gasUsed.toString());

                    tx = await router.connect(addr.instance).swapExactTokensForETH(
                        200,           // Amount of tokens to sell
                        0,             // Minimum amount of ETH to receive (can be adjusted)
                        path,          // Path from token to ETH
                        addr.instance.address, // Recipient address for ETH
                        ethers.constants.MaxUint256, // Deadline
                    );

                    // Get the transaction receipt
                    receipt = await tx.wait();
                    console.log(`[${addr.name}] ${token.name}->ETH swap gas (Buyer address end token balance>0):`, receipt.gasUsed.toString());

                    tx = await router.connect(addr.instance).swapExactTokensForETH(
                        200,           // Amount of tokens to sell
                        0,             // Minimum amount of ETH to receive (can be adjusted)
                        path,          // Path from token to ETH
                        addr.instance.address, // Recipient address for ETH
                        ethers.constants.MaxUint256, // Deadline
                    );

                    // Get the transaction receipt
                    receipt = await tx.wait();
                    console.log(`[${addr.name}] ${token.name}->ETH swap gas (Buyer address end token balance>0):`, receipt.gasUsed.toString());

                    // Perform the transaction to sell tokens for ETH
                    tx = await router.connect(addr.instance).swapExactTokensForETH(
                        500,      // Amount of tokens to sell
                        0,             // Minimum amount of ETH to receive (can be adjusted)
                        path,          // Path from token to ETH
                        addr.instance.address, // Recipient address for ETH
                        ethers.constants.MaxUint256, // Deadline
                    );

                    // Get the transaction receipt
                    receipt = await tx.wait();
                    console.log(`[${addr.name}] ${token.name}->ETH swap gas (Buyer address end token balance=0):`, receipt.gasUsed.toString());
                    }
                console.log("---")
                }
          });

          
          it("gas usage of TokenA->TokenB swap", async () => {

            await tokenC.transfer(addr2.address, 1000)
  
            // Set up the path for the token to WETH to ETH
            const path = [tokenC.address, tokenB.address];

            // Approve the Router to spend your tokens
            await tokenC.connect(addr2).approve(router.address, 100);

            // Perform the transaction to sell tokens for ETH
            let tx = await router.connect(addr2).swapExactTokensForTokens(
                100,      // Amount of tokens to sell
                0,             // Minimum amount of Tokens to receive (can be adjusted)
                path,          // Path from token to ETH
                addr2.address, // Recipient address for ETH
                ethers.constants.MaxUint256, // Deadline
            );

            // Get the transaction receipt
            let receipt = await tx.wait();
            console.log("Token->Token swap gas (Address has token balance>0):", receipt.gasUsed.toString());

            // Perform the transaction to sell tokens for ETH
            tx = await router.connect(addr2).swapExactTokensForTokens(
                100,      // Amount of tokens to sell
                0,             // Minimum amount of Tokens to receive (can be adjusted)
                path,          // Path from token to ETH
                addr2.address, // Recipient address for ETH
                ethers.constants.MaxUint256, // Deadline
            );

            // Get the transaction receipt
            receipt = await tx.wait();
            console.log("Token->Token swap gas (Address has token balance>0):", receipt.gasUsed.toString());

          });


          it("gas usage of Token->WETH->Token swap", async () => {

            const weth_address = await router.WETH()
            await factory.createPair(tokenB.address, weth_address);
            await factory.createPair(tokenC.address, weth_address);

            await tokenB.approve(router.address, (10000));
            await tokenC.approve(router.address, (10000));

            await router.addLiquidityETH(
                tokenB.address,
                (10000),
                0,
                0,
                owner.address,
                ethers.constants.MaxUint256,
                { value: eth(0.5) }
            );

            await router.addLiquidityETH(
                tokenC.address,
                (10000),
                0,
                0,
                owner.address,
                ethers.constants.MaxUint256,
                { value: eth(0.5) }
            );

            await tokenC.transfer(addr2.address, 1000)
  
            // Set up the path for the token to WETH to ETH
            const path = [tokenC.address, weth_address, tokenB.address];

            // Approve the Router to spend your tokens
            await tokenC.connect(addr2).approve(router.address, 100);

            // Perform the transaction to sell tokens for ETH
            let tx = await router.connect(addr2).swapExactTokensForTokens(
                100,      // Amount of tokens to sell
                0,             // Minimum amount of Tokens to receive (can be adjusted)
                path,          // Path from token to ETH
                addr2.address, // Recipient address for ETH
                ethers.constants.MaxUint256, // Deadline
            );

            // Get the transaction receipt
            let receipt = await tx.wait();
            console.log("Token->WETH->Token swap gas (Address has token balance=0):", receipt.gasUsed.toString());

            // Perform the transaction to sell tokens for ETH
            tx = await router.connect(addr2).swapExactTokensForTokens(
                100,      // Amount of tokens to sell
                0,             // Minimum amount of Tokens to receive (can be adjusted)
                path,          // Path from token to ETH
                addr2.address, // Recipient address for ETH
                ethers.constants.MaxUint256, // Deadline
            );

            // Get the transaction receipt
            receipt = await tx.wait();
            console.log("Token->WETH->Token swap gas (Address has token balance>0):", receipt.gasUsed.toString());
          });


    });
});