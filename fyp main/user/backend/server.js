const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const { generalLimiter } = require('./middleware/rateLimiter');
const setupSocketIO = require('./utils/socketHandler');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://127.0.0.1:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

global.io = io;
const socketHandlers = setupSocketIO(io);
global.socketHandlers = socketHandlers;

app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors({
    // Allow both localhost and 127.0.0.1 during development to prevent CORS fetch failures.
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://127.0.0.1:3000'
    ],
  credentials: true
}));

app.use(generalLimiter);

app.use((req, res, next) => {
  req.io = io;
  req.socketHandlers = socketHandlers;
  next();
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'iVotePK API - Intelligent Voting System',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      vote: '/api/vote',
      elections: '/api/public',
      admin: '/api/admin'
    }
  });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/vote', require('./routes/voteRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║         iVotePK - Intelligent Voting System          ║
║                                                       ║
║  Server running on port ${PORT}                         ║
║  Environment: ${process.env.NODE_ENV || 'development'}                      ║
║                                                       ║
║  API Endpoints:                                       ║
║  - Auth:       /api/auth                             ║
║  - Vote:       /api/vote                             ║
║  - Public:     /api/public                           ║
║  - Admin:      /api/admin                            ║
║                                                       ║
║  Socket.IO: Real-time analytics enabled              ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
