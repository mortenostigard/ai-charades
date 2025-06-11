'use client';

import { useGameStore } from '@/stores/gameStore';

import ActorView from './actor-view';
import DirectorView from './director-view';
import AudienceView from './audience-view';
import { RoomLobby } from './room-lobby';
import { RoundSummaryScreen } from './round-summary-screen';
import { GameCompleteScreen } from './game-complete-screen';
import { LoadingSpinner } from './loading-spinner';

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

  // Check if current player is reconnecting
  const isReconnecting = myPlayer?.connectionStatus === 'reconnecting';

  // If game is complete, show the game complete screen
  if (roomStatus === 'complete' && gameState && myPlayer) {
    return <GameCompleteScreen />;
  }

  // If we're in summary view, show the round summary screen
  if (currentView === 'summary') {
    return <RoundSummaryScreen />;
  }

  let mainContent;
  if (roomStatus === 'playing' && round && gameConfig) {
    switch (currentRole) {
      case 'actor':
        mainContent = <ActorView />;
        break;
      case 'director':
        mainContent = <DirectorView />;
        break;
      case 'audience':
        mainContent = <AudienceView />;
        break;
      default:
        // Render a loading/transition state or default to lobby
        mainContent = <RoomLobby roomCode={roomCode} />;
        break;
    }
  } else {
    // Default to the lobby if not playing or no round is active
    mainContent = <RoomLobby roomCode={roomCode} />;
  }

  return (
    <div className='relative'>
      {mainContent}

      {isReconnecting && (
        <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50'>
          <div className='bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center space-y-4 mx-4 max-w-sm'>
            <LoadingSpinner />
            <div>
              <h2 className='text-xl font-bold text-white mb-2'>
                Reconnecting...
              </h2>
              <p className='text-gray-400'>
                We&apos;re getting you back into the game
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
