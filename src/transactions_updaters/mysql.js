/**
 * @module mysql-updater
 * @author Smart-Chain
 * @version 1.0.0
 * This module gives a few functions to insert data into mysql
 */

const config = require('../../config/config.js');	                //env variables
const mysql2 = require('mysql2/promise'); 			//used to communicate with the DB


/////////////////////////////////////////// MYSQL ///////////////////////////////////////////

/**
* Function that connects to the database, it takes parameters from config file
*/
async function connectToDb() {
    console.log("Smartlink ICO API: Connecting to the database...");
    const connection = await mysql2.createConnection({
        host: config.DB_HOST,
        user: config.DB_USER,
        password: config.DB_PASSWORD,
        database: config.DB_NAME
      }).catch(error => {console.log(error)});
      console.log("Smartlink ICO API: Database connected !");
    return connection;
}


/**
* Function that closes the connection to the database
* @param connection_to_end
*/
function endDbConnection(connection_to_end)
{
    console.log("Smartlink ICO API: Closing connection...");
    connection_to_end.end();
    console.log("Smartlink ICO API: Connection closed !");
}


/**
* Function that gets all the hashes of the transactions registered in the table "blockchain"
* @param    co  the current connection to the database
* @returns      hashes of transactions
*/
async function getDBTransactions(co) {

    console.log("Smartlink ICO API: Querying the database for the transactions hashes...");
    const [rows, fields] = await co.execute('SELECT tx_hash FROM dxd_blockchain').catch(error => {console.log(error)});

    if (rows === undefined){
        throw "ERROR Smartlink ICO API: no response from database";
    }

    const res = rows.map(x => { return x['tx_hash']});
    console.log("Smartlink ICO API: " + res.length + " transactions returned");
    return res;
}


/**
* Function that gets the timestamp of the last transaction of a specified type registered in the table "blockchain"
* @param    co      the current connection to the database
* @param    tx_type type of the transactions (BTC, ETH, XTZ, USD or EUR)
* @returns          last transaction timestamp
*/
async function getDBLastTransactionTimestamp(co, tx_type) {

    console.log("Smartlink ICO API: Querying the database for the last transaction timestamp...");

    // query to get the timestamp of the last transaction of a specified type
    const query = 'SELECT MAX(tx_date) FROM dxd_blockchain WHERE tx_type = ?';

    const [res, fields] = await co.query(query, tx_type).catch(error => {console.log(error)});

    if (res === undefined){
        throw "ERROR Smartlink ICO API: no response from database";
    }

    console.log("Smartlink ICO API: last transaction timestamp is : " + res);
    return res;
}


/**
* Function that adds new transactions in the database for a specific coin (BTC, ETH or XTZ),
* it compares the input transactions (txs) with the transactions already in the DB (db_txs),
* it adds the latest price in USD for each transaction
* @param    co      the current connection to the database
* @param    db_txs  transactions in the database
* @param    txs     list of transactions to be added
* @param    coin    the transaction's currency (for information purpose in the logs)
* @param    price   price in USD
*/
async function addDBTransactions(co, db_txs, txs, coin, price) {

    console.log("Smartlink ICO API: Adding new " + coin + " transactions to the database");
    
    // queries to insert data in the "blockchain" and "transactions" tables
    const insert_blockchain = 'INSERT INTO dxd_blockchain (tx_type, tx_hash, amount, price_dollar, tx_date, price_date) VALUES (?, ?, ?, ?, ?, ?)';
    const insert_transactions = 'INSERT INTO dxd_transactions (sender_addr, tx_hash) VALUES (?, ?)';

    let index = index2 = blockchain_counter = transactions_counter = 0;
    const txs_nb = txs.length;

    for (; index < txs_nb; index++) {
        
        // checks for each transaction to be added of the transaction is already in the database
        if (!db_txs.includes(txs[index].hash)) {
            
            // checks the type of transaction
            var tx_type;
            if (txs[index].receiver == config.BITCOINADDRESS){tx_type = "BTC";}
            if (txs[index].receiver == config.ETHEREUMADDRESS){tx_type = "ETH";}
            if (txs[index].receiver == config.TEZOSADDRESS){tx_type = "XTZ";}

            // if not present, adds the transactions in the blockchain table and updates associated counter
            await co.query(insert_blockchain, [tx_type, txs[index].hash, txs[index].amount, (price.usd).toString(), txs[index].timestamp, price.last_updated_at]).catch(error => {console.log(error)});
            blockchain_counter++;

            // iterates through the array of sender addresses (can only be > 1 for BTC because of UTxO model, = 1 for ETH and XTZ)
            let sender_addr_nb = txs[index].sender.length;
            for (index2 = 0; index2 < sender_addr_nb; index2++) {
                await co.query(insert_transactions, [txs[index].sender[index2], txs[index].hash]).catch(error => {console.log(error)});
                transactions_counter++;
            }
        }   
    }
    // shows counters of rows inserted for each tables
    console.log("Smartlink ICO API: " + blockchain_counter + " rows added in table blockchain");
    console.log("Smartlink ICO API: " + transactions_counter + " rows added in table transactions");
}


// Exporting the functions in order to be used as module's functions in other modules
module.exports = {
    connectToDb,
    endDbConnection,
    getDBTransactions,
    getDBLastTransactionTimestamp,
    addDBTransactions
}