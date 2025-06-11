'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/lib/utils';

type TimerRole = 'actor' | 'director' | 'audience';

interface GameTimerProps {
  readonly role: TimerRole;
}

// Utility function to format milliseconds into MM:SS
const formatTime = (ms: number) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(1, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function GameTimer({ role }: GameTimerProps) {
  const timeRemaining = useGameStore(state => state.timeRemaining);
  const roundDuration = useGameStore(
    state => state.gameState?.gameConfig.roundDuration ?? 90000
  );

  const timePercentage = useMemo(() => {
    if (roundDuration === 0) return 0;
    return (timeRemaining / roundDuration) * 100;
  }, [timeRemaining, roundDuration]);

  const isCritical = timePercentage <= 15;
  const isWarning = timePercentage > 15 && timePercentage <= 35;

  const timerTextClasses = useMemo(() => {
    const baseClasses =
      'text-4xl font-black text-transparent bg-clip-text tracking-wider';
    if (isCritical) {
      return cn(baseClasses, 'bg-gradient-to-r from-red-400 to-red-600');
    }
    if (isWarning) {
      return cn(baseClasses, 'bg-gradient-to-r from-orange-400 to-red-500');
    }
    // Role-specific colors from design_system_spec.md
    switch (role) {
      case 'actor':
        return cn(
          baseClasses,
          'bg-gradient-to-r from-yellow-300 to-yellow-500'
        );
      case 'director':
        return cn(baseClasses, 'bg-gradient-to-r from-cyan-400 to-blue-500');
      case 'audience':
        return cn(
          baseClasses,
          'bg-gradient-to-r from-fuchsia-400 to-purple-500'
        );
    }
  }, [isCritical, isWarning, role]);

  const timerBgClasses = useMemo(() => {
    const baseClasses = 'px-4 py-2 rounded-xl border-2';
    if (isCritical) {
      return cn(
        baseClasses,
        'bg-gradient-to-r from-red-900/30 to-red-800/30 border-red-600/50'
      );
    }
    if (isWarning) {
      return cn(
        baseClasses,
        'bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-600/50'
      );
    }
    // Role-specific colors from design_system_spec.md
    switch (role) {
      case 'actor':
        return cn(
          baseClasses,
          'bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border-yellow-600/30'
        );
      case 'director':
        return cn(
          baseClasses,
          'bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-cyan-600/50'
        );
      case 'audience':
        return cn(
          baseClasses,
          'bg-gradient-to-r from-fuchsia-900/30 to-purple-900/30 border-fuchsia-600/50'
        );
    }
  }, [isCritical, isWarning, role]);

  return (
    <motion.div
      className={timerBgClasses}
      animate={isCritical ? { scale: [1, 1.05, 1] } : {}}
      transition={
        isCritical ? { repeat: Number.POSITIVE_INFINITY, duration: 0.5 } : {}
      }
    >
      <div className={timerTextClasses}>{formatTime(timeRemaining)}</div>
    </motion.div>
  );
}
