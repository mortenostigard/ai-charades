import { type Server, type Socket } from 'socket.io';
import {
  type ClientToServerEvents,
  type GameState,
  type ServerToClientEvents,
  type SocketData,
} from '@charades/shared';

import { RoomManager, getErrorMessage } from '@/game/room-manager.js';
import { RoundManager } from '@/game/round-manager.js';
import { PromptManager } from '@/game/prompt-manager.js';
import { SabotageManager } from '@/game/sabotage-manager.js';
import { gameLoopManager } from '@/game/game-loop.js';
import { roomStore } from '@/game/room-store.js';

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

// Per-socket auth state. Set by the io.use middleware on connection from the
// handshake auth payload, and by create_room/join_room/rejoin_room after a
// successful join. All privileged handlers derive playerId from here rather
// than trusting client-supplied payload fields.
function bindSocketIdentity(
  socket: TypedSocket,
  playerId: string,
  roomCode: string
) {
  socket.data.playerId = playerId;
  socket.data.roomCode = roomCode;
}

function clearSocketIdentity(socket: TypedSocket) {
  socket.data.playerId = undefined;
  socket.data.roomCode = undefined;
}

// Defense-in-depth check for privileged handlers: requires the socket's
// bound roomCode to match the one in the event payload. A socket whose
// identity was set via handshake auth but never validated against an actual
// room (because the auto-rejoin block doesn't run, or the binding is stale)
// will fail this check rather than silently acting on the payload's room.
function getAuthedPlayerForRoom(
  socket: TypedSocket,
  roomCode: string
): string | undefined {
  if (!socket.data.playerId) return undefined;
  if (socket.data.roomCode !== roomCode) return undefined;
  return socket.data.playerId;
}

function processRoundCompletion(
  io: TypedServer,
  roomCode: string,
  winnerId?: string
) {
  const gameState = roomStore.get(roomCode);
  if (!gameState) return;

  gameLoopManager.removeLoop(roomCode);

  const roundManager = new RoundManager(gameState);
  const ended = roundManager.endRound(winnerId);
  const { completedRound } = ended;
  let { newGameState } = ended;

  const updatedRoundManager = new RoundManager(newGameState);
  if (updatedRoundManager.isGameComplete()) {
    newGameState = {
      ...newGameState,
      room: { ...newGameState.room, status: 'complete' },
    };

    roomStore.set(roomCode, newGameState);

    io.to(roomCode).emit('game_state_update', {
      gameState: newGameState,
      message: 'Game complete! All players have acted.',
      shouldReconnect: false,
    });

    console.log(`Game completed in room ${roomCode}`);
  } else {
    roomStore.set(roomCode, newGameState);
    io.to(roomCode).emit('round_complete', { completedRound });
  }
}

// --- Socket Event Handlers ---

