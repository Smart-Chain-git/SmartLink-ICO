const task = require('./get_last_transactions.js');
const task2 = require('./get_last_unverified_transactions.js');

var CronJob = require('cron').CronJob;

// runs the job every 20 minutes
var job = new CronJob('0 */20 * * * *',function(){
  task.task();
}, null, true, 'Europe/Paris');

job.start();

// runs the job every minutes
var job2 = new CronJob('0 * * * * *',function(){
  task2.task();
}, null, true, 'Europe/Paris');

job2.start();