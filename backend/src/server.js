require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

const PORT = process.env.PORT || 3000;

// Create HTTP server instead of relying purely on Express app.listen
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // For development. Update in prod.
    methods: ['GET', 'POST']
  }
});

const roomPlayers = {}; // Track players per room

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join-room', ({ roomId, userId, username }) => {
    socket.join(`room-${roomId}`);
    console.log(`User ${username} (${userId}) joined room-${roomId}`);
    
    // Track players
    if (!roomPlayers[roomId]) roomPlayers[roomId] = [];
    if (!roomPlayers[roomId].find(p => p.userId === userId)) {
      roomPlayers[roomId].push({ userId, username, socketId: socket.id });
    }

    // Check how many people are in the room
    const clients = io.sockets.adapter.rooms.get(`room-${roomId}`);
    const numClients = clients ? clients.size : 0;

    if (numClients >= 2) {
      // If 2 or more players are in the room, tell everyone to start the match!
      io.in(`room-${roomId}`).emit('match-started', {
        players: roomPlayers[roomId],
        message: 'Match is starting!'
      });
    }

    // Notify others in the room for the opponent radar
    socket.to(`room-${roomId}`).emit('player-joined', {
      userId,
      username,
      message: `${username} has joined the match!`
    });
  });

  socket.on('code-sync', ({ roomId, userId, sourceCode }) => {
    socket.to(`room-${roomId}`).emit('code-update', {
      userId,
      sourceCode
    });
  });

  socket.on('submit-sync', ({ roomId, userId, status, message }) => {
    socket.to(`room-${roomId}`).emit('submission-status', {
      userId,
      status,
      message
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
