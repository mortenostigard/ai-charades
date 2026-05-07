import { type GameState } from '@charades/shared';
import { describe, it, expect } from 'vitest';

import { RoomManager, getErrorMessage } from './room-manager.js';

describe('RoomManager', () => {
  describe('createRoom', () => {
    it('creates a room with a 4-digit code, the host as the only player, and zero score', () => {
      const { room, playerId, gameState } = RoomManager.createRoom('Alice', []);

      expect(room.code).toMatch(/^\d{4}$/);
      expect(room.players).toHaveLength(1);
      expect(room.players[0]?.id).toBe(playerId);
      expect(room.players[0]?.name).toBe('Alice');
      expect(room.players[0]?.connectionStatus).toBe('connected');
      expect(room.status).toBe('waiting');
      expect(room.maxPlayers).toBe(8);

      expect(gameState.scores[playerId]).toBe(0);
      expect(gameState.currentRound).toBeNull();
      expect(gameState.roundHistory).toEqual([]);
    });

    it('generates a code that is not already in use', () => {
      // Generate a room, then create 50 more rooms making sure the new
      // codes are never one of the existing ones.
      const taken: string[] = [];
      for (let i = 0; i < 50; i++) {
        const { room } = RoomManager.createRoom('Alice', taken);
        expect(taken).not.toContain(room.code);
        taken.push(room.code);
      }
    });

    it('throws when no unique code can be generated', () => {
      const taken: string[] = [];
      for (let i = 1000; i <= 9999; i++) taken.push(String(i));

      expect(() => RoomManager.createRoom('Alice', taken)).toThrow(
        'Unable to generate unique room code'
      );
    });

    it('merges a partial config with the defaults', () => {
      const { gameState } = RoomManager.createRoom('Alice', [], {
        roundDuration: 30000,
      });
      expect(gameState.gameConfig.roundDuration).toBe(30000);
      expect(gameState.gameConfig.gracePeriod).toBe(20000);
      expect(gameState.gameConfig.maxSabotages).toBe(3);
    });

    it('issues a long, unguessable session token distinct per call', () => {
      const a = RoomManager.createRoom('Alice', []);
      const b = RoomManager.createRoom('Bob', []);

      // base64url of 32 random bytes is 43 chars; require enough entropy that
      // two calls never collide.
      expect(a.sessionToken).toMatch(/^[A-Za-z0-9_-]{40,}$/);
      expect(b.sessionToken).toMatch(/^[A-Za-z0-9_-]{40,}$/);
      expect(a.sessionToken).not.toBe(b.sessionToken);
    });

    it('omits the session token from the broadcastable Player shape', () => {
      const { room } = RoomManager.createRoom('Alice', []);
      // sessionToken belongs to the side channel only — it must not leak via
      // the Player record that's broadcast on every state update.
      expect(room.players[0]).not.toHaveProperty('sessionToken');
    });
  });

  describe('joinRoom', () => {
    const seed = (): GameState => RoomManager.createRoom('Alice', []).gameState;

    it('adds a player and initialises their score', () => {
      const { newGameState, newPlayer } = RoomManager.joinRoom(seed(), 'Bob');

      expect(newGameState.room.players).toHaveLength(2);
      expect(newGameState.room.players[1]?.name).toBe('Bob');
      expect(newGameState.scores[newPlayer.id]).toBe(0);
    });

    it('throws ROOM_FULL when the room is at maxPlayers', () => {
      let state = seed();
      // Already has Alice; add 7 more to reach 8.
      for (let i = 0; i < 7; i++) {
        state = RoomManager.joinRoom(state, `P${i}`).newGameState;
      }
      expect(() => RoomManager.joinRoom(state, 'TooMany')).toThrow('ROOM_FULL');
    });

    it('throws GAME_IN_PROGRESS when the room is no longer waiting', () => {
      const state = seed();
      const playing: GameState = {
        ...state,
        room: { ...state.room, status: 'playing' },
      };
      expect(() => RoomManager.joinRoom(playing, 'Bob')).toThrow(
        'GAME_IN_PROGRESS'
      );
    });

    it('throws PLAYER_NAME_TAKEN regardless of casing', () => {
      const state = RoomManager.joinRoom(seed(), 'Bob').newGameState;
      expect(() => RoomManager.joinRoom(state, 'BOB')).toThrow(
        'PLAYER_NAME_TAKEN'
      );
    });

    it('issues a fresh session token for the joiner that differs from the host', () => {
      const initial = RoomManager.createRoom('Alice', []);
      const joined = RoomManager.joinRoom(initial.gameState, 'Bob');

      expect(joined.sessionToken).toMatch(/^[A-Za-z0-9_-]{40,}$/);
      expect(joined.sessionToken).not.toBe(initial.sessionToken);
    });
  });

  describe('leaveRoom', () => {
    it('removes the player and their score entry', () => {
      const initial = RoomManager.createRoom('Alice', []).gameState;
      const aliceId = initial.room.players[0]!.id;
      const { newGameState } = RoomManager.joinRoom(initial, 'Bob');
      const bobId = newGameState.room.players[1]!.id;

      const after = RoomManager.leaveRoom(newGameState, bobId);

      expect(after).not.toBeNull();
      expect(after!.room.players).toHaveLength(1);
      expect(after!.room.players[0]?.id).toBe(aliceId);
      expect(after!.scores[bobId]).toBeUndefined();
      expect(after!.scores[aliceId]).toBe(0);
    });

    it('returns null when the last player leaves', () => {
      const initial = RoomManager.createRoom('Alice', []).gameState;
      const aliceId = initial.room.players[0]!.id;

      expect(RoomManager.leaveRoom(initial, aliceId)).toBeNull();
    });
  });
});

describe('getErrorMessage', () => {
  it('returns a friendly message for known codes', () => {
    expect(getErrorMessage('ROOM_FULL')).toMatch(/full/i);
    expect(getErrorMessage('PLAYER_NAME_TAKEN')).toMatch(/name/i);
  });

  it('returns a fallback for unknown codes', () => {
    expect(getErrorMessage('NOT_A_REAL_CODE')).toBe(
      'An unexpected error occurred.'
    );
  });
});
