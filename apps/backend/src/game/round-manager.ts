import {
  type CompletedRound,
  type CurrentRound,
  type GamePrompt,
  type GameState,
  type Player,
} from '@charades/shared';

import { ScoringEngine, type ScoringData } from './scoring-engine.js';
import { SabotageManager } from './sabotage-manager.js';

/**
 * Manages the lifecycle of rounds within a game, including role rotation
 * and game completion logic.
 *
 * This class is designed to be a pure, state-transforming module. It takes the
 * current game state and returns a new, updated state without causing side effects.
 */
export class RoundManager {
  private readonly gameState: GameState;
  private readonly players: Player[];
  private readonly roundHistory: CompletedRound[];

  constructor(gameState: GameState) {
    this.gameState = gameState;
    this.players = gameState.room.players;
    this.roundHistory = gameState.roundHistory;
  }

  /**
   * Starts a new round of the game, handling both the initial round and subsequent rounds.
   * It determines the correct Actor and Director, assigns a new prompt, and returns the updated state.
   * @param newPrompt The prompt for the new round.
   * @returns The updated GameState.
   */
  public startRound(newPrompt: GamePrompt): GameState {
    if (this.isGameComplete()) {
      return {
        ...this.gameState,
        currentRound: null,
        room: { ...this.gameState.room, status: 'complete' },
      };
    }

    const { newActor, newDirector } = this.getNextRoles();

    const newRound: CurrentRound = {
      number: (this.gameState.currentRound?.number ?? 0) + 1,
      actorId: newActor.id,
      directorId: newDirector.id,
      prompt: newPrompt,
      startTime: Date.now(),
      duration: this.gameState.gameConfig.roundDuration,
      currentSabotage: null,
      sabotagesDeployedCount: 0,
      availableSabotages: SabotageManager.selectRandomSabotages(6),
      status: 'active',
    };

    return {
      ...this.gameState,
      currentRound: newRound,
      room: { ...this.gameState.room, status: 'playing' },
    };
  }

  /**
   * Ends the current round, calculates scores, and returns the new state
   * along with the round record that was just appended to history.
   * @param winnerId The ID of the player who won the round, if any.
   */
  public endRound(winnerId?: string): {
    newGameState: GameState;
    completedRound: CompletedRound;
  } {
    if (!this.gameState.currentRound) {
      // This should ideally not be reached if called correctly
      throw new Error('No active round to end.');
    }

    const outcome = winnerId ? 'correct_guess' : 'time_up';
    const scoringData: ScoringData = {
      winnerId: winnerId || null,
      currentRound: this.gameState.currentRound,
    };
    const { newScores, scoreChanges } = ScoringEngine.calculateScores(
      this.gameState.scores,
      scoringData
    );

    const completedRound: CompletedRound = {
      roundNumber: this.gameState.currentRound.number,
      actorId: this.gameState.currentRound.actorId,
      directorId: this.gameState.currentRound.directorId,
      prompt: this.gameState.currentRound.prompt,
      outcome,
      winnerId,
      sabotagesUsed: this.gameState.currentRound.sabotagesDeployedCount,
      scoreChanges,
      completedAt: Date.now(),
    };

    const newGameState: GameState = {
      ...this.gameState,
      currentRound: null,
      roundHistory: [...this.gameState.roundHistory, completedRound],
      scores: newScores,
    };

    return { newGameState, completedRound };
  }

  /**
   * Checks if the game is complete.
   *
   * Only counts actors who are still in the room. A leaver who already had
   * their actor turn would otherwise inflate the count and end the game one
   * round early, before every remaining player has had a chance to act.
   * @returns True if the game is complete, false otherwise.
   */
  public isGameComplete(): boolean {
    const currentIds = new Set(this.players.map(p => p.id));
    const actorsStillHere = new Set<string>();
    for (const r of this.roundHistory) {
      if (currentIds.has(r.actorId)) actorsStillHere.add(r.actorId);
    }
    if (
      this.gameState.currentRound &&
      currentIds.has(this.gameState.currentRound.actorId)
    ) {
      actorsStillHere.add(this.gameState.currentRound.actorId);
    }
    return actorsStillHere.size >= this.players.length;
  }

  /**
   * Calculates the next Actor and Director based on a clockwise rotation.
   *
   * Rotation is computed purely from the number of rounds played so far, not
   * from the previous actor's id. That keeps the next round startable even if
   * the player who was actor in the previous round has left the room.
   * @returns The Player objects for the new Actor and new Director.
   */
  private getNextRoles(): { newActor: Player; newDirector: Player } {
    const numPlayers = this.players.length;
    if (numPlayers < 2) {
      throw new Error('Not enough players to start the game.');
    }

    // Round 1 places the director at index 0 and the actor at index 1; each
    // subsequent round rotates one slot clockwise.
    const nextRoundIndex = this.roundHistory.length;
    const actorIndex = (nextRoundIndex + 1) % numPlayers;
    const directorIndex = (actorIndex - 1 + numPlayers) % numPlayers;

    const newActor = this.players[actorIndex];
    const newDirector = this.players[directorIndex];
    if (!newActor || !newDirector) {
      throw new Error('Player index out of bounds during role rotation');
    }
    return { newActor, newDirector };
  }
}
