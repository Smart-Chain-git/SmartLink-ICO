const task = require('./task.js');

var CronJob = require('cron').CronJob;

// runs the job every 20 minutes
var job = new CronJob('0 */20 * * * *',function(){
  task.task();
}, null, true, 'Europe/Paris');

job.start();
