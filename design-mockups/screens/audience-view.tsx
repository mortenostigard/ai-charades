'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

interface AudienceViewProps {
  actorName: string;
  promptCategory: string;
  timeRemaining: number;
  maxReactions?: number;
  onReaction?: (emoji: string) => void;
}

export default function AudienceView({
  actorName = 'Alex',
  promptCategory = 'MOVIE',
  timeRemaining = 45,
  maxReactions = 3,
  onReaction = () => {},
}: AudienceViewProps) {
  const [reactionsUsed, setReactionsUsed] = useState(0);
  const [recentReaction, setRecentReaction] = useState<string | null>(null);

  // Format time function
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle reaction button click
  const handleReaction = (emoji: string) => {
    if (reactionsUsed >= maxReactions) return;

    setReactionsUsed(prev => prev + 1);
    setRecentReaction(emoji);
    onReaction(emoji);

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

  const reactionsLeft = maxReactions - reactionsUsed;
  const allReactionsUsed = reactionsUsed >= maxReactions;

  // Timer styling
  const getTimerClasses = () => {
    if (timeRemaining <= 5) {
      return 'text-4xl font-black text-transparent bg-gradient-to-r from-red-400 to-red-600 bg-clip-text tracking-wider';
    } else if (timeRemaining <= 15) {
      return 'text-4xl font-black text-transparent bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text tracking-wider';
    }
    return 'text-4xl font-black text-transparent bg-gradient-to-r from-fuchsia-400 to-purple-500 bg-clip-text tracking-wider';
  };

  const getTimerBgClasses = () => {
    if (timeRemaining <= 5) {
      return 'bg-gradient-to-r from-red-900/30 to-red-800/30 border-red-600/50';
    } else if (timeRemaining <= 15) {
      return 'bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-600/50';
    }
    return 'bg-gradient-to-r from-fuchsia-900/30 to-purple-900/30 border-fuchsia-600/50';
  };

  return (
    <div className='min-h-screen bg-gray-950 text-white flex flex-col p-4'>
      {/* Header Section - Role + Timer Combined */}
      <div className='flex-shrink-0 pt-6 pb-4'>
        <div className='text-center mb-4'>
          <h1 className='text-3xl font-bold text-white'>Game in Progress</h1>
        </div>
        <div className='flex items-center justify-between max-w-md mx-auto'>
          <h1 className='text-xl font-bold text-transparent bg-gradient-to-r from-fuchsia-300 to-purple-500 bg-clip-text'>
            AUDIENCE
          </h1>

          <motion.div
            className={`px-4 py-2 rounded-xl border-2 ${getTimerBgClasses()}`}
            animate={timeRemaining <= 5 ? { scale: [1, 1.05, 1] } : {}}
            transition={
              timeRemaining <= 5
                ? { repeat: Number.POSITIVE_INFINITY, duration: 0.5 }
                : {}
            }
          >
            <div className={getTimerClasses()}>{formatTime(timeRemaining)}</div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Section - Actor Info Card */}
      <div className='flex-1 flex items-center justify-center px-2'>
        <Card className='w-full max-w-md bg-gray-900 border-gray-800 rounded-2xl shadow-2xl'>
          <CardContent className='p-8 text-center'>
            <motion.div
              className='space-y-4'
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <div className='text-sm font-medium text-gray-400 uppercase tracking-wide'>
                Guess What
              </div>
              <div className='text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight'>
                {actorName} is acting out
              </div>
              <div className='text-4xl md:text-5xl font-black text-transparent bg-gradient-to-r from-fuchsia-400 to-purple-500 bg-clip-text'>
                {promptCategory}
              </div>
            </motion.div>
          </CardContent>
        </Card>
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
                      : reaction.type === 'positive'
                        ? 'bg-gray-800/80 border-gray-700 hover:border-gray-600 active:bg-gray-700/80'
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
