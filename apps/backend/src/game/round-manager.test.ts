import {
  type CompletedRound,
  type CurrentRound,
  type GameConfig,
  type GamePrompt,
  type GameState,
  type Player,
  type Room,
} from '@charades/shared';
import { describe, it, expect } from 'vitest';

import { RoundManager } from './round-manager.js';

const players: Player[] = [
  { id: 'p1', name: 'P1', connectionStatus: 'connected', joinedAt: 0 },
  { id: 'p2', name: 'P2', connectionStatus: 'connected', joinedAt: 0 },
  { id: 'p3', name: 'P3', connectionStatus: 'connected', joinedAt: 0 },
];

const room: Room = {
  code: '1234',
  players,
  status: 'waiting',
  createdAt: 0,
  maxPlayers: 8,
};

const gameConfig: GameConfig = {
  roundDuration: 90000,
  gracePeriod: 20000,
  maxSabotages: 3,
};

const prompt: GamePrompt = {
  id: 'modern_1',
  text: 'sample',
  category: 'modern_life',
  difficulty: 'easy',
};

const buildState = (overrides: Partial<GameState> = {}): GameState => ({
  room,
  currentRound: null,
  scores: { p1: 0, p2: 0, p3: 0 },
  gameConfig,
  roundHistory: [],
  ...overrides,
});

const buildCompleted = (
  overrides: Partial<CompletedRound>
): CompletedRound => ({
  roundNumber: 1,
  actorId: 'p2',
  directorId: 'p1',
  prompt,
  outcome: 'correct_guess',
  winnerId: 'p3',
  sabotagesUsed: 0,
  scoreChanges: [],
  completedAt: 0,
  ...overrides,
});

describe('RoundManager.startRound', () => {
  it('assigns p1 director and p2 actor on the first round', () => {
    const state = buildState();
    const next = new RoundManager(state).startRound(prompt);

    expect(next.currentRound).not.toBeNull();
    expect(next.currentRound?.number).toBe(1);
    expect(next.currentRound?.directorId).toBe('p1');
    expect(next.currentRound?.actorId).toBe('p2');
    expect(next.currentRound?.prompt).toEqual(prompt);
    expect(next.currentRound?.duration).toBe(gameConfig.roundDuration);
    expect(next.currentRound?.sabotagesDeployedCount).toBe(0);
    expect(next.currentRound?.availableSabotages).toHaveLength(6);
    expect(next.currentRound?.status).toBe('active');
    expect(next.room.status).toBe('playing');
  });

  it('rotates roles based on the previous round', () => {
    // Previous round had p2 as actor → p2 becomes director, p3 becomes actor.
    const state = buildState({
      roundHistory: [buildCompleted({ actorId: 'p2', directorId: 'p1' })],
    });

    const next = new RoundManager(state).startRound(prompt);

    expect(next.currentRound?.number).toBe(1); // currentRound was null, so 0 + 1
    expect(next.currentRound?.directorId).toBe('p2');
    expect(next.currentRound?.actorId).toBe('p3');
  });

  it('wraps the actor index around to the start', () => {
    // Last actor was p3 (index 2 of 3) → next actor wraps to p1.
    const state = buildState({
      roundHistory: [
        buildCompleted({ roundNumber: 1, actorId: 'p2' }),
        buildCompleted({ roundNumber: 2, actorId: 'p3' }),
      ],
    });

    const next = new RoundManager(state).startRound(prompt);

    expect(next.currentRound?.directorId).toBe('p3');
    expect(next.currentRound?.actorId).toBe('p1');
  });

  it('marks the room complete and clears currentRound when every player has acted', () => {
    const state = buildState({
      roundHistory: [
        buildCompleted({ roundNumber: 1, actorId: 'p1' }),
        buildCompleted({ roundNumber: 2, actorId: 'p2' }),
        buildCompleted({ roundNumber: 3, actorId: 'p3' }),
      ],
    });

    const next = new RoundManager(state).startRound(prompt);

    expect(next.currentRound).toBeNull();
    expect(next.room.status).toBe('complete');
  });

  it('throws when there are not enough players to start the first round', () => {
    const state = buildState({
      room: {
        ...room,
        players: [players[0]!],
      },
      scores: { p1: 0 },
    });

    expect(() => new RoundManager(state).startRound(prompt)).toThrow(
      'Not enough players'
    );
  });

  it('increments the round number from currentRound when present', () => {
    const currentRound: CurrentRound = {
      number: 5,
      actorId: 'p2',
      directorId: 'p1',
      prompt,
      startTime: 0,
      duration: gameConfig.roundDuration,
      currentSabotage: null,
      sabotagesDeployedCount: 0,
      availableSabotages: [],
      status: 'active',
    };
    const state = buildState({ currentRound });

    const next = new RoundManager(state).startRound(prompt);
    expect(next.currentRound?.number).toBe(6);
  });
});

