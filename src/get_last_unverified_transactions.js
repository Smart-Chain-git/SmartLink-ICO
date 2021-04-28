// You can custom in this file the actions to perform

// Interfaces implementation
const bitcoin = require('./transactions_listeners/bitcoin.js');
const ethereum = require('./transactions_listeners/ethereum.js');
const tezos = require('./transactions_listeners/tezos.js');
//const revolut = require('./transactions_listeners/revolut.js');
const prices = require('./prices.js');
const tools = require('./tools.js');
const mysql = require('./transactions_updaters/mysql_unverified.js');

// main function that calls functions from the different interfaces
async function task() {
    // gets Bitcoin transactions and sorts them
    const btc = await bitcoin.getBitcoinTxs();
    const pbtc = await bitcoin.parseBitcoinTxs(btc);

    // gets Ethereum transactions and sorts them
    const eth = await ethereum.getEthereumTxs();
    const peth = await ethereum.parseEthereumTxs(eth);

    // gets Tezos transactions and sorts them
    const xtz = await tezos.getTezosTxs();
    const pxtz = await tezos.parseTezosTxs(xtz);

    // gets last prices of BTC, ETH and XTZ in USD
    const last_prices = await prices.getPrices();

    // gets timestamps of last transactions
    const co1 = await mysql.connectToDb();
    const btc_ts = await mysql.getDBLastTransactionTimestamp(co1, "BTC");
    const eth_ts = await mysql.getDBLastTransactionTimestamp(co1, "ETH");
    const xtz_ts = await mysql.getDBLastTransactionTimestamp(co1, "XTZ");
    mysql.endDbConnection(co1);

    // selects only new transactions
    const nbtc = tools.getLastTransactions(pbtc, "BTC", btc_ts);
    const neth = tools.getLastTransactions(peth, "ETH", eth_ts);
    const nxtz = tools.getLastTransactions(pxtz, "XTZ", xtz_ts);

    // adds new transactions to the database
    const co2 = await mysql.connectToDb();
    const db_txs = await mysql.getDBTransactions(co2);
    await mysql.addDBTransactions(co2, db_txs, nbtc, "Bitcoin", last_prices.bitcoin);
    await mysql.addDBTransactions(co2, db_txs, neth, "Ethereum", last_prices.ethereum);
    await mysql.addDBTransactions(co2, db_txs, nxtz, "Tezos", last_prices.tezos);
    mysql.endDbConnection(co2);
}

// export the function to be used in other modules
module.exports.task = task;

// run the function if the file is called directly in node or npm run command
task();