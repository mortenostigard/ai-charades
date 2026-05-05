'use client';

import { useGameStore } from '@/stores/gameStore';

interface UseSabotageReturn {
  canDeploySabotage: boolean;
  gracePeriodState: {
    isInGracePeriod: boolean;
    remainingSeconds: number;
  };
}

/**
 * Custom hook for sabotage deployment logic and constraints
 * Follows tech spec pattern: separates derived state from store
 */
export function useSabotage(): UseSabotageReturn {
  // Access raw state from store
  const gameState = useGameStore(state => state.gameState);
  const timeRemaining = useGameStore(state => state.timeRemaining);
  const currentRole = useGameStore(state => state.getCurrentRole());

  const gracePeriodState = ((): UseSabotageReturn['gracePeriodState'] => {
    if (!gameState?.currentRound) {
      return { isInGracePeriod: false, remainingSeconds: 0 };
    }

    const { gracePeriod } = gameState.gameConfig;
    const { duration } = gameState.currentRound;

    const gracePeriodThreshold = duration - gracePeriod;
    const isInGracePeriod = timeRemaining > gracePeriodThreshold;

    if (!isInGracePeriod) {
      return { isInGracePeriod: false, remainingSeconds: 0 };
    }

    const remainingGraceMs = timeRemaining - gracePeriodThreshold;
    const remainingSeconds = Math.ceil(remainingGraceMs / 1000);

    return { isInGracePeriod, remainingSeconds };
  })();

  const canDeploySabotage = ((): boolean => {
    if (!gameState?.currentRound) return false;

    const { currentSabotage, sabotagesDeployedCount } = gameState.currentRound;
    const { maxSabotages } = gameState.gameConfig;

    if (currentRole !== 'director') return false;
    if (gracePeriodState.isInGracePeriod) return false;
    if (sabotagesDeployedCount >= maxSabotages) return false;
    if (currentSabotage) return false;

    return true;
  })();

  return {
    canDeploySabotage,
    gracePeriodState,
  };
}
