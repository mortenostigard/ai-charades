import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorMessageProps {
  readonly message: string;
  readonly className?: string;
}

export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-900/20 p-3 text-sm font-medium text-red-400 ${className}`}
    >
      <AlertTriangle className='h-5 w-5 flex-shrink-0' />
      <span>{message}</span>
    </div>
  );
}
