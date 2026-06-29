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
const interviewRooms = {}; // Track interview participants

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

  // --- Interview Mode Events ---
  socket.on('interview-join', ({ roomId, userId, username }) => {
    socket.join(`interview-${roomId}`);
    console.log(`User ${username} (${userId}) joined interview-${roomId}`);
    
    if (!interviewRooms[roomId]) {
      interviewRooms[roomId] = { players: [], currentQuestion: null };
    }
    
    let role = 'Guest';
    // First person to join is Host
    if (interviewRooms[roomId].players.length === 0) {
      role = 'Host';
    }
    
    if (!interviewRooms[roomId].players.find(p => p.userId === userId)) {
      interviewRooms[roomId].players.push({ userId, username, socketId: socket.id, role });
    } else {
      // Re-joining? Get existing role
      const existingUser = interviewRooms[roomId].players.find(p => p.userId === userId);
      role = existingUser.role;
    }

    // Tell the joining user their assigned role
    socket.emit('interview-role-assigned', { role });

    // Check how many people are in the room
    const clients = io.sockets.adapter.rooms.get(`interview-${roomId}`);
    const numClients = clients ? clients.size : 0;

    if (numClients >= 2) {
      // Both Host and Guest are here
      io.in(`interview-${roomId}`).emit('interview-started', {
        players: interviewRooms[roomId].players,
        currentQuestion: interviewRooms[roomId].currentQuestion
      });
    }
  });

  socket.on('interview-set-question', ({ roomId, question }) => {
    if (interviewRooms[roomId]) {
      interviewRooms[roomId].currentQuestion = question;
      io.in(`interview-${roomId}`).emit('interview-question-updated', { question });
    }
  });

  socket.on('interview-code-sync', ({ roomId, userId, sourceCode, language }) => {
    socket.to(`interview-${roomId}`).emit('interview-code-update', {
      userId,
      sourceCode,
      language
    });
  });

  socket.on('cursor-highlight', ({ roomId, userId, lineNumber }) => {
    socket.to(`interview-${roomId}`).emit('cursor-highlighted', {
      userId,
      lineNumber
    });
  });

  socket.on('send-nudge', ({ roomId, hint }) => {
    socket.to(`interview-${roomId}`).emit('receive-nudge', {
      hint
    });
  });

  socket.on('end-session', ({ roomId, finalRubric, status, notes, finalCode }) => {
    io.in(`interview-${roomId}`).emit('session-ended', {
      finalRubric,
      status,
      notes,
      finalCode
    });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
