import {
  CompletedRound,
  CurrentRound,
  GamePrompt,
  GameState,
  Player,
  ScoreUpdate,
} from '../types';

import { ScoringEngine } from './scoring-engine';

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
      status: 'active',
    };

    return {
      ...this.gameState,
      currentRound: newRound,
      room: { ...this.gameState.room, status: 'playing' },
    };
  }

  /**
   * Ends the current round, calculates scores, and returns the new state.
   * @param winnerId The ID of the player who won the round, if any.
   * @returns An object containing the updated GameState and the specific score changes for the round.
   */
  public endRound(winnerId?: string): {
    newGameState: GameState;
    scoreUpdates: ScoreUpdate[];
  } {
    if (!this.gameState.currentRound) {
      // This should ideally not be reached if called correctly
      throw new Error('No active round to end.');
    }

    const completedRound: CompletedRound = {
      roundNumber: this.gameState.currentRound.number,
      actorId: this.gameState.currentRound.actorId,
      directorId: this.gameState.currentRound.directorId,
      prompt: this.gameState.currentRound.prompt,
      winner: winnerId || null,
      sabotagesUsed: this.gameState.currentRound.sabotagesDeployedCount,
      completedAt: Date.now(),
    };

    const { newScores, scoreUpdates } = ScoringEngine.calculateScores(
      this.gameState.scores,
      { winnerId: winnerId || null, completedRound }
    );

    const newGameState: GameState = {
      ...this.gameState,
      currentRound: null,
      roundHistory: [...this.gameState.roundHistory, completedRound],
      scores: newScores,
    };

    return { newGameState, scoreUpdates };
  }

  /**
   * Checks if the game is complete.
   * The game is considered complete when every player has had at least one turn as the Actor.
   * @returns True if the game is complete, false otherwise.
   */
  public isGameComplete(): boolean {
    const actorsSoFar = new Set(this.roundHistory.map(r => r.actorId));
    // Add the current actor if a round is active
    if (this.gameState.currentRound) {
      actorsSoFar.add(this.gameState.currentRound.actorId);
    }
    return actorsSoFar.size >= this.players.length;
  }

  /**
   * Calculates the next Actor and Director based on a clockwise rotation.
   * The previous Actor becomes the new Director.
   * The player after the previous Actor becomes the new Actor.
   * @returns The Player objects for the new Actor and new Director.
   */
  private getNextRoles(): { newActor: Player; newDirector: Player } {
    const lastRound = this.gameState.currentRound;

    // Case 1: This is the first round of the game.
    if (!lastRound) {
      if (this.players.length < 2) {
        throw new Error('Not enough players to start the game.');
      }
      // Assign the first player as Director and the second as Actor.
      const newDirector = this.players[0];
      const newActor = this.players[1];
      return { newActor, newDirector };
    }

    // Case 2: This is a subsequent round. Rotate roles.
    const lastActorIndex = this.players.findIndex(
      p => p.id === lastRound.actorId
    );

    // The new Director is the player who was just the Actor.
    const newDirector = this.players[lastActorIndex];

    // The new Actor is the next player in the list, wrapping around if necessary.
    const newActorIndex = (lastActorIndex + 1) % this.players.length;
    const newActor = this.players[newActorIndex];

    return { newActor, newDirector };
  }
}
