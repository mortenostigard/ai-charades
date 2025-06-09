import {
  CompletedRound,
  CurrentRound,
  GamePrompt,
  GameState,
  Player,
} from '../types';

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
   * Starts the very first round of the game.
   * Assigns the first player in the list as the Director and the second as the Actor.
   * Throws an error if there are not enough players to start.
   * @param firstPrompt The prompt for the first round.
   * @returns The updated GameState with the first round started.
   */
  public startFirstRound(firstPrompt: GamePrompt): GameState {
    if (this.players.length < 2) {
      throw new Error('Not enough players to start the game.');
    }

    const director = this.players[0];
    const actor = this.players[1];

    const newRound: CurrentRound = {
      number: 1,
      actorId: actor.id,
      directorId: director.id,
      prompt: firstPrompt,
      startTime: Date.now(),
      duration: this.gameState.gameConfig.roundDuration,
      currentSabotage: null,
      sabotagesDeployedCount: 0,
      status: 'active',
    };

    return {
      ...this.gameState,
      currentRound: newRound,
      room: {
        ...this.gameState.room,
        status: 'playing',
      },
    };
  }

  /**
   * Starts the next round of the game based on the previous round's state.
   * It rotates roles and provides a new prompt.
   * If all players have had a turn as the Actor, it marks the game as complete.
   * @param nextPrompt The prompt for the new round.
   * @returns The updated GameState.
   */
  public startNextRound(nextPrompt: GamePrompt): GameState {
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
      prompt: nextPrompt,
      startTime: Date.now(),
      duration: this.gameState.gameConfig.roundDuration,
      currentSabotage: null,
      sabotagesDeployedCount: 0,
      status: 'active',
    };

    return {
      ...this.gameState,
      currentRound: newRound,
    };
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
    if (!lastRound) {
      throw new Error('Cannot start next round without a previous round.');
    }

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
