/**
* Function that selects only new transactions by comparing the timestamp of the transactions with the last update timestamp
* @param    {JSON}   txs                list of transactions
* @param    {number} tx_type            type (BTC, ETH, XTZ, EUR, USD)
* @param    {number} last_updated_at    timestamp of last update
* @returns  {JSON}                      list of new transactions 
*/
function getLastTransactions(txs, tx_type, last_updated_at) {
    const res = txs.filter(x => x['timestamp'] >= last_updated_at);
    console.log("Smartlink ICO API: " + (res.length - 1) + " new " + tx_type + " transactions");
    return res;
}


module.exports.getLastTransactions = getLastTransactions;