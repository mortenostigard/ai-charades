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
  const getPlayerById = useGameStore(state => state.getPlayerById);

  if (roomStatus === 'playing' && round) {
    const actor = getPlayerById(round.actorId);
    const director = getPlayerById(round.directorId);

    // Should always have an actor and director in a playing state.
    // If not, it could be a state inconsistency; render lobby as a fallback.
    if (!actor || !director) {
      console.warn('Actor or Director not found, rendering lobby.');
      return <RoomLobby roomCode={roomCode} />;
    }

    switch (currentRole) {
      case 'actor':
        return (
          <ActorView
            prompt={round.prompt.text}
            activeSabotage={round.currentSabotage}
          />
        );
      case 'director':
        return (
          <DirectorView
            activeSabotage={round.currentSabotage}
            onDeploySabotageAction={sabotage => {
              // TODO: wire up to socket emit
              console.log('Deploying sabotage', sabotage.id);
            }}
          />
        );
      case 'audience':
        return <AudienceView actor={actor} director={director} />;
      default:
        // Render a loading/transition state or default to lobby
        return <RoomLobby roomCode={roomCode} />;
    }
  }

  // Default to the lobby if not playing or no round is active
  return <RoomLobby roomCode={roomCode} />;
}
