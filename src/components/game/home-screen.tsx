'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/stores/gameStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayerNameInput } from '@/components/game/player-name-input';
import { RoomCodeInput } from '@/components/game/room-code-input';
import { LoadingSpinner } from '@/components/game/loading-spinner';
import { ErrorMessage } from '@/components/game/error-message';

export function HomeScreen() {
  const router = useRouter();
  const { emit } = useSocket();

  const gameState = useGameStore(state => state.gameState);
  const error = useGameStore(state => state.error);
  const loading = useGameStore(state => state.loading);
  const connected = useGameStore(state => state.connected);
  const setLoading = useGameStore(state => state.setLoading);
  const setError = useGameStore(state => state.setError);

  const [mode, setMode] = useState<'initial' | 'create' | 'join'>('initial');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const isPlayerNameValid = playerName.length >= 2 && playerName.length <= 20;
  const isRoomCodeValid = /^\d{4}$/.test(roomCode);

  useEffect(() => {
    // If we successfully joined a room, the gameState will be updated.
    // We can then navigate to the room lobby.
    if (gameState?.room?.code) {
      router.push(`/room/${gameState.room.code}`);
    }
  }, [gameState, router]);

  const handleCreateRoom = () => {
    if (!isPlayerNameValid) return;
    setLoading(true);
    setError(null);
    emit('create_room', { playerName });
  };

  const handleJoinRoom = () => {
    if (!isPlayerNameValid || !isRoomCodeValid) return;
    setLoading(true);
    setError(null);
    emit('join_room', { playerName, roomCode });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
  };

  const renderContent = () => {
    switch (mode) {
      case 'create':
        return (
          <motion.div
            key='create'
            variants={cardVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
            className='w-full'
          >
            <Card className='w-full max-w-md mx-auto bg-gray-900 border-gray-800 shadow-2xl'>
              <CardHeader>
                <CardTitle className='text-2xl font-bold text-center text-white'>
                  Create a New Game
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
                    onClick={handleCreateRoom}
                    disabled={!isPlayerNameValid || loading || !connected}
                    className='w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50'
                  >
                    {loading && <LoadingSpinner />}
                    {!loading && !connected && 'Connecting...'}
                    {!loading && connected && 'Create Room'}
                  </Button>
                  <Button
                    variant='ghost'
                    onClick={() => {
                      setMode('initial');
                      setError(null);
                    }}
                    className='w-full h-14 text-lg text-gray-300 hover:bg-gray-800 hover:text-white'
                    disabled={loading}
                  >
                    Back
                  </Button>
                </div>
                <ErrorMessage message={error || ''} />
              </CardContent>
            </Card>
          </motion.div>
        );
      case 'join':
        return (
          <motion.div
            key='join'
            variants={cardVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
            className='w-full'
          >
            <Card className='w-full max-w-md mx-auto bg-gray-900 border-gray-800 shadow-2xl'>
              <CardHeader>
                <CardTitle className='text-2xl font-bold text-center text-white'>
                  Join an Existing Game
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-4'>
                  <PlayerNameInput
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    disabled={loading}
                  />
                  <RoomCodeInput
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className='space-y-2'>
                  <Button
                    onClick={handleJoinRoom}
                    disabled={
                      !isPlayerNameValid ||
                      !isRoomCodeValid ||
                      loading ||
                      !connected
                    }
                    className='w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50'
                  >
                    {loading && <LoadingSpinner />}
                    {!loading && !connected && 'Connecting...'}
                    {!loading && connected && 'Join Room'}
                  </Button>
                  <Button
                    variant='ghost'
                    onClick={() => {
                      setMode('initial');
                      setError(null);
                    }}
                    className='w-full h-14 text-lg text-gray-300 hover:bg-gray-800 hover:text-white'
                    disabled={loading}
                  >
                    Back
                  </Button>
                </div>
                <ErrorMessage message={error || ''} />
              </CardContent>
            </Card>
          </motion.div>
        );
      case 'initial':
      default:
        return (
          <motion.div
            key='initial'
            variants={cardVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
            className='w-full max-w-md mx-auto space-y-4'
          >
            <Button
              onClick={() => setMode('create')}
              className='w-full h-16 text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
              disabled={loading || !connected}
            >
              {connected ? 'Create Room' : 'Connecting...'}
            </Button>
            <Button
              onClick={() => setMode('join')}
              className='w-full h-16 text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
              disabled={loading || !connected}
            >
              {connected ? 'Join Room' : 'Connecting...'}
            </Button>
          </motion.div>
        );
    }
  };

  return (
    <div className='min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4'>
      <div className='w-full max-w-md text-center mb-12'>
        <h1 className='text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400'>
          AI Charades
        </h1>
        <h2 className='text-2xl font-bold text-gray-300'>
          Director&apos;s Cut
        </h2>
      </div>

      <AnimatePresence mode='wait'>{renderContent()}</AnimatePresence>
    </div>
  );
}
