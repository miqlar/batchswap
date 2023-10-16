require("@nomicfoundation/hardhat-toolbox");

require("uniswap-v3-deploy-plugin");
require('hardhat-deploy');

/** @type import('hardhat/config').HardhatUserConfig */
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