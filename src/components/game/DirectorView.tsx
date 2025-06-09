'use client';

import { useState, useEffect } from 'react';

import { SabotageAction, ActiveSabotage, Player } from '@/types';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

import { GameTimer } from './game-timer';

interface DirectorViewProps {
  readonly activeSabotage: ActiveSabotage | null;
  readonly onDeploySabotageAction: (sabotage: SabotageAction) => void;
  readonly audience: Player[];
  readonly onSelectWinnerAction: (playerId: string) => void;
  readonly roundNumber: number;
}

export default function DirectorView({
  activeSabotage,
  onDeploySabotageAction,
  audience,
  onSelectWinnerAction,
  roundNumber,
}: DirectorViewProps) {
  const [isSelectingWinner, setIsSelectingWinner] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);

  // Reset the winner selection UI whenever a new round begins.
  useEffect(() => {
    setIsSelectingWinner(false);
    setSelectedWinnerId(null);
  }, [roundNumber]);

  // TODO: Replace with actual sabotages from game state
  const sabotages: SabotageAction[] = [
    {
      id: 'sabotage-1',
      name: 'One Hand Tied',
      description: 'Actor must perform with one hand behind their back.',
      duration: 30,
      category: 'physical',
    },
    {
      id: 'sabotage-2',
      name: 'Silent Movie',
      description: 'Actor cannot make any sounds.',
      duration: 20,
      category: 'sensory',
    },
    {
      id: 'sabotage-3',
      name: 'Gibberish',
      description: 'Actor can only speak in gibberish.',
      duration: 25,
      category: 'character',
    },
  ];

  // Handle sabotage deployment
  const handleDeploySabotage = (sabotage: SabotageAction) => {
    onDeploySabotageAction(sabotage);
  };

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

      {/* Sabotage Availability Section */}
      <div className='flex-1 flex flex-col items-center justify-center space-y-8'>
        <Card className='w-full max-w-md bg-gray-900 border-gray-800'>
          <CardHeader>
            <CardTitle className='text-center text-2xl font-bold text-cyan-400'>
              Deploy Sabotage
            </CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 gap-4'>
            {sabotages.map(sabotage => (
              <button
                key={sabotage.id}
                onClick={() => handleDeploySabotage(sabotage)}
                disabled={!!activeSabotage}
                className={`p-4 rounded-lg border-2 text-left transition-all ${getSabotageClasses(
                  activeSabotage?.action.id === sabotage.id,
                  !!activeSabotage
                )}`}
              >
                <div className='font-bold text-lg'>{sabotage.name}</div>
                <div className='text-sm text-gray-400'>
                  {sabotage.description}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Footer Section - Correct Guess Button */}
      <div className='flex-shrink-0 pt-4 pb-8 text-center'>
        {!isSelectingWinner ? (
          <Button
            size='lg'
            className='min-w-[200px] bg-green-600 hover:bg-green-700 text-white font-bold'
            onClick={() => setIsSelectingWinner(true)}
          >
            Correct Guess!
          </Button>
        ) : (
          <div className='w-full max-w-md mx-auto'>
            <h3 className='text-lg font-bold text-gray-300 mb-4'>
              Who guessed correctly?
            </h3>
            <div className='grid grid-cols-2 gap-3 mb-4'>
              {audience.map(player => (
                <Button
                  key={player.id}
                  variant={
                    selectedWinnerId === player.id ? 'default' : 'outline'
                  }
                  className={`w-full ${
                    selectedWinnerId === player.id
                      ? 'bg-green-500 border-green-400'
                      : 'border-gray-600'
                  }`}
                  onClick={() => setSelectedWinnerId(player.id)}
                >
                  {player.name}
                </Button>
              ))}
            </div>
            <Button
              size='lg'
              className='w-full bg-purple-600 hover:bg-purple-700'
              disabled={!selectedWinnerId}
              onClick={() => {
                if (selectedWinnerId) {
                  onSelectWinnerAction(selectedWinnerId);
                }
              }}
            >
              Confirm Winner & End Round
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
