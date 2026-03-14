require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');
const { supabase } = require('./lib/supabase');

// ─── Express app ────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const PORT = 5050;

// ─── Socket.IO ──────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Attach io to app so routes can emit events
app.set('io', io);

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/alerts',     require('./routes/alerts'));
app.use('/api/cities',     require('./routes/cities'));
app.use('/api/states',     require('./routes/states'));
app.use('/api/mc',         require('./routes/mc'));

// ─── Health ─────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), port: PORT });
});

// ─── 404 ─────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error ────────────────────────────────────────────
app.use((err, req, res, _next) => {
    console.error('SERVER ERROR:', err);
    try { require('fs').appendFileSync('server_errors.log', `[${new Date().toISOString()}] ${req.method} ${req.url}\n${err.stack}\n\n`); } catch {}
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

// ─── Socket.IO connection ────────────────────────────────────
io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Client can join specific rooms for targeted broadcasts
    socket.on('join:city', (cityId) => {
        socket.join(`city:${cityId}`);
        console.log(`[Socket] ${socket.id} joined city:${cityId}`);
    });

    socket.on('join:state', (stateId) => {
        socket.join(`state:${stateId}`);
        console.log(`[Socket] ${socket.id} joined state:${stateId}`);
    });

    socket.on('join:citizen', (citizenId) => {
        socket.join(`citizen:${citizenId}`);
        console.log(`[Socket] ${socket.id} joined citizen:${citizenId}`);
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
});

// ─── Supabase Realtime → Socket.IO Bridge ────────────────────
// Listen for ANY change on complaints and broadcast to relevant rooms
const setupRealtimeBridge = () => {
    supabase
        .channel('server_complaints_listener')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'complaints' },
            (payload) => {
                const complaint = payload.new || payload.old;
                const eventName = `complaint:${payload.eventType.toLowerCase()}`; // complaint:insert / complaint:update / complaint:delete

                console.log(`[Realtime] ${payload.eventType} on complaint ${complaint?.id}`);

                // Broadcast to everyone (all dashboards)
                io.emit('complaint:change', { type: payload.eventType, data: complaint });

                // Targeted broadcasts
                if (complaint?.city_id) {
                    io.to(`city:${complaint.city_id}`).emit(eventName, complaint);
                }
                if (complaint?.state_id) {
                    io.to(`state:${complaint.state_id}`).emit(eventName, complaint);
                }
                if (complaint?.citizen_id) {
                    io.to(`citizen:${complaint.citizen_id}`).emit(eventName, complaint);
                }
            }
        )
        .subscribe((status) => {
            console.log(`[Realtime] Complaints channel status: ${status}`);
        });

    supabase
        .channel('server_alerts_listener')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'alerts' },
            (payload) => {
                const alert = payload.new;
                console.log(`[Realtime] New alert: ${alert?.id}`);
                io.emit('alert:new', alert);
                if (alert?.city_id)  io.to(`city:${alert.city_id}`).emit('alert:new', alert);
                if (alert?.state_id) io.to(`state:${alert.state_id}`).emit('alert:new', alert);
            }
        )
        .subscribe((status) => {
            console.log(`[Realtime] Alerts channel status: ${status}`);
        });
};

// ─── Start ───────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
    console.log(`🔌 Socket.IO ready`);
    setupRealtimeBridge();
});

module.exports = { app, io };
