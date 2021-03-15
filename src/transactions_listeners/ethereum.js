/**
 * @module ethereum-listener
 * @author Smart-Chain
 * @version 1.0.0
 * This module gives a few functions to fetch transactions from the Ethereum blockchain
 */

 const config = require('../../config/config.js');	//env variables
 const axios = require('axios');				    //used to send HTTP requests



/////////////////////////////////////////// ETHEREUM ///////////////////////////////////////////

/**
* Function that gets the details of the transactions received on the Ethereum address,
* @returns  {String} 		- list of transactions
*/
async function getEthereumTxs() {
    console.log("Smartlink ICO API: fetching Ethereum transactions...");
    axios.defaults.baseURL = config.ETHEREUM_API;
	const url = "/api?module=account&action=txlist&address=" + config.ETHEREUMADDRESS + "&startblock=0&endblock=99999999&sort=asc&apikey=" + config.ETHERSCANTOKEN;
	const apiResp = await axios.get(url).catch(error => {console.log(error)});
    console.log("Smartlink ICO API: " + apiResp.data.result.length + " transactions fetched");
	return apiResp.data.result;
};


/**
* Function that extracts usefull information about the Ethereum transactions :
*   - sender address
*   - amount of ETH received
*   - timestamp of the transaction
*   - hash of the transaction for further analysis
*   - number of confirmations
* @param    {JSON} txs  transactions with full detail
* @returns  {JSON}      transactions only with important informations
*/
function parseEthereumTxs(txs) {
    const res = txs.map(x => { 
        return {
                    "sender": [x['from']],
                    "amount": (x['value'].slice(0, -10)/100000000).toString(),   // ethereum has a 10e-18 precision, we reduce it to 10e-8
                    "timestamp": parseInt(x['timeStamp'], 10),
                    "hash": x['hash'],
                    "confirmations": x['confirmations']
                }
    });
    return res;
}


/**
* Function that selects only valid Ethereum transactions (with 100 confirmations or more)
* @param    {JSON}   txs            list of transactions
* @returns  {JSON}                  list of valid transactions 
*/
function getValidEthereumTxs(txs) {
    const res = txs.filter(x => x['confirmations'] >= 100);
    console.log("Smartlink ICO API: " + res.length + " of " + txs.length + " valid Ethereum transactions (100 or more block confirmations)");
    return res;
}


// Exporting the functions in order to be used as module's functions in other modules
module.exports = {
    getEthereumTxs,
    parseEthereumTxs,
    getValidEthereumTxs
}