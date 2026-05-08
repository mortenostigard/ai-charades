import { type GameState } from '@charades/shared';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  afterAll,
} from 'vitest';

import { RoomManager } from './room-manager.js';
import { roomStore } from './room-store.js';

const seedRoom = (): { code: string; state: GameState } => {
  const created = RoomManager.createRoom('Alice', roomStore.codes());
  roomStore.set(created.room.code, created.gameState);
  roomStore.setSessionToken(created.playerId, created.sessionToken);
  return { code: created.room.code, state: created.gameState };
};

describe('roomStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    for (const code of roomStore.codes()) {
      roomStore.evict(code);
    }
  });

  afterAll(() => {
    for (const code of roomStore.codes()) {
      roomStore.evict(code);
    }
  });

  describe('dropSessionTokens', () => {
    it('removes the specified tokens and leaves others intact', () => {
      const a = RoomManager.createRoom('Alice', roomStore.codes());
      roomStore.set(a.room.code, a.gameState);
      roomStore.setSessionToken(a.playerId, a.sessionToken);

      const joined = RoomManager.joinRoom(a.gameState, 'Bob');
      const bobId = joined.newPlayer.id;
      roomStore.set(a.room.code, joined.newGameState);
      roomStore.setSessionToken(bobId, joined.sessionToken);

      roomStore.dropSessionTokens([bobId]);

      expect(roomStore.verifySessionToken(a.playerId, a.sessionToken)).toBe(
        true
      );
      expect(roomStore.verifySessionToken(bobId, joined.sessionToken)).toBe(
        false
      );
    });
  });

  describe('scheduleAbandonment', () => {
    it('ROOM-5.6 runs the callback after the configured delay', () => {
      const { code } = seedRoom();
      const run = vi.fn();

      roomStore.scheduleAbandonment(code, run, 1000);

      vi.advanceTimersByTime(999);
      expect(run).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(run).toHaveBeenCalledTimes(1);
    });

    it('ROOM-5.6 cancelAbandonment prevents the callback from firing', () => {
      const { code } = seedRoom();
      const run = vi.fn();

      roomStore.scheduleAbandonment(code, run, 1000);
      const cancelled = roomStore.cancelAbandonment(code);
      vi.advanceTimersByTime(2000);

      expect(cancelled).toBe(true);
      expect(run).not.toHaveBeenCalled();
    });

    it('replaces an existing pending abandonment for the same room', () => {
      const { code } = seedRoom();
      const first = vi.fn();
      const second = vi.fn();

      roomStore.scheduleAbandonment(code, first, 1000);
      roomStore.scheduleAbandonment(code, second, 1000);
      vi.advanceTimersByTime(1000);

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it('does not run the callback if the room was already evicted', () => {
      const { code } = seedRoom();
      const run = vi.fn();

      roomStore.scheduleAbandonment(code, run, 1000);
      roomStore.evict(code);
      vi.advanceTimersByTime(1000);

      expect(run).not.toHaveBeenCalled();
    });
  });

  describe('evict', () => {
    it('drops the room, its session tokens, and pending timers', () => {
      const { code } = seedRoom();
      const playerId = roomStore.get(code)!.room.players[0]!.id;
      const removalRun = vi.fn();
      const abandonmentRun = vi.fn();

      roomStore.scheduleRemoval(playerId, code, removalRun, 1000);
      roomStore.scheduleAbandonment(code, abandonmentRun, 1000);

      roomStore.evict(code);

      expect(roomStore.has(code)).toBe(false);
      expect(roomStore.verifySessionToken(playerId, 'anything')).toBe(false);

      vi.advanceTimersByTime(1000);
      expect(removalRun).not.toHaveBeenCalled();
      expect(abandonmentRun).not.toHaveBeenCalled();
    });

    it('is a no-op for an unknown room code', () => {
      expect(() => roomStore.evict('0000')).not.toThrow();
    });
  });
});
