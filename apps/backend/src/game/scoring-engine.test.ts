import {
  type CurrentRound,
  type GamePrompt,
  type SabotageAction,
} from '@charades/shared';
import { describe, it, expect } from 'vitest';

import { ScoringEngine, type ScoringData } from './scoring-engine.js';

const samplePrompt: GamePrompt = {
  id: 'modern_1',
  text: 'sample',
  category: 'modern_life',
  difficulty: 'easy',
};

const buildRound = (overrides: Partial<CurrentRound> = {}): CurrentRound => ({
  number: 1,
  actorId: 'actor',
  directorId: 'director',
  prompt: samplePrompt,
  startTime: 0,
  duration: 90000,
  currentSabotage: null,
  sabotagesDeployedCount: 0,
  availableSabotages: [] as SabotageAction[],
  status: 'active',
  ...overrides,
});

describe('ScoringEngine', () => {
  it('awards +2 actor / +1 guesser / -N director when a guess wins', () => {
    const data: ScoringData = {
      winnerId: 'guesser',
      currentRound: buildRound({ sabotagesDeployedCount: 2 }),
    };
    const { newScores, scoreChanges } = ScoringEngine.calculateScores(
      { actor: 0, director: 5, guesser: 3 },
      data
    );

    expect(newScores).toEqual({ actor: 2, director: 3, guesser: 4 });
    expect(scoreChanges).toEqual([
      { playerId: 'actor', pointsEarned: 2, totalScore: 2 },
      { playerId: 'director', pointsEarned: -2, totalScore: 3 },
      { playerId: 'guesser', pointsEarned: 1, totalScore: 4 },
    ]);
  });

  it('omits the director from scoreChanges when no sabotages were used', () => {
    const data: ScoringData = {
      winnerId: 'guesser',
      currentRound: buildRound({ sabotagesDeployedCount: 0 }),
    };
    const { newScores, scoreChanges } = ScoringEngine.calculateScores(
      { actor: 0, director: 0, guesser: 0 },
      data
    );

    expect(newScores.director).toBe(0);
    expect(scoreChanges.find(c => c.playerId === 'director')).toBeUndefined();
    expect(scoreChanges).toHaveLength(2);
  });

  it('awards the director +2 on timeout and omits the actor from scoreChanges', () => {
    const data: ScoringData = {
      winnerId: null,
      currentRound: buildRound({ sabotagesDeployedCount: 1 }),
    };
    const { newScores, scoreChanges } = ScoringEngine.calculateScores(
      { actor: 1, director: 0 },
      data
    );

    expect(newScores).toEqual({ actor: 1, director: 2 });
    expect(scoreChanges).toEqual([
      { playerId: 'director', pointsEarned: 2, totalScore: 2 },
    ]);
  });

  it('skips score updates for players no longer in currentScores', () => {
    // The actor left the room mid-round and has been removed from scores.
    // Their slot should not be resurrected; only the remaining players update.
    const data: ScoringData = {
      winnerId: 'guesser',
      currentRound: buildRound({ sabotagesDeployedCount: 1 }),
    };
    const { newScores, scoreChanges } = ScoringEngine.calculateScores(
      { director: 0, guesser: 0 },
      data
    );

    expect(newScores).toEqual({ director: -1, guesser: 1 });
    expect(scoreChanges).toEqual([
      { playerId: 'director', pointsEarned: -1, totalScore: -1 },
      { playerId: 'guesser', pointsEarned: 1, totalScore: 1 },
    ]);
    expect('actor' in newScores).toBe(false);
  });

  it('does not mutate the input scores object', () => {
    const original = { actor: 5, director: 5, guesser: 5 };
    const snapshot = { ...original };
    ScoringEngine.calculateScores(original, {
      winnerId: 'guesser',
      currentRound: buildRound({ sabotagesDeployedCount: 1 }),
    });
    expect(original).toEqual(snapshot);
  });
});
