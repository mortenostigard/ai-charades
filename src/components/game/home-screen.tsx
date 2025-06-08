'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Mode = 'initial' | 'create' | 'join';

export function HomeScreen() {
  const [mode, setMode] = useState<Mode>('initial');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const isPlayerNameValid = playerName.length >= 2 && playerName.length <= 20;
  const isRoomCodeValid = /^\d{4}$/.test(roomCode);

  const handleCreateRoom = () => {
    if (!isPlayerNameValid) return;
    console.log('Creating room for player:', playerName);
    // TODO: Implement socket logic
  };

  const handleJoinRoom = () => {
    if (!isPlayerNameValid || !isRoomCodeValid) return;
    console.log(`Player ${playerName} joining room ${roomCode}`);
    // TODO: Implement socket logic
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
                <Input
                  type='text'
                  placeholder='Your Name'
                  value={playerName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPlayerName(e.target.value)
                  }
                  className='h-14 text-lg text-center bg-gray-800 border-gray-700 text-white placeholder:text-gray-400'
                  maxLength={20}
                />
                <div className='space-y-2'>
                  <Button
                    onClick={handleCreateRoom}
                    disabled={!isPlayerNameValid}
                    className='w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50'
                  >
                    Create Room
                  </Button>
                  <Button
                    variant='ghost'
                    onClick={() => setMode('initial')}
                    className='w-full h-14 text-lg text-gray-300 hover:bg-gray-800 hover:text-white'
                  >
                    Back
                  </Button>
                </div>
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
                  <Input
                    type='text'
                    placeholder='Your Name'
                    value={playerName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPlayerName(e.target.value)
                    }
                    className='h-14 text-lg text-center bg-gray-800 border-gray-700 text-white placeholder:text-gray-400'
                    maxLength={20}
                  />
                  <Input
                    type='text'
                    placeholder='4-Digit Room Code'
                    value={roomCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRoomCode(e.target.value.replace(/\D/g, ''))
                    }
                    className='h-14 text-lg text-center font-mono bg-gray-800 border-gray-700 text-white placeholder:text-gray-400'
                    maxLength={4}
                  />
                </div>
                <div className='space-y-2'>
                  <Button
                    onClick={handleJoinRoom}
                    disabled={!isPlayerNameValid || !isRoomCodeValid}
                    className='w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50'
                  >
                    Join Room
                  </Button>
                  <Button
                    variant='ghost'
                    onClick={() => setMode('initial')}
                    className='w-full h-14 text-lg text-gray-300 hover:bg-gray-800 hover:text-white'
                  >
                    Back
                  </Button>
                </div>
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
            >
              Create Room
            </Button>
            <Button
              onClick={() => setMode('join')}
              className='w-full h-16 text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
            >
              Join Room
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
