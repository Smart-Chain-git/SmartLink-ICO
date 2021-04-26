/**
 * @module revolut-listener
 * @author Smart-Chain
 * @version 1.0.0
 * This module gives a few functions to fetch transactions from the Revolut API
 */

 const config = require('../../config/config.js');	//env variables
 const axios = require('axios');				    //used to send HTTP requests



 /////////////////////////////////////////// REVOLUT API ///////////////////////////////////////////

/**
* Function that uses the refresh token to get a new access token from the Revolut API,
* takes parameters from config file
* @returns  {string}  Revolut API access token 
*/
async function connectRevolut() {
    console.log("Smartlink ICO API: Refreshing connection to Revolut API...");
    axios.defaults.baseURL = config.REVOLUT_API;
	const url = "/api/1.0/auth/token";
    const options = {
        grant_type: 'refresh_token',
        refresh_token: config.REVOLUT_REFRESH_TOKEN,
        client_id: config.REVOLUT_CLIENT_ID,
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        client_assertion: config.REVOLUT_JWT
    };
    const encodeForm = (data) => {
        return Object.keys(data)
            .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
            .join('&');
      }
    const apiResp = await axios.post(url, encodeForm(options), {headers: {'Accept': 'application/json'}}).catch(error => {console.log(error)});
    console.log("Smartlink ICO API: Connected to Revolut API, new access token : " + apiResp.data.access_token);
	return apiResp.data.access_token;
};


/**
* Function that gets the details of the transactions received on the Revolut accounts (all accounts linked to the client),
* @param    {string}    access_token    to the Revolut API
* @returns  {JSON}                      list of transactions 
*/
async function getRevolutTxs(access_token) {
    console.log("Smartlink ICO API: Fetching Revolut transactions...");
    axios.defaults.baseURL = config.REVOLUT_API;
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
	const url = "/api/1.0/transactions?type=transfer";
	const apiResp = await axios.get(url).catch(error => {console.log(error)});
    console.log("Smartlink ICO API: " + apiResp.data.length + " transactions fetched");
	return apiResp.data;
};


/**
* Function that extracts usefull information about the Revolut transactions :
*   - sender identified by the reference of the transfer (has to be unique for each sender)
*   - amount received
*   - currency
*   - timestamp of the transaction
*   - hash of the transaction for further analysis
* @param    {JSON} txs  transactions with full details
* @returns  {JSON}      transactions with important information only
*/
function parseRevolutTxs(txs) {
    const res = txs.map(x => {
        return {
                    "sender": [x['reference']],
                    "amount": (x['legs'][0]['amount']).toString(),
                    "currency": x['legs'][0]['currency'],
                    "timestamp": new Date(x['completed_at']).setMilliseconds(0)/1000,
                    "hash": x['id']
                }
    });
    return res;
}


/**
* Function that selects only valid Revolut transactions for which the field timestamp is not NaN and returns USD and EUR transactions separately
* @param    {JSON}          txs                 list of transactions
* @returns  {JSON, JSON}    usd txs, eur txs    lists of valid USD and EUR transactions 
*/
function getValidRevolutTxs(txs) {
    const res = txs.filter(x => !!x['timestamp']);
    console.log("Smartlink ICO API: " + res.length + " of " + txs.length + " valid Revolut transactions (that have been completed)");
    const usd_txs = res.filter(x => x['currency'] == "USD");
    console.log("Smartlink ICO API: " + usd_txs.length + " USD transactions");
    const eur_txs = res.filter(x => x['currency'] == "EUR");
    console.log("Smartlink ICO API: " + eur_txs.length + " EUR transactions");
    return [usd_txs, eur_txs];
}


// Exporting the functions in order to be used as module's functions in other modules
module.exports = {
    connectRevolut,
    getRevolutTxs,
    parseRevolutTxs,
    getValidRevolutTxs
}
