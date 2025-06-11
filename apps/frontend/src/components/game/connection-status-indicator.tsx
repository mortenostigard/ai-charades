'use client';

import { Wifi, WifiOff, RotateCcw } from 'lucide-react';
import type { Player } from '@ai-charades/shared';

import { Badge } from '@/components/ui/badge';

interface ConnectionStatusIndicatorProps {
  readonly connectionStatus: Player['connectionStatus'];
  readonly showBadge?: boolean;
  readonly showIcon?: boolean;
  readonly className?: string;
}

// Helper function to get connection status display info
function getConnectionStatusInfo(connectionStatus: Player['connectionStatus']) {
  switch (connectionStatus) {
    case 'connected':
      return {
        icon: Wifi,
        badge: null, // Don't show badge for connected players
        iconColor: 'text-green-500',
      };
    case 'disconnected':
      return {
        icon: WifiOff,
        badge: 'Offline',
        iconColor: 'text-red-500',
        badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
      };
    case 'reconnecting':
      return {
        icon: RotateCcw,
        badge: 'Reconnecting',
        iconColor: 'text-yellow-500',
        badgeColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      };
    case 'connecting':
      return {
        icon: RotateCcw,
        badge: 'Connecting',
        iconColor: 'text-blue-500',
        badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      };
    default:
      return {
        icon: Wifi,
        badge: null,
        iconColor: 'text-gray-500',
      };
  }
}

export function ConnectionStatusIndicator({
  connectionStatus,
  showBadge = true,
  showIcon = true,
  className = '',
}: ConnectionStatusIndicatorProps) {
  const connectionInfo = getConnectionStatusInfo(connectionStatus);
  const ConnectionIcon = connectionInfo.icon;

  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      {/* Connection icon */}
      {showIcon && (
        <ConnectionIcon
          className={`h-4 w-4 flex-shrink-0 ${connectionInfo.iconColor}`}
        />
      )}

      {/* Connection status badge */}
      {showBadge && connectionInfo.badge && (
        <Badge
          variant='outline'
          className={`text-xs ${connectionInfo.badgeColor || 'border-gray-600'}`}
        >
          {connectionInfo.badge}
        </Badge>
      )}
    </div>
  );
}

export { getConnectionStatusInfo };
