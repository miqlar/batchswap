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

        const weth_address = await router.WETH()

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
    });
});