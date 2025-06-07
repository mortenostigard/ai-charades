'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function HomePage() {
  const handleCreateRoom = () => {
    // TODO: Implement create room logic
    console.log('Create Room clicked');
  };

  const handleJoinRoom = () => {
    // TODO: Implement join room logic
    console.log('Join Room clicked');
  };

  return (
    <div className='min-h-screen bg-gray-950 flex flex-col items-center justify-between p-6 pb-8'>
      {/* Header Section */}
      <div className='flex-1 flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <h1 className='text-5xl md:text-6xl font-black text-white tracking-tight leading-none'>
            AI
            <br />
            <span className='text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text'>
              Charades
            </span>
          </h1>
          <p className='text-gray-400 text-lg font-medium max-w-xs mx-auto'>
            The ultimate party game with a twist
          </p>
        </div>
      </div>

      {/* Action Buttons Section - Bottom 1/3 for thumb access */}
      <div className='w-full max-w-sm space-y-4'>
        <motion.div
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Button
            onClick={handleCreateRoom}
            className='w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg rounded-2xl shadow-lg border-0 transition-all duration-200'
            size='lg'
          >
            Create Room
          </Button>
        </motion.div>

        <motion.div
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Button
            onClick={handleJoinRoom}
            className='w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-lg rounded-2xl shadow-lg border-0 transition-all duration-200'
            size='lg'
          >
            Join Room
          </Button>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className='absolute top-20 left-4 w-16 h-16 bg-purple-500/20 rounded-full blur-xl'></div>
      <div className='absolute top-32 right-6 w-12 h-12 bg-pink-500/20 rounded-full blur-lg'></div>
      <div className='absolute bottom-40 left-8 w-8 h-8 bg-orange-500/20 rounded-full blur-md'></div>
    </div>
  );
}
