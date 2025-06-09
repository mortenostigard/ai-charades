# API Specification

## TypeScript Interfaces

### Core Data Types

```typescript
interface Player {
  id: string;
  name: string;
  connected: boolean;
  joinedAt: number;
}

interface Room {
  id: string;
  code: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'paused' | 'complete';
  createdAt: number;
  maxPlayers: number;
}

interface GameState {
  room: Room;
  currentRound: CurrentRound | null;
  scores: Record<string, number>;
  gameConfig: GameConfig;
  roundHistory: CompletedRound[];
}

interface CurrentRound {
  number: number;
  actorId: string;
  directorId: string;
  prompt: GamePrompt;
  startTime: number;
  duration: number;
  deployedSabotages: ActiveSabotage[];
  status: 'active' | 'complete';
}

interface GamePrompt {
  id: string;
  text: string;
  category: 'movie' | 'song' | 'celebrity' | 'book';
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SabotageAction {
  id: string;
  name: string;
  description: string;
  duration: number;
  category: 'movement' | 'timing' | 'style';
  compatibleWith: string[];
}

interface ActiveSabotage {
  action: SabotageAction;
  deployedAt: number;
  endsAt: number;
  deployedBy: string;
}

interface GameConfig {
  roundDuration: number;
  gracePeriod: number;
  maxSabotages: number;
  sabotageTypes: SabotageAction[];
}

interface CompletedRound {
  roundNumber: number;
  actorId: string;
  directorId: string;
  prompt: GamePrompt;
  winner: string | null;
  sabotagesUsed: number;
  completedAt: number;
}

interface EmojiReaction {
  fromPlayerId: string;
  toPlayerId: string; // The Actor
  emoji: '😂' | '🔥' | '🤔' | '😴'; // Example set
  timestamp: number;
}

interface ScoreUpdate {
  playerId: string;
  pointsAwarded: number;
  reason:
    | 'correct_guess'
    | 'successful_acting'
    | 'successful_direction'
    | 'failed_direction';
  totalScore: number;
}
```

## Socket Events

### Room Management Events

#### Client → Server

```typescript
// Join existing room
'join_room': {
  roomCode: string
  playerName: string
}

// Create new room
'create_room': {
  playerName: string
  gameConfig?: Partial<GameConfig>
}

// Leave current room
'leave_room': {
  playerId: string
}

// Update player info
'update_player': {
  playerId: string
  name?: string
}
```

#### Server → Client

```typescript
// Successfully joined room
'room_joined': {
  room: Room
  playerId: string
  gameState: GameState
}

// Room created successfully
'room_created': {
  room: Room
  playerId: string
  gameState: GameState
}

// Error joining/creating room
'room_error': {
  code: 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'INVALID_CODE' | 'PLAYER_NAME_TAKEN'
  message: string
}

// Player joined the room
'player_joined': {
  player: Player
  room: Room
}

// Player left the room
'player_left': {
  playerId: string
  room: Room
}

// Room state changed
'room_updated': {
  room: Room
}
```

### Game Flow Events

#### Client → Server

```typescript
// Start new round
'start_round': {
  roomId: string
  requestedBy: string
}

// Deploy sabotage (Director only)
'deploy_sabotage': {
  sabotageId: string
  directorId: string
  timestamp: number
}

// Send emoji reaction (Audience only)
'send_reaction': {
  emoji: '😂' | '🔥' | '🤔' | '😴'
  targetActorId: string
}

// End round (Director confirms a correct guess)
'end_round': {
  roomId: string
  directorId: string
  winnerId: string // The player who guessed correctly
}

// Start new game
'start_game': {
  roomId: string
  requestedBy: string
}
```

#### Server → Client

```typescript
// Round started successfully
'round_started': {
  round: CurrentRound
  roles: {
    actorId: string
    directorId: string
    audienceIds: string[]
  }
}

// Sabotage deployed notification
'sabotage_deployed': {
  sabotage: ActiveSabotage
  targetPlayerId: string // Only sent to actor
  sabotageId: string
  endedAt: number
}

// Sabotage ended notification
'sabotage_ended': {
  sabotageId: string
  endedAt: number
}

// Game timer update
'timer_update': {
  timeRemaining: number
  roundStatus: 'grace_period' | 'sabotage_allowed' | 'ending_soon'
}

// Game state synchronized
'game_state_update': {
  gameState: GameState
  message: string
  shouldReconnect: boolean
}

// Audience reaction was sent
'reaction_sent': {
  reaction: EmojiReaction
}

// Round completed
'round_complete': {
  round: CompletedRound
  scores: ScoreUpdate[]
  nextRoles?: {
    actorId: string
    directorId: string
    audienceIds: string[]
  }
}
```

### Error Events

#### Server → Client

```typescript
// General game error
'game_error': {
  code: 'INVALID_ACTION' | 'PLAYER_NOT_FOUND' | 'ROUND_NOT_ACTIVE' | 'UNAUTHORIZED'
  message: string
  details?: any
}

// Sabotage deployment error
'sabotage_error': {
  code: 'SABOTAGE_NOT_FOUND' | 'INCOMPATIBLE_SABOTAGE' | 'MAX_SABOTAGES_REACHED' | 'GRACE_PERIOD_ACTIVE'
  message: string
  attemptedSabotageId: string
}

// Emoji reaction error
'reaction_error': {
  code: 'REACTION_LIMIT_REACHED' | 'INVALID_TARGET'
  message: string
}

// Connection issues
'connection_error': {
  code: 'RECONNECTION_FAILED' | 'ROOM_EXPIRED' | 'SERVER_ERROR'
  message: string
  shouldReconnect: boolean
}
```

## Event Flow Patterns

### Typical Round Flow

```
1. Client: 'start_round'
2. Server: 'round_started' (to all)
3. Server: 'timer_update' (periodic)
4. Client: 'deploy_sabotage' (Director)
5. Server: 'sabotage_deployed' (to Actor)
6. Client: 'end_round' (Director, declaring a winner)
7. Server: 'round_complete' (to all, triggered by either Director's action or server-side timeout)
```

### Error Handling Flow

```
1. Client: Invalid action
2. Server: Appropriate error event
3. Client: Display error + retry logic
4. Client: Syncs UI with current game state
```

### Reconnection Flow

```
1. Client: Detects disconnection
2. Client: Attempts reconnection
3. Server: 'room_joined' with current state
4. Client: Syncs UI with current game state
```

## Data Validation

### Client-Side Validation

- Room codes: 4 digits, numeric only
- Player names: 2-20 characters, alphanumeric + spaces

### Server-Side Validation

- All client inputs validated and sanitized
- Rate limiting on room creation
- Authorization checks for role-specific actions
- Game state consistency validation

## Rate Limiting

### Per Client Limits

- Room creation: 3 per minute
- Sabotage deployment: 1 per 5 seconds
- Reconnection attempts: 10 per minute

### Per Room Limits

- Maximum players: 8
- Room lifetime: 2 hours
- Rounds per game: No limit (until players leave)
