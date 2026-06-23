require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
// Removed supabase require from here to avoid circular dependency
// const { createClient } = require('@supabase/supabase-js');

// Initialize Express
const app = express();
const PORT = 5050; // Changed from 5000 to avoid conflicts on Windows

// Middleware
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for easier debugging
}));
app.use(morgan('dev'));
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/cities', require('./routes/cities'));
app.use('/api/states', require('./routes/states'));
app.use('/api/mc', require('./routes/mc'));
app.use('/api/analytics', require('./routes/analytics'));


// Basic Route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), port: PORT });
});

// 404 Handler - MUST RETURN JSON
app.use((req, res) => {
    console.warn(`[404] ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found on this server.`,
        hint: 'Verify the API endpoint and method.'
    });
});

// Global Error Handler - MUST RETURN JSON
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    // Write to a log file so we can see it in this environment
    try {
        require('fs').appendFileSync('server_errors.log', `[${new Date().toISOString()}] ${req.method} ${req.url}\n${err.stack}\n\n`);
    } catch (e) { }

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start Server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is strictly running on http://127.0.0.1:${PORT}`);
    console.log(`Health check available at http://127.0.0.1:${PORT}/health`);
});

module.exports = app;
