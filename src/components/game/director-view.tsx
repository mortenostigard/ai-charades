'use client';

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Zap } from 'lucide-react';

import { SabotageAction, ActiveSabotage, Player } from '@/types';
import { Button } from '@/components/ui/button';
import { useSabotage } from '@/hooks/useSabotage';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

import { GameTimer } from './game-timer';
import { WinnerSelectionDialog } from './winner-selection-dialog';

interface DirectorViewProps {
  readonly activeSabotage: ActiveSabotage | null;
  readonly onDeploySabotageAction: (sabotage: SabotageAction) => void;
  readonly audience: Player[];
  readonly onSelectWinnerAction: (playerId: string) => void;
  readonly roundNumber: number;
  readonly availableSabotages: SabotageAction[];
  readonly sabotagesDeployedCount: number;
  readonly maxSabotages: number;
}

export default function DirectorView({
  activeSabotage,
  onDeploySabotageAction,
  audience,
  onSelectWinnerAction,
  roundNumber,
  availableSabotages,
  sabotagesDeployedCount,
  maxSabotages,
}: DirectorViewProps) {
  const { canDeploySabotage, gracePeriodState } = useSabotage();

  const handleDeploySabotage = useCallback(
    (sabotage: SabotageAction) => {
      onDeploySabotageAction(sabotage);
    },
    [onDeploySabotageAction]
  );

  const getSabotageClasses = (isActive: boolean, isDisabled: boolean) => {
    if (isActive) {
      return 'bg-gradient-to-r from-cyan-900/60 to-blue-900/60 border-cyan-500/70';
    }
    if (isDisabled) {
      return 'bg-gray-900/60 border-gray-800 opacity-70 cursor-not-allowed';
    }
    return 'bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-cyan-700/50 hover:border-cyan-600/70';
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
          <GameTimer role='director' />
        </div>
      </div>

      {/* Grace Period Status Section */}
      <div className='flex-shrink-0 mb-4'>
        <AnimatePresence mode='wait'>
          {gracePeriodState.isInGracePeriod ? (
            <motion.div
              key='grace-period'
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className='max-w-md mx-auto bg-gray-900/80 border border-gray-800 rounded-xl p-3 text-center'
            >
              <div className='text-sm text-gray-400'>
                Sabotages available in
              </div>
              <div className='text-2xl font-bold text-gray-300'>
                {gracePeriodState.remainingSeconds}s
              </div>
              <div className='flex justify-center mt-2'>
                <Lock className='text-gray-500 h-5 w-5' />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key='sabotages-unlocked'
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

      {/* Sabotage Deployment Section */}
      <div className='flex-1 flex flex-col items-center justify-center space-y-8'>
        <Card className='w-full max-w-md bg-gray-900 border-gray-800'>
          <CardHeader>
            <CardTitle className='text-center text-2xl font-bold text-cyan-400'>
              Deploy Sabotage ({sabotagesDeployedCount}/{maxSabotages})
            </CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-4'>
            {availableSabotages.map(sabotage => {
              // Use the existing canDeploySabotage logic instead of manual checks
              const isDisabled = !canDeploySabotage;
              return (
                <motion.button
                  key={sabotage.id}
                  onClick={() => handleDeploySabotage(sabotage)}
                  disabled={isDisabled}
                  whileTap={!isDisabled ? { scale: 0.95 } : {}}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${getSabotageClasses(
                    activeSabotage?.action.id === sabotage.id,
                    isDisabled
                  )}`}
                >
                  <div className='font-bold text-lg'>{sabotage.name}</div>
                  <div className='text-sm text-gray-400'>
                    {sabotage.description}
                  </div>
                </motion.button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Footer Section - Correct Guess Button */}
      <div className='flex-shrink-0 pt-4 pb-8 text-center'>
        <WinnerSelectionDialog
          audience={audience}
          onSelectWinnerAction={onSelectWinnerAction}
          roundNumber={roundNumber}
        >
          <Button
            size='lg'
            className='w-full max-w-xs h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-600 hover:to-cyan-700 text-white rounded-2xl shadow-lg border-2 border-green-400/50 transition-all duration-300 ease-in-out transform hover:scale-105'
          >
            Correct Guess!
          </Button>
        </WinnerSelectionDialog>
      </div>
    </div>
  );
}
