 const mysql2 = require('mysql2/promise');    // Used to communicate with the Database
 
 const config = require('../../config/config.js'); // Used to retrieve configuration variables
 
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
 
 async function updateSMAKamounts(co, addresses) {
    const get_amount_usd = 'SELECT sum(b.amount*b.price_dollar) FROM dxd_transactions t INNER JOIN dxd_blockchain b ON b.tx_hash = t.tx_hash WHERE t.sender_addr = ? AND b.tx_date >= 1620234000';
    const getpreviousSMAK = 'SELECT SMAK FROM dxd_smartlinkcopy WHERE sender_addr = ?'
    const updateSMAK = 'UPDATE dxd_smartlinkcopy SET SMAK = ? WHERE sender_addr = ?';
    const updateSMAK_ICO = 'UPDATE dxd_smartlinkcopy SET SMAK_ico = ? WHERE sender_addr = ?';

    let index = 0;
    const addresses_nb = addresses.length;

    for (; index < addresses_nb; index++) {
        var [res, fields] = await co.query(get_amount_usd, addresses[index]).catch(error => {console.log(error)});
        var [res2, fields] = await co.query(getpreviousSMAK, addresses[index]).catch(error => {console.log(error)});
        var smak = computeSmakAmount(res);
        var total_smak;
        if (!!res2) {
            total_smak = smak + res2;
        }
        else{
            total_smak = smak;
        }
        await co.query(updateSMAK, [total_smak, addresses[index]]).catch(error => {console.log(error)});
        await co.query(updateSMAK_ICO, [smak, addresses[index]]).catch(error => {console.log(error)});
    }
}
 

function computeSmakAmount(dollarPrice) {
    const smakPriceEur = config.SMAK_ICO
    var smakAmount = Math.ceil(dollarPrice / smakPriceEur)
    return smakAmount
}

 async function main() {
     const connection = await connectToDb();
     const data = await updateSMAKamounts(connection, [])
     endDbConnection(connection)
 }
 
 main();