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

async function updateNoICO(co, addresses) {
   const updateFlag = 'UPDATE dxd_smartlinkcopy SET No_ICO = "TRUE" WHERE sender_addr = ?';

   let index = 0;
   const addresses_nb = addresses.length;

   for (; index < addresses_nb; index++) {
       await co.query(updateFlag, addresses[index]).catch(error => {console.log(error)});
   }
}

async function main() {
    const connection = await connectToDb();
    await updateNoICO(connection, [])
    endDbConnection(connection)
}

main();