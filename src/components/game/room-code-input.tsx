import React from 'react';

import { Input } from '@/components/ui/input';

interface RoomCodeInputProps {
  readonly value: string;
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly disabled?: boolean;
}

export function RoomCodeInput({
  value,
  onChange,
  placeholder = '4-Digit Room Code',
  className = '',
  disabled = false,
}: RoomCodeInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/\D/g, '');
    onChange(e);
  };

  return (
    <Input
      type='text'
      placeholder={placeholder}
      value={value}
      onChange={handleInputChange}
      className={`h-14 text-lg text-center font-mono bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 ${className}`}
      maxLength={4}
      pattern='\d{4}'
      required
      disabled={disabled}
    />
  );
}
