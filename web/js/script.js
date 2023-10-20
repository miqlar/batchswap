let contract;

// index.js
async function connect(){
    if (typeof window.ethereum !== "undefined") {
        await window.ethereum.request({method: "eth_requestAccounts"})
        document.getElementById("connectButton").innerHTML = "Connected!"
    } else {
        document.getElementById("connectButton").innerHTML = "Please install Metamask"
  }
}

const inputField = document.getElementById('ethereumAddress'); // Get the input field by ID
const errorMessage = document.getElementById('error-message'); // Get the error message element

inputField.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        const inputValue = inputField.value; // Get the value from the input field

        // Check if the input matches the Ethereum address format (40 hexadecimal characters)
        if (isValidEthereumAddress(inputValue)) {
            console.log('Input Value:', inputValue); // Log the valid value
            callContractFunction();
        } else {
            console.error('Invalid Ethereum Address'); // Log an error message
            errorMessage.textContent = 'Invalid Ethereum Address';
            errorMessage.style.display = 'block';
        }
    }
});


// Function to check if a string is a valid Ethereum address
function isValidEthereumAddress(input) {
    const ethereumAddressRegex = /^(0x)?[0-9a-fA-F]{40}$/;
    return ethereumAddressRegex.test(input);
}


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

    setupContractInteraction();


});


function setupContractInteraction() {

    const contractAddress = '';

    // Load the ABI from the erc20.json file
    fetch('abi/erc20.json')
        .then(response => response.json())
        .then(data => {
            const contractAbi = data; // Use the loaded ABI        
            // Now you can interact with your contract using 'contract'
            contract = new window.web3.eth.Contract(contractAbi, contractAddress);
        })
        .catch(error => console.error('Error loading ABI:', error));
}


async function callContractFunction() {
    try {
        const result = await contract.methods.totalSupply().call();
        console.log('Smart Contract Result:', result);
    } catch (error) {
        console.error('Error calling the smart contract function:', error);
    }
}