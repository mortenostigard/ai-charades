'use client';

import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  type GameState,
  type Player,
  type Room,
  type ActiveSabotage,
  type CompletedRound,
} from '@charades/shared';

import { useGameStore } from '@/stores/gameStore';
import { loadPlayerSession, savePlayerSession } from '@/lib/playerSession';

// This ensures the hook only runs once, preventing multiple socket connections.
let socket: Socket | null = null;

export const useSocket = () => {
  const {
    setGameState,
    setPlayerId,
    setError,
    setLoading,
    setSocketReady,
    addPlayer,
    removePlayer,
    updatePlayer,
    updateRoom,
    updateScores,
    deployActiveSabotage,
    removeActiveSabotage,
  } = useGameStore.getState();

  useEffect(() => {
    if (socket) return;

    const requestResync = () => {
      if (socket?.connected) {
        console.log('Requesting game state resync...');
        socket.emit('request_game_state');
      }
    };

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

    console.log('🔌 Attempting to connect to Socket.IO server:', socketUrl);
    console.log(
      '🔧 Environment variable NEXT_PUBLIC_SOCKET_URL:',
      process.env.NEXT_PUBLIC_SOCKET_URL
    );

    // Read any persisted session and pass it via handshake auth so the server
    // can auto-rejoin us on connect. Falls back to undefined for a fresh user.
    const session = loadPlayerSession();

    // Restore playerId in the store immediately so getMyPlayer() resolves
    // once gameState arrives. Without this, a page refresh leaves playerId
    // null even though the server-side auto-rejoin succeeds, and components
    // treat the local user as a stranger.
    if (session) {
      setPlayerId(session.playerId);
      setLoading(true);
    }

    socket = io(socketUrl, {
      addTrailingSlash: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: session ?? undefined,
    });

    // Basic transport-level error logging
    socket.io.on('error', error => {
      console.error('🚨 Socket.IO transport error:', error);
    });

    // --- Core Connection Events ---
    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
      const { playerId } = useGameStore.getState();
      if (playerId) {
        updatePlayer(playerId, { connectionStatus: 'connected' });
      }
      setError(null);
      setSocketReady(true);

      // Auto-rejoin is handled server-side via the handshake auth payload
      // we passed when constructing the socket. The server will emit a
      // game_state_update on success. Show a reconnecting state in the UI
      // while we wait for that, and resync if there's no persisted session.
      const persisted = loadPlayerSession();
      if (persisted) {
        console.log(
          'Auto-rejoin via handshake auth for room:',
          persisted.roomCode
        );
        updatePlayer(persisted.playerId, { connectionStatus: 'reconnecting' });
        setLoading(true);
      } else {
        requestResync();
      }
    });

    socket.on('disconnect', reason => {
      console.log('Socket disconnected:', reason);
      const { playerId } = useGameStore.getState();
      if (playerId) {
        updatePlayer(playerId, { connectionStatus: 'disconnected' });
      }
      if (reason !== 'io client disconnect') {
        setError('Connection lost. Attempting to reconnect...');
      }
      setSocketReady(false);
    });

    socket.io.on('reconnect_attempt', (attempt: number) => {
      console.log(`Reconnection attempt ${attempt}...`);
      const { playerId } = useGameStore.getState();
      if (playerId) {
        updatePlayer(playerId, { connectionStatus: 'reconnecting' });
      }
      setLoading(true);
      setError(`Reconnecting (attempt ${attempt} of 5)...`);
    });

    socket.io.on('reconnect', (attempt: number) => {
      console.log(`Successfully reconnected after ${attempt} attempts.`);
      setLoading(false);
      setError(null);
      // State resync will be handled by the 'connect' event handler
    });

    socket.io.on('reconnect_failed', () => {
      console.error('Failed to reconnect.');
      setLoading(false);
      setError('Could not reconnect to the server. Please refresh the page.');
    });

    socket.on('connect_error', err => {
      console.error('Connection error:', err);
      setError(
        'Failed to connect to the server. Check your connection or try again later.'
      );
    });

    // --- Room Management Events ---
    socket.on(
      'room_created',
      (data: { room: Room; playerId: string; gameState: GameState }) => {
        setGameState(data.gameState);
        setPlayerId(data.playerId);
        setLoading(false);

        savePlayerSession(data.playerId, data.room.code);
      }
    );

    socket.on(
      'room_joined',
      (data: { room: Room; playerId: string; gameState: GameState }) => {
        setGameState(data.gameState);
        setPlayerId(data.playerId);
        setLoading(false);

        savePlayerSession(data.playerId, data.room.code);
      }
    );

    socket.on('player_joined', (data: { player: Player; room: Room }) => {
      addPlayer(data.player);
      updateRoom(data.room);
    });

    socket.on('player_left', (data: { playerId: string; room: Room }) => {
      removePlayer(data.playerId);
      updateRoom(data.room);
    });

    socket.on('player_reconnected', (data: { player: Player; room: Room }) => {
      updatePlayer(data.player.id, data.player);
      updateRoom(data.room);
    });

    socket.on(
      'player_disconnected',
      (data: { playerId: string; room: Room }) => {
        updatePlayer(data.playerId, { connectionStatus: 'disconnected' });
        updateRoom(data.room);
      }
    );

    socket.on('room_updated', (data: { room: Room }) => {
      updateRoom(data.room);
    });

    socket.on('room_error', (error: { code: string; message: string }) => {
      // If we have a persisted session and an optimistically-restored
      // playerId but no synced gameState yet, this error is from a failed
      // server-side auto-rejoin (server restarted, room expired, or player
      // removed after the grace window). Reset the store and clear the
      // stale session so we don't keep retrying on every reconnect.
      // resetState() handles both.
      const { gameState, resetState } = useGameStore.getState();
      const staleAutoRejoin =
        !gameState &&
        (error.code === 'ROOM_NOT_FOUND' ||
          error.code === 'PLAYER_NOT_FOUND' ||
          error.code === 'INVALID_CODE');
      if (staleAutoRejoin) {
        resetState();
      }
      setError(error.message);
      setLoading(false);
    });

    // --- Game Flow Events ---
    socket.on('round_complete', (data: { completedRound: CompletedRound }) => {
      const { setRoundComplete } = useGameStore.getState();
      setRoundComplete(data.completedRound);
    });

    socket.on('sabotage_deployed', (data: { sabotage: ActiveSabotage }) => {
      deployActiveSabotage(data.sabotage);
    });

    socket.on('sabotage_ended', (_data: { sabotageId: string }) => {
      removeActiveSabotage();
    });

    // --- Timer Events ---
    socket.on('timer_update', (data: { timeRemaining: number }) => {
      const { setTimeRemaining } = useGameStore.getState();
      setTimeRemaining(data.timeRemaining);
    });

    // --- Generic Error/State Sync ---
    socket.on('game_error', (error: { code: string; message: string }) => {
      setError(error.message);
      setLoading(false);
    });

    socket.on('game_state_update', (data: { gameState: GameState }) => {
      console.log('Received game_state_update, syncing state.');
      setGameState(data.gameState);
      setLoading(false);
      setError(null);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        console.log('Disconnecting socket...');
        socket.disconnect();
        socket = null;
      }
    };
  }, [
    setGameState,
    setPlayerId,
    setError,
    setLoading,
    setSocketReady,
    addPlayer,
    updatePlayer,
    removePlayer,
    updateRoom,
    updateScores,
    deployActiveSabotage,
    removeActiveSabotage,
  ]);

  const emit = (event: string, data: unknown) => {
    if (socket) {
      if (event === 'create_room' || event === 'join_room') {
        setLoading(true);
      }
      socket.emit(event, data);
    } else {
      console.error('Socket not connected. Cannot emit event.');
      setError('Cannot connect to the server. Please refresh the page.');
    }
  };

  return { emit };
};

// A wrapper component to initialize the socket hook for the entire app.
// This should be placed in your main layout file (e.g., `src/app/layout.tsx`).
export function SocketInitializer() {
  // Initialize the socket connection for the entire app
  useSocket();
  return null; // This component doesn't render anything.
}
