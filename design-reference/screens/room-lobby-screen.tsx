'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface Player {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  joinedAt: number;
}

interface RoomLobbyProps {
  roomCode: string;
  players: Player[];
  currentUserId: string;
  onStartGame: () => void;
}

// Demo players for the example
const initialPlayers = [
  { id: '1', name: 'Alex', isHost: true, joinedAt: Date.now() - 60000 },
  { id: '2', name: 'Jordan', isHost: false, joinedAt: Date.now() - 45000 },
  { id: '3', name: 'Casey', isHost: false, joinedAt: Date.now() - 30000 },
  { id: '4', name: 'Riley', isHost: false, joinedAt: Date.now() - 15000 },
];

// Demo players that will join later
const joiningPlayers = [
  { id: '5', name: 'Morgan', isHost: false, joinedAt: 0 },
  { id: '6', name: 'Taylor', isHost: false, joinedAt: 0 },
  { id: '7', name: 'Avery', isHost: false, joinedAt: 0 },
  { id: '8', name: 'Quinn', isHost: false, joinedAt: 0 },
];

export default function RoomLobby({
  roomCode = '1234',
  players: initialPlayersProp = initialPlayers,
  currentUserId = '1',
  onStartGame = () => console.log('Starting game...'),
}: RoomLobbyProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayersProp);
  const [nextPlayerIndex, setNextPlayerIndex] = useState(0);
  const currentUser = players.find(p => p.id === currentUserId);
  const isHost = currentUser?.isHost || false;

  // Demo function to simulate new players joining
  useEffect(() => {
    // Only add more players if we haven't reached the end of our demo list
    if (nextPlayerIndex < joiningPlayers.length) {
      const timer = setTimeout(() => {
        const newPlayer = {
          ...joiningPlayers[nextPlayerIndex],
          joinedAt: Date.now(),
        };

        setPlayers(current => [...current, newPlayer]);
        setNextPlayerIndex(prev => prev + 1);
      }, 3000); // Add a new player every 3 seconds

      return () => clearTimeout(timer);
    }
  }, [players, nextPlayerIndex]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const playerVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20,
      },
    },
  };

  // Sort players by join time (newest last)
  const sortedPlayers = [...players].sort((a, b) => a.joinedAt - b.joinedAt);

  return (
    <div className='min-h-screen bg-gray-950 text-white flex flex-col p-4'>
      {/* Top Section - Title */}
      <div className='flex-shrink-0 pt-8 pb-6'>
        <h1 className='text-3xl font-bold text-center text-white'>
          Room Lobby
        </h1>
      </div>

      {/* Middle Section - Room Code & Players */}
      <div className='flex-1 flex items-center justify-center px-2'>
        <Card className='w-full max-w-md bg-gray-900 border-gray-800 rounded-2xl'>
          <CardContent className='p-8 space-y-8'>
            {/* Room Code Section */}
            <div className='text-center space-y-4'>
              <p className='text-lg text-gray-300 font-medium'>Room Code:</p>
              <div className='text-6xl font-black text-white tracking-wider font-mono bg-gray-800 rounded-xl py-4 px-6 border-2 border-gray-700'>
                {roomCode}
              </div>
            </div>

            {/* Players List */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-bold text-white'>
                  Players ({players.length}/8)
                </h3>
                {nextPlayerIndex < joiningPlayers.length && (
                  <div className='text-sm text-gray-400 animate-pulse'>
                    Waiting for players...
                  </div>
                )}
              </div>

              <div className='max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-1'>
                <motion.div
                  className={`gap-3 ${players.length > 4 ? 'grid grid-cols-1 sm:grid-cols-2' : 'space-y-3'}`}
                  variants={containerVariants}
                  initial='hidden'
                  animate='show'
                >
                  <AnimatePresence>
                    {sortedPlayers.map(player => (
                      <motion.div
                        key={player.id}
                        layout
                        variants={playerVariants}
                        initial='hidden'
                        animate='show'
                        className='flex items-center gap-3 p-3 bg-gray-800 rounded-xl border border-gray-700'
                      >
                        <Avatar className='h-10 w-10 border-2 border-gray-600 flex-shrink-0'>
                          <AvatarImage
                            src={player.avatar || '/placeholder.svg'}
                            alt={player.name}
                          />
                          <AvatarFallback className='bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold'>
                            {player.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1 min-w-0'>
                          <p className='font-semibold text-white truncate'>
                            {player.name}
                            {player.isHost && (
                              <span className='ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-bold'>
                                HOST
                              </span>
                            )}
                          </p>
                        </div>
                        {Date.now() - player.joinedAt < 3000 && (
                          <span className='text-xs bg-green-500 text-black px-2 py-1 rounded-full font-bold animate-pulse'>
                            NEW
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Start Game Button */}
      <div className='flex-shrink-0 pt-6 pb-8 flex justify-center'>
        {isHost && (
          <Button
            onClick={onStartGame}
            className='w-full max-w-md h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl shadow-lg transform transition-all duration-150 active:scale-95'
            disabled={players.length < 2}
          >
            Start Game
          </Button>
        )}
        {!isHost && (
          <div className='text-center text-gray-400 text-sm max-w-md'>
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}
