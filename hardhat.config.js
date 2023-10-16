require("@nomicfoundation/hardhat-toolbox");

require("uniswap-v3-deploy-plugin");
require('hardhat-deploy');

const { task } = require("hardhat/config");
const { execSync } = require("child_process");


task("test-v2", "Run V2 tests", async (_, hre) => {
  try {
    execSync("npx hardhat test ./test/UniswapV2_basic.js", { stdio: "inherit" });
  } catch (error) {
    process.exit(1);
  }
  try {
    execSync("npx hardhat test ./test/UniswapV2_gas_tests.js", { stdio: "inherit" });
  } catch (error) {
    process.exit(1);
  }
});

task("test-v3", "Run V3 tests", async (_, hre) => {
  try {
    execSync("npx hardhat test ./test/UniswapV3_basic.js", { stdio: "inherit" });
  } catch (error) {
    process.exit(1);
  }
});


module.exports = {
  solidity: {
    version: "0.8.19", // Your desired Solidity version
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000 // Number of optimization rounds
      },
    },
  },
};