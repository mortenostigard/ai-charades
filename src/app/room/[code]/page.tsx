'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { GameRoom } from '@/components/game/game-room';
import { useGameStore } from '@/stores/gameStore';
import { JoinGate } from '@/components/game/join-gate';
import { LoadingSpinner } from '@/components/game/loading-spinner';

export default function RoomPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const gameState = useGameStore(state => state.gameState);
  const myPlayer = useGameStore(state => state.getMyPlayer());
  const loading = useGameStore(state => state.loading);
  const error = useGameStore(state => state.error);
  const resetState = useGameStore(state => state.resetState);

  // Effect to handle navigation if gameState is ever cleared (e.g., player leaves)
  useEffect(() => {
    if (!gameState && !loading) {
      const timer = setTimeout(() => {
        if (!useGameStore.getState().gameState) {
          console.log('No game state found, returning home.');
          router.push('/');
        }
      }, 500); // Small delay to prevent race conditions on leave
      return () => clearTimeout(timer);
    }
  }, [gameState, loading, router]);

  // In a dynamic route like this, params should always be available.
  // If not, we can show a loading state before proceeding.
  if (!params) {
    return (
      <div className='flex h-screen items-center justify-center bg-gray-950'>
        <LoadingSpinner />
      </div>
    );
  }
  const roomCode = params.code;

  // If there's an error, show it. This is important for "room not found", etc.
  if (error) {
    return (
      <div className='flex h-screen flex-col items-center justify-center bg-gray-950 text-white gap-4'>
        <p className='text-red-400'>{error}</p>
        <button
          onClick={() => {
            resetState();
            router.push('/');
          }}
          className='px-4 py-2 bg-purple-600 rounded-lg'
        >
          Go Home
        </button>
      </div>
    );
  }

  // If the user has a player object within the current gameState, they are in the room.
  if (myPlayer) {
    return <GameRoom roomCode={roomCode} />;
  }

  // If there is a gameState but the user is not in it, or no gameState at all,
  // this user is a new visitor (or has refreshed). Show the JoinGate.
  if (!myPlayer) {
    return <JoinGate roomCode={roomCode} />;
  }

  // Fallback loading state while store initializes
  return (
    <div className='flex h-screen items-center justify-center bg-gray-950'>
      <LoadingSpinner />
    </div>
  );
}
