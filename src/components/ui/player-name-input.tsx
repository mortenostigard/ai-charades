import React from 'react';

import { Input } from '@/components/ui/input';

interface PlayerNameInputProps {
  readonly value: string;
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly disabled?: boolean;
}

export function PlayerNameInput({
  value,
  onChange,
  placeholder = 'Your Name',
  className = '',
  disabled = false,
}: PlayerNameInputProps) {
  return (
    <Input
      type='text'
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`h-14 text-lg text-center bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 ${className}`}
      maxLength={20}
      minLength={2}
      required
      disabled={disabled}
    />
  );
}
