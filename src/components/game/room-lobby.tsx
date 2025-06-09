'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Crown, Users } from 'lucide-react';
import { toast } from 'sonner';

import { useGameStore } from '@/stores/gameStore';
import { useSocket } from '@/hooks/useSocket';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error-message';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface RoomLobbyProps {
  readonly roomCode: string;
}

export function RoomLobby({ roomCode }: RoomLobbyProps) {
  const router = useRouter();
  const { emit } = useSocket();

  const gameState = useGameStore(state => state.gameState);
  const playerId = useGameStore(state => state.playerId);
  const isHost = useGameStore(state => state.isHost());
  const canStartGame = useGameStore(state => state.canStartGame());
  const myPlayer = useGameStore(state => state.getMyPlayer());
  const error = useGameStore(state => state.error);
  const roomId = useGameStore(state => state.gameState?.room.id);

  // Redirect if not in a room or gameState is missing
  useEffect(() => {
    if (error) return; // Don't redirect if there's an error being shown

    if (!myPlayer || !gameState) {
      // Allow a brief moment for state to sync
      const timer = setTimeout(() => {
        if (!useGameStore.getState().getMyPlayer()) {
          console.log('Redirecting to home: no player state found.');
          router.push('/');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [myPlayer, gameState, router, error]);

  const handleCopyCode = useCallback(() => {
    if (gameState?.room.code) {
      navigator.clipboard.writeText(gameState.room.code);
      toast.success('Room code copied to clipboard!');
    }
  }, [gameState?.room.code]);

  const handleStartGame = useCallback(() => {
    if (canStartGame && roomId) {
      console.log("Emitting 'start_game'", { roomId });
      emit('start_game', { roomId });
    }
  }, [canStartGame, roomId, emit]);

  if (error) {
    return (
      <div className='min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 space-y-4'>
        <ErrorMessage message={error} />
        <Button onClick={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }

  if (!gameState || !myPlayer) {
    return (
      <div className='min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4'>
        <LoadingSpinner />
        <p className='mt-4 text-gray-400'>Joining room: {roomCode}...</p>
      </div>
    );
  }

  const { room } = gameState;
  const players = room.players.slice().sort((a, b) => a.joinedAt - b.joinedAt);

  return (
    <div className='min-h-screen bg-gray-950 text-white flex flex-col p-4'>
      <header className='flex-shrink-0 pt-8 pb-6 text-center'>
        <h1 className='text-3xl font-bold'>Room Lobby</h1>
      </header>

      <main className='flex-1 flex items-center justify-center'>
        <Card className='w-full max-w-md bg-gray-900 border-gray-800 rounded-2xl'>
          <CardContent className='p-6 md:p-8 space-y-8'>
            <div className='text-center space-y-4'>
              <p className='text-lg text-gray-300 font-medium'>
                Share this code with your friends!
              </p>
              <Button
                onClick={handleCopyCode}
                variant='outline'
                className='group relative flex items-center justify-center text-5xl md:text-6xl font-black text-white tracking-wider font-mono bg-gray-800 rounded-xl py-4 px-6 border-2 border-gray-700 hover:border-purple-500 transition-colors w-full h-auto'
              >
                <span>{room.code}</span>
                <Copy className='absolute right-4 h-8 w-8 text-gray-500 transition-all group-hover:text-purple-400 group-hover:scale-110' />
              </Button>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-xl font-bold text-white flex items-center gap-2'>
                  <Users className='h-6 w-6' />
                  Players ({players.length}/{room.maxPlayers})
                </h3>
              </div>

              <div className='max-h-[240px] overflow-y-auto pr-2'>
                <motion.div
                  className='space-y-3'
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.1 },
                    },
                  }}
                  initial='hidden'
                  animate='show'
                >
                  <AnimatePresence>
                    {players.map((player, index) => (
                      <motion.div
                        key={player.id}
                        layout
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 },
                        }}
                        initial='hidden'
                        animate='show'
                        className='flex items-center gap-3 p-3 bg-gray-800 rounded-xl border border-gray-700'
                      >
                        <Avatar className='h-10 w-10 border-2 border-gray-600'>
                          <AvatarFallback className='bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold'>
                            {player.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className='font-semibold text-white truncate flex-1'>
                          {player.name}
                        </p>
                        {index === 0 && (
                          <Badge
                            variant='secondary'
                            className='bg-yellow-400 text-black font-bold'
                          >
                            <Crown className='h-4 w-4 mr-1' />
                            Host
                          </Badge>
                        )}
                        {player.id === playerId && (
                          <Badge variant='outline'>You</Badge>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className='flex-shrink-0 pt-6 pb-8 flex justify-center'>
        {isHost ? (
          <Button
            onClick={handleStartGame}
            className='w-full max-w-md h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl'
            disabled={!canStartGame}
          >
            {canStartGame
              ? 'Start Game'
              : `Need ${3 - players.length} more player(s)`}
          </Button>
        ) : (
          <p className='text-center text-gray-400'>
            Waiting for the host to start the game...
          </p>
        )}
      </footer>
    </div>
  );
}
