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
    let Token, token1, token2, token3, factory, router, burn_address;

    beforeEach(async () => {
        [owner, addr1, addr2, _] = await ethers.getSigners();
        ({ factory, router } = await UniswapV2Deployer.deploy(owner));
        const weth_address = await router.WETH()
        burn_address = "0x0000000000000000000000000000000000000000"

        Token = await ethers.getContractFactory('BasicToken');
        token1 = await Token.deploy("Token1", "TOK1");
        token2 = await Token.deploy("Token1", "TOK1");
        token3 = await Token.deploy("Token1", "TOK1");

        for (const token of [token1, token2, token3]) {
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
        }

        BatchSwapV2 = await ethers.getContractFactory('BatchSwapV2');
        batchswap = await BatchSwapV2.deploy(router.address, burn_address);
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
                let tx = await batchswap.connect(signers[i+10]).depositEth(token1.address, {value: eth(0.1)});
                let receipt = await tx.wait();
                console.log(`depositEth() gas used: ${receipt.gasUsed.toString()}`);
            }

            let tx = await batchswap.connect(signers[0]).finishRound(token1.address);
            let receipt = await tx.wait();
            console.log(`finishRound() gas used: ${receipt.gasUsed.toString()}`);

            for (let i = 0; i < 10; i++) {
                let tx = await batchswap.connect(signers[i+10]).withdrawTokens(token1.address);
                let receipt = await tx.wait();
                console.log(`withdrawTokens() gas used: ${receipt.gasUsed.toString()}`);
                expect(await token1.balanceOf(signers[i+10].address)).to.be.gt(0);
            }
        });

        it("2x tokens, 10 depositors, 1 depositEthAndFinishRound, 10 withdraws", async () => {
            let signers = await randomSigners(100);
            for (let i = 0; i < 10; i++) {
                let tx = await batchswap.connect(signers[i+30]).depositEth(token1.address, {value: eth(0.1)});
                let receipt = await tx.wait();
                console.log(`depositEth() gas used: ${receipt.gasUsed.toString()}`);
            }

            for (let i = 0; i < 10; i++) {
                let tx = await batchswap.connect(signers[i+30]).depositEth(token2.address, {value: eth(0.1)});
                let receipt = await tx.wait();
                console.log(`depositEth() gas used: ${receipt.gasUsed.toString()}`);
            }
            
            let startETH = await ethers.provider.getBalance(burn_address);
            let tx = await batchswap.connect(signers[0]).depositEthAndFinishRound(token1.address, {value: eth(0.2)});
            let receipt = await tx.wait();
            console.log(`depositEthAndFinishRound() gas used: ${receipt.gasUsed.toString()}`);
            expect((await ethers.provider.getBalance(burn_address)) - startETH).to.be.gt(0);

            startETH = await ethers.provider.getBalance(burn_address);
            tx = await batchswap.connect(signers[0]).depositEthAndFinishRound(token2.address, {value: eth(0.2)});
            receipt = await tx.wait();
            console.log(`depositEthAndFinishRound() gas used: ${receipt.gasUsed.toString()}`);
            expect((await ethers.provider.getBalance(burn_address)) - startETH).to.be.gt(0);

            for (let i = 0; i < 10; i++) {
                let tx = await batchswap.connect(signers[i+30]).withdrawTokens(token1.address);
                let receipt = await tx.wait();
                console.log(`withdrawTokens() gas used: ${receipt.gasUsed.toString()}`);
                expect(await token1.balanceOf(signers[i+30].address)).to.be.gt(0);
            }

            for (let i = 0; i < 10; i++) {
                let tx = await batchswap.connect(signers[i+30]).withdrawTokens(token2.address);
                let receipt = await tx.wait();
                console.log(`withdrawTokens() gas used: ${receipt.gasUsed.toString()}`);
                expect(await token2.balanceOf(signers[i+30].address)).to.be.gt(0);
            }
        });

        it("I can deposit and cancel the deposit, receving eth back, and it reverts a second time", async () => {
            let signer = (await randomSigners(2))[0];
            await batchswap.connect(signer).depositEth(token1.address, {value: eth(0.1)});

            startETH = await ethers.provider.getBalance(signer.address);
            await batchswap.connect(signer).cancelEthDeposit(token1.address);
            endETH = await ethers.provider.getBalance(signer.address);
            expect(endETH-startETH).to.be.gt(0);

            await expect(batchswap.connect(signer).cancelEthDeposit(token1.address)).to.be.reverted;
        });


    });
});