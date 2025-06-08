import { Room, Player, GameState, GameConfig } from '@/types';

// In-memory storage for rooms and game states.
// WARNING: This is not suitable for production on serverless environments like Vercel.
// A persistent store like Vercel KV (Redis) should be used instead.
const rooms = new Map<string, Room>();
const gameStates = new Map<string, GameState>();
export const playerSockets = new Map<string, string>(); // playerId -> socketId mapping

// Default game configuration
const DEFAULT_CONFIG: GameConfig = {
  roundDuration: 90000, // 90 seconds in milliseconds
  gracePeriod: 20000, // 20 seconds in milliseconds
  maxSabotages: 3,
  sabotageTypes: [], // Will be populated with actual sabotage actions later
};

// Generate 4-digit room code
function generateRoomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Ensure unique room code
function generateUniqueRoomCode(): string {
  let code = generateRoomCode();
  let attempts = 0;
  while (rooms.has(code) && attempts < 10) {
    code = generateRoomCode();
    attempts++;
  }
  if (attempts >= 10) {
    throw new Error('Unable to generate unique room code');
  }
  return code;
}

// Create new room
export function createRoom(
  hostPlayerName: string,
  config?: Partial<GameConfig>
): { room: Room; playerId: string; gameState: GameState } {
  const roomCode = generateUniqueRoomCode();
  const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  const hostPlayer: Player = {
    id: playerId,
    name: hostPlayerName,
    connected: true,
    joinedAt: Date.now(),
  };

  const room: Room = {
    id: `room_${roomCode}`,
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

  rooms.set(roomCode, room);
  gameStates.set(roomCode, gameState);

  return { room, playerId, gameState };
}

// Add player to existing room
export function joinRoom(
  roomCode: string,
  playerName: string
): { room: Room; playerId: string; gameState: GameState } {
  const room = rooms.get(roomCode);
  const gameState = gameStates.get(roomCode);

  if (!room || !gameState) {
    throw new Error('ROOM_NOT_FOUND');
  }

  if (room.players.length >= room.maxPlayers) {
    throw new Error('ROOM_FULL');
  }

  if (room.status !== 'waiting') {
    throw new Error('GAME_IN_PROGRESS');
  }

  // Check if player name is already taken
  const nameExists = room.players.some(
    p => p.name.toLowerCase() === playerName.toLowerCase()
  );
  if (nameExists) {
    throw new Error('PLAYER_NAME_TAKEN');
  }

  const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  const newPlayer: Player = {
    id: playerId,
    name: playerName,
    connected: true,
    joinedAt: Date.now(),
  };

  room.players.push(newPlayer);
  gameState.scores[playerId] = 0;

  return { room, playerId, gameState };
}

// Remove player from room
export function leaveRoom(roomCode: string, playerId: string): Room | null {
  const room = rooms.get(roomCode);
  if (!room) return null;

  room.players = room.players.filter(p => p.id !== playerId);

  const gameState = gameStates.get(roomCode);
  if (gameState) {
    delete gameState.scores[playerId];
  }

  // Clean up empty rooms
  if (room.players.length === 0) {
    rooms.delete(roomCode);
    gameStates.delete(roomCode);
    return null;
  }

  return room;
}

// Map error codes to user-friendly messages
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

export function findRoomByPlayerId(playerId: string): string | null {
  for (const [roomCode, room] of rooms.entries()) {
    if (room.players.some(p => p.id === playerId)) {
      return roomCode;
    }
  }
  return null;
}

export function getRoom(roomCode: string): Room | undefined {
  return rooms.get(roomCode);
}

export function getGameState(roomCode: string): GameState | undefined {
  return gameStates.get(roomCode);
}
