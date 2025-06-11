import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  readonly className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return <Loader2 className={`animate-spin ${className || ''}`} />;
}
