'use client';

import { useGameStore } from '@/stores/gameStore';

import ActorView from './actor-view';
import DirectorView from './director-view';
import AudienceView from './audience-view';
import { RoomLobby } from './room-lobby';
import { RoundSummaryScreen } from './round-summary-screen';
import { GameCompleteScreen } from './game-complete-screen';

interface GameRoomProps {
  readonly roomCode: string;
}

export function GameRoom({ roomCode }: GameRoomProps) {
  const gameState = useGameStore(state => state.gameState);
  const roomStatus = useGameStore(state => state.gameState?.room.status);
  const currentView = useGameStore(state => state.currentView);
  const currentRole = useGameStore(state => state.getCurrentRole());
  const round = useGameStore(state => state.gameState?.currentRound);
  const gameConfig = useGameStore(state => state.gameState?.gameConfig);
  const myPlayer = useGameStore(state => state.getMyPlayer());

  // If game is complete, show the game complete screen
  if (roomStatus === 'complete' && gameState && myPlayer) {
    return <GameCompleteScreen />;
  }

  // If we're in summary view, show the round summary screen
  if (currentView === 'summary') {
    return <RoundSummaryScreen />;
  }

  if (roomStatus === 'playing' && round && gameConfig) {
    switch (currentRole) {
      case 'actor':
        return <ActorView />;
      case 'director':
        return <DirectorView />;
      case 'audience':
        return <AudienceView />;
      default:
        // Render a loading/transition state or default to lobby
        return <RoomLobby roomCode={roomCode} />;
    }
  }

  // Default to the lobby if not playing or no round is active
  return <RoomLobby roomCode={roomCode} />;
}
