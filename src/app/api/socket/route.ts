import { Server as NetServer } from 'http';

import { NextRequest } from 'next/server';
import { Server as ServerIO } from 'socket.io';

import { registerSocketEvents } from './handlers';

let io: ServerIO | undefined;

export async function GET(req: NextRequest) {
  if (!io) {
    console.log('Initializing Socket.io server...');

    // Note: This is a Next.js specific pattern for Socket.io integration
    const httpServer: NetServer = (
      req as unknown as { socket: { server: NetServer } }
    ).socket.server;
    io = new ServerIO(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    registerSocketEvents(io);

    console.log('Socket.io server initialized');
  }

  return new Response('Socket.io server running', { status: 200 });
}
