import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  GameState,
  Player,
  Room,
  CurrentRound,
  ActiveSabotage,
  PlayerScoreChange,
  PlayerRole,
  CompletedRound,
} from '@ai-charades/shared';

interface GameStore {
  // Core State
  gameState: GameState | null;
  playerId: string | null;
  loading: boolean;
  error: string | null;
  timeRemaining: number;
  currentView: 'playing' | 'summary';
  completedRound: CompletedRound | null;
  socketReady: boolean;

  // Actions - Room Management
  setGameState: (state: GameState) => void;
  setPlayerId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTimeRemaining: (time: number) => void;
  setSocketReady: (ready: boolean) => void;

  // Actions - Player Management
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;

  // Actions - Room Updates
  updateRoom: (updates: Partial<Room>) => void;

  // Actions - Round Management
  setCurrentRound: (round: CurrentRound | null) => void;
  updateScores: (scoreUpdates: PlayerScoreChange[]) => void;
  deployActiveSabotage: (sabotage: ActiveSabotage) => void;
  removeActiveSabotage: () => void;
  setRoundComplete: (completedRound: CompletedRound) => void;

  // Actions - Reset
  resetState: () => void;

  // Computed Selectors
  getCurrentRole: () => PlayerRole | undefined;
  isHost: () => boolean;
  canStartGame: () => boolean;
  getPlayerById: (id: string) => Player | undefined;
  isInRoom: () => boolean;
  getMyPlayer: () => Player | undefined;
}

const initialState = {
  gameState: null,
  playerId: null,
  loading: false,
  error: null,
  timeRemaining: Number(process.env.NEXT_PUBLIC_ROUND_TIME) || 90,
  currentView: 'playing' as const,
  completedRound: null,
  socketReady: false,
};

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    ...initialState,

    // Basic setters
    setGameState: (state: GameState) =>
      set(draft => {
        draft.gameState = state;
        draft.error = null;
        draft.currentView = 'playing';
      }),

    setPlayerId: (id: string) =>
      set(draft => {
        draft.playerId = id;
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

    setSocketReady: (ready: boolean) =>
      set(draft => {
        draft.socketReady = ready;
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

    updateScores: (scoreUpdates: PlayerScoreChange[]) =>
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

    setRoundComplete: (completedRound: CompletedRound) =>
      set(draft => {
        draft.completedRound = completedRound;
        draft.currentView = 'summary';
      }),

    // Reset state (for leaving room, etc.)
    resetState: () => set(initialState),

    // Computed selectors
    getCurrentRole: () => {
      const state = get();
      const { gameState, playerId } = state;

      if (!gameState?.currentRound || !playerId) return undefined;

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
