'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ActiveSabotage } from '@ai-charades/shared';

import { Badge } from '@/components/ui/badge';

interface SabotageAlertProps {
  readonly activeSabotage: ActiveSabotage | null;
}

export function SabotageAlert({ activeSabotage }: SabotageAlertProps) {
  return (
    <AnimatePresence>
      {activeSabotage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring', stiffness: 400, damping: 20 },
          }}
          exit={{
            opacity: 0,
            y: 50,
            scale: 0.9,
            transition: { duration: 0.2 },
          }}
          className='fixed inset-x-4 bottom-24 z-50 md:bottom-10'
        >
          <div className='w-full max-w-md mx-auto bg-gradient-to-br from-red-500/90 to-orange-600/90 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-red-400/80 p-6'>
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-2xl font-black text-white tracking-tight'>
                SABOTAGE!
              </h2>
              <Badge
                variant='destructive'
                className='bg-red-700/80 border-red-500/80 text-white text-xs px-3 py-1 font-bold'
              >
                ACTIVE
              </Badge>
            </div>
            <div className='text-center'>
              <p className='text-3xl font-bold text-white drop-shadow-md'>
                {activeSabotage.action.name}
              </p>
              <p className='text-lg text-white/80 mt-1'>
                {activeSabotage.action.description}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
