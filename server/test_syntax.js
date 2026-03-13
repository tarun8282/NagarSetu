try {
  require('./src/routes/auth.js');
  require('fs').writeFileSync('syntax-ok.txt', 'OK');
} catch (err) {
  require('fs').writeFileSync('syntax-error.txt', err.toString() + '\\n' + err.stack);
}
