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

describe("uniswap V2 tests", () => {
    let Token, token1, token2, factory, router;

    beforeEach(async () => {
        [owner, addr1, addr2, _] = await ethers.getSigners();

        ({ factory, router } = await UniswapV2Deployer.deploy(owner));

        Token = await ethers.getContractFactory('BasicToken');

        token1 = await Token.deploy("Token1", "TOK1");
        token2 = await Token.deploy("Token2", "TOK2");
        token3 = await Token.deploy("Token3", "TOK3");

    });

    describe('basic tests', () => {
        it("create pair and add liquidity", async () => {

            await factory.createPair(token1.address, token2.address);

            const pair = IUniswapV2Pair__factory.connect(
                await factory.getPair(token1.address, token2.address),
                owner
              );

            await token1.approve(router.address, (10000));
            await token2.approve(router.address, (10000));

            await router.addLiquidity(
                token1.address,
                token2.address,
                (10000),
                (10000),
                0,
                0,
                owner.address,
                ethers.constants.MaxUint256
            );

            await token1.transfer(addr1.address, (10000));

            await token1.connect(addr1).approve(router.address, 10000);

            await router.connect(addr1).swapExactTokensForTokens(
              10000,
              0,
              [token1.address, token2.address],
              addr1.address,
              ethers.constants.MaxUint256
            );

            expect(await parseInt(await token2.balanceOf(addr1.address))).to.greaterThan(0);

        });

        it("create pair with WETH and can buy", async () => {

          const weth_address = await router.WETH()
          await factory.createPair(token3.address, weth_address);

          await token3.approve(router.address, (10000));

          await router.addLiquidityETH(
              token3.address,
              (10000),
              0,
              0,
              owner.address,
              ethers.constants.MaxUint256,
              { value: eth(0.5) }
          );

          await router.connect(addr2).swapExactETHForTokens(
            0,
            [weth_address, token3.address],
            addr2.address,
            ethers.constants.MaxUint256,
            { value: eth(0.1) }
          )

          expect(await parseInt(await token3.balanceOf(addr2.address))).to.greaterThan(0);

        });

        it("see gas usage of ETH->Token swap", async () => {

            const weth_address = await router.WETH()
            await factory.createPair(token3.address, weth_address);
  
            await token3.approve(router.address, (10000));
  
            await router.addLiquidityETH(
                token3.address,
                (10000),
                0,
                0,
                owner.address,
                ethers.constants.MaxUint256,
                { value: eth(0.5) }
            );
  
            // Perform the transaction
            const tx = await router.connect(addr2).swapExactETHForTokens(
                0,
                [weth_address, token3.address],
                addr2.address,
                ethers.constants.MaxUint256,
                { value: eth(0.1) }
            );

            const receipt = await tx.wait();
            console.log("ETH->Token swap gas:", receipt.gasUsed.toString());
  
          });


          it("see gas usage of Token->ETH swap", async () => {

            const weth_address = await router.WETH()
            await factory.createPair(token3.address, weth_address);
  
            await token3.approve(router.address, (10000));
  
            await router.addLiquidityETH(
                token3.address,
                (10000),
                0,
                0,
                owner.address,
                ethers.constants.MaxUint256,
                { value: eth(0.5) }
            );

            await token3.transfer(addr2.address, 1000)
  
            // Set up the path for the token to WETH to ETH
            const path = [token3.address, weth_address];

            // Approve the Router to spend your tokens
            await token3.connect(addr2).approve(router.address, 100);

            // Perform the transaction to sell tokens for ETH
            const tx = await router.connect(addr2).swapExactTokensForETH(
                100,      // Amount of tokens to sell
                0,             // Minimum amount of ETH to receive (can be adjusted)
                path,          // Path from token to ETH
                addr2.address, // Recipient address for ETH
                ethers.constants.MaxUint256, // Deadline
            );

            // Get the transaction receipt
            const receipt = await tx.wait();
            console.log("Token->ETH swap gas:", receipt.gasUsed.toString());
          });

          it("see gas usage of Token->Token swap", async () => {

            await factory.createPair(token3.address, token2.address);
  
            await token2.approve(router.address, (10000));
            await token3.approve(router.address, (10000));
  
            await router.addLiquidity(
                token3.address,
                token2.address,
                (10000),
                (10000),
                0,
                0,
                owner.address,
                ethers.constants.MaxUint256
            );

            await token3.transfer(addr2.address, 1000)
  
            // Set up the path for the token to WETH to ETH
            const path = [token3.address, token2.address];

            // Approve the Router to spend your tokens
            await token3.connect(addr2).approve(router.address, 100);

            // Perform the transaction to sell tokens for ETH
            const tx = await router.connect(addr2).swapExactTokensForTokens(
                100,      // Amount of tokens to sell
                0,             // Minimum amount of Tokens to receive (can be adjusted)
                path,          // Path from token to ETH
                addr2.address, // Recipient address for ETH
                ethers.constants.MaxUint256, // Deadline
            );

            // Get the transaction receipt
            const receipt = await tx.wait();
            console.log("Token->Token swap gas:", receipt.gasUsed.toString());
          });


          it("see gas usage of Token->WETH->Token swap", async () => {

            const weth_address = await router.WETH()
            await factory.createPair(token2.address, weth_address);
            await factory.createPair(token3.address, weth_address);

            await token2.approve(router.address, (10000));
            await token3.approve(router.address, (10000));

            await router.addLiquidityETH(
                token2.address,
                (10000),
                0,
                0,
                owner.address,
                ethers.constants.MaxUint256,
                { value: eth(0.5) }
            );

            await router.addLiquidityETH(
                token3.address,
                (10000),
                0,
                0,
                owner.address,
                ethers.constants.MaxUint256,
                { value: eth(0.5) }
            );

            await token3.transfer(addr2.address, 1000)
  
            // Set up the path for the token to WETH to ETH
            const path = [token3.address, weth_address, token2.address];

            // Approve the Router to spend your tokens
            await token3.connect(addr2).approve(router.address, 100);

            // Perform the transaction to sell tokens for ETH
            const tx = await router.connect(addr2).swapExactTokensForTokens(
                100,      // Amount of tokens to sell
                0,             // Minimum amount of Tokens to receive (can be adjusted)
                path,          // Path from token to ETH
                addr2.address, // Recipient address for ETH
                ethers.constants.MaxUint256, // Deadline
            );

            // Get the transaction receipt
            const receipt = await tx.wait();
            console.log("Token->WETH->Token swap gas:", receipt.gasUsed.toString());
          });


    });
});