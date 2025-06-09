'use client';

import { useGameStore } from '@/stores/gameStore';
import { useSocket } from '@/hooks/useSocket';

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
  const players = useGameStore(state => state.gameState?.room.players ?? []);
  const getPlayerById = useGameStore(state => state.getPlayerById);
  const { emit } = useSocket();

  if (roomStatus === 'playing' && round) {
    const actor = getPlayerById(round.actorId);
    const director = getPlayerById(round.directorId);

    // Should always have an actor and director in a playing state.
    // If not, it could be a state inconsistency; render lobby as a fallback.
    if (!actor || !director) {
      console.warn('Actor or Director not found, rendering lobby.');
      return <RoomLobby roomCode={roomCode} />;
    }

    const audience = players.filter(
      p => p.id !== round.actorId && p.id !== round.directorId
    );

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
              emit('deploy_sabotage', { roomCode, sabotageId: sabotage.id });
            }}
            audience={audience}
            onSelectWinner={winnerId => {
              emit('end_round', { roomCode, winnerId });
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
