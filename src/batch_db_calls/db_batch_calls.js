/**
 * @module smart-link-ICO
 * @author Smart-Chain
 * @version 1.0.0
 * This module retrives the list of reception addresses and their SMAK amounts, devides it in batches and sends batched transactions to the Tezos Blockchain. 
 */

const mysql2 = require('mysql2/promise');    // Used to communicate with the Database
const taquito = require("@taquito/taquito");    // Used to communicate with the Tezos Blockchain
const signer = require("@taquito/signer");      // Used to be able to interact with all the functions requiring signing in
const config = require('../../config/config.js');

const Tezos = new taquito.TezosToolkit(config.RPC_ADDRESS);     // Connexion to the desired Tezos Network

/** 
 * Retrieves information about participants awaiting SMAKs that validated the kyc and sent funds
 * Information retrieved: reception address, total invested amount in dollar
 */
const get_participants_and_their_amount = 'SELECT reception_addr, sum(amount*price_dollar) AS total_amount FROM transactions t INNER JOIN kyc k ON k.sender_addr = t.sender_addr INNER JOIN blockchain b ON b.tx_hash = t.tx_hash where is_smak_sent IS NULL  GROUP BY reception_addr'

/** 
 * Updates the kyc table with the operation hash corresponding to the transaction made to send smaks to investor
 * Information updated: is_smak_sent
 */
const set_sent_smak = 'UPDATE kyc  SET is_smak_sent = ? WHERE reception_addr LIKE ?';

// Import the signer account
signer.importKey(
    Tezos, 
    config.SIGNER_EMAIL, 
    config.SIGNER_PASSWORD, 
    config.SIGNER_MNEMONIC, 
    config.SIGNER_SECRET
); 

/**
* Function that connects to the database, it takes parameters from config file
* @returns  - database connection
*/
async function connectToDb()
{
    console.log("Smartlink ICO API: Connecting to the database...");
    const connection = await mysql2.createConnection({
        host: config.DB_HOST,
        user: config.DB_USER,
        password: config.DB_PASSWORD,
        database: config.DB_NAME
      })
      .catch(error => {console.log(error)});

    return connection;
}

/**
* Function that closes the connection to the database
* @param connection_to_end - database connection to end
*/
function endDbConnection(connection_to_end)
{
    console.log("Smartlink ICO API: Closing connection");
    connection_to_end.end();
    console.log("Smartlink ICO API: Connection closed !");
}


/**
* Queries the database and divides the retrieved data into batches
* @return - queried data in batches
*/
async function getBatchesFromDb(connection)
{

    // Querying the database for participants and their invested amounts
    console.log("Smartlink ICO API: Querying the database...");
    const [results, columns_def] = await connection.execute(get_participants_and_their_amount);	
   

    if (results === undefined){
        throw "ERROR Smartlink ICO API: no response from database";
    }

    if(results.length < 1)
    { 
        console.log("Smartlink ICO API: No data to handle!")
    }

    // Batching the results
    const data_batches = await chunk(results, config.TRANSACTIONS_PER_BATCH);

    return data_batches;
}

/**
* Updates the kyc table in the SmartLink database with the transaction operation hash of the transferAndFreeze entrypoint call
* @param connection   - contract object to which the calls are going to be made
* @param  {Object} data	- one batch of data retrieved from the database
* @param  {string} tx_hash - transaction hash to be written in the database
* @return - batch of contract calls ready to be sent
*/
async function updateKycWithTxHash(connection, data, tx_hash)
{
    // For a batch, get the reception address, and update the kyc table accordingly
    for(var i = 0; i < data.length; i++)
    {
        await connection.query(set_sent_smak, [tx_hash, data[i].reception_addr]).catch(error => {console.log(error)});
    }
}

