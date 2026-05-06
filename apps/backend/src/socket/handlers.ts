import { type Server, type Socket } from 'socket.io';
import { type GameState, type GameConfig } from '@charades/shared';

import { RoomManager, getErrorMessage } from '@/game/room-manager.js';
import { RoundManager } from '@/game/round-manager.js';
import { PromptManager } from '@/game/prompt-manager.js';
import { SabotageManager } from '@/game/sabotage-manager.js';
import { gameLoopManager } from '@/game/game-loop.js';

declare module 'socket.io' {
  interface SocketData {
    playerId?: string;
    roomCode?: string;
  }
}

// --- In-memory state management with HMR (Hot Module Replacement) support ---

// In development, we use a global variable to preserve state across hot reloads.
// In production, this is just a regular variable.
const globalForState = globalThis as unknown as {
  gameStates: Map<string, GameState>;
  pendingRemovals: Map<string, NodeJS.Timeout>;
};

const gameStates = globalForState.gameStates || new Map<string, GameState>();
const pendingRemovals =
  globalForState.pendingRemovals || new Map<string, NodeJS.Timeout>();

if (process.env.NODE_ENV !== 'production') {
  globalForState.gameStates = gameStates;
  globalForState.pendingRemovals = pendingRemovals;
}

// Per-socket auth state. Set by the io.use middleware on connection from the
// handshake auth payload, and by create_room/join_room/rejoin_room after a
// successful join. All privileged handlers derive playerId from here rather
// than trusting client-supplied payload fields.
function bindSocketIdentity(
  socket: Socket,
  playerId: string,
  roomCode: string
) {
  socket.data.playerId = playerId;
  socket.data.roomCode = roomCode;
}

// Defense-in-depth check for privileged handlers: requires the socket's
// bound roomCode to match the one in the event payload. A socket whose
// identity was set via handshake auth but never validated against an actual
// room (because the auto-rejoin block doesn't run, or the binding is stale)
// will fail this check rather than silently acting on the payload's room.
function getAuthedPlayerForRoom(
  socket: Socket,
  roomCode: string
): string | undefined {
  if (!socket.data.playerId) return undefined;
  if (socket.data.roomCode !== roomCode) return undefined;
  return socket.data.playerId;
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

function processRoundCompletion(
  io: Server,
  roomCode: string,
  winnerId?: string
) {
  const gameState = gameStates.get(roomCode);
  if (!gameState) return;

  // Stop the timer loop
  gameLoopManager.removeLoop(roomCode);

  // Use the RoundManager to handle the core logic of ending a round.
  const roundManager = new RoundManager(gameState);
  let { newGameState } = roundManager.endRound(winnerId);

  // Check if the game is complete after this round
  const updatedRoundManager = new RoundManager(newGameState);
  if (updatedRoundManager.isGameComplete()) {
    // Update game state to complete status
    newGameState = {
      ...newGameState,
      room: { ...newGameState.room, status: 'complete' },
    };

    // Persist the complete state
    gameStates.set(roomCode, newGameState);

    // Broadcast game completion
    io.to(roomCode).emit('game_state_update', {
      gameState: newGameState,
      message: 'Game complete! All players have acted.',
      shouldReconnect: false,
    });

    console.log(`Game completed in room ${roomCode}`);
  } else {
    // Persist the new state
    gameStates.set(roomCode, newGameState);

    // Notify all clients that the round is complete with the results
    io.to(roomCode).emit('round_complete', {
      completedRound:
        newGameState.roundHistory[newGameState.roundHistory.length - 1],
    });
  }
}

// --- Socket Event Handlers ---

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
      bindSocketIdentity(socket, playerId, room.code);

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
      bindSocketIdentity(socket, newPlayer.id, roomCode);

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

// Shared rejoin logic used by both the explicit `rejoin_room` event and the
// auto-rejoin path triggered by handshake auth on a fresh connection.
async function rejoinPlayerToRoom(
  socket: Socket,
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

  const gameState = gameStates.get(roomCode);
  if (!gameState) {
    return {
      ok: false,
      code: 'ROOM_NOT_FOUND',
      message: getErrorMessage('ROOM_NOT_FOUND'),
    };
  }

  const player = gameState.room.players.find(p => p.id === playerId);
  if (!player) {
    return {
      ok: false,
      code: 'PLAYER_NOT_FOUND',
      message: 'Player not found in the specified room.',
    };
  }

  // Cancel any pending removal timer for this player
  const pendingTimer = pendingRemovals.get(playerId);
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    pendingRemovals.delete(playerId);
    console.log(`Cancelled pending removal for player ${playerId}`);
  }

  const updatedPlayer = {
    ...player,
    connectionStatus: 'connected' as const,
  };
  const updatedPlayers = gameState.room.players.map(p =>
    p.id === playerId ? updatedPlayer : p
  );

  const newGameState = {
    ...gameState,
    room: { ...gameState.room, players: updatedPlayers },
  };

  gameStates.set(roomCode, newGameState);
  bindSocketIdentity(socket, playerId, roomCode);

  await socket.join(roomCode);

  socket.emit('game_state_update', {
    gameState: newGameState,
    message: 'Successfully rejoined the room.',
    shouldReconnect: false,
  });

  socket.to(roomCode).emit('player_reconnected', {
    player: updatedPlayer,
    room: newGameState.room,
  });

  console.log(`${player.name} (${playerId}) rejoined room ${roomCode}`);
  return { ok: true };
}

