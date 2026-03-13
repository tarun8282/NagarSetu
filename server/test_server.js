const fs = require('fs');
const path = require('path');

function log(msg) {
    const t = new Date().toISOString();
    const line = `[${t}] ${msg}\n`;
    fs.appendFileSync('server_check.log', line);
    console.log(line);
}

log('Starting server check...');

try {
    log('Checking for .env file...');
    if (fs.existsSync('.env')) {
        log('.env exists');
    } else {
        log('.env DOES NOT EXIST');
    }

    log('Checking node_modules...');
    if (fs.existsSync('node_modules')) {
        log('node_modules exists');
    } else {
        log('node_modules DOES NOT EXIST');
    }

    log('Attempting to load Express...');
    const express = require('express');
    log('Express loaded');

    log('Attempting to load routes...');
    require('./src/routes/auth');
    log('Routes loaded');

    log('All checks passed. Server should be able to start.');
} catch (err) {
    log('ERROR: ' + err.message);
    log('STACK: ' + err.stack);
}
