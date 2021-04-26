// You can custom in this file the actions to perform

// Interfaces implementation
const config = require('../config/config.js');
const bitcoin = require('./transactions_listeners/bitcoin.js');
const ethereum = require('./transactions_listeners/ethereum.js');
const tezos = require('./transactions_listeners/tezos.js');
const revolut = require('./transactions_listeners/revolut.js');
const prices = require('./prices.js');
const mysql = require('./transactions_updaters/mysql.js');

// main function that calls functions from the different interfaces
async function task() {
    // gets Bitcoin transactions and sorts them
    const btc = await bitcoin.getBitcoinTxs();
    const pbtc = await bitcoin.parseBitcoinTxs(btc);
    const block = await bitcoin.getBitcoinBlock();
    const vbtc = await bitcoin.getValidBitcoinTxs(pbtc, block);

    // gets Ethereum transactions and sorts them
    const eth = await ethereum.getEthereumTxs();
    const peth = await ethereum.parseEthereumTxs(eth);
    const veth = await ethereum.getValidEthereumTxs(peth);

    // gets Tezos transactions and sorts them
    const xtz = await tezos.getTezosTxs();
    const pxtz = await tezos.parseTezosTxs(xtz);
    const xtzblock = await tezos.getTezosBlock();
    const vxtz = await tezos.getValidTezosTxs(pxtz, xtzblock);

    // gets Revolut transactions and sorts them
    const token = await revolut.connectRevolut();
    const txs = await revolut.getRevolutTxs(token);
    const ptxs = await revolut.parseRevolutTxs(txs);
    const [vusd, veur] = revolut.getValidRevolutTxs(ptxs);


    // gets last prices of BTC, ETH and XTZ in USD
    const last_prices = await prices.getPrices();

    // adds new transactions to the database
    const co = await mysql.connectToDb();
    const db_txs = await mysql.getDBTransactions(co);
    await mysql.addDBTransactions(co, db_txs, vbtc, "Bitcoin", last_prices.bitcoin);
    await mysql.addDBTransactions(co, db_txs, veth, "Ethereum", last_prices.ethereum);
    await mysql.addDBTransactions(co, db_txs, vxtz, "Tezos", last_prices.tezos);
    await mysql.addDBTransactions(co, db_txs, vusd, "Revolut (USD)", {"usd":1,"last_updated_at":new Date().setMilliseconds(0)/1000});
    await mysql.addDBTransactions(co, db_txs, veur, "Revolut (EUR)", {"usd":config.EUR_USD_RATE,"last_updated_at":new Date().setMilliseconds(0)/1000});
    mysql.endDbConnection(co);
}

// export the function to be used in other modules
module.exports.task = task;

// run the function if the file is called directly in node or npm run command
task();