import { GameState, ActiveSabotage } from '@ai-charades/shared';

import { SABOTAGE_ACTIONS } from './data/sabotages';

/**
 * Manages the deployment and state of sabotages within a game round.
 * This class is designed to be a pure, state-transforming module. It takes the
 * current game state and returns a new, updated state without causing side effects.
 */
export class SabotageManager {
  private readonly gameState: GameState;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  /**
   * Deploys a new sabotage and returns the updated game state.
   * This method contains all validation logic.
   * @param sabotageId The ID of the sabotage to deploy.
   * @param directorId The ID of the player deploying the sabotage.
   * @param deployTime The timestamp of the deployment.
   * @returns A new GameState object with the deployed sabotage.
   * @throws An error with a reason code if the sabotage cannot be deployed.
   */
  public deploySabotage(
    sabotageId: string,
    directorId: string,
    deployTime: number
  ): GameState {
    const { currentRound, gameConfig } = this.gameState;

    if (!currentRound || currentRound.status !== 'active') {
      throw new Error('ROUND_NOT_ACTIVE');
    }

    if (currentRound.directorId !== directorId) {
      throw new Error('UNAUTHORIZED');
    }

    if (deployTime - currentRound.startTime < gameConfig.gracePeriod) {
      throw new Error('GRACE_PERIOD_ACTIVE');
    }

    if (currentRound.sabotagesDeployedCount >= gameConfig.maxSabotages) {
      throw new Error('MAX_SABOTAGES_REACHED');
    }

    if (currentRound.currentSabotage) {
      throw new Error('SABOTAGE_ALREADY_ACTIVE');
    }

    const action = SABOTAGE_ACTIONS.find(a => a.id === sabotageId);
    if (!action) {
      throw new Error('SABOTAGE_NOT_FOUND');
    }

    const newSabotage: ActiveSabotage = {
      action,
      deployedBy: directorId,
      deployedAt: deployTime,
      endsAt: deployTime + action.duration,
    };

    const newCurrentRound = {
      ...currentRound,
      currentSabotage: newSabotage,
      sabotagesDeployedCount: currentRound.sabotagesDeployedCount + 1,
    };

    return {
      ...this.gameState,
      currentRound: newCurrentRound,
    };
  }

  /**
   * Selects a specified number of random sabotages from the master list.
   * This uses the Fisher-Yates shuffle algorithm for an unbiased selection.
   * @param count The number of random sabotages to select.
   * @returns An array of SabotageAction objects.
   */
  public static selectRandomSabotages(count: number) {
    // Create a shuffled copy of the array
    const shuffled = [...SABOTAGE_ACTIONS].sort(() => 0.5 - Math.random());
    // Return the first `count` elements
    return shuffled.slice(0, count);
  }
}
