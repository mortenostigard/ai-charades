'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Home, RotateCcw } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  finalScore: number;
  audienceFavorite?: boolean;
  mostConfusing?: boolean;
}

interface GameCompleteProps {
  players: Player[];
  audienceFavoritePlayer: string;
  mostConfusingPlayer: string;
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

// Demo data
const demoPlayers: Player[] = [
  { id: '1', name: 'Alex', finalScore: 12 },
  { id: '2', name: 'Jordan', finalScore: 10 },
  { id: '3', name: 'Casey', finalScore: 8 },
  { id: '4', name: 'Riley', finalScore: 7 },
  { id: '5', name: 'Morgan', finalScore: 5 },
  { id: '6', name: 'Taylor', finalScore: 3 },
];

export default function GameCompleteScreen({
  players = demoPlayers,
  audienceFavoritePlayer = 'Jordan',
  mostConfusingPlayer = 'Taylor',
  onPlayAgain = () => console.log('Play Again clicked'),
  onBackToHome = () => console.log('Back to Home clicked'),
}: GameCompleteProps) {
  const [animationStep, setAnimationStep] = useState(0);
  const [displayedScores, setDisplayedScores] = useState<
    Record<string, number>
  >({});
  const [showWinner, setShowWinner] = useState(false);

  // Initialize displayed scores
  useEffect(() => {
    const initialScores: Record<string, number> = {};
    players.forEach(player => {
      initialScores[player.id] = player.finalScore;
    });
    setDisplayedScores(initialScores);
  }, [players]);

  // Animation sequence timing
  useEffect(() => {
    const timers = [
      // Step 1: Show leaderboard
      setTimeout(() => setAnimationStep(1), 1000),
      // Step 2: Show bonus/penalty
      setTimeout(() => setAnimationStep(2), 3000),
      // Step 3: Apply score changes
      setTimeout(() => {
        setDisplayedScores(prev => {
          const updated = { ...prev };
          // Apply audience favorite bonus
          const favoritePlayer = players.find(
            p => p.name === audienceFavoritePlayer
          );
          if (favoritePlayer) {
            updated[favoritePlayer.id] = favoritePlayer.finalScore + 2;
          }
          // Apply most confusing penalty
          const confusingPlayer = players.find(
            p => p.name === mostConfusingPlayer
          );
          if (confusingPlayer) {
            updated[confusingPlayer.id] = Math.max(
              0,
              confusingPlayer.finalScore - 2
            );
          }
          return updated;
        });
      }, 4500),
      // Step 4: Crown the winner
      setTimeout(() => setShowWinner(true), 6000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [players, audienceFavoritePlayer, mostConfusingPlayer]);

  // Get final sorted players with updated scores
  const getFinalRankings = () => {
    return players
      .map(player => ({
        ...player,
        displayScore: displayedScores[player.id] || player.finalScore,
      }))
      .sort((a, b) => b.displayScore - a.displayScore);
  };

  const finalRankings = getFinalRankings();
  const winner = finalRankings[0];

  // Animated score component
  const AnimatedScore = ({
    targetScore,
    playerId,
  }: {
    targetScore: number;
    playerId: string;
  }) => {
    const [currentScore, setCurrentScore] = useState(
      displayedScores[playerId] || 0
    );

    useEffect(() => {
      const target = displayedScores[playerId] || targetScore;
      if (currentScore !== target) {
        const increment = target > currentScore ? 1 : -1;
        const timer = setInterval(() => {
          setCurrentScore(prev => {
            const next = prev + increment;
            if (
              (increment > 0 && next >= target) ||
              (increment < 0 && next <= target)
            ) {
              clearInterval(timer);
              return target;
            }
            return next;
          });
        }, 100);

        return () => clearInterval(timer);
      }
    }, [displayedScores[playerId], targetScore, currentScore, playerId]);

    return (
      <span className='text-2xl font-black text-white'>{currentScore}</span>
    );
  };

  return (
    <div className='min-h-screen bg-gray-950 text-white flex flex-col p-4 relative overflow-hidden'>
      {/* Celebratory background effects */}
      <div className='absolute inset-0 pointer-events-none'>
        <div className='absolute top-10 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse' />
        <div className='absolute top-20 right-16 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-1000' />
        <div className='absolute bottom-32 left-20 w-20 h-20 bg-orange-500/10 rounded-full blur-xl animate-pulse delay-2000' />
        <div className='absolute bottom-20 right-12 w-28 h-28 bg-yellow-500/10 rounded-full blur-2xl animate-pulse delay-500' />
      </div>

      {/* Header Section */}
      <div className='flex-shrink-0 pt-6 pb-8 relative z-10'>
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className='text-5xl md:text-6xl font-black text-center text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text tracking-tight leading-none'
        >
          GAME OVER!
        </motion.h1>
      </div>

      {/* Main Section - Animation Sequence */}
      <div className='flex-1 flex flex-col items-center justify-start px-2 relative z-10'>
        {/* Step 1: Final Leaderboard */}
        <AnimatePresence>
          {animationStep >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className='w-full max-w-md mb-6'
            >
              <Card className='bg-gray-900 border-gray-800 rounded-2xl shadow-2xl'>
                <CardContent className='p-6'>
                  <h2 className='text-2xl font-bold text-center text-white mb-6'>
                    Final Leaderboard
                  </h2>
                  <div className='space-y-3'>
                    {finalRankings.map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: index * 0.1,
                          type: 'spring',
                          stiffness: 400,
                          damping: 17,
                        }}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                          showWinner && index === 0
                            ? 'bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-yellow-500/70'
                            : 'bg-gray-800/60 border-gray-700'
                        }`}
                      >
                        <div className='flex items-center gap-3'>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black'
                                : index === 1
                                  ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-black'
                                  : index === 2
                                    ? 'bg-gradient-to-r from-orange-400 to-orange-600 text-white'
                                    : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <span className='font-semibold text-white text-lg'>
                            {player.name}
                          </span>

                          {/* Winner crown */}
                          <AnimatePresence>
                            {showWinner && index === 0 && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                  type: 'spring',
                                  stiffness: 400,
                                  damping: 10,
                                  delay: 0.5,
                                }}
                              >
                                <Crown className='h-6 w-6 text-yellow-400' />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className='text-right'>
                          <AnimatedScore
                            targetScore={player.finalScore}
                            playerId={player.id}
                          />
                          <div className='text-xs text-gray-400'>points</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 2: Bonus/Penalty Reveals */}
        <AnimatePresence>
          {animationStep >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.5,
                type: 'spring',
                stiffness: 400,
                damping: 17,
              }}
              className='w-full max-w-md space-y-3 mb-6'
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className='bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-600/50 rounded-xl p-4 text-center'
              >
                <div className='text-green-300 font-bold'>
                  🎭 Audience Favorite Bonus:{' '}
                  <span className='text-green-200'>
                    {audienceFavoritePlayer}
                  </span>{' '}
                  <span className='text-green-400'>(+2 pts)</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className='bg-gradient-to-r from-red-900/40 to-pink-900/40 border border-red-600/50 rounded-xl p-4 text-center'
              >
                <div className='text-red-300 font-bold'>
                  🤯 Most Confusing Penalty:{' '}
                  <span className='text-red-200'>{mostConfusingPlayer}</span>{' '}
                  <span className='text-red-400'>(-2 pts)</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Winner Announcement */}
        <AnimatePresence>
          {showWinner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 17,
                delay: 1,
              }}
              className='text-center mb-8'
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  textShadow: [
                    '0 0 20px rgba(255, 215, 0, 0.5)',
                    '0 0 30px rgba(255, 215, 0, 0.8)',
                    '0 0 20px rgba(255, 215, 0, 0.5)',
                  ],
                }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                className='text-4xl md:text-5xl font-black text-transparent bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text mb-2'
              >
                🏆 {winner?.name} WINS! 🏆
              </motion.div>
              <div className='text-gray-400 text-lg'>
                Congratulations, champion!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Section - Action Buttons */}
      <AnimatePresence>
        {showWinner && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 2,
              type: 'spring',
              stiffness: 400,
              damping: 17,
            }}
            className='flex-shrink-0 pb-8 relative z-10'
          >
            <div className='max-w-md mx-auto flex gap-4'>
              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className='flex-1'
              >
                <Button
                  onClick={onPlayAgain}
                  className='w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg rounded-2xl shadow-lg border-0 transition-all duration-200'
                  size='lg'
                >
                  <RotateCcw className='h-5 w-5 mr-2' />
                  Play Again
                </Button>
              </motion.div>

              <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className='flex-1'
              >
                <Button
                  onClick={onBackToHome}
                  variant='outline'
                  className='w-full h-14 bg-gray-800/60 border-gray-700 hover:bg-gray-700/60 hover:border-gray-600 text-gray-300 hover:text-white font-bold text-lg rounded-2xl transition-all duration-200'
                  size='lg'
                >
                  <Home className='h-5 w-5 mr-2' />
                  Back to Home
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
