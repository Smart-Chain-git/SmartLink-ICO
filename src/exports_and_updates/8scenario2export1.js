 const mysql2 = require('mysql2/promise');    // Used to communicate with the Database
 const Json2csvParser = require("json2csv").Parser; // Used to convert json to csv
 const fs = require("fs/promises") // Used to write/create files
 
 const config = require('../../config/config.js'); // Used to retrieve configuration variables
 
 const query = 'SELECT mail, @sender := sender_addr, reception_addr, FROM_UNIXTIME(validation_date) AS kyc_validation, (SELECT sum(b.amount*b.price_dollar) FROM dxd_transactions t INNER JOIN dxd_blockchain b ON b.tx_hash = t.tx_hash WHERE t.sender_addr = @sender AND b.tx_date < 1620234000) AS total_amount_usd FROM dxd_smartlinkcopy WHERE KYCStatus = "APPROVED" AND validation_date <= 1619197200 ORDER BY kyc_validation;';

////////////////////// DB ////////////////////////////////
 async function connectToDb() {
     const connection = await mysql2.createConnection({
         host: config.DB_HOST,
         user: config.DB_USER,
         password: config.DB_PASSWORD,
         database: config.DB_NAME
     }).catch(error => { console.log(error) });
     return connection;
 }
 function endDbConnection(connection_to_end) {
     connection_to_end.end();
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
     const [results, columns_def] = await connection.execute(query);
     if (results === undefined) {
         throw "ERROR Smartlink ICO API: no response from database";
     }
     return results
 }
 
 async function main() {
     const dir = './output';
     await fs.mkdir(dir, { recursive: true });
     const connection = await connectToDb();
     const data = await getData(connection, query)
     endDbConnection(connection)
 
     // Writing data into a file
     await writeToCSV(data, "scenario2export1")
 }
 
 main();