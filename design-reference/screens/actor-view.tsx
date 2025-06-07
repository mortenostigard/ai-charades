'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SabotageAction {
  id: string;
  name: string;
  description: string;
}

interface ActorViewProps {
  prompt: string;
  timeRemaining: number;
  activeSabotages: SabotageAction[];
}

export default function ActorView({
  prompt = 'Playing tennis',
  timeRemaining = 45,
  activeSabotages = [
    { id: '1', name: 'One Hand Tied', description: 'One hand behind back' },
    { id: '2', name: 'Silent Mode', description: 'No sounds allowed' },
    { id: '3', name: 'Hop Only', description: 'Can only hop on one foot' },
  ],
}: ActorViewProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [isLowTime, setIsLowTime] = useState(false);
  const [isCriticalTime, setIsCriticalTime] = useState(false);
  const prevSabotagesRef = useRef<SabotageAction[]>([]);
  const isFirstRender = useRef(true);
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

  useEffect(() => {
    setIsLowTime(timeRemaining <= 15 && timeRemaining > 5);
    setIsCriticalTime(timeRemaining <= 5);
  }, [timeRemaining]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevSabotagesRef.current = [...activeSabotages];
      return;
    }

    if (activeSabotages.length > prevSabotagesRef.current.length) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .catch(err => console.error('Error playing sound:', err));
      }
    }

    prevSabotagesRef.current = [...activeSabotages];
  }, [activeSabotages]);

  const getTimerClasses = () => {
    if (isCriticalTime) {
      return 'text-4xl font-black text-transparent bg-gradient-to-r from-red-400 to-red-600 bg-clip-text tracking-wider';
    } else if (isLowTime) {
      return 'text-4xl font-black text-transparent bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text tracking-wider';
    }
    return 'text-4xl font-black text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text tracking-wider';
  };

  const getTimerBgClasses = () => {
    if (isCriticalTime) {
      return 'bg-gradient-to-r from-red-900/30 to-red-800/30 border-red-600/50';
    } else if (isLowTime) {
      return 'bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-600/50';
    }
    return 'bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border-yellow-600/30';
  };

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

          <motion.div
            className={`px-4 py-2 rounded-xl border-2 ${getTimerBgClasses()}`}
            animate={isCriticalTime ? { scale: [1, 1.05, 1] } : {}}
            transition={
              isCriticalTime
                ? { repeat: Number.POSITIVE_INFINITY, duration: 0.5 }
                : {}
            }
          >
            <div className={getTimerClasses()}>{formatTime(timeRemaining)}</div>
          </motion.div>
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
        <AnimatePresence>
          {activeSabotages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className='max-w-md mx-auto'
            >
              <div className='text-center mb-4'>
                <h2 className='text-lg font-bold text-transparent bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text'>
                  Active Sabotages ({activeSabotages.length})
                </h2>
              </div>

              <div className='grid grid-cols-1 gap-2'>
                {activeSabotages.map((sabotage, index) => (
                  <motion.div
                    key={sabotage.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.1,
                      type: 'spring',
                      stiffness: 400,
                      damping: 17,
                    }}
                  >
                    <div className='bg-gradient-to-r from-red-900/40 to-red-800/40 border border-red-600/50 rounded-xl p-3'>
                      <div className='flex items-center justify-between'>
                        <span className='font-bold text-red-200 text-sm'>
                          {sabotage.name}
                        </span>
                        <Badge
                          variant='outline'
                          className='bg-red-500/20 border-red-400/50 text-red-300 text-xs px-2 py-1'
                        >
                          NEW
                        </Badge>
                      </div>
                      <p className='text-red-300/80 text-xs mt-1'>
                        {sabotage.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
