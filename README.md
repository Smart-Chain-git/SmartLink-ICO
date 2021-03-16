# Node js ico app 
[WIP]
This application has been built to handle an ICO and fulfill the following needs :
- fetch transactions received on several supports (blockchain and bank transfers)
- fetch the price of a currency in USD
- update a database with newly received transactions
- send tokens depending on the amount of a specific currency received at the end of the ICO (one time execution of the function)


This application can fetch transactions from different blockchains and bank APIs. 
Currently supported :
- Bitcoin (mainnet)
- Ethereum (mainnet and Ropsten testnet)
- Tezos (mainnet and Edo2net testnet)
- Revolut API (prod and sandbox)

For each blockchain protocol, a module has been developed and offers the following functionalities :
- fetch raw transactions from a public API for a specific address
- parse transactions to keep only usefull information
- sort transactions to keep only confirmed transactions (with a certain block height)


This application can update a database with newly received transactions.
Currently supported DBMS is :
- MySQL

## Project setup
``` bash
npm install
```

## Configure environment
### Create the database
We have a script to init a test database.
Follow instructions in /testset/readme.md to init empty database.

### Configure the variables
For development purpose, you can create a local env file called local.env under /config by copy/pasting the development.env file.
For production, use /config/template.env instead.
**If you are willing to push code to this repo, do not enter your addresses and token in the development.env or template.env files as they are not in the .gitignore**

Enter the BTC, ETH and XTZ addresses you want to fetch transactions from, in the env file.
**Note :** BTC testnet is currently not supported, therefore the development.env file refers to the mainnet BTC API

To fetch ETH transactions, you will have to get an Etherscan token (https://etherscan.io/apis)

For Revolut (prod and sandbox), you will have to proceed an OAuth authentication and generate a JWT (please refer to /src/transactions_listeners/revolut.md)
Tweak the variable EUR_USD_RATE to adjust to current rate for EUR transactions to be converted to USD.

Configure the database variables (host, user , password, db name).
**Note :** The tables and columns names are hardcoded (please refer to /src/testset/database.sql)


##  Run
For each following command, you can specify the env file to use by exporting the NODE_ENV variable (eg export NODE_ENV=development && npm run task)

### Task
The functions called are wrapped in a main function under /src/task.js
You can run this function like so :
``` bash
export NODE_ENV="fill with correct env name" && npm run task
```

### Schedule task
The application implements node-cron to schedule task. You can launch the following command to run /src/task.js every 20 minutes.
``` bash
export NODE_ENV="fill with correct env name" && npm run cronJob
```
You can adjust the time between 2 executions by modifying the cron expression in /src/cronJob.js (ie '0 */20 * * * *')


### Custom task
As all the functions called are wrapped in the main function under /src/task.js
If you want to add or remove an API call, you can just edit this function.


### Batch calls
``` bash
export NODE_ENV=development && npm run batch
```

### Originate contract
``` bash
export NODE_ENV=development && npm run originate
```

### Export database data to csv
``` bash
export NODE_ENV=development && npm run export
```