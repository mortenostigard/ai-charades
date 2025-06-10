'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/stores/gameStore';
import { useSocket } from '@/hooks/useSocket';

export function RoundSummaryScreen() {
  const completedRound = useGameStore(state => state.completedRound);
  const gameState = useGameStore(state => state.gameState);
  const isHost = useGameStore(state => state.isHost());
  const getPlayerById = useGameStore(state => state.getPlayerById);
  const { emit } = useSocket();

  if (!completedRound || !gameState) {
    return null;
  }

  // Outcome configuration
  const outcomeConfig = {
    correct_guess: {
      title: 'Correct Guess!',
      subtitle: 'Someone got it right!',
      icon: Trophy,
      gradient: 'from-green-400 via-emerald-400 to-teal-400',
      bgGlow: 'from-green-500/20 to-emerald-500/20',
    },
    time_up: {
      title: "Time's Up!",
      subtitle: 'The round has ended',
      icon: Clock,
      gradient: 'from-orange-400 via-red-400 to-pink-400',
      bgGlow: 'from-orange-500/20 to-red-500/20',
    },
  };

  const config = outcomeConfig[completedRound.outcome];
  const IconComponent = config.icon;

  // Get point change styling
  const getPointChangeStyle = (points: number) => {
    if (points > 0) {
      return 'text-green-400 bg-green-900/30 border-green-600/50';
    } else if (points < 0) {
      return 'text-red-400 bg-red-900/30 border-red-600/50';
    } else {
      return 'text-gray-400 bg-gray-900/30 border-gray-600/50';
    }
  };

  // Format points for display
  const formatPoints = (points: number) => {
    if (points > 0) return `+${points}`;
    return points.toString();
  };

  // Sort players by total score (highest first)
  const sortedPlayers = completedRound.scoreChanges
    .map(change => {
      const player = getPlayerById(change.playerId);
      return {
        ...change,
        name: player?.name || 'Unknown Player',
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  const handleNextRound = () => {
    if (gameState.room.code) {
      const { playerId } = useGameStore.getState();
      emit('start_round', {
        roomCode: gameState.room.code,
        requestedBy: playerId,
      });
    }
  };

  return (
    <div className='min-h-screen bg-gray-950 text-white flex flex-col p-4'>
      {/* Header Section */}
      <div className='flex-shrink-0 pt-6 pb-4'>
        <h1 className='text-3xl font-bold text-center text-white'>
          Round {completedRound.roundNumber} Complete
        </h1>
      </div>

      {/* Top Section - Outcome */}
      <div className='flex-shrink-0 mb-6'>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className='max-w-md mx-auto text-center'
        >
          {/* Background glow effect */}
          <div
            className={`absolute inset-0 bg-gradient-to-r ${config.bgGlow} rounded-2xl blur-xl opacity-50 -z-10`}
          />

          <div className='relative bg-gray-900/80 border border-gray-800 rounded-2xl p-6'>
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className='flex justify-center mb-4'
            >
              <IconComponent
                className={`h-12 w-12 text-transparent bg-gradient-to-r ${config.gradient} bg-clip-text`}
              />
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`text-4xl md:text-5xl font-black text-transparent bg-gradient-to-r ${config.gradient} bg-clip-text tracking-tight leading-none mb-2`}
            >
              {config.title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className='text-gray-400 text-lg font-medium'
            >
              {config.subtitle}
            </motion.p>
          </div>
        </motion.div>
      </div>

      {/* Middle Section - Score Updates */}
      <div className='flex-1 flex items-start justify-center px-2 pb-4'>
        <Card className='w-full max-w-md bg-gray-900 border-gray-800 rounded-2xl'>
          <CardContent className='p-6'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className='text-xl font-bold text-white mb-4 text-center'>
                Score Updates
              </h3>

              <div className='space-y-3'>
                <AnimatePresence>
                  {sortedPlayers.map((player, index) => (
                    <motion.div
                      key={player.playerId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.6 + index * 0.1,
                        type: 'spring',
                        stiffness: 400,
                        damping: 17,
                      }}
                      className='flex items-center justify-between p-3 bg-gray-800/60 border border-gray-700 rounded-xl'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='flex items-center gap-2'>
                          {index === 0 && player.totalScore > 0 && (
                            <Trophy className='h-4 w-4 text-yellow-400' />
                          )}
                          <span className='font-semibold text-white'>
                            {player.name}
                          </span>
                        </div>
                      </div>

                      <div className='flex items-center gap-3'>
                        <div
                          className={`px-2 py-1 rounded-lg border text-sm font-bold ${getPointChangeStyle(
                            player.pointsEarned
                          )}`}
                        >
                          {formatPoints(player.pointsEarned)}
                        </div>
                        <div className='text-right'>
                          <div className='text-lg font-bold text-white'>
                            {player.totalScore}
                          </div>
                          <div className='text-xs text-gray-400'>total</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Next Round Button (Host Only) */}
      {isHost && (
        <div className='flex-shrink-0 pb-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className='max-w-md mx-auto'
          >
            <motion.div
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Button
                onClick={handleNextRound}
                className='w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg rounded-2xl shadow-lg border-0 transition-all duration-200'
                size='lg'
              >
                Next Round
              </Button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
