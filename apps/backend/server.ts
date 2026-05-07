import { createServer } from 'http';

import { config } from 'dotenv';
import { Server } from 'socket.io';
import {
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from '@charades/shared';

import { initializeSocketHandlers } from './src/socket/handlers.js';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Parse CLIENT_URL: comma-separated list, each entry can use `*` as a wildcard.
// Examples:
//   CLIENT_URL=http://localhost:3000
//   CLIENT_URL=https://charades-directors-cut.vercel.app,https://charades-directors-cut-*.vercel.app
const allowedOriginPatterns = (
  process.env.CLIENT_URL || 'http://localhost:3000'
)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOriginRegexes = allowedOriginPatterns.map(pattern => {
  if (!pattern.includes('*')) {
    return { exact: pattern };
  }
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return { regex: new RegExp(`^${escaped}$`) };
});

const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true; // non-browser (e.g. server-to-server, native clients)
  return allowedOriginRegexes.some(o =>
    'exact' in o ? o.exact === origin : o.regex.test(origin)
  );
};

// Create the HTTP server with a /health endpoint for platform health checks.
// All other paths fall through to Socket.IO's upgrade handling.
const httpServer = createServer((req, res) => {
  if (req.url === '/health' || req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }
  // Anything that isn't a Socket.IO handshake/upgrade hits this fallthrough.
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['polling', 'websocket'],
  addTrailingSlash: false,
  // Buffers missed packets and restores socket state (id, rooms, data) when a
  // client reconnects within the window. Covers brief disconnects (network
  // blips, app backgrounding, transport switches). The custom rejoin_room
  // handler remains the fallback for longer disconnects, server restarts,
  // and tab-close scenarios where the socket id is gone client-side.
  // https://socket.io/docs/v4/connection-state-recovery
  connectionStateRecovery: {
    maxDisconnectionDuration: 3 * 60 * 1000,
    skipMiddlewares: true,
  },
});

io.on('connection', socket => {
  console.log(
    `🔌 Client ${socket.recovered ? 'recovered' : 'connected'}: ${socket.id}`
  );

  socket.on('disconnect', reason => {
    console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
  });
});

initializeSocketHandlers(io);

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
  console.log(`🌐 Server accessible at: http://${HOST}:${PORT}`);
  console.log(`🌐 CORS allowed origins: ${allowedOriginPatterns.join(', ')}`);
  console.log(`⚙️  Ping timeout: 20000ms, Ping interval: 25000ms`);
});
