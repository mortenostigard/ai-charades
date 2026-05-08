import { timingSafeEqual } from 'node:crypto';

import { type GameState, type Player } from '@charades/shared';

import { RoomManager } from './room-manager.js';

// In development, we use a global variable to preserve state across hot
// reloads. In production this is just a regular module-level binding.
const globalForState = globalThis as unknown as {
  gameStates?: Map<string, GameState>;
  pendingRemovals?: Map<string, NodeJS.Timeout>;
  sessionTokens?: Map<string, string>;
};

const gameStates = globalForState.gameStates ?? new Map<string, GameState>();
const pendingRemovals =
  globalForState.pendingRemovals ?? new Map<string, NodeJS.Timeout>();
// Side table mapping playerId -> sessionToken. Kept off the broadcast Player
// shape so peers never see another player's token. Cleared on player removal.
const sessionTokens = globalForState.sessionTokens ?? new Map<string, string>();

if (process.env.NODE_ENV !== 'production') {
  globalForState.gameStates = gameStates;
  globalForState.pendingRemovals = pendingRemovals;
  globalForState.sessionTokens = sessionTokens;
}

export type ConnectionUpdate = { state: GameState; player: Player };

export type RemovePlayerResult =
  | { status: 'removed'; state: GameState }
  | { status: 'emptied' }
  | { status: 'not_found' };

function setPlayerConnectionStatus(
  code: string,
  playerId: string,
  status: 'connected' | 'disconnected'
): ConnectionUpdate | undefined {
  const state = gameStates.get(code);
  if (!state) return undefined;

  const existing = state.room.players.find(p => p.id === playerId);
  if (!existing) return undefined;

  const updatedPlayer: Player = { ...existing, connectionStatus: status };
  const updatedPlayers = state.room.players.map(p =>
    p.id === playerId ? updatedPlayer : p
  );

  const newState: GameState = {
    ...state,
    room: { ...state.room, players: updatedPlayers },
  };

  gameStates.set(code, newState);
  return { state: newState, player: updatedPlayer };
}

/**
 * In-memory store for active rooms and the timers that manage delayed
 * disconnect cleanup. The single owner of the underlying Maps; handlers go
 * through this module rather than touching them directly.
 */
export const roomStore = {
  get(code: string): GameState | undefined {
    return gameStates.get(code);
  },

  set(code: string, state: GameState): void {
    gameStates.set(code, state);
  },

  delete(code: string): void {
    gameStates.delete(code);
  },

  has(code: string): boolean {
    return gameStates.has(code);
  },

  /** Snapshot of all known room codes — used to generate non-colliding codes. */
  codes(): string[] {
    return Array.from(gameStates.keys());
  },

  /**
   * Mark the given player as connected and persist. Returns the new state
   * along with the updated player record, or undefined if the room or
   * player isn't found.
   */
  markPlayerConnected(
    code: string,
    playerId: string
  ): ConnectionUpdate | undefined {
    return setPlayerConnectionStatus(code, playerId, 'connected');
  },

  /**
   * Mark the given player as disconnected and persist. Returns the new
   * state along with the updated player record, or undefined if the room
   * or player isn't found.
   */
  markPlayerDisconnected(
    code: string,
    playerId: string
  ): ConnectionUpdate | undefined {
    return setPlayerConnectionStatus(code, playerId, 'disconnected');
  },

  /**
   * Remove a player from the room. Distinguishes the three outcomes so the
   * caller can react accordingly: the room still has players (`removed`),
   * the room is now empty and was evicted (`emptied`), or the room never
   * existed (`not_found`).
   */
  removePlayer(code: string, playerId: string): RemovePlayerResult {
    const state = gameStates.get(code);
    if (!state) return { status: 'not_found' };

    const wasMember = state.room.players.some(p => p.id === playerId);
    const newState = RoomManager.leaveRoom(state, playerId);
    if (newState === null) {
      // Room is being evicted: drop tokens for every player who was in it.
      for (const player of state.room.players) {
        sessionTokens.delete(player.id);
      }
      gameStates.delete(code);
      return { status: 'emptied' };
    }
    if (wasMember) {
      sessionTokens.delete(playerId);
    }
    gameStates.set(code, newState);
    return { status: 'removed', state: newState };
  },

  /**
   * Persist the cryptographically random session token for a player.
   * Subsequent reconnect attempts must present this token to claim that
   * playerId. Stored in a side table so it never appears on the broadcast
   * Player shape.
   */
  setSessionToken(playerId: string, token: string): void {
    sessionTokens.set(playerId, token);
  },

  /** Constant-time match. Returns false if no token is stored for the player. */
  verifySessionToken(playerId: string, token: string): boolean {
    const stored = sessionTokens.get(playerId);
    if (!stored) return false;
    const a = Buffer.from(stored);
    const b = Buffer.from(token);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  },

  /**
   * Schedule a delayed removal task for a player. Replaces any existing
   * pending task for the same player. The pending entry is cleared when the
   * timer fires; the callback only runs if the room still exists.
   */
  scheduleRemoval(
    playerId: string,
    code: string,
    run: () => void,
    delayMs: number
  ): void {
    const existing = pendingRemovals.get(playerId);
    if (existing) {
      clearTimeout(existing);
    }
    const timer = setTimeout(() => {
      pendingRemovals.delete(playerId);
      if (!gameStates.has(code)) return;
      run();
    }, delayMs);
    pendingRemovals.set(playerId, timer);
  },

  /** Cancel a pending removal task. Returns true if a timer was cleared. */
  cancelRemoval(playerId: string): boolean {
    const timer = pendingRemovals.get(playerId);
    if (!timer) return false;
    clearTimeout(timer);
    pendingRemovals.delete(playerId);
    return true;
  },
};
