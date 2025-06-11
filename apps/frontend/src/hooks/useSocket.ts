'use client';

import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  GameState,
  Player,
  Room,
  ActiveSabotage,
  CompletedRound,
} from '@ai-charades/shared';

import { useGameStore } from '@/stores/gameStore';

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

  const requestResync = useCallback(() => {
    if (socket?.connected) {
      const { playerId } = useGameStore.getState();
      if (playerId) {
        console.log('Requesting game state resync...');
        socket.emit('request_game_state', { playerId });
      }
    }
  }, []);

  useEffect(() => {
    if (socket) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

    socket = io(socketUrl, {
      addTrailingSlash: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
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

      // Check for existing session data for automatic rejoining
      const storedPlayerId = sessionStorage.getItem('ai-charades-playerId');
      const storedRoomCode = sessionStorage.getItem('ai-charades-roomCode');

      if (storedPlayerId && storedRoomCode && socket) {
        console.log(
          'Found session data, attempting to rejoin room:',
          storedRoomCode
        );
        updatePlayer(storedPlayerId, { connectionStatus: 'reconnecting' });
        setLoading(true);
        socket.emit('rejoin_room', {
          playerId: storedPlayerId,
          roomCode: storedRoomCode,
        });
      } else {
        // If we are reconnecting without session data, we might want to resync state
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

        // Store session data for reconnection
        sessionStorage.setItem('ai-charades-playerId', data.playerId);
        sessionStorage.setItem('ai-charades-roomCode', data.room.code);
      }
    );

    socket.on(
      'room_joined',
      (data: { room: Room; playerId: string; gameState: GameState }) => {
        setGameState(data.gameState);
        setPlayerId(data.playerId);
        setLoading(false);

        // Store session data for reconnection
        sessionStorage.setItem('ai-charades-playerId', data.playerId);
        sessionStorage.setItem('ai-charades-roomCode', data.room.code);
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
    requestResync,
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
  // This effect will run once on component mount, "waking up" the
  // Next.js API route that hosts the Socket.IO server. This is necessary
  // to prevent a race condition where the client tries to connect before
  // the server is fully initialized.
  useEffect(() => {
    fetch('/api/socket');
  }, []);

  useSocket();
  return null; // This component doesn't render anything.
}
