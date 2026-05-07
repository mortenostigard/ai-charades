# API Specification

## Source of truth

The shapes of every Socket.IO event payload live in
[`packages/shared/src/events.ts`](../packages/shared/src/events.ts) as
`ClientToServerEvents`, `ServerToClientEvents`, and `SocketData`. Both the
backend (`Server` / `Socket` generics in `apps/backend/server.ts` and
`apps/backend/src/socket/handlers.ts`) and the frontend (`io(...)` and the
`emit` wrapper in `apps/frontend/src/hooks/useSocket.ts`) are parameterised
on those interfaces, so a renamed or removed field fails `pnpm type-check`
on whichever side wasn't updated.

The TypeScript snippets below are illustrative — when in doubt, read the
shared types.

## Domain types

Game/data interfaces (`Player`, `Room`, `GameState`, `CurrentRound`,
`CompletedRound`, `GamePrompt`, `SabotageAction`, `ActiveSabotage`,
`GameConfig`, `EmojiReaction`) are also in `@charades/shared`:

```typescript
import {
  Player,
  Room,
  GameState,
  CurrentRound,
  CompletedRound,
  GamePrompt,
  SabotageAction,
  ActiveSabotage,
  GameConfig,
  EmojiReaction,
} from '@charades/shared';
```

Key interfaces:

- `Player` — game room participant with connection status
- `GameState` — full game state (room, scores, round history)
- `CurrentRound` — active round with timer, roles, and available sabotages
- `CompletedRound` — finished round with winner and sabotage count

## Socket events

### Room management

#### Client → Server

```typescript
// Join existing room
'join_room': { roomCode: string; playerName: string }

// Create new room
'create_room': { playerName: string; gameConfig?: Partial<GameConfig> }

// Leave current room. Identity is derived from the socket's auth binding
// (set on create/join/rejoin or via handshake auth) — no payload needed.
'leave_room': ()

// Rejoin room after disconnection. Establishing event — payload is the
// source of identity. Auto-rejoin on (re)connect is also supported via
// handshake auth (`io(url, { auth: { playerId, roomCode } })`).
'rejoin_room': { playerId: string; roomCode: string }
```

#### Server → Client

```typescript
'room_created':       { room: Room; playerId: string; gameState: GameState }
'room_joined':        { room: Room; playerId: string; gameState: GameState }
'player_joined':      { player: Player; room: Room }
'player_left':        { playerId: string; room: Room }
'player_reconnected': { player: Player; room: Room }
'player_disconnected':{ playerId: string; room: Room }
'room_error':         { code: string; message: string }
```

`room_error` codes include `ROOM_NOT_FOUND`, `ROOM_FULL`, `INVALID_CODE`,
`PLAYER_NAME_TAKEN`, `INVALID_PLAYER_NAME`, `INVALID_DATA`,
`AUTO_REJOIN_FAILED`, `PLAYER_NOT_FOUND`, `SERVER_ERROR`.

### Game flow

#### Client → Server

```typescript
// Start new game (host only — verified via socket auth binding)
'start_game': { roomCode: string }

// Start new round (host only — verified via socket auth binding)
'start_round': { roomCode: string }

// Deploy sabotage (Director only — verified via socket auth binding)
'deploy_sabotage': { sabotageId: string; roomCode: string }

// End round (Director confirms a correct guess)
'end_round': { roomCode: string; winnerId: string }

// Request current game state (for reconnection). Identity is derived
// from the socket's auth binding; no payload required.
'request_game_state': ()
```

#### Server → Client

```typescript
'sabotage_deployed': { sabotage: ActiveSabotage; targetPlayerId?: string }
'sabotage_ended':    { sabotageId: string }
'timer_update':      { timeRemaining: number }
'game_state_update': { gameState: GameState; message?: string; shouldReconnect?: boolean }
'round_complete':    { completedRound: CompletedRound }
'game_complete':     { scores: Record<string, number> }
```

### Errors

```typescript
'game_error':     { code: string; message: string }
'sabotage_error': { code: string; message: string; attemptedSabotageId: string }
```

`game_error` codes include `INVALID_ACTION`, `PLAYER_NOT_FOUND`,
`ROUND_NOT_ACTIVE`, `UNAUTHORIZED`, `ROOM_NOT_FOUND`, `START_GAME_FAILED`,
`START_ROUND_FAILED`, `STATE_SYNC_ERROR`, `SERVER_ERROR`.

`sabotage_error` codes include `SABOTAGE_NOT_FOUND`,
`MAX_SABOTAGES_REACHED`, `GRACE_PERIOD_ACTIVE`,
`SABOTAGE_ALREADY_ACTIVE`.

## Event flow patterns

### Typical round flow

```
1. Client: 'start_game'
2. Server: 'game_state_update' (to all)
3. Server: 'timer_update' (periodic)
4. Client: 'deploy_sabotage' (Director)
5. Server: 'sabotage_deployed' (to room)
6. Client: 'end_round' (Director, declaring a winner)
7. Server: 'round_complete' (to all, triggered by either Director's
   action or server-side timeout)
```

### Error handling flow

```
1. Client: Invalid action
2. Server: Appropriate error event
3. Client: Display error + retry logic
4. Client: Syncs UI with current game state
```

### Reconnection flow

```
1. Client: Detects disconnection
2. Client: Reconnects (handshake auth carries playerId + roomCode)
3. Server: 'game_state_update' with current state
4. Client: Syncs UI with current game state
```

## Data validation

### Client-side

- Room codes: 4 digits, numeric only
- Player names: 2–20 characters

### Server-side

- All client inputs validated and sanitized
- Authorization checks for role-specific actions (host, director)
- Game state consistency validation

## Per-room limits

- Maximum players: 8
- Room lifetime: 2 hours (idle)
- Rounds per game: capped by player count (each player acts once)