export function handleRejoinRoom(socket: Socket) {
  return async (data: { playerId: string; roomCode: string }) => {
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

export function handleLeaveRoom(socket: Socket) {
  return async () => {
    try {
      const playerId = socket.data.playerId;
      if (!playerId) return;

      const roomCode = findRoomCodeByPlayerId(playerId);
      if (!roomCode) return;

      const gameState = gameStates.get(roomCode);
      if (!gameState) return;

      // If game is in progress, stop the loop
      if (gameState.room.status === 'playing') {
        gameLoopManager.removeLoop(roomCode);
      }

      const newGameState = RoomManager.leaveRoom(gameState, playerId);

      // Clear identity binding on this socket and leave the socket.io room
      socket.data.playerId = undefined;
      socket.data.roomCode = undefined;
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
        gameLoopManager.removeLoop(roomCode);
        console.log(`Room ${roomCode} cleaned up - no players remaining`);
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };
}

export function handleRequestGameState(socket: Socket) {
  return () => {
    const playerId = socket.data.playerId;
    try {
      if (!playerId) return;

      const roomCode = findRoomCodeByPlayerId(playerId);
      if (!roomCode) return;

      const gameState = gameStates.get(roomCode);
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

export function handleDisconnect(io: Server, socket: Socket) {
  return async () => {
    console.log(`Client disconnected: ${socket.id}`);

    const disconnectedPlayerId = socket.data.playerId;
    if (!disconnectedPlayerId) return;

    const roomCode = findRoomCodeByPlayerId(disconnectedPlayerId);
    if (!roomCode) return;

    const gameState = gameStates.get(roomCode);
    if (!gameState) return;

    // Find and update the player's connection status to 'disconnected'
    const updatedPlayers = gameState.room.players.map(player =>
      player.id === disconnectedPlayerId
        ? { ...player, connectionStatus: 'disconnected' as const }
        : player
    );

    const newGameState = {
      ...gameState,
      room: { ...gameState.room, players: updatedPlayers },
    };

    gameStates.set(roomCode, newGameState);

    // Broadcast player disconnection status to other clients (using io)
    io.to(roomCode).emit('player_disconnected', {
      playerId: disconnectedPlayerId,
      room: newGameState.room,
    });

    // Start 30-second countdown before permanent removal
    const removalTimer = setTimeout(() => {
      if (!gameStates.has(roomCode)) return;

      console.log(`Removing player ${disconnectedPlayerId} after timeout`);

      pendingRemovals.delete(disconnectedPlayerId);

      const latestState = gameStates.get(roomCode);
      if (!latestState) return;

      const updatedState = RoomManager.leaveRoom(
        latestState,
        disconnectedPlayerId
      );

      if (updatedState) {
        gameStates.set(roomCode, updatedState);
        io.to(roomCode).emit('player_left', {
          playerId: disconnectedPlayerId,
          room: updatedState.room,
        });
      }
    }, 30000);

    pendingRemovals.set(disconnectedPlayerId, removalTimer);

    console.log(
      `Player ${disconnectedPlayerId} marked as disconnected, will be removed in 30 seconds if not reconnected`
    );
  };
}

export function handleStartGame(io: Server, socket: Socket) {
  return (data: { roomCode: string }) => {
    try {
      const { roomCode } = data;
      const gameState = gameStates.get(roomCode);

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

        // Update state and broadcast the reset
        gameStates.set(roomCode, newGameState);
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

        gameStates.set(roomCode, newGameState);
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

export function handleStartRound(io: Server, socket: Socket) {
  return (data: { roomCode: string }) => {
    try {
      const { roomCode } = data;
      const currentGameState = gameStates.get(roomCode);

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
        // --- END THE GAME ---
        const finalGameState: GameState = {
          ...currentGameState,
          room: { ...currentGameState.room, status: 'complete' },
        };
        gameStates.set(roomCode, finalGameState);
        io.to(roomCode).emit('game_complete', {
          scores: finalGameState.scores,
        });
        console.log(`Game completed in room ${roomCode}`);
      } else {
        // --- START NEXT ROUND ---
        const promptManager = new PromptManager(
          currentGameState.roundHistory.map(r => r.prompt.id)
        );
        const nextPrompt = promptManager.getRandomPrompt();
        const nextRoundGameState = roundManager.startRound(nextPrompt);

        gameStates.set(roomCode, nextRoundGameState);
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

export function handleDeploySabotage(io: Server, socket: Socket) {
  return async (data: { sabotageId: string; roomCode: string }) => {
    try {
      const { sabotageId, roomCode } = data;
      const gameState = gameStates.get(roomCode);
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

      // --- State Update ---
      gameStates.set(roomCode, newGameState);

      const activeSabotage = newGameState.currentRound?.currentSabotage;
      if (!activeSabotage) {
        // This should not happen if deploySabotage succeeds, but it's a safe guard.
        throw new Error('Deployment failed to produce an active sabotage.');
      }

      // --- Emit Events ---
      io.to(roomCode).emit('sabotage_deployed', {
        sabotage: activeSabotage,
        targetPlayerId: newGameState.currentRound?.actorId,
      });

      // --- Set Timer to End Sabotage ---
      setTimeout(() => {
        const currentGameState = gameStates.get(roomCode);
        if (
          currentGameState?.currentRound?.currentSabotage?.action.id ===
          sabotageId
        ) {
          currentGameState.currentRound.currentSabotage = null;
          gameStates.set(roomCode, currentGameState);

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

export function handleEndRound(io: Server, socket: Socket) {
  return (data: { roomCode: string; winnerId: string }) => {
    try {
      const { roomCode, winnerId } = data;
      const gameState = gameStates.get(roomCode);
      if (!gameState) return;

      // Security Check: Validate that the person ending the round is the director
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

export function initializeSocketHandlers(io: Server) {
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

  io.on('connection', (socket: Socket) => {
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

    // Auto-rejoin via handshake auth on a fresh connection. Recovered sockets
    // already have their rooms restored, so no rejoin is needed there.
    // The middleware guarantees playerId and roomCode are either both set or
    // both unset, so a single presence check covers both.
    if (!socket.recovered && socket.data.playerId && socket.data.roomCode) {
      const { playerId, roomCode } = socket.data;
      rejoinPlayerToRoom(socket, playerId, roomCode).then(result => {
        if (!result.ok) {
          // Clear stale identity so this socket doesn't carry it forward.
          socket.data.playerId = undefined;
          socket.data.roomCode = undefined;
          socket.emit('room_error', {
            code: result.code,
            message: result.message,
          });
        }
      });
    }
  });
}
