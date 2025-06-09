import { GameState, SabotageAction, ActiveSabotage } from '@/types';

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
   * Retrieves a list of sabotage actions that are available to be deployed.
   * This filters out any sabotages that are already active in the current round.
   * @returns An array of available SabotageAction objects.
   */
  public getAvailableSabotages(): SabotageAction[] {
    if (!this.gameState.currentRound) {
      return [];
    }

    const activeSabotageIds = new Set(
      this.gameState.currentRound.deployedSabotages.map(s => s.action.id)
    );

    return SABOTAGE_ACTIONS.filter(action => !activeSabotageIds.has(action.id));
  }

  /**
   * Checks if a specific sabotage can be deployed at a given time.
   * @param sabotageId The ID of the sabotage to check.
   * @param deployTime The timestamp of the deployment attempt.
   * @returns An object with a boolean `canDeploy` and an optional `reason` if it cannot be deployed.
   */
  public canDeploySabotage(
    sabotageId: string,
    deployTime: number
  ): { canDeploy: boolean; reason?: string } {
    const { currentRound, gameConfig } = this.gameState;

    if (!currentRound || currentRound.status !== 'active') {
      return { canDeploy: false, reason: 'ROUND_NOT_ACTIVE' };
    }

    if (deployTime - currentRound.startTime < gameConfig.gracePeriod) {
      return { canDeploy: false, reason: 'GRACE_PERIOD_ACTIVE' };
    }

    if (currentRound.deployedSabotages.length >= gameConfig.maxSabotages) {
      return { canDeploy: false, reason: 'MAX_SABOTAGES_REACHED' };
    }

    const isAlreadyActive = currentRound.deployedSabotages.some(
      s => s.action.id === sabotageId
    );
    if (isAlreadyActive) {
      return { canDeploy: false, reason: 'SABOTAGE_ALREADY_ACTIVE' };
    }

    const action = SABOTAGE_ACTIONS.find(a => a.id === sabotageId);
    if (!action) {
      return { canDeploy: false, reason: 'SABOTAGE_NOT_FOUND' };
    }

    return { canDeploy: true };
  }

  /**
   * Deploys a new sabotage and returns the updated game state.
   * @param sabotageId The ID of the sabotage to deploy.
   * @param directorId The ID of the player deploying the sabotage.
   * @param deployTime The timestamp of the deployment.
   * @returns A new GameState object with the deployed sabotage.
   * @throws An error if the sabotage cannot be deployed.
   */
  public deploySabotage(
    sabotageId: string,
    directorId: string,
    deployTime: number
  ): GameState {
    const { canDeploy, reason } = this.canDeploySabotage(
      sabotageId,
      deployTime
    );
    if (!canDeploy) {
      throw new Error(reason || 'INVALID_ACTION');
    }

    const action = SABOTAGE_ACTIONS.find(a => a.id === sabotageId);
    if (!action || !this.gameState.currentRound) {
      // This check is somewhat redundant due to canDeploySabotage, but good for type safety
      throw new Error('SABOTAGE_NOT_FOUND');
    }

    const newSabotage: ActiveSabotage = {
      action,
      deployedBy: directorId,
      deployedAt: deployTime,
      endsAt: deployTime + action.duration,
    };

    const newDeployedSabotages = [
      ...this.gameState.currentRound.deployedSabotages,
      newSabotage,
    ];

    const newCurrentRound = {
      ...this.gameState.currentRound,
      deployedSabotages: newDeployedSabotages,
    };

    return {
      ...this.gameState,
      currentRound: newCurrentRound,
    };
  }
}
