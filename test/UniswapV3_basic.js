const {expect} = require('chai');
const { ethers } = require('hardhat');

// const {
//     UniswapV3Deployer,
//     IUniswapV3Factory,
//     IUniswapV3Pair__factory,
//     IUniswapV3Router02,
//   } = require('uniswap-v3-deploy-plugin');
const { UniswapV3Deployer } = require ('uniswap-v3-deploy-plugin/dist/deployer/UniswapV3Deployer')
//const IUniswapV3Pool = JSON.parse(fs.readFileSync("node_modules/@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json"));
const artifacts = {
    NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
    IUniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
  };
const { Pool, Position, nearestUsableTick } = require('@uniswap/v3-sdk')


function eth(n) {
  return ethers.utils.parseEther(n.toString());
}


async function getPoolData(poolContract) {
    const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
      poolContract.tickSpacing(),
      poolContract.fee(),
      poolContract.liquidity(),
      poolContract.slot0(),
    ])
  
    return {
      tickSpacing: tickSpacing,
      fee: fee,
      liquidity: liquidity,
      sqrtPriceX96: slot0[0],
      tick: slot0[1],
    }
  }

describe("uniswap V3 tests", () => {
    let Token, token1, token2, router, factory;

    beforeEach(async () => {
        [owner, addr1, addr2, _] = await ethers.getSigners();

        ({
            weth9,
            factory,
            router,
            nftDescriptorLibrary,
            positionDescriptor,
            positionManager,
        }  = await UniswapV3Deployer.deploy(owner));

        Token = await ethers.getContractFactory('BasicToken');

        token1 = await Token.deploy("Token1", "TOK1");
        token2 = await Token.deploy("Token2", "TOK2");
        token3 = await Token.deploy("Token3", "TOK3");

        const weth_address = await weth9.address;

    });

    describe('basic tests', () => {
        it.only("create pair and add liquidity", async () => {

            await factory.createPool(token1.address, token2.address, 3000);
            let pool_address = (await factory.getPool(token1.address, token2.address, 3000));
            
            const pool = new ethers.Contract(
                pool_address,
                artifacts.IUniswapV3Pool.abi,
                owner
              );            
    
            await token1.approve(router.address, (10000));
            await token2.approve(router.address, (10000));

            let poolData = await getPoolData(pool);
            console.log(poolData);

            console.log(await nearestUsableTick(poolData.tick, poolData.tickSpacing) - poolData.tickSpacing * 2);

            const position = new Position({
                pool: pool,
                liquidity: ethers.utils.parseEther('1'),
                tickLower: nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2,
                tickUpper: nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 4,
              })
            
            // const { amount0: amount0Desired, amount1: amount1Desired} = position.mintAmounts

            // params = {
            //     token0: token1.address,
            //     token1: token2.address,
            //     fee: poolData.fee,
            //     tickLower: nearestUsableTick(poolData.tick, poolData.tickSpacing) - poolData.tickSpacing * 2,
            //     tickUpper: nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2,
            //     amount0Desired: amount0Desired.toString(),
            //     amount1Desired: amount1Desired.toString(),
            //     amount0Min: 0,
            //     amount1Min: 0,
            //     recipient: signer2.address,
            //     deadline: Math.floor(Date.now() / 1000) + (60 * 10)
            //   }
            
            //   const nonfungiblePositionManager = new Contract(
            //     POSITION_MANAGER_ADDRESS,
            //     artifacts.NonfungiblePositionManager.abi,
            //     provider
            //   )
            
            //   const tx = await nonfungiblePositionManager.connect(signer2).mint(
            //     params,
            //     { gasLimit: '1000000' }
            //   )
            //   const receipt = await tx.wait()


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