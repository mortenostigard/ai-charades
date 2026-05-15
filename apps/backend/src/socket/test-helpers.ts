import { type AddressInfo } from 'net';
import { createServer, type Server as HttpServer } from 'http';

import { Server } from 'socket.io';
import { type Socket as ClientSocket, io as ioc } from 'socket.io-client';
import {
  type ClientToServerEvents,
  type ServerToClientEvents,
  type SocketData,
} from '@charades/shared';

import { gameLoopManager } from '../game/game-loop.js';

import { type HandlerTimings, initializeSocketHandlers } from './handlers.js';

export type TypedClientSocket = ClientSocket<
  ServerToClientEvents,
  ClientToServerEvents
>;

export type TestHarness = {
  port: number;
  httpServer: HttpServer;
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >;
  close: () => Promise<void>;
};

export async function createTestServer(
  timings?: Partial<HandlerTimings>
): Promise<TestHarness> {
  const httpServer = createServer();
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer);

  initializeSocketHandlers(io, timings);

  await new Promise<void>(resolve => httpServer.listen(0, resolve));
  const port = (httpServer.address() as AddressInfo).port;

  return {
    port,
    httpServer,
    io,
    close: async () => {
      gameLoopManager.reset();
      await io.close();
      await new Promise<void>(resolve => httpServer.close(() => resolve()));
    },
  };
}

export type ClientAuth = {
  playerId?: string;
  roomCode?: string;
  sessionToken?: string;
};

export function connectClient(
  port: number,
  auth?: ClientAuth
): TypedClientSocket {
  return ioc(`http://localhost:${port}`, {
    auth: auth ?? {},
    transports: ['websocket'],
    reconnection: false,
    forceNew: true,
  });
}

export function waitForConnect(socket: TypedClientSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('connect timeout')), 1000);
    socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once('connect_error', err => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export function waitFor<E extends keyof ServerToClientEvents>(
  socket: TypedClientSocket,
  event: E,
  timeoutMs = 1000
): Promise<Parameters<ServerToClientEvents[E]>[0]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timed out waiting for ${String(event)}`)),
      timeoutMs
    );
    socket.once(event as never, (payload: unknown) => {
      clearTimeout(timer);
      resolve(payload as Parameters<ServerToClientEvents[E]>[0]);
    });
  });
}

export function waitForConnectError(
  socket: TypedClientSocket,
  timeoutMs = 1000
): Promise<Error> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('expected connect_error did not arrive')),
      timeoutMs
    );
    socket.once('connect_error', err => {
      clearTimeout(timer);
      resolve(err);
    });
    socket.once('connect', () => {
      clearTimeout(timer);
      reject(new Error('connected unexpectedly'));
    });
  });
}

export function disconnectAll(...sockets: TypedClientSocket[]): void {
  for (const s of sockets) {
    if (s.connected) s.disconnect();
  }
}
