

let erc20, symbol, factory, batchswap, tokenAddress;

let greenLight = true;

const TOKEN_ADDRESS = '0xBb7fDACD5269083dE9e55322AD36A9eaECAAB44c';
const UNISWAP_V2_ROUTER_ADDRESS = '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008';
const UNISWAP_V2_FACTORY_ADDRESS = '0x7e0987e5b3a30e3f2828572bb659a548460a3003';
const WETH9_ADDRESS = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9';
const BATCHSWAP_ADDRESS = '0x2886522743FF22522351fd0Cfebe8C8cECCfe1AD'

const inputField = document.getElementById('ethereumAddress'); // Get the input field by ID
const errorMessage = document.getElementById('error-message'); // Get the error message element
const result = document.getElementById('result'); // Get the error message element
const TokenInfo = document.getElementById('token-found');
const PoolExists = document.getElementById('pool-found');
const numbers = document.getElementById('numbers');
const number1Element = document.getElementById('number1');
const number2Element = document.getElementById('number2');
const number3Element = document.getElementById('number3');
const number4Element = document.getElementById('number4');
const withdrawalInfo = document.getElementById('withdrawalInfo');

window.addEventListener('load', async () => {
    // Modern dapp browsers
    if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        try {
            // Request account access if needed
            await ethereum.enable();
        } catch (error) {
            console.error(error);
        }
    }
    // Legacy dapp browsers
    else if (window.web3) {
        window.web3 = new Web3(web3.currentProvider);
    }
    // Non-dapp browsers
    else {
        console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }

    setupFactory();
    setupBatchSwap();
    checkConnection()
});

async function clear(){
    result.style.display = 'none';
    withdrawalInfo.style.display = 'none';
    errorMessage.style.display = 'none';
    TokenInfo.style.display = 'none';
    PoolExists.style.display = 'none';
    greenLight=true;
}

inputField.addEventListener('keyup', async (event) => {
    if (event.key === 'Enter') {

        await clear();

        tokenAddress = inputField.value; // Get the value from the input field
        // tokenAddress = TOKEN_ADDRESS;
        let inputValue = tokenAddress;
        // Check if the input matches the Ethereum address format (40 hexadecimal characters)
        if (isValidEthereumAddress(inputValue)) {
            console.log('Input Value:', inputValue); // Log the valid value
            await setupERC20();
            await checks();
            if (greenLight){
                refreshAndShowInterface();
            }
        } else {
            console.error('Invalid Ethereum Address'); // Log an error message
            errorMessage.textContent = 'Invalid Ethereum Address';
            errorMessage.style.display = 'block';
        }
    }
});

async function refreshAndShowInterface(){
    withdrawalInfo.style.display = 'none';
    result.style.display = 'none';
    let NTokens = await NTokensToWithdraw(tokenAddress);
    if (NTokens>0){
        withdrawalButton(NTokens);
    }
    else{
        refreshBatchswapData();
        result.style.display = 'block';
    }
}

function withdrawalButton(NTokens){
    number4Element.textContent = weiToEth(NTokens);
    withdrawalInfo.style.display = 'block';
}

async function checks(){
    await checkToken();
    if (greenLight){
        await checkPool();
    }
}

async function refreshBatchswapData(){
    number1Element.textContent = weiToEth(await batchswap.methods.getDepositedETH(tokenAddress).call({from: (await getAccount())[0]}));
    number2Element.textContent = weiToEth(await batchswap.methods.getTotalDepositedETH(tokenAddress).call());
    number3Element.textContent = weiToEth(await batchswap.methods.getSwapperETHprize(tokenAddress).call());
    //result.style.display = 'block';
}

async function NTokensToWithdraw(){
    let NTokens = await batchswap.methods.getTokensToWithdraw(tokenAddress).call({from: (await getAccount())[0]});
    return NTokens;
}   

// Function to check if a string is a valid Ethereum address
function isValidEthereumAddress(input) {
    const ethereumAddressRegex = /^(0x)?[0-9a-fA-F]{40}$/;
    return ethereumAddressRegex.test(input);
}

async function setupERC20() {
    try {
        const response = await fetch('abi/erc20.json');
        const data = await response.json();
        const contractAbi = data;
        erc20 = new window.web3.eth.Contract(contractAbi, tokenAddress);
        // Continue with your logic here, as the setup is complete
    } catch (error) {
        console.error('Error loading ABI:', error);
    }
}

function setupFactory() {
    fetch('abi/IUniswapV2Factory.json')
        .then(response => response.json())
        .then(data => {
            const contractAbi = data; // Use the loaded ABI        
            factory = new window.web3.eth.Contract(contractAbi, UNISWAP_V2_FACTORY_ADDRESS);
        })
        .catch(error => console.error('Error loading ABI:', error));
}


function setupBatchSwap() {
    fetch('abi/batchswap.json')
        .then(response => response.json())
        .then(data => {
            const contractAbi = data; // Use the loaded ABI        
            batchswap = new window.web3.eth.Contract(contractAbi, BATCHSWAP_ADDRESS);
        })
        .catch(error => console.error('Error loading ABI:', error));
}


async function checkToken() {
    try {
        const name = await erc20.methods.name().call();
        symbol = await erc20.methods.symbol().call();
        TokenInfo.textContent = "\u2705 ERC20 Token detected: " + name + " ("+ symbol +")";
    } catch (error) {
        console.error('Error calling the ERC20 contract:', error);
        TokenInfo.textContent = "\uD83D\uDE1E ERC20 Token not detected!";
        greenLight=false;
    }
    TokenInfo.style.display = 'block'; 
}


