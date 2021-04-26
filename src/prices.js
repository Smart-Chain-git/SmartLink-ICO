// Used to send HTTP requests
const axios = require('axios');


/////////////////////////////////////////// PRICES ///////////////////////////////////////////

/**
* Function that gets the last values with their timestamps of BTC, ETH and XTZ against USD
* @returns  {JSON} 		- list of transactions
*/
async function getPrices() {
    console.log("Smartlink ICO API: fetching latest coins prices...");
    axios.defaults.baseURL = "https://api.coingecko.com";
    const url = "/api/v3/simple/price?ids=bitcoin%2Cethereum%2Ctezos&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=true";
    const apiResp = await axios.get(url).catch(error => {console.log(error)});
    console.log("Smartlink ICO API: latest coins prices :");
    console.log("Bitcoin : " + apiResp.data.bitcoin.usd + " $ (" + new Date(apiResp.data.bitcoin.last_updated_at*1000) + ")");
    console.log("Ethereum : " + apiResp.data.ethereum.usd + " $ (" + new Date(apiResp.data.ethereum.last_updated_at*1000) + ")");
    console.log("Tezos : " + apiResp.data.tezos.usd + " $ (" + new Date(apiResp.data.tezos.last_updated_at*1000) + ")");
    return apiResp.data;
}


module.exports.getPrices = getPrices;