'use client';

import { useMemo } from 'react';

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

  // Compute grace period state with React memoization
  const gracePeriodState = useMemo(() => {
    if (!gameState?.currentRound) {
      return { isInGracePeriod: false, remainingSeconds: 0 };
    }

    const { gracePeriod } = gameState.gameConfig;
    const { duration } = gameState.currentRound;

    // Grace period is active when timeRemaining > (duration - gracePeriod)
    const gracePeriodThreshold = duration - gracePeriod;
    const isInGracePeriod = timeRemaining > gracePeriodThreshold;

    if (!isInGracePeriod) {
      return { isInGracePeriod: false, remainingSeconds: 0 };
    }

    // Calculate remaining grace period time
    const remainingGraceMs = timeRemaining - gracePeriodThreshold;
    const remainingSeconds = Math.ceil(remainingGraceMs / 1000);

    return { isInGracePeriod, remainingSeconds };
  }, [gameState?.currentRound, gameState?.gameConfig, timeRemaining]);

  // Compute sabotage deployment eligibility with React memoization
  const canDeploySabotage = useMemo(() => {
    if (!gameState?.currentRound) return false;

    const { currentSabotage, sabotagesDeployedCount } = gameState.currentRound;
    const { maxSabotages } = gameState.gameConfig;

    // Only director can deploy sabotage
    if (currentRole !== 'director') return false;

    // Grace period must be over
    if (gracePeriodState.isInGracePeriod) return false;

    // Check max sabotages limit
    if (sabotagesDeployedCount >= maxSabotages) return false;

    // No sabotage can be active
    if (currentSabotage) return false;

    return true;
  }, [
    gameState?.currentRound,
    gameState?.gameConfig,
    currentRole,
    gracePeriodState.isInGracePeriod,
  ]);

  return {
    canDeploySabotage,
    gracePeriodState,
  };
}
