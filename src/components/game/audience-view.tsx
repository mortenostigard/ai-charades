'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Player } from '@/types';

import { GameTimer } from './game-timer';

interface AudienceViewProps {
  readonly actor: Player;
  readonly director: Player;
}

export default function AudienceView({ actor, director }: AudienceViewProps) {
  const [reactionsUsed, setReactionsUsed] = useState(0);
  const [recentReaction, setRecentReaction] = useState<string | null>(null);

  // Handle reaction button click
  const handleReaction = (emoji: string) => {
    if (reactionsUsed >= 3) return;

    setReactionsUsed(prev => prev + 1);
    setRecentReaction(emoji);

    // Clear recent reaction after animation
    setTimeout(() => setRecentReaction(null), 1000);
  };

  // Reaction buttons configuration
  const reactionButtons = [
    { emoji: '😂', label: 'Funny', type: 'positive' },
    { emoji: '🔥', label: 'Amazing', type: 'positive' },
    { emoji: '🤔', label: 'Confused', type: 'negative' },
    { emoji: '😴', label: 'Boring', type: 'negative' },
  ];

  const reactionsLeft = 3 - reactionsUsed;
  const allReactionsUsed = reactionsUsed >= 3;

  return (
    <div className='min-h-screen bg-gray-950 text-white flex flex-col p-4'>
      {/* Header Section - Role + Timer Combined */}
      <div className='flex-shrink-0 pt-6 pb-4'>
        <div className='text-center mb-4'>
          <h1 className='text-3xl font-bold text-white'>Game in Progress</h1>
        </div>
        <div className='flex items-center justify-between max-w-md mx-auto'>
          <h1 className='text-xl font-bold text-transparent bg-gradient-to-r from-fuchsia-400 to-purple-500 bg-clip-text'>
            AUDIENCE
          </h1>

          <GameTimer role='audience' />
        </div>
      </div>

      {/* Main Content Section - Watching the Actor */}
      <div className='flex-1 flex flex-col items-center justify-center space-y-8'>
        <div className='w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-8 text-center'>
          <h2 className='text-2xl font-bold text-gray-300'>
            Now Watching:
            <span className='block text-4xl font-black text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text mt-2'>
              {actor.name}
            </span>
          </h2>
          <p className='text-gray-400 mt-4'>
            Directed by{' '}
            <span className='font-bold text-transparent bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text'>
              {director.name}
            </span>
          </p>
        </div>

        <div className='text-gray-500'>
          Your turn will come up soon. Enjoy the show!
        </div>
      </div>

      {/* Bottom Section - Reaction Zone */}
      <div className='flex-shrink-0 pb-8'>
        <div className='max-w-md mx-auto space-y-4'>
          {/* Reactions Left Counter */}
          <div className='text-center'>
            <div className='text-lg font-bold text-gray-300'>
              Reactions Left:{' '}
              <span className='text-fuchsia-400'>{reactionsLeft}</span>
            </div>
            {allReactionsUsed && (
              <div className='text-sm text-gray-500 mt-1'>
                All reactions used for this round
              </div>
            )}
          </div>

          {/* Reaction Buttons */}
          <div className='flex justify-center gap-3'>
            {reactionButtons.map(reaction => (
              <motion.button
                key={reaction.emoji}
                onClick={() => handleReaction(reaction.emoji)}
                disabled={allReactionsUsed}
                whileTap={!allReactionsUsed ? { scale: 0.9 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className={`
                  w-16 h-16 rounded-xl border-2 flex items-center justify-center text-2xl
                  ${
                    allReactionsUsed
                      ? 'bg-gray-900/60 border-gray-800 opacity-50 cursor-not-allowed'
                      : 'bg-gray-800/80 border-gray-700 hover:border-gray-600 active:bg-gray-700/80'
                  }
                `}
                aria-label={reaction.label}
              >
                <motion.span
                  animate={
                    recentReaction === reaction.emoji
                      ? {
                          scale: [1, 1.3, 1],
                          rotate: [0, 10, -10, 0],
                        }
                      : {}
                  }
                  transition={{ duration: 0.6 }}
                >
                  {reaction.emoji}
                </motion.span>
              </motion.button>
            ))}
          </div>

          {/* Recent Reaction Feedback */}
          <AnimatePresence>
            {recentReaction && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                className='text-center'
              >
                <div className='inline-flex items-center gap-2 bg-fuchsia-900/40 border border-fuchsia-600/50 rounded-xl px-4 py-2'>
                  <span className='text-2xl'>{recentReaction}</span>
                  <span className='text-sm text-fuchsia-300 font-medium'>
                    Reaction sent!
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
