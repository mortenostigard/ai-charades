import {
  type CurrentRound,
  type GameConfig,
  type GamePrompt,
  type GameState,
  type Player,
  type Room,
} from '@charades/shared';
import { describe, it, expect } from 'vitest';

import { SABOTAGE_ACTIONS } from './data/sabotages.js';
import { SabotageManager } from './sabotage-manager.js';

const directorId = 'director';
const actorId = 'actor';

const players: Player[] = [
  {
    id: directorId,
    name: 'Director',
    connectionStatus: 'connected',
    joinedAt: 0,
  },
  { id: actorId, name: 'Actor', connectionStatus: 'connected', joinedAt: 0 },
];

const room: Room = {
  code: '1234',
  players,
  status: 'playing',
  createdAt: 0,
  maxPlayers: 8,
};

const gameConfig: GameConfig = {
  roundDuration: 90000,
  gracePeriod: 20000,
  maxSabotages: 3,
};

const samplePrompt: GamePrompt = {
  id: 'modern_1',
  text: 'sample',
  category: 'modern_life',
  difficulty: 'easy',
};

const buildState = (overrides: {
  currentRound?: CurrentRound | null;
}): GameState => ({
  room,
  currentRound: overrides.currentRound ?? null,
  scores: { [directorId]: 0, [actorId]: 0 },
  gameConfig,
  roundHistory: [],
});

const buildRound = (overrides: Partial<CurrentRound> = {}): CurrentRound => ({
  number: 1,
  actorId,
  directorId,
  prompt: samplePrompt,
  startTime: 0,
  duration: gameConfig.roundDuration,
  currentSabotage: null,
  sabotagesDeployedCount: 0,
  availableSabotages: SABOTAGE_ACTIONS.slice(0, 6),
  status: 'active',
  ...overrides,
});

const validSabotageId = SABOTAGE_ACTIONS[0]!.id;

describe('SabotageManager.deploySabotage', () => {
  it('deploys a sabotage past the grace period and updates the round', () => {
    const state = buildState({ currentRound: buildRound() });
    const deployTime = gameConfig.gracePeriod + 1000;

    const next = new SabotageManager(state).deploySabotage(
      validSabotageId,
      directorId,
      deployTime
    );

    expect(next.currentRound?.currentSabotage).not.toBeNull();
    expect(next.currentRound?.currentSabotage?.deployedBy).toBe(directorId);
    expect(next.currentRound?.currentSabotage?.deployedAt).toBe(deployTime);
    expect(next.currentRound?.currentSabotage?.endsAt).toBe(
      deployTime + SABOTAGE_ACTIONS[0]!.duration
    );
    expect(next.currentRound?.sabotagesDeployedCount).toBe(1);
  });

  it('throws ROUND_NOT_ACTIVE when no round is active', () => {
    const state = buildState({ currentRound: null });
    expect(() =>
      new SabotageManager(state).deploySabotage(
        validSabotageId,
        directorId,
        100000
      )
    ).toThrow('ROUND_NOT_ACTIVE');
  });

  it('throws ROUND_NOT_ACTIVE when round status is complete', () => {
    const state = buildState({
      currentRound: buildRound({ status: 'complete' }),
    });
    expect(() =>
      new SabotageManager(state).deploySabotage(
        validSabotageId,
        directorId,
        100000
      )
    ).toThrow('ROUND_NOT_ACTIVE');
  });

  it('throws UNAUTHORIZED when a non-director attempts deploy', () => {
    const state = buildState({ currentRound: buildRound() });
    expect(() =>
      new SabotageManager(state).deploySabotage(
        validSabotageId,
        actorId,
        gameConfig.gracePeriod + 1
      )
    ).toThrow('UNAUTHORIZED');
  });

  it('throws GRACE_PERIOD_ACTIVE before the grace period elapses', () => {
    const state = buildState({ currentRound: buildRound({ startTime: 0 }) });
    expect(() =>
      new SabotageManager(state).deploySabotage(
        validSabotageId,
        directorId,
        gameConfig.gracePeriod - 1
      )
    ).toThrow('GRACE_PERIOD_ACTIVE');
  });

  it('throws MAX_SABOTAGES_REACHED at the configured cap', () => {
    const state = buildState({
      currentRound: buildRound({
        sabotagesDeployedCount: gameConfig.maxSabotages,
      }),
    });
    expect(() =>
      new SabotageManager(state).deploySabotage(
        validSabotageId,
        directorId,
        gameConfig.gracePeriod + 1
      )
    ).toThrow('MAX_SABOTAGES_REACHED');
  });

  it('throws SABOTAGE_ALREADY_ACTIVE while another sabotage is in progress', () => {
    const round = buildRound();
    const state = buildState({
      currentRound: {
        ...round,
        currentSabotage: {
          action: SABOTAGE_ACTIONS[0]!,
          deployedAt: 21000,
          endsAt: 41000,
          deployedBy: directorId,
        },
      },
    });
    expect(() =>
      new SabotageManager(state).deploySabotage(
        validSabotageId,
        directorId,
        gameConfig.gracePeriod + 5000
      )
    ).toThrow('SABOTAGE_ALREADY_ACTIVE');
  });

  it('throws SABOTAGE_NOT_FOUND for an unknown id', () => {
    const state = buildState({ currentRound: buildRound() });
    expect(() =>
      new SabotageManager(state).deploySabotage(
        'does-not-exist',
        directorId,
        gameConfig.gracePeriod + 1
      )
    ).toThrow('SABOTAGE_NOT_FOUND');
  });
});

describe('SabotageManager.selectRandomSabotages', () => {
  it('returns the requested count', () => {
    expect(SabotageManager.selectRandomSabotages(6)).toHaveLength(6);
    expect(SabotageManager.selectRandomSabotages(1)).toHaveLength(1);
  });

  it('returns only valid SabotageAction objects from the master list', () => {
    const ids = new Set(SABOTAGE_ACTIONS.map(a => a.id));
    for (const action of SabotageManager.selectRandomSabotages(6)) {
      expect(ids.has(action.id)).toBe(true);
    }
  });

  it('returns at most the master list length when asked for more', () => {
    const result = SabotageManager.selectRandomSabotages(
      SABOTAGE_ACTIONS.length + 5
    );
    expect(result).toHaveLength(SABOTAGE_ACTIONS.length);
  });
});
