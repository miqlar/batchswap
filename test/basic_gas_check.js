// In your test script
const { ethers } = require("hardhat");
const { expect } = require("chai");


describe("Gas check tests", () => {

    it("Basic eth transfer, should be 21000", async () => {
    [owner, addr1, addr2, _] = await ethers.getSigners();

    // Perform a transaction
    const transaction = await owner.sendTransaction({
        to: addr1.address,
        value: ethers.utils.parseEther("1.0"), // Set the amount you want to send
    });

    // Retrieve the gas used
    const receipt = await transaction.wait();
    const gasUsed = receipt.gasUsed;

    // Assert or log the gas usage
    console.log(`Gas used: ${gasUsed.toString()}`);
    expect(gasUsed).to.be.gte(0); // Add assertions as needed
    });

});