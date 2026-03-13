const fs = require('fs');
const logStream = fs.createWriteStream('./crash_diag.log', { flags: 'a' });

function log(msg) {
  const t = new Date().toISOString();
  console.log(`[${t}] ${msg}`);
  logStream.write(`[${t}] ${msg}\n`);
}

process.on('uncaughtException', (err) => {
  log('UNCAUGHT EXCEPTION: ' + err.message + '\n' + err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('UNHANDLED REJECTION: ' + reason);
  process.exit(1);
});

log('DEBUG: Attempting to require src/index.js');
try {
  require('./src/index.js');
  log('DEBUG: Successfully required src/index.js (server should be running)');
} catch (err) {
  log('DEBUG: CATCHED ERROR: ' + err.message + '\n' + err.stack);
}
