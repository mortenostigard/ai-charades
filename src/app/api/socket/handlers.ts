import { Server, Socket } from 'socket.io';

import { GameConfig } from '@/types';
import * as roomManager from '@/game/room-manager';

export function handleCreateRoom(socket: Socket) {
  return async (data: {
    playerName: string;
    gameConfig?: Partial<GameConfig>;
  }) => {
    try {
      if (!data.playerName || data.playerName.trim().length < 2) {
        socket.emit('room-error', {
          code: 'INVALID_PLAYER_NAME',
          message: 'Player name must be at least 2 characters long.',
        });
        return;
      }

      const { room, playerId, gameState } = roomManager.createRoom(
        data.playerName.trim(),
        data.gameConfig
      );

      // Store player-socket mapping
      roomManager.playerSockets.set(playerId, socket.id);

      // Join the socket room
      await socket.join(room.code);

      socket.emit('room-created', {
        room,
        playerId,
        gameState,
      });

      console.log(
        `Room ${room.code} created by ${data.playerName} (${playerId})`
      );
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('room-error', {
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
        socket.emit('room-error', {
          code: 'INVALID_DATA',
          message: 'Room code and player name are required.',
        });
        return;
      }

      const roomCode = data.roomCode.trim();
      const playerName = data.playerName.trim();

      if (!/^\d{4}$/.test(roomCode)) {
        socket.emit('room-error', {
          code: 'INVALID_CODE',
          message: roomManager.getErrorMessage('INVALID_CODE'),
        });
        return;
      }

      if (playerName.length < 2) {
        socket.emit('room-error', {
          code: 'INVALID_PLAYER_NAME',
          message: 'Player name must be at least 2 characters long.',
        });
        return;
      }

      const { room, playerId, gameState } = roomManager.joinRoom(
        roomCode,
        playerName
      );

      // Store player-socket mapping
      roomManager.playerSockets.set(playerId, socket.id);

      // Join the socket room
      await socket.join(roomCode);

      socket.emit('room-joined', {
        room,
        playerId,
        gameState,
      });

      // Notify other players in the room
      const newPlayer = room.players.find(p => p.id === playerId);
      if (newPlayer) {
        socket.to(roomCode).emit('player-joined', {
          player: newPlayer,
          room,
        });
      }

      console.log(`${playerName} (${playerId}) joined room ${roomCode}`);
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'SERVER_ERROR';
      socket.emit('room-error', {
        code: errorCode,
        message: roomManager.getErrorMessage(errorCode),
      });
      console.error('Error joining room:', error);
    }
  };
}

export function handleLeaveRoom(socket: Socket) {
  return async (data: { playerId: string }) => {
    try {
      const { playerId } = data;
      const playerRoomCode = roomManager.findRoomByPlayerId(playerId);

      if (playerRoomCode) {
        const updatedRoom = roomManager.leaveRoom(playerRoomCode, playerId);

        // Remove player-socket mapping
        roomManager.playerSockets.delete(playerId);

        // Leave the socket room
        await socket.leave(playerRoomCode);

        if (updatedRoom) {
          // Notify remaining players
          socket.to(playerRoomCode).emit('player-left', {
            playerId,
            room: updatedRoom,
          });
          console.log(`Player ${playerId} left room ${playerRoomCode}`);
        } else {
          console.log(
            `Room ${playerRoomCode} cleaned up - no players remaining`
          );
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
      const roomCode = roomManager.findRoomByPlayerId(playerId);

      if (roomCode) {
        const gameState = roomManager.getGameState(roomCode);
        if (gameState) {
          console.log(
            `Resyncing game state for player ${playerId} in room ${roomCode}`
          );
          socket.emit('game-state-update', { gameState });
        }
      }
    } catch (error) {
      console.error(
        `Error resyncing game state for player ${data.playerId}:`,
        error
      );
      socket.emit('game-error', {
        code: 'STATE_SYNC_ERROR',
        message: 'Could not retrieve the latest game state.',
      });
    }
  };
}

export function handleDisconnect(socket: Socket) {
  return async () => {
    console.log(`Client disconnected: ${socket.id}`);

    // Find and clean up any player associated with this socket
    for (const [playerId, socketId] of roomManager.playerSockets.entries()) {
      if (socketId === socket.id) {
        const roomCode = roomManager.findRoomByPlayerId(playerId);
        if (roomCode) {
          const updatedRoom = roomManager.leaveRoom(roomCode, playerId);
          roomManager.playerSockets.delete(playerId);

          if (updatedRoom) {
            socket.to(roomCode).emit('player-left', {
              playerId,
              room: updatedRoom,
            });
          }
        }
        break;
      }
    }
  };
}

export function registerSocketEvents(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('create_room', handleCreateRoom(socket));
    socket.on('join_room', handleJoinRoom(socket));
    socket.on('leave_room', handleLeaveRoom(socket));
    socket.on('request_game_state', handleRequestGameState(socket));
    socket.on('disconnect', handleDisconnect(socket));
  });
}
