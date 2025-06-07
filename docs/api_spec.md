# API Specification

## TypeScript Interfaces

### Core Data Types
```typescript
interface Player {
  id: string
  name: string
  connected: boolean
  joinedAt: number
}

interface Room {
  id: string
  code: string
  players: Player[]
  status: 'waiting' | 'playing' | 'paused' | 'complete'
  createdAt: number
  maxPlayers: number
}

interface GameState {
  room: Room
  currentRound: CurrentRound | null
  scores: Record<string, number>
  gameConfig: GameConfig
  roundHistory: CompletedRound[]
}

interface CurrentRound {
  number: number
  actorId: string
  directorId: string
  prompt: GamePrompt
  startTime: number
  duration: number
  activeSabotages: ActiveSabotage[]
  guesses: Guess[]
  status: 'active' | 'complete'
}

interface GamePrompt {
  id: string
  text: string
  category: 'movie' | 'song' | 'celebrity' | 'book'
  difficulty: 'easy' | 'medium' | 'hard'
}

interface SabotageAction {
  id: string
  name: string
  description: string
  duration: number
  category: 'movement' | 'timing' | 'style'
  compatibleWith: string[]
}

interface ActiveSabotage {
  action: SabotageAction
  deployedAt: number
  endsAt: number
  deployedBy: string
}

interface Guess {
  playerId: string
  text: string
  timestamp: number
  isCorrect?: boolean
}

interface GameConfig {
  roundDuration: number
  gracePeriod: number
  maxSabotages: number
  sabotageTypes: SabotageAction[]
}

interface CompletedRound {
  roundNumber: number
  actorId: string
  directorId: string
  prompt: GamePrompt
  winner: string | null
  sabotagesUsed: number
  completedAt: number
  finalGuess: Guess | null
}

interface ScoreUpdate {
  playerId: string
  pointsAwarded: number
  reason: 'correct_guess' | 'successful_acting' | 'successful_direction' | 'failed_direction'
  totalScore: number
}
```

## Socket Events

### Room Management Events

#### Client → Server
```typescript
// Join existing room
'join-room': {
  roomCode: string
  playerName: string
}

// Create new room  
'create-room': {
  playerName: string
  gameConfig?: Partial<GameConfig>
}

// Leave current room
'leave-room': {
  playerId: string
}

// Update player info
'update-player': {
  playerId: string
  name?: string
}
```

#### Server → Client
```typescript
// Successfully joined room
'room-joined': {
  room: Room
  playerId: string
  gameState: GameState
}

// Room created successfully
'room-created': {
  room: Room
  playerId: string
  gameState: GameState
}

// Error joining/creating room
'room-error': {
  code: 'ROOM_NOT_FOUND' | 'ROOM_FULL' | 'INVALID_CODE' | 'PLAYER_NAME_TAKEN'
  message: string
}

// Player joined the room
'player-joined': {
  player: Player
  room: Room
}

// Player left the room
'player-left': {
  playerId: string
  room: Room
}

// Room state changed
'room-updated': {
  room: Room
}
```

### Game Flow Events

#### Client → Server
```typescript
// Start new round
'start-round': {
  roomId: string
  requestedBy: string
}

// Submit guess
'submit-guess': {
  playerId: string
  guess: string
  timestamp: number
}

// Deploy sabotage (Director only)
'deploy-sabotage': {
  sabotageId: string
  directorId: string
  timestamp: number
}

// End round early
'end-round': {
  roomId: string
  requestedBy: string
  reason: 'timeout' | 'correct_guess' | 'manual'
}

// Start new game
'start-game': {
  roomId: string
  requestedBy: string
}
```

#### Server → Client
```typescript
// Round started successfully
'round-started': {
  round: CurrentRound
  roles: {
    actorId: string
    directorId: string
    audienceIds: string[]
  }
}

// Sabotage deployed notification
'sabotage-deployed': {
  sabotage: ActiveSabotage
  targetPlayerId: string // Only sent to actor
}

// Sabotage ended notification  
'sabotage-ended': {
  sabotageId: string
  endedAt: number
}

// Guess submitted
'guess-submitted': {
  guess: Guess
  isCorrect: boolean
}

// Round completed
'round-complete': {
  round: CompletedRound
  scores: ScoreUpdate[]
  nextRoles?: {
    actorId: string
    directorId: string
    audienceIds: string[]
  }
}

// Game timer update
'timer-update': {
  timeRemaining: number
  roundStatus: 'grace_period' | 'sabotage_allowed' | 'ending_soon'
}

// Game state synchronized
'game-state-update': {
  gameState: GameState
}
```

### Error Events

#### Server → Client
```typescript
// General game error
'game-error': {
  code: 'INVALID_ACTION' | 'PLAYER_NOT_FOUND' | 'ROUND_NOT_ACTIVE' | 'UNAUTHORIZED'
  message: string
  details?: any
}

// Sabotage deployment error
'sabotage-error': {
  code: 'SABOTAGE_NOT_FOUND' | 'INCOMPATIBLE_SABOTAGE' | 'MAX_SABOTAGES_REACHED' | 'GRACE_PERIOD_ACTIVE'
  message: string
  attemptedSabotageId: string
}

// Connection issues
'connection-error': {
  code: 'RECONNECTION_FAILED' | 'ROOM_EXPIRED' | 'SERVER_ERROR'
  message: string
  shouldReconnect: boolean
}
```

## Event Flow Patterns

### Typical Round Flow
```
1. Client: 'start-round'
2. Server: 'round-started' (to all)
3. Server: 'timer-update' (periodic)
4. Client: 'deploy-sabotage' (Director)
5. Server: 'sabotage-deployed' (to Actor)
6. Client: 'submit-guess' (Audience)
7. Server: 'guess-submitted' (to all)
8. Server: 'round-complete' (to all)
```

### Error Handling Flow
```
1. Client: Invalid action
2. Server: Appropriate error event
3. Client: Display error + retry logic
4. Client: Request 'game-state-update' if needed
```

### Reconnection Flow
```
1. Client: Detects disconnection
2. Client: Attempts reconnection
3. Server: 'room-joined' with current state
4. Client: Syncs UI with current game state
```

## Data Validation

### Client-Side Validation
- Room codes: 4 digits, numeric only
- Player names: 2-20 characters, alphanumeric + spaces
- Guesses: 1-50 characters, sanitized input

### Server-Side Validation
- All client inputs validated and sanitized
- Rate limiting on room creation and guesses
- Authorization checks for role-specific actions
- Game state consistency validation

## Rate Limiting

### Per Client Limits
- Room creation: 3 per minute
- Guess submission: 1 per 2 seconds
- Sabotage deployment: 1 per 5 seconds
- Reconnection attempts: 10 per minute

### Per Room Limits
- Maximum players: 8
- Room lifetime: 2 hours
- Rounds per game: No limit (until players leave)