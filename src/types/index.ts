export interface Player {
  id: string;
  name: string;
  connected: boolean;
  joinedAt: number;
}

export interface Room {
  id: string;
  code: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'paused' | 'complete';
  createdAt: number;
  maxPlayers: number;
}

export interface GameState {
  room: Room;
  currentRound: CurrentRound | null;
  scores: Record<string, number>;
  gameConfig: GameConfig;
  roundHistory: CompletedRound[];
}

export interface CurrentRound {
  number: number;
  actorId: string;
  directorId: string;
  prompt: GamePrompt;
  startTime: number;
  duration: number;
  activeSabotages: ActiveSabotage[];
  guesses: Guess[];
  status: 'active' | 'complete';
}

export interface GamePrompt {
  id: string;
  text: string;
  category: 'movie' | 'song' | 'celebrity' | 'book';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SabotageAction {
  id: string;
  name: string;
  description: string;
  duration: number;
  category: 'movement' | 'timing' | 'style';
  compatibleWith: string[];
}

export interface ActiveSabotage {
  action: SabotageAction;
  deployedAt: number;
  endsAt: number;
  deployedBy: string;
}

export interface Guess {
  playerId: string;
  text: string;
  timestamp: number;
  isCorrect?: boolean;
}

export interface GameConfig {
  roundDuration: number;
  gracePeriod: number;
  maxSabotages: number;
  sabotageTypes: SabotageAction[];
}

export interface CompletedRound {
  roundNumber: number;
  actorId: string;
  directorId: string;
  prompt: GamePrompt;
  winner: string | null;
  sabotagesUsed: number;
  completedAt: number;
  finalGuess: Guess | null;
}

export interface EmojiReaction {
  fromPlayerId: string;
  toPlayerId: string; // The Actor
  emoji: '😂' | '🔥' | '🤔' | '😴';
  timestamp: number;
}

export interface ScoreUpdate {
  playerId: string;
  pointsAwarded: number;
  reason:
    | 'correct_guess'
    | 'successful_acting'
    | 'successful_direction'
    | 'failed_direction';
  totalScore: number;
}
