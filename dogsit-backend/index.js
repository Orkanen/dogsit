require('dotenv').config({ path: './.env' });
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const ownerRoutes = require('./routes/owner');
const profileRoutes = require('./routes/profile');
const kennelRoutes = require('./routes/kennel');
const matchRoutes = require('./routes/match');
const chatRouter = require("./routes/chat");
const sittersRouter = require("./routes/sitters");

const app = express();
const server = http.createServer(app); // ← Use this instead of app
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite dev server
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// === ROUTES ===
app.get('/api/users', async (req, res) => {
  try {
    const data = await prisma.user.findMany();
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use('/auth', authRoutes);
app.use("/kennels", kennelRoutes);
app.use('/owner', ownerRoutes);
app.use('/profile', profileRoutes);
app.use('/match', matchRoutes);
app.use("/message", chatRouter);
app.use("/sitters", sittersRouter);

// === SOCKET.IO AUTH & CHAT LOGIC ===
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true }
    });
    if (!user) return next(new Error('Invalid token'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User ${socket.user.email} connected (socket.id: ${socket.id})`);

  socket.on('join-match', (matchId) => {
    socket.join(`match-${matchId}`);
    console.log(`${socket.user.email} joined match-${matchId}`);
  });

  socket.on('send-message', async ({ matchId, message }) => {
    if (!message?.trim()) return;

    try {
      const match = await prisma.match.findUnique({ where: { id: matchId } });
      if (!match) return;

      const isParticipant = match.ownerId === socket.user.id || match.sitterId === socket.user.id;
      if (!isParticipant) return;

      const msg = await prisma.message.create({
        data: {
          matchId,
          senderId: socket.user.id,
          message: message.trim(),
        },
        include: {
          sender: { select: { id: true, profile: { select: { firstName: true } } } },
        },
      });

      io.to(`match-${matchId}`).emit('new-message', msg);
    } catch (err) {
      console.error('Socket message error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.user.email} disconnected`);
  });
});

// === START SERVER ===
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`WebSocket ready`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});