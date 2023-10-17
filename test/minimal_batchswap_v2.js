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

async function randomSigners(amount) {
    const signers = []
    for (let i = 0; i < amount; i++) {
        wallet = ethers.Wallet.createRandom();
        wallet =  wallet.connect(ethers.provider);
        signers.push(wallet)
        await addr1.sendTransaction({to: wallet.address, value: ethers.utils.parseEther("1")});
    }
    return signers
  }

describe("uniswap V2 tests", () => {
    let Token, token1, factory, router;

    beforeEach(async () => {
        [owner, addr1, addr2, _] = await ethers.getSigners();
        ({ factory, router } = await UniswapV2Deployer.deploy(owner));
        const weth_address = await router.WETH()

        Token = await ethers.getContractFactory('BasicToken');
        token = await Token.deploy("Token1", "TOK1");
        await factory.createPair(token.address, weth_address);
        await token.approve(router.address, (100000));
        await router.addLiquidityETH(
            token.address,
            (100000),
            0,
            0,
            owner.address,
            ethers.constants.MaxUint256,
            { value: eth(20) }
        );
        await router.connect(addr2).swapExactETHForTokens(
            0,
            [weth_address, token.address],
            addr2.address,
            ethers.constants.MaxUint256,
            { value: eth(0.1) }
          )
        
        MinimalBatchSwapV2 = await ethers.getContractFactory('MinimalBatchSwapV2');
        batchswap = await MinimalBatchSwapV2.deploy(router.address, token.address);
    });

    describe('basic tests', () => {
        it("Cant send eth to contract", async () => {
            await expect(addr1.sendTransaction({to: batchswap.address, value: eth(1)})).to.be.reverted;
        });
    });

    describe('batchswap tests', () => {
        it("10 depositors, 1 finish round, 10 withdraws", async () => {
            let signers = await randomSigners(100);
            for (let i = 0; i < 10; i++) {
                let tx = await batchswap.connect(signers[i+10]).depositEth({value: eth(0.1)});
                let receipt = await tx.wait();
                console.log(`depositEth() gas used: ${receipt.gasUsed.toString()}`);
            }

            let tx = await batchswap.connect(signers[0]).finishRound();
            let receipt = await tx.wait();
            console.log(`finishRound() gas used: ${receipt.gasUsed.toString()}`);
            
            for (let i = 0; i < 10; i++) {
                let tx = await batchswap.connect(signers[i+10]).withdrawTokens();
                let receipt = await tx.wait();
                console.log(`withdrawTokens() gas used: ${receipt.gasUsed.toString()}`);
            }
        });

        it("10 depositors, 1 depositEthAndFinishRound, 10 withdraws", async () => {
            let signers = await randomSigners(100);
            for (let i = 0; i < 10; i++) {
                let tx = await batchswap.connect(signers[i+10]).depositEth({value: eth(0.1)});
                let receipt = await tx.wait();
                console.log(`depositEth() gas used: ${receipt.gasUsed.toString()}`);
            }

            let tx = await batchswap.connect(signers[0]).depositEthAndFinishRound({value: eth(0.5)});
            let receipt = await tx.wait();
            console.log(`depositEthAndFinishRound() gas used: ${receipt.gasUsed.toString()}`);
            
            for (let i = 0; i < 10; i++) {
                let tx = await batchswap.connect(signers[i+10]).withdrawTokens();
                let receipt = await tx.wait();
                console.log(`withdrawTokens() gas used: ${receipt.gasUsed.toString()}`);
            }
        });
    });

});
