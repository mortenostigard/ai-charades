export interface Player {
  id: string;
  name: string;
  connected: boolean;
  joinedAt: number;
}

export interface Room {
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
  currentSabotage: ActiveSabotage | null;
  sabotagesDeployedCount: number;
  status: 'active' | 'complete';
}

export interface GamePrompt {
  id: string;
  text: string;
  category:
    | 'modern_life'
    | 'social_media'
    | 'technology'
    | 'professional'
    | 'emotional'
    | 'abstract'
    | 'social_situations';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SabotageAction {
  id: string;
  name: string;
  description: string;
  duration: number;
  category:
    | 'emotion'
    | 'physical'
    | 'environment'
    | 'character'
    | 'sensory'
    | 'meta';
}

export interface ActiveSabotage {
  action: SabotageAction;
  deployedAt: number;
  endsAt: number;
  deployedBy: string;
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
