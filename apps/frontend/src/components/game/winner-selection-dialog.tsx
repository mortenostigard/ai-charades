'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Player } from '@ai-charades/shared';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface WinnerSelectionDialogProps {
  readonly audience: Player[];
  readonly onSelectWinnerAction: (playerId: string) => void;
  readonly roundNumber: number;
  readonly children: ReactNode;
}

export function WinnerSelectionDialog({
  audience,
  onSelectWinnerAction,
  roundNumber,
  children,
}: WinnerSelectionDialogProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);

  // Reset the modal and winner selection UI whenever a new round begins.
  useEffect(() => {
    setIsModalOpen(false);
    setSelectedWinnerId(null);
  }, [roundNumber]);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='bg-gray-900 border-gray-800 text-white p-6 rounded-2xl max-w-sm mx-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-center text-white'>
            Who Guessed Correctly?
          </DialogTitle>
        </DialogHeader>
        <ToggleGroup
          type='single'
          className='grid grid-cols-1 sm:grid-cols-2 gap-3 py-4'
          onValueChange={value => {
            if (value) setSelectedWinnerId(value);
          }}
        >
          {audience.map(player => (
            <ToggleGroupItem
              key={player.id}
              value={player.id}
              className='flex items-center justify-start gap-3 p-3 h-auto rounded-xl border-2 transition-all cursor-pointer w-full text-left data-[state=on]:bg-cyan-500/20 data-[state=on]:border-cyan-400 data-[state=on]:shadow-lg data-[state=on]:shadow-cyan-500/10 bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600 !rounded-xl'
            >
              <Avatar className='h-10 w-10 border-2 border-gray-600'>
                <AvatarFallback className='bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold'>
                  {player.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className='font-semibold text-white truncate flex-1'>
                {player.name}
              </p>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <DialogFooter>
          <Button
            size='lg'
            className='w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl shadow-lg border-0 transition-all duration-200 disabled:opacity-50'
            disabled={!selectedWinnerId}
            onClick={() => {
              if (selectedWinnerId) {
                onSelectWinnerAction(selectedWinnerId);
                setIsModalOpen(false); // Close modal on confirm
              }
            }}
          >
            Confirm Winner & End Round
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
