require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const gmailRoutes = require('./routes/gmail');
const aiRoutes = require('./routes/ai');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Routes
app.use('/auth', authRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Gmail push notification webhook (Pub/Sub)
app.post('/webhook/gmail', express.json(), (req, res) => {
  try {
    const message = req.body?.message;
    if (message?.data) {
      const decoded = Buffer.from(message.data, 'base64').toString('utf-8');
      const notification = JSON.parse(decoded);
      console.log('Gmail push notification:', notification);
      // Notify all connected clients to refresh
      io.emit('gmail:new_message', { emailAddress: notification.emailAddress });
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(200).json({ received: true });
  }
});

// WebSocket
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Real-time polling fallback (for when Pub/Sub isn't configured)
// Clients can call this to trigger a poll
app.post('/api/gmail/poll', async (req, res) => {
  const io = req.app.get('io');
  io.emit('gmail:poll_refresh');
  res.json({ triggered: true });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Mail App Backend running on http://localhost:${PORT}`);
  console.log(`📧 Gmail OAuth: http://localhost:${PORT}/auth/google`);
  console.log(`🤖 AI Assistant: http://localhost:${PORT}/api/ai/chat\n`);
});

module.exports = { app, server, io };