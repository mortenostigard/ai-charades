import { type GameState } from '@charades/shared';

import { RoomManager } from './room-manager.js';

// In development, we use a global variable to preserve state across hot
// reloads. In production this is just a regular module-level binding.
const globalForState = globalThis as unknown as {
  gameStates?: Map<string, GameState>;
  pendingRemovals?: Map<string, NodeJS.Timeout>;
};

const gameStates = globalForState.gameStates ?? new Map<string, GameState>();
const pendingRemovals =
  globalForState.pendingRemovals ?? new Map<string, NodeJS.Timeout>();

if (process.env.NODE_ENV !== 'production') {
  globalForState.gameStates = gameStates;
  globalForState.pendingRemovals = pendingRemovals;
}

function setPlayerConnectionStatus(
  code: string,
  playerId: string,
  status: 'connected' | 'disconnected'
): GameState | undefined {
  const state = gameStates.get(code);
  if (!state) return undefined;

  const player = state.room.players.find(p => p.id === playerId);
  if (!player) return undefined;

  const updatedPlayers = state.room.players.map(p =>
    p.id === playerId ? { ...p, connectionStatus: status } : p
  );

  const newState: GameState = {
    ...state,
    room: { ...state.room, players: updatedPlayers },
  };

  gameStates.set(code, newState);
  return newState;
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
   * Mark the given player as connected and persist. Returns the updated
   * GameState, or undefined if the room or player isn't found.
   */
  markPlayerConnected(code: string, playerId: string): GameState | undefined {
    return setPlayerConnectionStatus(code, playerId, 'connected');
  },

  /**
   * Mark the given player as disconnected and persist. Returns the updated
   * GameState, or undefined if the room or player isn't found.
   */
  markPlayerDisconnected(
    code: string,
    playerId: string
  ): GameState | undefined {
    return setPlayerConnectionStatus(code, playerId, 'disconnected');
  },

  /**
   * Remove a player from the room. Returns the new GameState, or null if the
   * room is now gone (either empty after removal, or never existed). When
   * empty, the room is also evicted from the store.
   */
  removePlayer(code: string, playerId: string): GameState | null {
    const state = gameStates.get(code);
    if (!state) return null;

    const newState = RoomManager.leaveRoom(state, playerId);
    if (newState === null) {
      gameStates.delete(code);
      return null;
    }
    gameStates.set(code, newState);
    return newState;
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
