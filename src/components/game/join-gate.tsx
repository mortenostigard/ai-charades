'use client';

import { useState } from 'react';

import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayerNameInput } from '@/components/ui/player-name-input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';

interface JoinGateProps {
  readonly roomCode: string;
}

export function JoinGate({ roomCode }: JoinGateProps) {
  const { emit } = useSocket();
  const error = useGameStore(state => state.error);
  const loading = useGameStore(state => state.loading);
  const connected = useGameStore(state => state.connected);
  const setLoading = useGameStore(state => state.setLoading);
  const setError = useGameStore(state => state.setError);
  const [playerName, setPlayerName] = useState('');

  const isPlayerNameValid = playerName.length >= 2 && playerName.length <= 20;

  const handleJoinRoom = () => {
    if (!isPlayerNameValid) return;
    setLoading(true);
    setError(null);
    emit('join_room', { playerName, roomCode });
  };

  return (
    <div className='min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4'>
      <Card className='w-full max-w-md mx-auto bg-gray-900 border-gray-800 shadow-2xl'>
        <CardHeader>
          <CardTitle className='text-2xl font-bold text-center text-white'>
            You&apos;re entering room{' '}
            <span className='text-purple-400'>{roomCode}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <PlayerNameInput
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            disabled={loading}
          />
          <div className='space-y-2'>
            <Button
              onClick={handleJoinRoom}
              disabled={!isPlayerNameValid || loading || !connected}
              className='w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50'
            >
              {loading && <LoadingSpinner />}
              {!loading && !connected && 'Connecting...'}
              {!loading && connected && 'Join Game'}
            </Button>
          </div>
          <ErrorMessage message={error || ''} />
        </CardContent>
      </Card>
    </div>
  );
}
