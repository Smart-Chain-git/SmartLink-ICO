/**
 * @module smart-link-ICO
 * @author Smart-Chain
 * @version 1.0.0
 * This module exports data from database and writes it into a csv file
 */

const mysql2 = require('mysql2/promise');    // Used to communicate with the Database
const Json2csvParser = require("json2csv").Parser; // Used to convert json to csv
const fs = require("fs/promises") // Used to write/create files

const config = require('../../config/config.js'); // Used to retrieve configuration variables

/** 
 * Retrieves information about participants that validated the kyc but did not send any funds
 * Information retrieved: kyc id, sender address type, sender address, reception address and mail
 */
const export_only_kyc = "SELECT id_kyc, addr_type, k.sender_addr, reception_addr,  mail  FROM kyc k LEFT JOIN transactions t ON t.sender_addr = k.sender_addr WHERE tx_hash IS NULL";

/**
 * Retrieves information about participants that sent funds but did not pass the kyc
 * Information retrieved: sender address, transaction hash
 */
const export_only_transactions = "SELECT temp2.sender_addr, temp2.tx_hash FROM (SELECT t.sender_addr, b.tx_hash FROM transactions t INNER JOIN kyc k ON k.sender_addr = t.sender_addr INNER JOIN blockchain b ON b.tx_hash = t.tx_hash) temp1 RIGHT JOIN (SELECT t.sender_addr, tx_hash FROM kyc k RIGHT JOIN transactions t ON k.sender_addr = t.sender_addr WHERE k.sender_addr IS NULL) temp2 on temp1.tx_hash = temp2.tx_hash WHERE temp1.sender_addr IS NULL";
/**
 * Retrieves the operation hashes of the sending smak & freeze account transactions
 * Information retrieved: sender address, transaction hash
 */
const export_smak_transactions = "SELECT is_smak_sent FROM kyc WHERE is_smak_sent IS NOT NULL GROUP BY is_smak_sent";

/////////////////////////////////////////// DATABASE ///////////////////////////////////////////

/**
* Function that connects to the database, it takes parameters from config file
* @returns  - database connection
*/
async function connectToDb() {
    console.log("Smartlink ICO API: Connecting to the database...");
    const connection = await mysql2.createConnection({
        host: config.DB_HOST,
        user: config.DB_USER,
        password: config.DB_PASSWORD,
        database: config.DB_NAME
    }).catch(error => { console.log(error) });

    return connection;
}

/**
* Function that closes the connection to the database
* @param connection_to_end - database connection to end
*/
function endDbConnection(connection_to_end) {
    console.log("Smartlink ICO API: Closing connection");
    connection_to_end.end();
    console.log("Smartlink ICO API: Connection closed !");
}

/////////////////////////////////////////// EXPORTING DATA TO CSV ///////////////////////////////////////////

/**
 * Function that converts the given JSON to a CSV, then writes it into a file
 * @param {Object} data - data retrieved from the database, to convert into CSV and write into a file
 * @param {string} file_name - name of the output csv file
 */
async function writeToCSV(data, file_name) {
    // Parsing the retrieved data object from the database into a JSON
    const jsonData = JSON.parse(JSON.stringify(data));

    if (jsonData.length < 1) {
        console.log("Smartlink ICO API: Nothing to write to " + file_name + ".csv !");
    }
    else {
        // Converting the json to a csv
        const json2csvParser = new Json2csvParser({ header: true });
        const csv = json2csvParser.parse(jsonData);

        // Writing the csv into a file
        await fs.writeFile("output/" + file_name + ".csv", csv);
        console.log("Smartlink ICO API: Write to " + file_name + ".csv successfully!");
    }


}

/**
 * Function that queries the database
 * @param {Object} data - data retrieved from the database, to convert into CSV and write into a file
 * @param {string} file_name - name of the output csv file
 */
async function getData(connection, query) {
    // Querying the database for participants and their invested amounts
    console.log("Smartlink ICO API: Querying the database...");
    const [results, columns_def] = await connection.execute(query);

    if (results === undefined) {
        throw "ERROR Smartlink ICO API: no response from database";
    }

    if (results.length < 1) {
        console.log("Smartlink ICO API: No data to export!")
    }

    return results
}

async function main() {
    const dir = './output';

    // Creating the output directory
    await fs.mkdir(dir, { recursive: true });
    console.log("Directory is created.");

    // Connecting to database
    const connection = await connectToDb();

    // Querying the database
    const kyc_data = await getData(connection, export_only_kyc)
    const transactions_data = await getData(connection, export_only_transactions)
    const smak_operations_data = await getData(connection, export_smak_transactions)

    // Ending the connection
    endDbConnection(connection)

    // Writing data into a file
    await writeToCSV(kyc_data, "kyc")
    await writeToCSV(transactions_data, "transactions")
    await writeToCSV(smak_operations_data, "smak_transactions")
}

main();