/**
 * @module bitcoin-listener
 * @author Smart-Chain
 * @version 1.0.0
 * This module gives a few functions to fetch transactions from the Bitcoin blockchain
 */

 const config = require('../../config/config.js');	//env variables
 const axios = require('axios');				    //used to send HTTP requests



/////////////////////////////////////////// BITCOIN ///////////////////////////////////////////

/**
* Function that gets the details of the transactions received on the Bitcoin address,
* @returns  {JSON}  list of transactions 
*/
async function getBitcoinTxs() {
    console.log("Smartlink ICO API: fetching Bitcoin transactions...");
    axios.defaults.baseURL = config.BITCOIN_API;
	const url = "/rawaddr/" + config.BITCOINADDRESS;
	const apiResp = await axios.get(url).catch(error => {console.log(error)});
    console.log("Smartlink ICO API: " + apiResp.data.txs.length + " transactions fetched");
	return apiResp.data.txs;
};


/**
* Function that extracts usefull information about the Bitcoin transactions :
*   - sender address
*   - block height
*   - amount of BTC received
*   - timestamp of the transaction
*   - hash of the transaction for further analysis
* @param    {JSON} txs  transactions with full detail
* @returns  {JSON}      transactions with important information only
*/
function parseBitcoinTxs(txs) {
    const res = txs.map(x => {
        return {
                    "sender": x['inputs'].map(x => {return x['prev_out']['addr']}), // retourne l'ensemble des utxos entrantes
                    "receiver": config.BITCOINADDRESS,
                    "block": x['block_height'],
                    "amount": (x['result']/100000000).toString(),
                    "timestamp": x['time'],
                    "hash": x['hash']
                }
    });
    return res;
}


/**
* Function that gets the current block height of the Bitcoin blockchain,
* @returns  {number} 
*/
async function getBitcoinBlock() {
    console.log("Smartlink ICO API: fetching current Bitcoin block...");
    axios.defaults.baseURL = config.BITCOIN_API;
	const url = "/latestblock";
	const apiResp = await axios.get(url).catch(error => {console.log(error)});
    console.log("Smartlink ICO API: current Bitcoin block is " + apiResp.data.height);
	return apiResp.data.height;
}


/**
* Function that selects only valid Bitcoin transactions (with 3 confirmations or more)
* @param    {JSON}   txs            list of transactions
* @param    {number} block_height   current block height
* @returns  {JSON}                  list of valid transactions 
*/
function getValidBitcoinTxs(txs, block_height) {
    const res = txs.filter(x => block_height - x['block'] >= 3);
    console.log("Smartlink ICO API: " + res.length + " of " + txs.length + " valid Bitcoin transactions (3 or more block confirmations)");
    return res;
}


// Exporting the functions in order to be used as module's functions in other modules
module.exports = {
    getBitcoinTxs,
    parseBitcoinTxs,
    getBitcoinBlock,
    getValidBitcoinTxs
}