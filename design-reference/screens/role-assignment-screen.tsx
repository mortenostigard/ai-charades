'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface RoleAssignmentScreenProps {
  role: 'ACTOR' | 'DIRECTOR' | 'AUDIENCE';
}

export default function RoleAssignmentScreen({
  role = 'ACTOR',
}: RoleAssignmentScreenProps) {
  // Role-specific gradient configurations
  const roleConfig = {
    ACTOR: {
      textColor: 'text-yellow-300',
      gradient: 'linear-gradient(45deg, #fef08a, #facc15)',
      glowColor: 'rgba(254, 240, 138, 0.3)',
    },
    DIRECTOR: {
      textColor: 'text-cyan-400',
      gradient: 'linear-gradient(45deg, #67e8f9, #22d3ee)',
      glowColor: 'rgba(103, 232, 249, 0.3)',
    },
    AUDIENCE: {
      textColor: 'text-fuchsia-400',
      gradient: 'linear-gradient(45deg, #f5d0fe, #d946ef)',
      glowColor: 'rgba(245, 208, 254, 0.3)',
    },
  };

  const config = roleConfig[role];

  return (
    <div className='min-h-screen bg-gray-950 flex flex-col p-4'>
      {/* Header Section */}
      <div className='flex-shrink-0 pt-8 pb-6'>
        <h1 className='text-3xl font-bold text-center text-white'>
          Role Assignment
        </h1>
      </div>

      {/* Main Content Section */}
      <div className='flex-1 flex items-center justify-center px-2'>
        <Card className='w-full max-w-md bg-gray-900 border-gray-800 rounded-2xl'>
          <div className='flex flex-col items-center justify-center p-8 space-y-8 text-center'>
            <p className='text-gray-300 text-lg font-medium'>
              Your role for this round is...
            </p>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 17,
                duration: 0.5,
              }}
              className='relative'
            >
              <motion.h1
                className={`text-5xl md:text-6xl font-black ${config.textColor} tracking-tight leading-none`}
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 2.5,
                  ease: 'easeInOut',
                }}
              >
                THE {role}
              </motion.h1>

              {/* Animated glow effect */}
              <motion.div
                className='absolute -inset-4 -z-10 rounded-2xl blur-xl'
                style={{
                  background: config.gradient,
                  opacity: 0.3,
                }}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 2,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>

            <motion.p
              className='text-gray-400 text-lg font-medium'
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.7, 1] }}
              transition={{
                delay: 1,
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 1,
              }}
            >
              Get ready...
            </motion.p>
          </div>
        </Card>
      </div>

      {/* Bottom spacer */}
      <div className='flex-shrink-0 pb-8'></div>
    </div>
  );
}
