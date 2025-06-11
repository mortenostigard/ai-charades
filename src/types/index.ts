/**
 * Represents a player in the game room.
 * Players can join/leave rooms and participate in rounds with different roles.
 */
export interface Player {
  /** Unique identifier for the player */
  id: string;
  /** Display name chosen by the player */
  name: string;
  /** Current connection status of the player */
  connectionStatus:
    | 'connecting'
    | 'connected'
    | 'disconnected'
    | 'reconnecting';
  /** Timestamp when the player joined the room */
  joinedAt: number;
}

/**
 * Represents a game room where players gather before and during gameplay.
 */
export interface Room {
  /** 4-digit room code for joining */
  code: string;
  /** List of all players in the room */
  players: Player[];
  /** Current room state */
  status: 'waiting' | 'playing' | 'complete';
  /** Timestamp when the room was created */
  createdAt: number;
  /** Maximum number of players allowed (default: 8) */
  maxPlayers: number;
}

/**
 * Complete game state containing all game data.
 * This is the authoritative state managed by the server.
 */
export interface GameState {
  /** The room information and players */
  room: Room;
  /** Currently active round, null if between rounds */
  currentRound: CurrentRound | null;
  /** Player scores as playerId -> totalScore mapping */
  scores: Record<string, number>;
  /** Game configuration settings */
  gameConfig: GameConfig;
  /** History of all completed rounds */
  roundHistory: CompletedRound[];
}

/**
 * An active round currently being played.
 * Contains all data needed for the 90-second round gameplay.
 */
export interface CurrentRound {
  /** Round number (starts at 1) */
  number: number;
  /** Player ID of the actor performing the prompt */
  actorId: string;
  /** Player ID of the director who can deploy sabotage */
  directorId: string;
  /** The prompt the actor must perform */
  prompt: GamePrompt;
  /** Timestamp when the round started */
  startTime: number;
  /** Round duration in milliseconds (default: 90000) */
  duration: number;
  /** Currently active sabotage, null if none deployed */
  currentSabotage: ActiveSabotage | null;
  /** Count of sabotages deployed this round (max 3) */
  sabotagesDeployedCount: number;
  /** Sabotage actions available to the director this round */
  availableSabotages: SabotageAction[];
  /** Round status */
  status: 'active' | 'complete';
}

/**
 * A prompt that the actor must perform during their round.
 * Prompts are selected randomly from different categories.
 */
export interface GamePrompt {
  /** Unique identifier for the prompt */
  id: string;
  /** The prompt text to be performed */
  text: string;
  /** Category classification for prompt selection */
  category:
    | 'modern_life'
    | 'social_media'
    | 'technology'
    | 'professional'
    | 'emotional'
    | 'abstract'
    | 'social_situations';
  /** Difficulty level affecting prompt complexity */
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * A sabotage action that the director can deploy to make acting more challenging.
 * Each sabotage has a duration and affects the actor's performance.
 */
export interface SabotageAction {
  /** Unique identifier for the sabotage */
  id: string;
  /** Display name shown to players */
  name: string;
  /** Detailed description of the constraint */
  description: string;
  /** How long the sabotage lasts in milliseconds */
  duration: number;
  /** Category for sabotage selection and balancing */
  category:
    | 'emotion'
    | 'physical'
    | 'environment'
    | 'character'
    | 'sensory'
    | 'meta';
}

/**
 * An active sabotage currently affecting the actor.
 * Only one sabotage can be active at a time.
 */
export interface ActiveSabotage {
  /** The sabotage action being applied */
  action: SabotageAction;
  /** Timestamp when the sabotage was deployed */
  deployedAt: number;
  /** Timestamp when the sabotage will end */
  endsAt: number;
  /** Player ID of the director who deployed it */
  deployedBy: string;
}

/**
 * Game configuration settings that control gameplay rules.
 */
export interface GameConfig {
  /** Round duration in milliseconds (default: 90000) */
  roundDuration: number;
  /** Grace period before sabotage can be deployed in milliseconds (default: 20000) */
  gracePeriod: number;
  /** Maximum number of sabotages per round (default: 3) */
  maxSabotages: number;
}

/**
 * Player role within a specific round.
 * Each round has exactly one Actor, one Director, and remaining players are Audience.
 */
export type PlayerRole = 'actor' | 'director' | 'audience';

/**
 * Outcome of a completed round for display purposes.
 */
export type RoundOutcome = 'correct_guess' | 'time_up';

/**
 * Player's score change from a completed round.
 * Simplified to focus on the essential data needed for display.
 */
export interface PlayerScoreChange {
  /** Player ID receiving the score change */
  readonly playerId: string;
  /** Points earned/lost in this round (can be negative) */
  readonly pointsEarned: number;
  /** Player's total score after this round */
  readonly totalScore: number;
}

/**
 * A completed round with all data needed for display and game logic.
 * Designed to be UI-friendly while containing all necessary game information.
 */
export interface CompletedRound {
  /** The round number that was completed */
  roundNumber: number;
  /** Player ID who was the actor */
  actorId: string;
  /** Player ID who was the director */
  directorId: string;
  /** The prompt that was performed */
  prompt: GamePrompt;
  /** Round outcome - whether someone guessed correctly or time expired */
  outcome: RoundOutcome;
  /** Player ID who guessed correctly (only present if outcome is CORRECT_GUESS) */
  winnerId?: string;
  /** Number of sabotages deployed during the round */
  sabotagesUsed: number;
  /** Score changes for all players from this round */
  scoreChanges: PlayerScoreChange[];
  /** Timestamp when the round completed */
  completedAt: number;
}

/**
 * Emoji reaction sent by audience members to the actor.
 * Used for engagement and end-game bonuses.
 */
export interface EmojiReaction {
  /** Player ID who sent the reaction */
  fromPlayerId: string;
  /** Player ID who received the reaction (always the actor) */
  toPlayerId: string;
  /** The emoji reaction sent */
  emoji: '😂' | '🔥' | '🤔' | '😴';
  /** Timestamp when the reaction was sent */
  timestamp: number;
}
