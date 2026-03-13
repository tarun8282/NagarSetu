const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'simple server ok' }));
});
server.listen(5000, '0.0.0.0', () => {
    console.log('Simple server running on port 5000');
});
