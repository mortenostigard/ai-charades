import { Server, Socket } from 'socket.io';

import { GameState, GameConfig } from '@/types';
import { RoomManager, getErrorMessage } from '@/game/room-manager';

// --- In-memory state management with HMR (Hot Module Replacement) support ---

// In development, we use a global variable to preserve state across hot reloads.
// In production, this is just a regular variable.
const globalForState = globalThis as unknown as {
  gameStates: Map<string, GameState>;
  playerSockets: Map<string, string>;
};

const gameStates = globalForState.gameStates || new Map<string, GameState>();
const playerSockets = globalForState.playerSockets || new Map<string, string>();

if (process.env.NODE_ENV !== 'production') {
  globalForState.gameStates = gameStates;
  globalForState.playerSockets = playerSockets;
}

// Helper function to find which room a player is in.
function findRoomCodeByPlayerId(playerId: string): string | undefined {
  for (const [roomCode, state] of gameStates.entries()) {
    if (state.room.players.some(p => p.id === playerId)) {
      return roomCode;
    }
  }
  return undefined;
}

export function handleCreateRoom(socket: Socket) {
  return async (data: {
    playerName: string;
    gameConfig?: Partial<GameConfig>;
  }) => {
    try {
      if (!data.playerName || data.playerName.trim().length < 2) {
        socket.emit('room_error', {
          code: 'INVALID_PLAYER_NAME',
          message: 'Player name must be at least 2 characters long.',
        });
        return;
      }

      const existingCodes = Array.from(gameStates.keys());
      const { room, playerId, gameState } = RoomManager.createRoom(
        data.playerName.trim(),
        existingCodes,
        data.gameConfig
      );

      // Store state
      gameStates.set(room.code, gameState);
      playerSockets.set(playerId, socket.id);

      // Join the socket room
      await socket.join(room.code);

      socket.emit('room_created', {
        room,
        playerId,
        gameState,
      });

      console.log(
        `Room ${room.code} created by ${data.playerName} (${playerId})`
      );
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('room_error', {
        code: 'SERVER_ERROR',
        message: 'Failed to create room. Please try again.',
      });
    }
  };
}

export function handleJoinRoom(socket: Socket) {
  return async (data: { roomCode: string; playerName: string }) => {
    try {
      if (!data.roomCode || !data.playerName) {
        socket.emit('room_error', {
          code: 'INVALID_DATA',
          message: 'Room code and player name are required.',
        });
        return;
      }

      const roomCode = data.roomCode.trim();
      const playerName = data.playerName.trim();

      if (!/^\d{4}$/.test(roomCode)) {
        socket.emit('room_error', {
          code: 'INVALID_CODE',
          message: getErrorMessage('INVALID_CODE'),
        });
        return;
      }

      const gameState = gameStates.get(roomCode);
      if (!gameState) {
        socket.emit('room_error', {
          code: 'ROOM_NOT_FOUND',
          message: getErrorMessage('ROOM_NOT_FOUND'),
        });
        return;
      }

      if (playerName.length < 2) {
        socket.emit('room_error', {
          code: 'INVALID_PLAYER_NAME',
          message: 'Player name must be at least 2 characters long.',
        });
        return;
      }

      const { newGameState, newPlayer } = RoomManager.joinRoom(
        gameState,
        playerName
      );

      // Update state
      gameStates.set(roomCode, newGameState);
      playerSockets.set(newPlayer.id, socket.id);

      // Join the socket room
      await socket.join(roomCode);

      socket.emit('room_joined', {
        room: newGameState.room,
        playerId: newPlayer.id,
        gameState: newGameState,
      });

      // Notify other players in the room
      socket.to(roomCode).emit('player_joined', {
        player: newPlayer,
        room: newGameState.room,
      });

      console.log(`${playerName} (${newPlayer.id}) joined room ${roomCode}`);
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'SERVER_ERROR';
      socket.emit('room_error', {
        code: errorCode,
        message: getErrorMessage(errorCode),
      });
      console.error('Error joining room:', error);
    }
  };
}

export function handleLeaveRoom(socket: Socket) {
  return async (data: { playerId: string }) => {
    try {
      const { playerId } = data;
      const roomCode = findRoomCodeByPlayerId(playerId);

      if (roomCode) {
        const gameState = gameStates.get(roomCode);
        if (!gameState) return;

        const newGameState = RoomManager.leaveRoom(gameState, playerId);

        // Remove player-socket mapping
        playerSockets.delete(playerId);
        await socket.leave(roomCode);

        if (newGameState) {
          gameStates.set(roomCode, newGameState);
          // Notify remaining players
          socket.to(roomCode).emit('player_left', {
            playerId,
            room: newGameState.room,
          });
          console.log(`Player ${playerId} left room ${roomCode}`);
        } else {
          // Room is empty, clean it up
          gameStates.delete(roomCode);
          console.log(`Room ${roomCode} cleaned up - no players remaining`);
        }
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };
}

export function handleRequestGameState(socket: Socket) {
  return (data: { playerId: string }) => {
    try {
      const { playerId } = data;
      const roomCode = findRoomCodeByPlayerId(playerId);

      if (roomCode) {
        const gameState = gameStates.get(roomCode);
        if (gameState) {
          console.log(
            `Resyncing game state for player ${playerId} in room ${roomCode}`
          );
          socket.emit('game_state_update', { gameState });
        }
      }
    } catch (error) {
      console.error(
        `Error resyncing game state for player ${data.playerId}:`,
        error
      );
      socket.emit('game_error', {
        code: 'STATE_SYNC_ERROR',
        message: 'Could not retrieve the latest game state.',
      });
    }
  };
}

export function handleDisconnect(socket: Socket) {
  return async () => {
    console.log(`Client disconnected: ${socket.id}`);
    let playerIdToRemove: string | undefined;

    // Find player associated with this socket
    for (const [playerId, socketId] of playerSockets.entries()) {
      if (socketId === socket.id) {
        playerIdToRemove = playerId;
        break;
      }
    }

    if (playerIdToRemove) {
      // Use the same logic as leaving a room
      await handleLeaveRoom(socket)({ playerId: playerIdToRemove });
    }
  };
}

export function initializeSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('create_room', handleCreateRoom(socket));
    socket.on('join_room', handleJoinRoom(socket));
    socket.on('leave_room', handleLeaveRoom(socket));
    socket.on('request_game_state', handleRequestGameState(socket));
    socket.on('disconnect', handleDisconnect(socket));
  });
}