/**
* Computes Freeze Duration, substraction between the final date and today's date
* @param contract   - contract object to which the calls are going to be made
* @param  {Object} data	- one batch of data retrieved from the database
* @return - batch of contract calls ready to be sent
*/
async function prepareBatchToSendToBlockchain(contract, data)
{
    // Init batch
    const batch = await Tezos.batch();
    
    // Add transactions to send to the batch
    for(var i = 0; i < data.length; i++)
    {
        // Computing the SMAK amount to send
        var smakAmount = computeSmakAmount(data[i].total_amount)
        
        // Computing the Freeze Duration
        var duration = computeFreezeDuration()

        // Add to batch the transfer and Freeze transaction call
        batch.withContractCall(
            contract.methods.transferAndFreeze(
                data[i].reception_addr,
                smakAmount,
                duration
            )
        )
    }

    return batch;
}

/////////////////////////////////////////// BLOCKCHAIN  ///////////////////////////////////////////
/**
* Computes Freeze Duration, substraction between the final date and today's date
* @param connection   - database connection
* @param  {Object} data_batch	- data in batches retrieved from the database
*/
async function sendBatchesToBlockchain(connection, data_batch)
{
    // Get the contract
    const contract = await Tezos.contract.at(config.CONTRACT_ADDRESS);

    // Prepare the batch to send
    for(var i = 0; i < data_batch.length; i++)
    {
        // Preparing the Batch of transactions to sesnd to Blockchain
        console.log("Smartlink ICO API: Preparing the batch n° ", i);
        const batch = await prepareBatchToSendToBlockchain(contract, data_batch[i])
        
        // Send the batch
        console.log("Smartlink ICO API: Sending the batch n° ", i);
        const batchOp = await batch.send().catch(error => {
            console.log(error)
        });
        
        // Wait for batch confirmation
        await batchOp.confirmation();
        console.log("Smartlink ICO API: The operation of the batch n° "+i+" is confirmed! The hash of the operation is "+ batchOp.hash);

        // Update the database with the new batch transaction hash
        console.log("Smartlink ICO API: Now updating the database...");
        await updateKycWithTxHash(connection, data_batch[i], batchOp.hash).catch(error => {console.log(error)});
        console.log("Smartlink ICO API: Database updated! Finished processing batch n° "+i+".");
    }
}

/////////////////////////////////////////// UTILITY FUNCTIONS ///////////////////////////////////////////
/**
* Computes Freeze Duration, substraction between the final date and today's date
* @param {Number} dollarPrice   - price in dollar invested by an investor
* @returns  {Number} 	- smak amount that must be sent to the investor
*/
function computeSmakAmount(dollarPrice){
    const smakPriceEur = config.SMAK_VALUE
    const smakAccuracy = config.SMAK_ACCURACY
    var smakAmount = Math.ceil(dollarPrice / smakPriceEur * smakAccuracy)

    return smakAmount
}

/**
* Computes Freeze Duration, substraction between the final date and today's date
* @returns  {Number} 	- duration in seconds between now and the final date of the ICO
*/
function computeFreezeDuration(){
    // Set the final date
    const finalDate = new Date(config.ICO_DEADLINE)
    
    // This operation returns the number of milliseconds between the two dates
    // If it is negative, this means that the finalDate has expired, so the account needs to be freezed for a default duration
    var datesDiff = finalDate - Date.now()
    
    // Default duration of the freeze
    var duration = 1

    // Compute the duration in seconds
    if(datesDiff >0){
        duration = Math.ceil(datesDiff/1000)
    }
    
    return duration
}

/**
* Function that chunks an array in chunks of a certain size,
* @param    {Array} array	- array to chunk
* @param    {Number} size	- size of the chunks
* @returns  {Array[Array]} 	- array contening the chunks
*/

function chunk(array, size) {
	const chunked_arr = [];
	let copied = [...array]; // ES6 destructuring
	const numOfChild = Math.ceil(copied.length / size); // Round up to the nearest integer
	for (let i = 0; i < numOfChild; i++) {
		chunked_arr.push(copied.splice(0, size));
	}
	return chunked_arr;
}

async function main()
{
    // Connect to the database
    const connection = await connectToDb()

    // Query the database and retrieve the data in batches
    const data_in_batches = await getBatchesFromDb(connection);

    // Send data to Tezos Blockchain
    await sendBatchesToBlockchain(connection, data_in_batches);

    // End the database connection
    endDbConnection(connection)
}

main();