import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { SABOTAGE_ACTIONS } from '../game/data/sabotages.js';
import { roomStore } from '../game/room-store.js';

import {
  type ClientAuth,
  type TestHarness,
  type TypedClientSocket,
  connectClient,
  createTestServer,
  disconnectAll,
  waitFor,
  waitForConnect,
  waitForConnectError,
} from './test-helpers.js';

const TIMINGS = { lobbyDisconnectRemovalMs: 50, abandonmentTimeoutMs: 500 };

let harness: TestHarness;
const tracked: TypedClientSocket[] = [];

function client(auth?: ClientAuth): TypedClientSocket {
  const c = connectClient(harness.port, auth);
  tracked.push(c);
  return c;
}

async function createRoom(playerName: string) {
  const c = client();
  await waitForConnect(c);
  const created = waitFor(c, 'room_created');
  c.emit('create_room', { playerName });
  const payload = await created;
  return { socket: c, ...payload };
}

async function joinRoom(roomCode: string, playerName: string) {
  const c = client();
  await waitForConnect(c);
  const joined = waitFor(c, 'room_joined');
  c.emit('join_room', { roomCode, playerName });
  const payload = await joined;
  return { socket: c, ...payload };
}

async function startGame(socket: TypedClientSocket, roomCode: string) {
  const update = waitFor(socket, 'game_state_update');
  socket.emit('start_game', { roomCode });
  return update;
}

beforeAll(async () => {
  harness = await createTestServer(TIMINGS);
});

afterAll(async () => {
  await harness.close();
});

afterEach(() => {
  disconnectAll(...tracked);
  tracked.length = 0;
  for (const code of roomStore.codes()) {
    roomStore.evict(code);
  }
});

describe('auth middleware', () => {
  it('NET-2.1 allows a connection with no auth and leaves identity unbound', async () => {
    const c = client();
    await waitForConnect(c);
    expect(c.connected).toBe(true);
  });

  it('NET-2.2 rejects partial auth', async () => {
    const c = client({ playerId: 'p1' });
    const err = await waitForConnectError(c);
    expect(err.message).toBe('AUTH_FAILED');
  });

  it('NET-2.2 rejects a non-numeric roomCode in auth', async () => {
    const c = client({
      playerId: 'p1',
      roomCode: 'ABCD',
      sessionToken: 'tok',
    });
    const err = await waitForConnectError(c);
    expect(err.message).toBe('AUTH_FAILED');
  });

  it('NET-2.2 ROOM-6.2 rejects a bad session token even for a real player', async () => {
    const host = await createRoom('Host');
    host.socket.disconnect();

    const c = client({
      playerId: host.playerId,
      roomCode: host.room.code,
      sessionToken: 'wrong-token',
    });
    const err = await waitForConnectError(c);
    expect(err.message).toBe('AUTH_FAILED');
  });

  it('ROOM-5.4 auto-rejoins on handshake with a valid token', async () => {
    const host = await createRoom('Host');
    const other = await joinRoom(host.room.code, 'Other');
    other.socket.disconnect();

    const reconnected = waitFor(host.socket, 'player_reconnected');
    const c = client({
      playerId: other.playerId,
      roomCode: host.room.code,
      sessionToken: other.sessionToken,
    });
    const update = await waitFor(c, 'game_state_update');
    expect(update.gameState.room.code).toBe(host.room.code);
    const announcement = await reconnected;
    expect(announcement.player.id).toBe(other.playerId);
  });
});

