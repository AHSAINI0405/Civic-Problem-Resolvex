require('dotenv').config({ path: '../.env' });
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');

const connectDB = require('./config/db');
const socketService = require('./services/socketService');

// Route imports
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');
const deptRoutes = require('./routes/department');
const notifRoutes = require('./routes/notifications');
const aiRoutes = require('./routes/ai');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] },
});
socketService.initSocket(io);

// Connect DB
connectDB();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests, please try again later.' });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/department', deptRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Resolvex API is running', timestamp: new Date() }));

// SLA cron — check every hour for breached SLA
cron.schedule('0 * * * *', async () => {
  try {
    const Complaint = require('./models/Complaint');
    await Complaint.updateMany(
      { status: { $nin: ['resolved', 'rejected'] }, slaDeadline: { $lt: new Date() }, slaBreached: false },
      { slaBreached: true }
    );
    console.log('⏰ SLA breach check completed');
  } catch (err) {
    console.error('SLA cron error:', err.message);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Resolvex server running on port ${PORT} in ${process.env.NODE_ENV} mode`));