describe('RoundManager.endRound', () => {
  const activeRound: CurrentRound = {
    number: 1,
    actorId: 'p2',
    directorId: 'p1',
    prompt,
    startTime: 0,
    duration: gameConfig.roundDuration,
    currentSabotage: null,
    sabotagesDeployedCount: 1,
    availableSabotages: [],
    status: 'active',
  };

  it('records correct_guess, applies scoring, and pushes to history', () => {
    const state = buildState({ currentRound: activeRound });
    const { newGameState } = new RoundManager(state).endRound('p3');

    expect(newGameState.currentRound).toBeNull();
    expect(newGameState.roundHistory).toHaveLength(1);

    const completed = newGameState.roundHistory[0]!;
    expect(completed.roundNumber).toBe(1);
    expect(completed.outcome).toBe('correct_guess');
    expect(completed.winnerId).toBe('p3');
    expect(completed.sabotagesUsed).toBe(1);

    // +2 actor (p2), -1 director (p1, 1 sabotage), +1 guesser (p3)
    expect(newGameState.scores).toEqual({ p1: -1, p2: 2, p3: 1 });
  });

  it('records time_up and gives the director +2 when no winner is provided', () => {
    const state = buildState({ currentRound: activeRound });
    const { newGameState } = new RoundManager(state).endRound();

    const completed = newGameState.roundHistory[0]!;
    expect(completed.outcome).toBe('time_up');
    expect(completed.winnerId).toBeUndefined();

    // Director (p1) gets +2, actor and others unchanged
    expect(newGameState.scores).toEqual({ p1: 2, p2: 0, p3: 0 });
  });

  it('throws when called with no active round', () => {
    const state = buildState({ currentRound: null });
    expect(() => new RoundManager(state).endRound()).toThrow(
      'No active round to end.'
    );
  });
});

describe('RoundManager.isGameComplete', () => {
  it('is false when no rounds have been played', () => {
    expect(new RoundManager(buildState()).isGameComplete()).toBe(false);
  });

  it('is true once every player has been actor across history', () => {
    const state = buildState({
      roundHistory: [
        buildCompleted({ roundNumber: 1, actorId: 'p1' }),
        buildCompleted({ roundNumber: 2, actorId: 'p2' }),
        buildCompleted({ roundNumber: 3, actorId: 'p3' }),
      ],
    });
    expect(new RoundManager(state).isGameComplete()).toBe(true);
  });

  it('counts the current actor towards completion', () => {
    const currentRound: CurrentRound = {
      number: 3,
      actorId: 'p3',
      directorId: 'p2',
      prompt,
      startTime: 0,
      duration: gameConfig.roundDuration,
      currentSabotage: null,
      sabotagesDeployedCount: 0,
      availableSabotages: [],
      status: 'active',
    };
    const state = buildState({
      currentRound,
      roundHistory: [
        buildCompleted({ roundNumber: 1, actorId: 'p1' }),
        buildCompleted({ roundNumber: 2, actorId: 'p2' }),
      ],
    });
    expect(new RoundManager(state).isGameComplete()).toBe(true);
  });
});