async function checkPool() {
    try {
        let pair = await factory.methods.getPair(tokenAddress, WETH9_ADDRESS).call();
        console.log("pair!:", pair);
        if (pair === '0x0000000000000000000000000000000000000000') {
            PoolExists.textContent = "\uD83D\uDE1E " + symbol + "/ETH pool NOT found!";
            greenLight=false;
        } else {
            PoolExists.textContent = "\uD83D\uDE80 " + symbol + "/ETH pool found!";
        }
    } catch (error) {
        console.error('Error calling the Factory contract:', error);
        PoolExists.textContent = "\uD83D\uDE1E " + symbol + "/ETH pool NOT found!";
        greenLight=false;
    }
    PoolExists.style.display = 'block'; 
}


async function connect(){
    if (typeof window.ethereum !== "undefined") {
        await window.ethereum.request({method: "eth_requestAccounts"})
        document.getElementById("connectButton").innerHTML = "Connected!"
    } else {
        document.getElementById("connectButton").innerHTML = "Please install Metamask"
  }
}

async function checkConnection() {
    if (typeof window.ethereum !== "undefined") {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        // User is already connected
        document.getElementById("connectButton").innerHTML = "Connected!";
      }
    }
  }
  

async function getAccount() {
    accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    return accounts
  }

async function deposit(){
    const etherAmountInput = document.getElementById('depositAmount'); 
    if (isNumericCheck(etherAmountInput.value)){
        await batchswap.methods.depositEth(tokenAddress).send({
            from: (await getAccount())[0],
            value: web3.utils.toWei(etherAmountInput.value, 'ether'), // Specify the amount of ether to send
            gas: 200000, // You may need to adjust the gas limit
        }).on('transactionHash', function (hash) {
            // This callback is called when the transaction is mined and has a transaction hash
            console.log('Transaction hash:', hash);
          })
          .on('confirmation', function (confirmationNumber, receipt) {
            // This callback is called for each confirmation of the transaction
            if (confirmationNumber == 1) {
              console.log('Transaction confirmed');
              console.log('Transaction receipt:', receipt);
              refreshBatchswapData();
            }
          });
    }
}

async function cancelDeposit(){
    await batchswap.methods.cancelEthDeposit(tokenAddress).send({
        from: (await getAccount())[0],
        value: 0, // Specify the amount of ether to send
        gas: 200000, // You may need to adjust the gas limit
      }).on('transactionHash', function (hash) {
        // This callback is called when the transaction is mined and has a transaction hash
        console.log('Transaction hash:', hash);
      })
      .on('confirmation', function (confirmationNumber, receipt) {
        // This callback is called for each confirmation of the transaction
        if (confirmationNumber == 1) {
          console.log('Transaction confirmed');
          console.log('Transaction receipt:', receipt);
          refreshBatchswapData();
        }
      });
}

async function swap(){
    await batchswap.methods.finishRound(tokenAddress).send({
        from: (await getAccount())[0],
        value: 0, // Specify the amount of ether to send
        gas: 300000, // You may need to adjust the gas limit
      }).on('transactionHash', function (hash) {
        // This callback is called when the transaction is mined and has a transaction hash
        console.log('Transaction hash:', hash);
      })
      .on('confirmation', function (confirmationNumber, receipt) {
        // This callback is called for each confirmation of the transaction
        if (confirmationNumber == 1) {
          console.log('Transaction confirmed');
          console.log('Transaction receipt:', receipt);
          refreshBatchswapData();
        }
      });;
}

function weiToEth(weiAmount) {
    const weiBN = web3.utils.toBN(weiAmount);
    const eth = web3.utils.fromWei(weiBN, 'ether');
    return parseFloat(eth).toFixed(6);
  }

async function depositAndSwap(){
    const etherAmountInput = document.getElementById('depositAmount'); 
    if (isNumericCheck(etherAmountInput.value)){
        await batchswap.methods.depositEthAndFinishRound(tokenAddress).send({
            from: (await getAccount())[0],
            value: web3.utils.toWei(etherAmountInput.value, 'ether'), // Specify the amount of ether to send
            gas: 300000, // You may need to adjust the gas limit
          }).on('transactionHash', function (hash) {
            // This callback is called when the transaction is mined and has a transaction hash
            console.log('Transaction hash:', hash);
          })
          .on('confirmation', function (confirmationNumber, receipt) {
            // This callback is called for each confirmation of the transaction
            if (confirmationNumber == 1) {
              console.log('Transaction confirmed');
              console.log('Transaction receipt:', receipt);
              refreshBatchswapData();
            }
          });;
    }
}

async function withdrawTokens() {
    await batchswap.methods.withdrawTokens(tokenAddress).send({
        from: (await getAccount())[0],
        value: 0,
        gas: 300000, 
      }).on('transactionHash', function (hash) {
        // This callback is called when the transaction is mined and has a transaction hash
        console.log('Transaction hash:', hash);
      })
      .on('confirmation', function (confirmationNumber, receipt) {
        // This callback is called for each confirmation of the transaction
        if (confirmationNumber == 1) {
          console.log('Transaction confirmed');
          console.log('Transaction receipt:', receipt);

          refreshAndShowInterface();
    }});
}

function isNumeric(value) {
    return !isNaN(value) && isFinite(value) && value!='';
}

function isNumericCheck(value){
    if (!isNumeric(value)){
        window.alert('No valid numeric value introduced in deposit field');
    }else{
        return true
    }
}

