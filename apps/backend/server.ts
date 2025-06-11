import { createServer } from 'http';

import { config } from 'dotenv';
import { Server } from 'socket.io';

import { initializeSocketHandlers } from './src/socket/handlers';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Create a standard Node.js HTTP server.
const httpServer = createServer();

// Attach Socket.IO to the HTTP server.
const io = new Server(httpServer, {
  // Configure CORS to allow connections from our Vercel-deployed frontend.
  // We use an environment variable to make this flexible for different environments.
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['polling', 'websocket'],

  // Accept both `/socket.io` and `/socket.io/` endpoints
  addTrailingSlash: false,
});

// Add connection debugging
io.on('connection', socket => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.on('disconnect', reason => {
    console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
  });
});

// Initialize all our existing event handlers
initializeSocketHandlers(io);

// Define the port the server will listen on.
// Use the host's PORT environment variable, or default to 3001 for local testing.
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Start the server.
httpServer.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
  console.log(`🌐 Server accessible at: http://${HOST}:${PORT}`);
  console.log(
    `🌐 CORS origin: ${process.env.CLIENT_URL || 'http://localhost:3000'}`
  );
  console.log(`⚙️  Ping timeout: 20000ms, Ping interval: 25000ms`);
});
