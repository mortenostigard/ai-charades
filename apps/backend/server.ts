import { createServer } from 'http';

import { Server } from 'socket.io';

import { initializeSocketHandlers } from './src/socket/handlers';

// Create a standard Node.js HTTP server.
const httpServer = createServer();

// Attach Socket.IO to the HTTP server.
const io = new Server(httpServer, {
  // Configure CORS to allow connections from our Vercel-deployed frontend.
  // We use an environment variable to make this flexible for different environments.
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Initialize all our existing event handlers
initializeSocketHandlers(io);

// Define the port the server will listen on.
// Use the host's PORT environment variable, or default to 3001 for local testing.
const PORT = process.env.PORT || 3001;

// Start the server.
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
