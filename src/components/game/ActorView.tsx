'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

import { Card, CardContent } from '@/components/ui/card';
import { ActiveSabotage } from '@/types';

import { GameTimer } from './game-timer';
import { SabotageAlert } from './SabotageAlert';

interface ActorViewProps {
  readonly prompt: string;
  readonly activeSabotage: ActiveSabotage | null;
}

export default function ActorView({ prompt, activeSabotage }: ActorViewProps) {
  const prevSabotageRef = useRef<ActiveSabotage | null>(null);

  useEffect(() => {
    if (activeSabotage && !prevSabotageRef.current) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .catch(err => console.error('Error playing sound:', err));
      }
    }

    prevSabotageRef.current = activeSabotage;
  }, [activeSabotage]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/sabotage-alert.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className='min-h-screen bg-gray-950 text-white flex flex-col p-4'>
      {/* Header Section - Role + Timer Combined */}
      <div className='flex-shrink-0 pt-6 pb-4'>
        <div className='text-center mb-4'>
          <h1 className='text-3xl font-bold text-white'>Game in Progress</h1>
        </div>
        <div className='flex items-center justify-between max-w-md mx-auto'>
          <h1 className='text-xl font-bold text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text'>
            ACTOR
          </h1>

          <GameTimer role='actor' />
        </div>
      </div>

      {/* Main Content Section - Prompt Card (Hero) */}
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
                Act Out This Prompt
              </div>
              <div className='text-4xl md:text-5xl font-black text-white leading-tight tracking-tight'>
                {prompt}
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>

      {/* Active Sabotages Section - Better Integration */}
      <div className='flex-shrink-0 pb-8'>
        <SabotageAlert activeSabotage={activeSabotage} />
      </div>
    </div>
  );
}
