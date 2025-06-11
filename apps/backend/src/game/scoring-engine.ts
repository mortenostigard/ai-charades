import { PlayerScoreChange, CurrentRound } from '@ai-charades/shared';

/**
 * Data needed to calculate scores from a completed round.
 */
export interface ScoringData {
  /** The player who correctly guessed the prompt. Null if the round timed out. */
  winnerId: string | null;
  /** The current round data (before completion). */
  currentRound: CurrentRound;
}

/**
 * Calculates scores based on the outcome of a round, following the game's
 * risk/reward logic.
 *
 * This class is designed to be a pure, state-transforming module. It takes the
 * current game state and returns a new, updated score object without causing
 * side effects.
 */
export class ScoringEngine {
  /**
   * Calculates the new scores for all players based on the round's outcome.
   * @param currentScores The record of player IDs to their current scores.
   * @param input The result of the completed round.
   * @returns An object containing the new scores record and a list of individual score changes.
   */
  public static calculateScores(
    currentScores: Record<string, number>,
    data: ScoringData
  ): {
    newScores: Record<string, number>;
    scoreChanges: PlayerScoreChange[];
  } {
    const { winnerId, currentRound } = data;
    const { actorId, directorId, sabotagesDeployedCount } = currentRound;
    const newScores = { ...currentScores };
    const scoreChanges: PlayerScoreChange[] = [];

    const createUpdate = (playerId: string, points: number): void => {
      if (points !== 0) {
        newScores[playerId] = (newScores[playerId] || 0) + points;
        scoreChanges.push({
          playerId,
          pointsEarned: points,
          totalScore: newScores[playerId],
        });
      }
    };

    if (winnerId) {
      // --- Scenario: Audience Guessed Correctly ---
      // Actor gets +2 points
      createUpdate(actorId, 2);
      // Director loses 1 point per sabotage used
      createUpdate(directorId, -sabotagesDeployedCount);
      // Correct guesser gets +1 point
      createUpdate(winnerId, 1);
    } else {
      // --- Scenario: No One Guessed (Timeout) ---
      // Director gets +2 points for successful sabotage
      createUpdate(directorId, 2);
      // Actor gets 0 points, so no update is created
    }

    return { newScores, scoreChanges };
  }
}
