import { Room, Player, GameState, GameConfig } from '@/types';

// Default game configuration
const DEFAULT_CONFIG: GameConfig = {
  roundDuration: 90000, // 90 seconds in milliseconds
  gracePeriod: 20000, // 20 seconds in milliseconds
  maxSabotages: 3,
  sabotageTypes: [], // Will be populated with actual sabotage actions later
};

/**
 * Manages the creation and state of game rooms using pure, static methods.
 * This class is designed to be stateless. It takes the current state and returns
 * a new, updated state without causing side effects.
 */
export class RoomManager {
  /**
   * Generates a 4-digit room code.
   */
  private static generateRoomCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Generates a unique room code that is not present in the provided list.
   * @param existingCodes An array of room codes that are already in use.
   */
  private static generateUniqueRoomCode(existingCodes: string[]): string {
    let code: string;
    let attempts = 0;
    do {
      code = this.generateRoomCode();
      attempts++;
    } while (existingCodes.includes(code) && attempts < 20);

    if (attempts >= 20) {
      throw new Error('Unable to generate unique room code');
    }
    return code;
  }

  /**
   * Creates a new room and its initial game state.
   * @param hostPlayerName The name of the host player.
   * @param existingRoomCodes A list of all current room codes to ensure uniqueness.
   * @param config Optional custom game configuration.
   * @returns The newly created Room, the host's player ID, and the initial GameState.
   */
  public static createRoom(
    hostPlayerName: string,
    existingRoomCodes: string[],
    config?: Partial<GameConfig>
  ): { room: Room; playerId: string; gameState: GameState } {
    const roomCode = this.generateUniqueRoomCode(existingRoomCodes);
    const playerId = `player_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;

    const hostPlayer: Player = {
      id: playerId,
      name: hostPlayerName,
      connected: true,
      joinedAt: Date.now(),
    };

    const room: Room = {
      code: roomCode,
      players: [hostPlayer],
      status: 'waiting',
      createdAt: Date.now(),
      maxPlayers: 8,
    };

    const gameState: GameState = {
      room,
      currentRound: null,
      scores: { [playerId]: 0 },
      gameConfig: { ...DEFAULT_CONFIG, ...config },
      roundHistory: [],
    };

    return { room, playerId, gameState };
  }

  /**
   * Adds a new player to an existing game state.
   * @param gameState The current game state of the room to join.
   * @param playerName The name of the new player.
   * @returns A new GameState object with the player added.
   * @throws Will throw an error if the room is full, game is in progress, or name is taken.
   */
  public static joinRoom(
    gameState: GameState,
    playerName: string
  ): { newGameState: GameState; newPlayer: Player } {
    const { room, scores } = gameState;

    if (room.players.length >= room.maxPlayers) {
      throw new Error('ROOM_FULL');
    }
    if (room.status !== 'waiting') {
      throw new Error('GAME_IN_PROGRESS');
    }
    if (
      room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())
    ) {
      throw new Error('PLAYER_NAME_TAKEN');
    }

    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: playerName,
      connected: true,
      joinedAt: Date.now(),
    };

    const newPlayers = [...room.players, newPlayer];
    const newScores = { ...scores, [newPlayer.id]: 0 };
    const newRoom = { ...room, players: newPlayers };

    return {
      newGameState: { ...gameState, room: newRoom, scores: newScores },
      newPlayer,
    };
  }

  /**
   * Removes a player from a game state.
   * @param gameState The current game state.
   * @param playerId The ID of the player to remove.
   * @returns A new GameState with the player removed. If the room becomes empty, returns null.
   */
  public static leaveRoom(
    gameState: GameState,
    playerId: string
  ): GameState | null {
    const newPlayers = gameState.room.players.filter(p => p.id !== playerId);

    if (newPlayers.length === 0) {
      return null; // Indicates the room should be deleted.
    }

    const newScores = { ...gameState.scores };
    delete newScores[playerId];

    const newRoom = { ...gameState.room, players: newPlayers };

    return {
      ...gameState,
      room: newRoom,
      scores: newScores,
    };
  }
}

// This remains a standalone utility function as it is pure and stateless.
export function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    ROOM_NOT_FOUND: 'Room not found. Please check the room code.',
    ROOM_FULL: 'This room is full. Please try another room.',
    GAME_IN_PROGRESS: 'Cannot join - game is already in progress.',
    PLAYER_NAME_TAKEN:
      'This name is already taken. Please choose another name.',
    INVALID_CODE: 'Invalid room code format.',
  };
  return messages[code] || 'An unexpected error occurred.';
}