describe('privileged handlers', () => {
  it('ROOM-4.1 rejects start_game from a non-host', async () => {
    const host = await createRoom('Host');
    const guest = await joinRoom(host.room.code, 'Guest');

    const err = waitFor(guest.socket, 'game_error');
    guest.socket.emit('start_game', { roomCode: host.room.code });
    expect((await err).code).toBe('UNAUTHORIZED');
  });

  it('NET-2.1 rejects start_game when socket has no bound identity', async () => {
    const host = await createRoom('Host');
    await joinRoom(host.room.code, 'Guest');

    const stranger = client();
    await waitForConnect(stranger);
    const err = waitFor(stranger, 'game_error');
    stranger.emit('start_game', { roomCode: host.room.code });
    expect((await err).code).toBe('UNAUTHORIZED');
  });

  it('NET-2.1 rejects start_game when payload roomCode does not match the socket binding', async () => {
    const hostA = await createRoom('HostA');
    const hostB = await createRoom('HostB');

    const err = waitFor(hostA.socket, 'game_error');
    hostA.socket.emit('start_game', { roomCode: hostB.room.code });
    expect((await err).code).toBe('UNAUTHORIZED');
  });

  it('ROOM-4.1 rejects start_round from a non-host', async () => {
    const host = await createRoom('Host');
    const guest = await joinRoom(host.room.code, 'Guest');
    await startGame(host.socket, host.room.code);

    const err = waitFor(guest.socket, 'game_error');
    guest.socket.emit('start_round', { roomCode: host.room.code });
    expect((await err).code).toBe('UNAUTHORIZED');
  });

  it('ROUND-3.2 rejects end_round from a non-director', async () => {
    const host = await createRoom('Host');
    const guest = await joinRoom(host.room.code, 'Guest');
    const started = await startGame(host.socket, host.room.code);

    const directorId = started.gameState.currentRound?.directorId;
    const nonDirectorSocket =
      directorId === host.playerId ? guest.socket : host.socket;

    const err = waitFor(nonDirectorSocket, 'game_error');
    nonDirectorSocket.emit('end_round', {
      roomCode: host.room.code,
      winnerId: guest.playerId,
    });
    expect((await err).code).toBe('UNAUTHORIZED');
  });

  it('SAB-2.2 SAB-2.5 emits sabotage_error when a non-director deploys', async () => {
    const host = await createRoom('Host');
    const guest = await joinRoom(host.room.code, 'Guest');
    const started = await startGame(host.socket, host.room.code);

    const directorId = started.gameState.currentRound?.directorId;
    const nonDirectorSocket =
      directorId === host.playerId ? guest.socket : host.socket;

    const err = waitFor(nonDirectorSocket, 'sabotage_error');
    nonDirectorSocket.emit('deploy_sabotage', {
      sabotageId: SABOTAGE_ACTIONS[0]!.id,
      roomCode: host.room.code,
    });
    const payload = await err;
    expect(payload.code).toBe('UNAUTHORIZED');
    expect(payload.attemptedSabotageId).toBe(SABOTAGE_ACTIONS[0]!.id);
  });
});

describe('disconnect lifecycle', () => {
  it('ROOM-5.1 broadcasts player_disconnected to peers', async () => {
    const host = await createRoom('Host');
    const guest = await joinRoom(host.room.code, 'Guest');

    const announced = waitFor(host.socket, 'player_disconnected');
    guest.socket.disconnect();
    const payload = await announced;
    expect(payload.playerId).toBe(guest.playerId);
    expect(
      payload.room.players.find(p => p.id === guest.playerId)?.connectionStatus
    ).toBe('disconnected');
  });

  it('ROOM-5.2 removes a lobby player after the disconnect grace window', async () => {
    const host = await createRoom('Host');
    const guest = await joinRoom(host.room.code, 'Guest');

    const left = waitFor(host.socket, 'player_left', 500);
    guest.socket.disconnect();
    const payload = await left;
    expect(payload.playerId).toBe(guest.playerId);
    expect(payload.room.players).toHaveLength(1);
  });

  it('ROOM-5.3 keeps a disconnected slot while a game is in progress', async () => {
    const host = await createRoom('Host');
    const guest = await joinRoom(host.room.code, 'Guest');
    await startGame(host.socket, host.room.code);

    await waitFor(host.socket, 'player_disconnected', 200).catch(() => {});
    guest.socket.disconnect();
    await waitFor(host.socket, 'player_disconnected');

    let leftFired = false;
    host.socket.once('player_left', () => {
      leftFired = true;
    });
    await new Promise(r => setTimeout(r, TIMINGS.lobbyDisconnectRemovalMs * 3));
    expect(leftFired).toBe(false);
    const state = roomStore.get(host.room.code);
    expect(state?.room.players).toHaveLength(2);
  });

  it('ROOM-5.4 cancels the pending removal when a player auto-rejoins in time', async () => {
    const host = await createRoom('Host');
    const guest = await joinRoom(host.room.code, 'Guest');
    guest.socket.disconnect();

    const reconnected = waitFor(host.socket, 'player_reconnected');
    const replacement = client({
      playerId: guest.playerId,
      roomCode: host.room.code,
      sessionToken: guest.sessionToken,
    });
    await waitFor(replacement, 'game_state_update');
    await reconnected;

    let leftFired = false;
    host.socket.once('player_left', () => {
      leftFired = true;
    });
    await new Promise(r => setTimeout(r, TIMINGS.lobbyDisconnectRemovalMs * 3));
    expect(leftFired).toBe(false);
  });
});

describe('leave_room', () => {
  it('ROOM-3.1 emits player_left to peers and removes the player', async () => {
    const host = await createRoom('Host');
    const guest = await joinRoom(host.room.code, 'Guest');

    const left = waitFor(host.socket, 'player_left');
    guest.socket.emit('leave_room');
    const payload = await left;
    expect(payload.playerId).toBe(guest.playerId);
    expect(payload.room.players).toHaveLength(1);
  });
});
