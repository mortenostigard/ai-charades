import { ScoreUpdate, CompletedRound } from '@/types';

/**
 * Defines the outcome of a completed round, which is needed to calculate scores.
 */
export interface RoundOutcome {
  /** The player who correctly guessed the prompt. Null if the round timed out. */
  winnerId: string | null;
  /** The completed round data. */
  completedRound: CompletedRound;
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
   * @param outcome The result of the completed round.
   * @returns An object containing the new scores record and a list of individual score updates.
   */
  public static calculateScores(
    currentScores: Record<string, number>,
    outcome: RoundOutcome
  ): {
    newScores: Record<string, number>;
    scoreUpdates: ScoreUpdate[];
  } {
    const { winnerId, completedRound } = outcome;
    const { actorId, directorId, sabotagesUsed } = completedRound;
    const newScores = { ...currentScores };
    const scoreUpdates: ScoreUpdate[] = [];

    const createUpdate = (
      playerId: string,
      points: number,
      reason: ScoreUpdate['reason']
    ): void => {
      if (points !== 0) {
        newScores[playerId] = (newScores[playerId] || 0) + points;
        scoreUpdates.push({
          playerId,
          pointsAwarded: points,
          reason,
          totalScore: newScores[playerId],
        });
      }
    };

    if (winnerId) {
      // --- Scenario: Audience Guessed Correctly ---
      // Actor gets +2 points
      createUpdate(actorId, 2, 'successful_acting');
      // Director loses 1 point per sabotage used
      createUpdate(directorId, -sabotagesUsed, 'failed_direction');
      // Correct guesser gets +1 point
      createUpdate(winnerId, 1, 'correct_guess');
    } else {
      // --- Scenario: No One Guessed (Timeout) ---
      // Director gets +2 points for successful sabotage
      createUpdate(directorId, 2, 'successful_direction');
      // Actor gets 0 points, so no update is created
    }

    return { newScores, scoreUpdates };
  }
}
