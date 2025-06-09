'use client';

import { useGameStore } from '@/stores/gameStore';

import ActorView from './ActorView';
import DirectorView from './DirectorView';
import AudienceView from './AudienceView';
import { RoomLobby } from './room-lobby';

interface GameRoomProps {
  readonly roomCode: string;
}

export function GameRoom({ roomCode }: GameRoomProps) {
  const roomStatus = useGameStore(state => state.gameState?.room.status);
  const currentRole = useGameStore(state => state.getCurrentRole());
  const round = useGameStore(state => state.gameState?.currentRound);

  if (roomStatus === 'playing' && round) {
    switch (currentRole) {
      case 'actor':
        return (
          <ActorView
            prompt={round.prompt.text}
            timeRemaining={90} // Placeholder
            activeSabotage={round.currentSabotage}
          />
        );
      case 'director':
        return (
          <DirectorView
            timeRemaining={90} // Placeholder
            activeSabotage={round.currentSabotage}
            onDeploySabotageAction={sabotage => {
              // TODO: wire up to socket emit
              console.log('Deploying sabotage', sabotage.id);
            }}
          />
        );
      case 'audience':
        return (
          <AudienceView
            actorName='Player' // Placeholder
            promptCategory={round.prompt.category}
            timeRemaining={90} // Placeholder
          />
        );
      default:
        // Render a loading/transition state or default to lobby
        return <RoomLobby roomCode={roomCode} />;
    }
  }

  // Default to the lobby if not playing or no round is active
  return <RoomLobby roomCode={roomCode} />;
}
