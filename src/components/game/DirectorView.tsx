'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Zap } from 'lucide-react';

import { SabotageAction, ActiveSabotage } from '@/types';
import { Badge } from '@/components/ui/badge';
import { SABOTAGE_ACTIONS } from '@/game/data/sabotages';

interface DirectorViewProps {
  readonly timeRemaining: number;
  readonly activeSabotage: ActiveSabotage | null;
  readonly onDeploySabotageAction: (sabotage: SabotageAction) => void;
}

export default function DirectorView({
  timeRemaining = 45,
  activeSabotage = null,
  onDeploySabotageAction = () => {},
}: DirectorViewProps) {
  const [sabotagesAvailable, setSabotagesAvailable] = useState(false);
  const [sabotageCountdown, setSabotageCountdown] = useState(20);

  // Format time function
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle sabotage deployment
  const handleDeploySabotage = (sabotage: SabotageAction) => {
    onDeploySabotageAction(sabotage);
  };

  // Effect for sabotage availability countdown
  useEffect(() => {
    if (sabotageCountdown > 0 && !sabotagesAvailable) {
      const timer = setTimeout(() => {
        setSabotageCountdown(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (sabotageCountdown === 0 && !sabotagesAvailable) {
      setSabotagesAvailable(true);
    }
  }, [sabotageCountdown, sabotagesAvailable]);

  const getSabotageClasses = (isActive: boolean, isDisabled: boolean) => {
    if (isActive) {
      return 'bg-gradient-to-r from-cyan-900/60 to-blue-900/60 border-cyan-500/70';
    }
    if (isDisabled) {
      return 'bg-gray-900/60 border-gray-800 opacity-70 cursor-not-allowed';
    }
    return 'bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-cyan-700/50 hover:border-cyan-600/70';
  };

  // Get timer classes based on sabotage availability
  const getTimerClasses = () => {
    if (!sabotagesAvailable) {
      return 'text-4xl font-black text-transparent bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text tracking-wider';
    }
    return 'text-4xl font-black text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text tracking-wider';
  };

  const getTimerBgClasses = () => {
    if (!sabotagesAvailable) {
      return 'bg-gradient-to-r from-gray-900/30 to-gray-800/30 border-gray-600/50';
    }
    return 'bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-cyan-600/50';
  };

  return (
    <div className='min-h-screen bg-gray-950 text-white flex flex-col p-4'>
      {/* Header Section - Role + Timer Combined */}
      <div className='flex-shrink-0 pt-6 pb-4'>
        <div className='text-center mb-4'>
          <h1 className='text-3xl font-bold text-white'>Game in Progress</h1>
        </div>
        <div className='flex items-center justify-between max-w-md mx-auto'>
          <h1 className='text-xl font-bold text-transparent bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text'>
            DIRECTOR
          </h1>

          <div
            className={`px-4 py-2 rounded-xl border-2 ${getTimerBgClasses()}`}
          >
            <div className={getTimerClasses()}>{formatTime(timeRemaining)}</div>
          </div>
        </div>
      </div>

      {/* Sabotage Availability Section */}
      <div className='flex-shrink-0 mb-4'>
        <AnimatePresence mode='wait'>
          {!sabotagesAvailable ? (
            <motion.div
              key='countdown'
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className='max-w-md mx-auto bg-gray-900/80 border border-gray-800 rounded-xl p-3 text-center'
            >
              <div className='text-sm text-gray-400'>
                Sabotages available in
              </div>
              <div className='text-2xl font-bold text-gray-300'>
                {sabotageCountdown}s
              </div>
              <div className='flex justify-center mt-2'>
                <Lock className='text-gray-500 h-5 w-5' />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key='available'
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: [0.9, 1.05, 1],
                boxShadow: [
                  '0 0 0 rgba(34, 211, 238, 0)',
                  '0 0 20px rgba(34, 211, 238, 0.5)',
                  '0 0 10px rgba(34, 211, 238, 0.3)',
                ],
              }}
              transition={{ duration: 0.6 }}
              className='max-w-md mx-auto bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-600/50 rounded-xl p-3 text-center'
            >
              <div className='text-lg font-bold text-transparent bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text'>
                Sabotages Unlocked!
              </div>
              <div className='text-sm text-cyan-300/70 mt-1'>
                Deploy sabotages to challenge the actor
              </div>
              <div className='flex justify-center mt-2'>
                <Zap className='text-cyan-400 h-5 w-5 animate-pulse' />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content - Sabotage Grid */}
      <div className='flex-1 overflow-y-auto px-2 pb-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto'>
          {SABOTAGE_ACTIONS.map(sabotage => {
            const isDisabled = !sabotagesAvailable || !!activeSabotage;
            const isActive = activeSabotage?.action.id === sabotage.id;

            return (
              <motion.button
                key={sabotage.id}
                onClick={() => handleDeploySabotage(sabotage)}
                disabled={isDisabled}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className={`w-full h-auto min-h-[100px] p-4 flex flex-col items-start justify-between text-left rounded-xl border ${getSabotageClasses(
                  isActive,
                  isDisabled
                )}`}
              >
                <div className='flex justify-between items-start w-full mb-2'>
                  <span className='font-bold text-sm leading-tight'>
                    {sabotage.name}
                  </span>
                  <div className='flex flex-col gap-1 ml-2 flex-shrink-0'>
                    {isActive && (
                      <Badge
                        variant='outline'
                        className='bg-cyan-900/60 border-cyan-700 text-cyan-300 text-xs'
                      >
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
                <p className='text-xs text-gray-400 leading-relaxed w-full break-words whitespace-normal overflow-hidden'>
                  {sabotage.description}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Active Sabotages Section */}
      <div className='flex-shrink-0 pt-4 pb-8'>
        <div className='max-w-md mx-auto'>
          <div className='text-center mb-3'>
            <h2 className='text-lg font-bold text-transparent bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text'>
              Active Sabotage
            </h2>
          </div>

          {!activeSabotage ? (
            <div className='text-center text-sm text-gray-500'>
              No active sabotages
            </div>
          ) : (
            <div className='flex gap-2 overflow-x-auto pb-2 px-1'>
              <Badge
                key={activeSabotage.action.id}
                variant='outline'
                className='bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-cyan-600/50 text-cyan-300 px-3 py-1 text-xs whitespace-nowrap'
              >
                {activeSabotage.action.name}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
