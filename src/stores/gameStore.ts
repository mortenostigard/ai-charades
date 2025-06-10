import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type {
  GameState,
  Player,
  Room,
  CurrentRound,
  ActiveSabotage,
  ScoreUpdate,
} from '@/types';

interface GameStore {
  // Core State
  gameState: GameState | null;
  playerId: string | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
  timeRemaining: number;

  // Actions - Room Management
  setGameState: (state: GameState) => void;
  setPlayerId: (id: string) => void;
  setConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTimeRemaining: (time: number) => void;

  // Actions - Player Management
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;

  // Actions - Room Updates
  updateRoom: (updates: Partial<Room>) => void;

  // Actions - Round Management
  setCurrentRound: (round: CurrentRound | null) => void;
  updateScores: (scoreUpdates: ScoreUpdate[]) => void;
  deployActiveSabotage: (sabotage: ActiveSabotage) => void;
  removeActiveSabotage: () => void;

  // Actions - Reset
  resetState: () => void;

  // Computed Selectors
  getCurrentRole: () => 'actor' | 'director' | 'audience' | null;
  isHost: () => boolean;
  canStartGame: () => boolean;
  getPlayerById: (id: string) => Player | undefined;
  isInRoom: () => boolean;
  getMyPlayer: () => Player | undefined;
}

const initialState = {
  gameState: null,
  playerId: null,
  connected: false,
  loading: false,
  error: null,
  timeRemaining: 0,
};

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    ...initialState,

    // Basic setters
    setGameState: (state: GameState) =>
      set(draft => {
        draft.gameState = state;
        draft.error = null;
      }),

    setPlayerId: (id: string) =>
      set(draft => {
        draft.playerId = id;
      }),

    setConnected: (connected: boolean) =>
      set(draft => {
        draft.connected = connected;
        if (!connected) {
          draft.error = 'Connection lost. Attempting to reconnect...';
        }
      }),

    setLoading: (loading: boolean) =>
      set(draft => {
        draft.loading = loading;
      }),

    setError: (error: string | null) =>
      set(draft => {
        draft.error = error;
        if (error) {
          draft.loading = false;
        }
      }),

    setTimeRemaining: (time: number) =>
      set(draft => {
        draft.timeRemaining = time;
      }),

    // Player management
    addPlayer: (player: Player) =>
      set(draft => {
        if (draft.gameState?.room) {
          const existingPlayer = draft.gameState.room.players.find(
            p => p.id === player.id
          );
          if (!existingPlayer) {
            draft.gameState.room.players.push(player);
            // Initialize score for new player
            if (draft.gameState.scores) {
              draft.gameState.scores[player.id] = 0;
            }
          }
        }
      }),

    removePlayer: (playerId: string) =>
      set(draft => {
        if (draft.gameState?.room) {
          draft.gameState.room.players = draft.gameState.room.players.filter(
            p => p.id !== playerId
          );
          // Remove from scores
          if (draft.gameState.scores) {
            delete draft.gameState.scores[playerId];
          }
        }
      }),

    updatePlayer: (playerId: string, updates: Partial<Player>) =>
      set(draft => {
        if (draft.gameState?.room) {
          const player = draft.gameState.room.players.find(
            p => p.id === playerId
          );
          if (player) {
            Object.assign(player, updates);
          }
        }
      }),

    // Room management
    updateRoom: (updates: Partial<Room>) =>
      set(draft => {
        if (draft.gameState?.room) {
          Object.assign(draft.gameState.room, updates);
        }
      }),

    // Round management
    setCurrentRound: (round: CurrentRound | null) =>
      set(draft => {
        if (draft.gameState) {
          draft.gameState.currentRound = round;
        }
      }),

    updateScores: (scoreUpdates: ScoreUpdate[]) =>
      set(draft => {
        if (draft.gameState?.scores) {
          scoreUpdates.forEach(update => {
            if (draft.gameState?.scores) {
              draft.gameState.scores[update.playerId] = update.totalScore;
            }
          });
        }
      }),

    deployActiveSabotage: (sabotage: ActiveSabotage) =>
      set(draft => {
        if (draft.gameState?.currentRound) {
          draft.gameState.currentRound.currentSabotage = sabotage;
          draft.gameState.currentRound.sabotagesDeployedCount += 1;
        }
      }),

    removeActiveSabotage: () =>
      set(draft => {
        if (draft.gameState?.currentRound) {
          draft.gameState.currentRound.currentSabotage = null;
        }
      }),

    // Reset state (for leaving room, etc.)
    resetState: () =>
      set(state => ({
        ...initialState,
        // Persist connection status across resets
        connected: state.connected,
      })),

    // Computed selectors
    getCurrentRole: () => {
      const state = get();
      const { gameState, playerId } = state;

      if (!gameState?.currentRound || !playerId) return null;

      const { actorId, directorId } = gameState.currentRound;

      if (playerId === actorId) return 'actor';
      if (playerId === directorId) return 'director';
      return 'audience';
    },

    isHost: () => {
      const state = get();
      const { gameState, playerId } = state;

      if (!gameState?.room || !playerId) return false;

      // First player in the room is the host
      return gameState.room.players[0]?.id === playerId;
    },

    canStartGame: () => {
      const state = get();
      const { gameState } = state;

      if (!gameState?.room) return false;

      return (
        state.isHost() &&
        gameState.room.status === 'waiting' &&
        gameState.room.players.length >= 3 // Minimum players for actor, director, audience
      );
    },

    getPlayerById: (id: string) => {
      const { gameState } = get();
      return gameState?.room.players.find(p => p.id === id);
    },

    isInRoom: () => {
      const { gameState, playerId } = get();
      return !!(gameState?.room && playerId);
    },

    getMyPlayer: () => {
      const state = get();
      const { playerId } = state;
      return playerId ? state.getPlayerById(playerId) : undefined;
    },
  }))
);