export function handleCreateRoom(
  socket: TypedSocket
): ClientToServerEvents['create_room'] {
  return async data => {
    try {
      if (!data.playerName || data.playerName.trim().length < 2) {
        socket.emit('room_error', {
          code: 'INVALID_PLAYER_NAME',
          message: 'Player name must be at least 2 characters long.',
        });
        return;
      }

      const { room, playerId, gameState } = RoomManager.createRoom(
        data.playerName.trim(),
        roomStore.codes(),
        data.gameConfig
      );

      roomStore.set(room.code, gameState);
      bindSocketIdentity(socket, playerId, room.code);

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

export function handleJoinRoom(
  socket: TypedSocket
): ClientToServerEvents['join_room'] {
  return async data => {
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

      const gameState = roomStore.get(roomCode);
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

      roomStore.set(roomCode, newGameState);
      bindSocketIdentity(socket, newPlayer.id, roomCode);

      await socket.join(roomCode);

      socket.emit('room_joined', {
        room: newGameState.room,
        playerId: newPlayer.id,
        gameState: newGameState,
      });

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

// Shared rejoin logic used by both the explicit `rejoin_room` event and the
// auto-rejoin path triggered by handshake auth on a fresh connection.
async function rejoinPlayerToRoom(
  socket: TypedSocket,
  playerId: string,
  roomCode: string
): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  if (!/^\d{4}$/.test(roomCode)) {
    return {
      ok: false,
      code: 'INVALID_CODE',
      message: getErrorMessage('INVALID_CODE'),
    };
  }

  if (!roomStore.has(roomCode)) {
    return {
      ok: false,
      code: 'ROOM_NOT_FOUND',
      message: getErrorMessage('ROOM_NOT_FOUND'),
    };
  }

  const update = roomStore.markPlayerConnected(roomCode, playerId);
  if (!update) {
    return {
      ok: false,
      code: 'PLAYER_NOT_FOUND',
      message: 'Player not found in the specified room.',
    };
  }

  if (roomStore.cancelRemoval(playerId)) {
    console.log(`Cancelled pending removal for player ${playerId}`);
  }

  bindSocketIdentity(socket, playerId, roomCode);
  await socket.join(roomCode);

  socket.emit('game_state_update', {
    gameState: update.state,
    message: 'Successfully rejoined the room.',
    shouldReconnect: false,
  });

  socket.to(roomCode).emit('player_reconnected', {
    player: update.player,
    room: update.state.room,
  });

  console.log(`${update.player.name} (${playerId}) rejoined room ${roomCode}`);
  return { ok: true };
}

export function handleRejoinRoom(
  socket: TypedSocket
): ClientToServerEvents['rejoin_room'] {
  return async data => {
    try {
      const { playerId, roomCode } = data;

      if (!playerId || !roomCode) {
        socket.emit('room_error', {
          code: 'INVALID_DATA',
          message: 'Player ID and room code are required for rejoining.',
        });
        return;
      }

      const result = await rejoinPlayerToRoom(socket, playerId, roomCode);
      if (!result.ok) {
        socket.emit('room_error', {
          code: result.code,
          message: result.message,
        });
      }
    } catch (error) {
      console.error('Error rejoining room:', error);
      socket.emit('room_error', {
        code: 'SERVER_ERROR',
        message: 'Failed to rejoin room. Please try again.',
      });
    }
  };
}

export function handleLeaveRoom(
  socket: TypedSocket
): ClientToServerEvents['leave_room'] {
  return async () => {
    try {
      const playerId = socket.data.playerId;
      const roomCode = socket.data.roomCode;
      if (!playerId || !roomCode) return;

      // Drop any pending disconnect-removal timer so it doesn't fire after
      // the explicit leave and emit a phantom player_left.
      roomStore.cancelRemoval(playerId);

      const currentState = roomStore.get(roomCode);
      if (currentState?.room.status === 'playing') {
        gameLoopManager.removeLoop(roomCode);
      }

      const result = roomStore.removePlayer(roomCode, playerId);

      clearSocketIdentity(socket);
      await socket.leave(roomCode);

      switch (result.status) {
        case 'removed':
          socket.to(roomCode).emit('player_left', {
            playerId,
            room: result.state.room,
          });
          console.log(`Player ${playerId} left room ${roomCode}`);
          break;
        case 'emptied':
          gameLoopManager.removeLoop(roomCode);
          console.log(`Room ${roomCode} cleaned up - no players remaining`);
          break;
        case 'not_found':
          break;
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };
}

export function handleRequestGameState(
  socket: TypedSocket
): ClientToServerEvents['request_game_state'] {
  return () => {
    const playerId = socket.data.playerId;
    const roomCode = socket.data.roomCode;
    try {
      if (!playerId || !roomCode) return;

      const gameState = roomStore.get(roomCode);
      if (gameState) {
        console.log(
          `Resyncing game state for player ${playerId} in room ${roomCode}`
        );
        socket.emit('game_state_update', { gameState });
      }
    } catch (error) {
      console.error(
        `Error resyncing game state for player ${playerId ?? 'unknown'}:`,
        error
      );
      socket.emit('game_error', {
        code: 'STATE_SYNC_ERROR',
        message: 'Could not retrieve the latest game state.',
      });
    }
  };
}

export function handleDisconnect(io: TypedServer, socket: TypedSocket) {
  return async () => {
    console.log(`Client disconnected: ${socket.id}`);

    const disconnectedPlayerId = socket.data.playerId;
    const roomCode = socket.data.roomCode;
    if (!disconnectedPlayerId || !roomCode) return;

    const update = roomStore.markPlayerDisconnected(
      roomCode,
      disconnectedPlayerId
    );
    if (!update) return;

    io.to(roomCode).emit('player_disconnected', {
      playerId: disconnectedPlayerId,
      room: update.state.room,
    });

    roomStore.scheduleRemoval(
      disconnectedPlayerId,
      roomCode,
      () => {
        console.log(`Removing player ${disconnectedPlayerId} after timeout`);
        const result = roomStore.removePlayer(roomCode, disconnectedPlayerId);
        if (result.status === 'removed') {
          io.to(roomCode).emit('player_left', {
            playerId: disconnectedPlayerId,
            room: result.state.room,
          });
        }
      },
      30000
    );

    console.log(
      `Player ${disconnectedPlayerId} marked as disconnected, will be removed in 30 seconds if not reconnected`
    );
  };
}

export function handleStartGame(
  io: TypedServer,
  socket: TypedSocket
): ClientToServerEvents['start_game'] {
  return data => {
    try {
      const { roomCode } = data;
      const gameState = roomStore.get(roomCode);

      if (!gameState) {
        throw new Error('Game state not found');
      }

      // Validate that the request comes from the room host (the socket bound
      // to the host playerId via auth handshake or create/join).
      const hostId = gameState.room.players[0]?.id;
      const requesterId = getAuthedPlayerForRoom(socket, roomCode);
      if (!requesterId || requesterId !== hostId) {
        socket.emit('game_error', {
          code: 'UNAUTHORIZED',
          message: 'Only the host can start the game.',
        });
        return;
      }

      let newGameState: GameState;

      if (gameState.room.status === 'complete') {
        // Play Again: Reset game state while keeping players
        newGameState = {
          ...gameState,
          room: { ...gameState.room, status: 'waiting' },
          currentRound: null,
          scores: Object.fromEntries(
            gameState.room.players.map(player => [player.id, 0])
          ),
          roundHistory: [],
        };

        roomStore.set(roomCode, newGameState);
        io.to(roomCode).emit('game_state_update', {
          gameState: newGameState,
          message: 'Game reset. Ready to play again!',
          shouldReconnect: false,
        });

        console.log(`Game reset for play again in room ${roomCode}`);
      } else {
        // Start new game from waiting state
        const roundManager = new RoundManager(gameState);
        const promptManager = new PromptManager(
          gameState.roundHistory.map(r => r.prompt.id)
        );
        const prompt = promptManager.getRandomPrompt();
        newGameState = roundManager.startRound(prompt);

        roomStore.set(roomCode, newGameState);
        gameLoopManager.createLoop(roomCode, newGameState);

        io.to(roomCode).emit('game_state_update', {
          gameState: newGameState,
          message: 'Game started!',
          shouldReconnect: false,
        });

        console.log(`Game started in room ${roomCode}`);
      }
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('game_error', {
        code: 'START_GAME_FAILED',
        message: 'Could not start the game.',
      });
    }
  };
}

export function handleStartRound(
  io: TypedServer,
  socket: TypedSocket
): ClientToServerEvents['start_round'] {
  return data => {
    try {
      const { roomCode } = data;
      const currentGameState = roomStore.get(roomCode);

      if (!currentGameState) {
        socket.emit('game_error', {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found.',
        });
        return;
      }

      // Validate that the request comes from the room host
      const hostId = currentGameState.room.players[0]?.id;
      const requesterId = getAuthedPlayerForRoom(socket, roomCode);
      if (!requesterId || requesterId !== hostId) {
        socket.emit('game_error', {
          code: 'UNAUTHORIZED',
          message: 'Only the host can start the next round.',
        });
        return;
      }

      const roundManager = new RoundManager(currentGameState);

      if (roundManager.isGameComplete()) {
        const finalGameState: GameState = {
          ...currentGameState,
          room: { ...currentGameState.room, status: 'complete' },
        };
        roomStore.set(roomCode, finalGameState);
        io.to(roomCode).emit('game_complete', {
          scores: finalGameState.scores,
        });
        console.log(`Game completed in room ${roomCode}`);
      } else {
        const promptManager = new PromptManager(
          currentGameState.roundHistory.map(r => r.prompt.id)
        );
        const nextPrompt = promptManager.getRandomPrompt();
        const nextRoundGameState = roundManager.startRound(nextPrompt);

        roomStore.set(roomCode, nextRoundGameState);
        gameLoopManager.createLoop(roomCode, nextRoundGameState);

        io.to(roomCode).emit('game_state_update', {
          gameState: nextRoundGameState,
        });
        console.log(`Starting next round in room ${roomCode}`);
      }
    } catch (error) {
      console.error('Error starting next round:', error);
      socket.emit('game_error', {
        code: 'START_ROUND_FAILED',
        message: 'Could not start the next round.',
      });
    }
  };
}

export function handleDeploySabotage(
  io: TypedServer,
  socket: TypedSocket
): ClientToServerEvents['deploy_sabotage'] {
  return async data => {
    try {
      const { sabotageId, roomCode } = data;
      const gameState = roomStore.get(roomCode);
      if (!gameState) {
        throw new Error(`Game state not found for room ${roomCode}`);
      }

      // Director identity is derived from the socket binding, not the payload.
      // SabotageManager will reject if this id doesn't match currentRound.directorId.
      const directorId = getAuthedPlayerForRoom(socket, roomCode);
      if (!directorId) {
        socket.emit('game_error', {
          code: 'UNAUTHORIZED',
          message: 'You must be in a room to deploy sabotage.',
        });
        return;
      }

      const sabotageManager = new SabotageManager(gameState);
      const newGameState = sabotageManager.deploySabotage(
        sabotageId,
        directorId,
        Date.now()
      );

      roomStore.set(roomCode, newGameState);

      const activeSabotage = newGameState.currentRound?.currentSabotage;
      if (!activeSabotage) {
        // This should not happen if deploySabotage succeeds, but it's a safe guard.
        throw new Error('Deployment failed to produce an active sabotage.');
      }

      io.to(roomCode).emit('sabotage_deployed', {
        sabotage: activeSabotage,
        targetPlayerId: newGameState.currentRound?.actorId,
      });

      setTimeout(() => {
        const currentGameState = roomStore.get(roomCode);
        if (
          currentGameState?.currentRound?.currentSabotage?.action.id ===
          sabotageId
        ) {
          currentGameState.currentRound.currentSabotage = null;
          roomStore.set(roomCode, currentGameState);

          io.to(roomCode).emit('sabotage_ended', { sabotageId });
        }
      }, activeSabotage.action.duration);
    } catch (error) {
      if (error instanceof Error) {
        // We expect specific error codes from the SabotageManager
        console.error(`Sabotage error: ${error.message}`);
        socket.emit('sabotage_error', {
          code: error.message,
          message: 'Failed to deploy sabotage.',
          attemptedSabotageId: data.sabotageId,
        });
      } else {
        console.error(`Unknown error deploying sabotage:`, error);
        socket.emit('game_error', {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred.',
        });
      }
    }
  };
}

export function handleEndRound(
  io: TypedServer,
  socket: TypedSocket
): ClientToServerEvents['end_round'] {
  return data => {
    try {
      const { roomCode, winnerId } = data;
      const gameState = roomStore.get(roomCode);
      if (!gameState) return;

      const requesterId = getAuthedPlayerForRoom(socket, roomCode);
      const directorId = gameState.currentRound?.directorId;
      if (!requesterId || !directorId || requesterId !== directorId) {
        return socket.emit('game_error', {
          code: 'UNAUTHORIZED',
          message: 'Only the director can end the round.',
        });
      }

      processRoundCompletion(io, roomCode, winnerId);
    } catch (error) {
      console.error('Error ending round:', error);
      socket.emit('game_error', {
        code: 'ROUND_NOT_ACTIVE',
        message: 'Could not end the round.',
      });
    }
  };
}

export function initializeSocketHandlers(io: TypedServer) {
  // Initialize the game loop manager with the server instance
  gameLoopManager.init(io, (roomCode: string) => {
    // This is the callback for when a round timer runs out
    processRoundCompletion(io, roomCode); // No winnerId
  });

  // Connection-time auth middleware. Bind the socket to a player identity if
  // the client supplies a session via handshake auth. Connections without
  // auth are still allowed — they're for create_room / join_room / fresh
  // joiners. Privileged handlers verify socket.data.playerId at call time.
  //
  // Both playerId and roomCode must be present and well-formed; otherwise
  // neither is bound. This guarantees the auto-rejoin block below always has
  // a chance to validate the (playerId, roomCode) pair against an actual
  // room — half-bound state would leave socket.data.playerId set without
  // any membership check.
  //
  // Skipped on socket.recovered (see connectionStateRecovery.skipMiddlewares
  // in server.ts), which is correct because socket.data is preserved across
  // the recovery window.
  io.use((socket, next) => {
    const auth = (socket.handshake.auth ?? {}) as {
      playerId?: unknown;
      roomCode?: unknown;
    };
    const playerId =
      typeof auth.playerId === 'string' && auth.playerId.length > 0
        ? auth.playerId
        : undefined;
    const roomCode =
      typeof auth.roomCode === 'string' && /^\d{4}$/.test(auth.roomCode)
        ? auth.roomCode
        : undefined;
    if (playerId && roomCode) {
      socket.data.playerId = playerId;
      socket.data.roomCode = roomCode;
    }
    next();
  });

  io.on('connection', (socket: TypedSocket) => {
    console.log(
      `Client ${socket.recovered ? 'recovered' : 'connected'}: ${socket.id}`
    );

    socket.on('create_room', handleCreateRoom(socket));
    socket.on('join_room', handleJoinRoom(socket));
    socket.on('rejoin_room', handleRejoinRoom(socket));
    socket.on('leave_room', handleLeaveRoom(socket));
    socket.on('start_game', handleStartGame(io, socket));
    socket.on('start_round', handleStartRound(io, socket));
    socket.on('deploy_sabotage', handleDeploySabotage(io, socket));
    socket.on('request_game_state', handleRequestGameState(socket));
    socket.on('end_round', handleEndRound(io, socket));
    socket.on('disconnecting', handleDisconnect(io, socket));

    if (!socket.recovered && socket.data.playerId && socket.data.roomCode) {
      const { playerId, roomCode } = socket.data;
      rejoinPlayerToRoom(socket, playerId, roomCode).then(result => {
        if (!result.ok) {
          clearSocketIdentity(socket);
          socket.emit('room_error', {
            code: 'AUTO_REJOIN_FAILED',
            message: 'Your previous session is no longer valid.',
          });
        }
      });
    }
  });
}
