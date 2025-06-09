'use client';

import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

import { useGameStore } from '@/stores/gameStore';
import {
  GameState,
  Player,
  Room,
  CurrentRound,
  ScoreUpdate,
  ActiveSabotage,
  EmojiReaction,
} from '@/types';

// This ensures the hook only runs once, preventing multiple socket connections.
let socket: Socket | null = null;

export const useSocket = () => {
  const {
    setConnected,
    setGameState,
    setPlayerId,
    setError,
    setLoading,
    addPlayer,
    removePlayer,
    updateRoom,
    setCurrentRound,
    updateScores,
    deployActiveSabotage,
    removeActiveSabotage,
    // TODO: Add an action in the store for this
    // addReaction,
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
      setConnected(true);
      setError(null);
      // If we are reconnecting, we might want to resync state
      requestResync();
    });

    socket.on('disconnect', reason => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
      if (reason !== 'io client disconnect') {
        setError('Connection lost. Attempting to reconnect...');
      }
    });

    socket.on('reconnect_attempt', attempt => {
      console.log(`Reconnection attempt ${attempt}...`);
      setLoading(true);
      setError(`Reconnecting (attempt ${attempt} of 5)...`);
    });

    socket.on('reconnect', attempt => {
      console.log(`Successfully reconnected after ${attempt} attempts.`);
      setLoading(false);
      setError(null);
      // State resync will be handled by the 'connect' event handler
    });

    socket.on('reconnect_failed', () => {
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
      }
    );

    socket.on(
      'room_joined',
      (data: { room: Room; playerId: string; gameState: GameState }) => {
        setGameState(data.gameState);
        setPlayerId(data.playerId);
        setLoading(false);
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

    socket.on('room_updated', (data: { room: Room }) => {
      updateRoom(data.room);
    });

    socket.on('room_error', (error: { code: string; message: string }) => {
      setError(error.message);
      setLoading(false);
    });

    // --- Game Flow Events ---
    socket.on('round_started', (data: { round: CurrentRound }) => {
      setCurrentRound(data.round);
    });

    socket.on(
      'round_complete',
      (data: { round: CurrentRound; scores: ScoreUpdate[] }) => {
        // Update the completed round history in the store and clear the current round
        // This logic will be more complex, for now we just clear the round
        setCurrentRound(null);
        updateScores(data.scores);
      }
    );

    socket.on('sabotage_deployed', (data: { sabotage: ActiveSabotage }) => {
      deployActiveSabotage(data.sabotage);
    });

    socket.on('sabotage_ended', (_data: { sabotageId: string }) => {
      removeActiveSabotage();
    });

    socket.on('reaction_sent', (data: { reaction: EmojiReaction }) => {
      // TODO: Implement reaction handling in the store
      console.log('Reaction received:', data.reaction);
      // addReaction(data.reaction);
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
    setConnected,
    setGameState,
    setPlayerId,
    setError,
    setLoading,
    addPlayer,
    removePlayer,
    updateRoom,
    setCurrentRound,
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
