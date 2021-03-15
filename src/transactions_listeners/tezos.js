/**
 * @module tezos-listener
 * @author Smart-Chain
 * @version 1.0.0
 * This module gives a few functions to fetch transactions from the Tezos blockchain
 */

 const config = require('../../config/config.js');	//env variables
 const axios = require('axios');				    //used to send HTTP requests



/////////////////////////////////////////// TEZOS ///////////////////////////////////////////


/**
* Function that gets the details of the transactions received on the Tezos address,
* @returns  {String} 		- list of transactions
*/
async function getTezosTxs() {
    console.log("Smartlink ICO API: fetching Tezos transactions...");
    axios.defaults.baseURL = config.TEZOS_API;
	const url = "/v1/accounts/" + config.TEZOSADDRESS + "/operations";
	const apiResp = await axios.get(url).catch(error => {console.log(error)});
    // keeps only transactions, removes "key revelation" or "delegation" associated transactions
    const res = apiResp.data.filter(x => x['type'] == 'transaction');
    console.log("Smartlink ICO API: " + res.length + " transactions fetched");
	return res;
};


/**
* Function that extracts usefull information about the Tezos transactions :
*   - sender address
*   - amount of XTZ received
*   - timestamp of the transaction
*   - hash of the transaction for further analysis
*   - block height
* @param    {JSON} txs  transactions with full detail
* @returns  {JSON}      transactions only with important informations
*/
function parseTezosTxs(txs) {
    const res = txs.map(x => {
        return {
                    "sender": [x['sender']['address']],
                    "amount": (x['amount']/1000000).toString(),
                    "timestamp": new Date(x['timestamp'])/1000,
                    "hash": x['hash'],
                    "block": x['level']
                }
    });
    return res;
}


/**
* Function that gets the current block height of the Tezos blockchain,
* @returns  {number}
*/
async function getTezosBlock() {
    console.log("Smartlink ICO API: fetching current Tezos block...");
    axios.defaults.baseURL = config.TEZOS_API;
    const url = "/v1/blocks/count";
    const apiResp = await axios.get(url).catch(error => {console.log(error)});
    console.log("Smartlink ICO API: current Tezos block is " + apiResp.data);
    return apiResp.data;
}
    

/**
* Function that selects only valid Tezos transactions (with 20 confirmations or more)
* @param    {JSON}   txs            list of transactions
* @param    {number} block_height   current block height
* @returns  {JSON}                  list of valid transactions 
*/
function getValidTezosTxs(txs, block_height) {
    const res = txs.filter(x => block_height - x['block'] >= 20);
    console.log("Smartlink ICO API: " + res.length + " of " + txs.length + " valid Tezos transactions (20 or more block confirmations)");
    return res;
}


// Exporting the functions in order to be used as module's functions in other modules
module.exports = {
    getTezosTxs,
    parseTezosTxs,
    getTezosBlock,
    getValidTezosTxs
}