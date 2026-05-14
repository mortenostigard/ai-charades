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
  it('ROUND-1.1 SAB-1.1 assigns p1 director and p2 actor on the first round', () => {
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

  it('ROUND-1.1 rotates roles based on the previous round', () => {
    // Previous round had p2 as actor → p2 becomes director, p3 becomes actor.
    const state = buildState({
      roundHistory: [buildCompleted({ actorId: 'p2', directorId: 'p1' })],
    });

    const next = new RoundManager(state).startRound(prompt);

    expect(next.currentRound?.number).toBe(1); // currentRound was null, so 0 + 1
    expect(next.currentRound?.directorId).toBe('p2');
    expect(next.currentRound?.actorId).toBe('p3');
  });

  it('ROUND-1.3 skips a disconnected player when picking the next actor', () => {
    // Round 1 actor was p2; round 2's natural slot is p3. p3 is disconnected
    // so the rotation must advance past them to p1.
    const state = buildState({
      room: {
        ...room,
        players: [
          { ...players[0]!, connectionStatus: 'connected' },
          { ...players[1]!, connectionStatus: 'connected' },
          { ...players[2]!, connectionStatus: 'disconnected' },
        ],
      },
      roundHistory: [buildCompleted({ actorId: 'p2', directorId: 'p1' })],
    });

    const next = new RoundManager(state).startRound(prompt);

    expect(next.currentRound?.actorId).toBe('p1');
    // Director is the next connected player walking backward from the actor.
    expect(next.currentRound?.directorId).toBe('p2');
  });

  it('ROUND-1.3 skips a disconnected player when picking the director', () => {
    // Round 2 starts with p3 as the natural actor. The director slot would
    // normally land on p2 (the previous actor), but p2 is disconnected, so
    // the rotation walks back to p1.
    const state = buildState({
      room: {
        ...room,
        players: [
          { ...players[0]!, connectionStatus: 'connected' },
          { ...players[1]!, connectionStatus: 'disconnected' },
          { ...players[2]!, connectionStatus: 'connected' },
        ],
      },
      roundHistory: [buildCompleted({ actorId: 'p2', directorId: 'p1' })],
    });

    const next = new RoundManager(state).startRound(prompt);

    expect(next.currentRound?.actorId).toBe('p3');
    expect(next.currentRound?.directorId).toBe('p1');
  });

  it('ROUND-1.2 ROUND-1.3 picks up a reconnected player who was skipped while disconnected', () => {
    // p3 was offline during round 2 so the rotation jumped them and round 2
    // landed on p1 instead. p3 is now back; round 3's target lands on p1 —
    // who has already acted — so the loop advances past p1 and p2 (also
    // acted) and assigns p3, keeping the at-most-once-per-game invariant.
    const state = buildState({
      roundHistory: [
        buildCompleted({ roundNumber: 1, actorId: 'p2', directorId: 'p1' }),
        buildCompleted({ roundNumber: 2, actorId: 'p1', directorId: 'p2' }),
      ],
    });

    const next = new RoundManager(state).startRound(prompt);

    expect(next.currentRound?.actorId).toBe('p3');
    expect(next.currentRound?.directorId).toBe('p2');
  });

  it('ROUND-1.3 throws when no connected player is left to direct', () => {
    // Two-player game where one player has gone offline. The connected
    // player can fill the Actor slot but there's no second connected
    // player to direct.
    const state = buildState({
      room: {
        ...room,
        players: [
          { ...players[0]!, connectionStatus: 'connected' },
          { ...players[1]!, connectionStatus: 'disconnected' },
          { ...players[2]!, connectionStatus: 'disconnected' },
        ],
      },
    });

    expect(() => new RoundManager(state).startRound(prompt)).toThrow(
      'No eligible director'
    );
  });

  it('ROUND-1.3 throws when no connected player is left to act', () => {
    // p1 and p2 already acted; p3 is the only player without a turn but
    // they're disconnected — and the others have already had theirs, so
    // there's no eligible Actor anywhere in the rotation.
    const state = buildState({
      room: {
        ...room,
        players: [
          { ...players[0]!, connectionStatus: 'disconnected' },
          { ...players[1]!, connectionStatus: 'disconnected' },
          { ...players[2]!, connectionStatus: 'disconnected' },
        ],
      },
      roundHistory: [
        buildCompleted({ roundNumber: 1, actorId: 'p1' }),
        buildCompleted({ roundNumber: 2, actorId: 'p2' }),
      ],
    });

    expect(() => new RoundManager(state).startRound(prompt)).toThrow(
      'No eligible actor'
    );
  });

  it('ROUND-1.1 wraps the actor index around to the start', () => {
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

  it('ROUND-4.1 marks the room complete and clears currentRound when every player has acted', () => {
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

  it('starts the next round when the previous actor has left the room', () => {
    // Round 1 was played with p2 as actor. p2 then left the room, so the
    // current player list no longer contains them.
    const remainingPlayers: Player[] = [
      { id: 'p1', name: 'P1', connectionStatus: 'connected', joinedAt: 0 },
      { id: 'p3', name: 'P3', connectionStatus: 'connected', joinedAt: 0 },
    ];
    const state = buildState({
      room: { ...room, players: remainingPlayers },
      scores: { p1: 0, p3: 0 },
      roundHistory: [buildCompleted({ actorId: 'p2', directorId: 'p1' })],
    });

    const next = new RoundManager(state).startRound(prompt);

    expect(next.currentRound).not.toBeNull();
    // With 2 remaining players, the round-2 rotation lands on actor index
    // 2 % 2 = 0 (p1) and director index 1 (p3).
    expect(next.currentRound?.actorId).toBe('p1');
    expect(next.currentRound?.directorId).toBe('p3');
  });

  it('ROUND-1.2 ROUND-4.1 rotates through every remaining player after a leave before completing', () => {
    // 4 players. p2 acts in round 1 then leaves; the simulation must reach
    // a complete state with p1, p3, p4 all having acted at least once.
    const fourPlayers: Player[] = [
      { id: 'p1', name: 'P1', connectionStatus: 'connected', joinedAt: 0 },
      { id: 'p2', name: 'P2', connectionStatus: 'connected', joinedAt: 0 },
      { id: 'p3', name: 'P3', connectionStatus: 'connected', joinedAt: 0 },
      { id: 'p4', name: 'P4', connectionStatus: 'connected', joinedAt: 0 },
    ];
    let state: GameState = {
      room: { ...room, players: fourPlayers },
      currentRound: null,
      scores: { p1: 0, p2: 0, p3: 0, p4: 0 },
      gameConfig,
      roundHistory: [],
    };

    // Round 1.
    state = new RoundManager(state).startRound(prompt);
    expect(state.currentRound?.actorId).toBe('p2');
    state = new RoundManager(state).endRound().newGameState;

    // p2 leaves (matches what RoomManager.leaveRoom does to players + scores).
    state = {
      ...state,
      room: {
        ...state.room,
        players: state.room.players.filter(p => p.id !== 'p2'),
      },
      scores: {
        p1: state.scores.p1!,
        p3: state.scores.p3!,
        p4: state.scores.p4!,
      },
    };

    // Drive rounds until startRound returns a completed game.
    for (let i = 0; i < 20; i++) {
      const next = new RoundManager(state).startRound(prompt);
      if (next.currentRound === null) {
        state = next;
        break;
      }
      state = new RoundManager(next).endRound().newGameState;
    }

    expect(state.room.status).toBe('complete');
    const actors = new Set(state.roundHistory.map(r => r.actorId));
    expect(actors.has('p1')).toBe(true);
    expect(actors.has('p3')).toBe(true);
    expect(actors.has('p4')).toBe(true);
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

  it('ROUND-3.1 SCORE-1.1 SCORE-1.2 SCORE-1.3 records correct_guess, applies scoring, and pushes to history', () => {
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

  it('ROUND-3.3 SCORE-2.1 SCORE-2.2 records time_up and gives the director +2 when no winner is provided', () => {
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

  it('ROUND-4.1 is true once every player has been actor across history', () => {
    const state = buildState({
      roundHistory: [
        buildCompleted({ roundNumber: 1, actorId: 'p1' }),
        buildCompleted({ roundNumber: 2, actorId: 'p2' }),
        buildCompleted({ roundNumber: 3, actorId: 'p3' }),
      ],
    });
    expect(new RoundManager(state).isGameComplete()).toBe(true);
  });

  it('ROUND-4.1 does not count actors who have left the room', () => {
    // history contains p2 (left), p3, p4 — but p2 is no longer in players.
    // With 3 remaining players (p1, p3, p4), the game should not be complete
    // yet because p1 has not acted.
    const remaining: Player[] = [
      { id: 'p1', name: 'P1', connectionStatus: 'connected', joinedAt: 0 },
      { id: 'p3', name: 'P3', connectionStatus: 'connected', joinedAt: 0 },
      { id: 'p4', name: 'P4', connectionStatus: 'connected', joinedAt: 0 },
    ];
    const state = buildState({
      room: { ...room, players: remaining },
      scores: { p1: 0, p3: 0, p4: 0 },
      roundHistory: [
        buildCompleted({ roundNumber: 1, actorId: 'p2' }),
        buildCompleted({ roundNumber: 2, actorId: 'p3' }),
        buildCompleted({ roundNumber: 3, actorId: 'p4' }),
      ],
    });
    expect(new RoundManager(state).isGameComplete()).toBe(false);
  });

  it('ROUND-4.1 completes when every connected player has acted, ignoring disconnected slots', () => {
    // p3 is disconnected and never acted; p1 and p2 (the only connected
    // players) have both acted. The game is over for the connected players.
    const state = buildState({
      room: {
        ...room,
        players: [
          { ...players[0]!, connectionStatus: 'connected' },
          { ...players[1]!, connectionStatus: 'connected' },
          { ...players[2]!, connectionStatus: 'disconnected' },
        ],
      },
      roundHistory: [
        buildCompleted({ roundNumber: 1, actorId: 'p1' }),
        buildCompleted({ roundNumber: 2, actorId: 'p2' }),
      ],
    });

    expect(new RoundManager(state).isGameComplete()).toBe(true);
  });

  it('ROUND-4.1 reverts to incomplete when a disconnected player reconnects with a turn still owed', () => {
    // p1 and p2 have acted. p3 was disconnected (which would have ended the
    // game) but reconnects, so they're owed a turn and the game is no
    // longer complete.
    const state = buildState({
      room: {
        ...room,
        players: [
          { ...players[0]!, connectionStatus: 'connected' },
          { ...players[1]!, connectionStatus: 'connected' },
          { ...players[2]!, connectionStatus: 'connected' },
        ],
      },
      roundHistory: [
        buildCompleted({ roundNumber: 1, actorId: 'p1' }),
        buildCompleted({ roundNumber: 2, actorId: 'p2' }),
      ],
    });

    expect(new RoundManager(state).isGameComplete()).toBe(false);
  });

  it('ROUND-4.1 counts the current actor towards completion', () => {
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
