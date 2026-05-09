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
   * The game ends once every currently-connected player has had a turn as
   * Actor. Disconnected players are skipped from rotation (see
   * `getNextRoles`); waiting indefinitely for them would let one offline
   * player block the rest of the room. A player who reconnects while the
   * game is still in progress slots back into the queue and unblocks
   * completion until they've acted.
   * @returns True if the game is complete, false otherwise.
   */
  public isGameComplete(): boolean {
    const connected = this.players.filter(
      p => p.connectionStatus === 'connected'
    );
    if (connected.length === 0) return false;

    const acted = new Set(this.roundHistory.map(r => r.actorId));
    if (this.gameState.currentRound) {
      acted.add(this.gameState.currentRound.actorId);
    }
    return connected.every(p => acted.has(p.id));
  }

  /**
   * Calculates the next Actor and Director based on a clockwise rotation,
   * advancing past any slot that's currently ineligible.
   *
   * Rotation starts from the same slot the original index-based scheme
   * would have picked — `(roundHistory.length + 1) % numPlayers` — but
   * advances forward (clockwise) past disconnected players and players
   * who have already acted to find the next eligible Actor. The Director
   * is the next-most-recent connected player ahead of the Actor in the
   * rotation; they may have already acted (Director can be anyone who
   * isn't the Actor).
   * @returns The Player objects for the new Actor and new Director.
   * @throws If no eligible Actor or Director can be found.
   */
  private getNextRoles(): { newActor: Player; newDirector: Player } {
    const numPlayers = this.players.length;
    if (numPlayers < 2) {
      throw new Error('Not enough players to start the game.');
    }

    const acted = new Set(this.roundHistory.map(r => r.actorId));
    const startIndex = (this.roundHistory.length + 1) % numPlayers;

    let actorIndex = -1;
    for (let offset = 0; offset < numPlayers; offset++) {
      const idx = (startIndex + offset) % numPlayers;
      const candidate = this.players[idx];
      if (
        candidate &&
        candidate.connectionStatus === 'connected' &&
        !acted.has(candidate.id)
      ) {
        actorIndex = idx;
        break;
      }
    }
    if (actorIndex === -1) {
      throw new Error('No eligible actor available.');
    }

    let directorIndex = -1;
    const directorStart = (actorIndex - 1 + numPlayers) % numPlayers;
    for (let offset = 0; offset < numPlayers; offset++) {
      const idx = (directorStart - offset + numPlayers) % numPlayers;
      if (idx === actorIndex) continue;
      const candidate = this.players[idx];
      if (candidate && candidate.connectionStatus === 'connected') {
        directorIndex = idx;
        break;
      }
    }
    if (directorIndex === -1) {
      throw new Error('No eligible director available.');
    }

    const newActor = this.players[actorIndex];
    const newDirector = this.players[directorIndex];
    if (!newActor || !newDirector) {
      throw new Error('Player index out of bounds during role rotation');
    }
    return { newActor, newDirector };
  }
}
