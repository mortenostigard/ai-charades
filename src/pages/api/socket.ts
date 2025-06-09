import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';

import type { NextApiRequest, NextApiResponse } from 'next';
import { Server as IOServer } from 'socket.io';

import { initializeSocketHandlers } from '@/lib/socket/handlers';

interface SocketServer extends HTTPServer {
  io?: IOServer;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const socketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    console.log('Socket is already running.');
  } else {
    console.log('Socket is initializing...');
    const io = new IOServer(res.socket.server, {
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    res.socket.server.io = io;
    initializeSocketHandlers(io);
  }
  res.end();
};

export default socketHandler;
