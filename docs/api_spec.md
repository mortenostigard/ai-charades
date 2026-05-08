# API Specification

Source of truth: [`packages/shared/src/events.ts`](../packages/shared/src/events.ts).

`ClientToServerEvents`, `ServerToClientEvents`, and `SocketData` parameterise
both the backend `Server` / `Socket` and the frontend `io(...)`. Renaming a
field fails `pnpm type-check` on whichever side wasn't updated.

Domain types (`Player`, `Room`, `GameState`, `CurrentRound`, `CompletedRound`,
`GamePrompt`, `SabotageAction`, `ActiveSabotage`, `GameConfig`,
`EmojiReaction`) are also exported from `@charades/shared`.

## Events

### Client → Server

| Event                | Payload                                            |
| -------------------- | -------------------------------------------------- |
| `create_room`        | `{ playerName; gameConfig?: Partial<GameConfig> }` |
| `join_room`          | `{ roomCode; playerName }`                         |
| `rejoin_room`        | `{ playerId; roomCode; sessionToken }`             |
| `leave_room`         | —                                                  |
| `start_game`         | `{ roomCode }`                                     |
| `start_round`        | `{ roomCode }`                                     |
| `deploy_sabotage`    | `{ sabotageId; roomCode }`                         |
| `end_round`          | `{ roomCode; winnerId }`                           |
| `request_game_state` | —                                                  |

Identity for privileged events (`leave_room`, `start_*`, `deploy_sabotage`,
`end_round`, `request_game_state`) is derived from the socket auth binding.
Auto-rejoin: `io(url, { auth: { playerId, roomCode, sessionToken } })`. The
`sessionToken` is issued once on `room_created` / `room_joined` and required
on every subsequent connection.

### Server → Client

| Event                 | Payload                                         |
| --------------------- | ----------------------------------------------- |
| `room_created`        | `{ room; playerId; sessionToken; gameState }`   |
| `room_joined`         | `{ room; playerId; sessionToken; gameState }`   |
| `player_joined`       | `{ player; room }`                              |
| `player_left`         | `{ playerId; room }`                            |
| `player_reconnected`  | `{ player; room }`                              |
| `player_disconnected` | `{ playerId; room }`                            |
| `game_state_update`   | `{ gameState; message?; shouldReconnect? }`     |
| `timer_update`        | `{ timeRemaining }`                             |
| `sabotage_deployed`   | `{ sabotage: ActiveSabotage; targetPlayerId? }` |
| `sabotage_ended`      | `{ sabotageId }`                                |
| `round_complete`      | `{ completedRound }`                            |
| `room_error`          | `{ code; message }`                             |
| `game_error`          | `{ code; message }`                             |
| `sabotage_error`      | `{ code; message; attemptedSabotageId }`        |

Error codes (non-exhaustive):

- `room_error`: `ROOM_NOT_FOUND`, `ROOM_FULL`, `INVALID_CODE`,
  `INVALID_DATA`, `PLAYER_NAME_TAKEN`, `INVALID_PLAYER_NAME`,
  `AUTH_FAILED`, `AUTO_REJOIN_FAILED`, `SERVER_ERROR`
- `game_error`: `UNAUTHORIZED`, `ROUND_NOT_ACTIVE`, `PLAYER_NOT_FOUND`,
  `START_GAME_FAILED`, `START_ROUND_FAILED`, `STATE_SYNC_ERROR`
- `sabotage_error`: `SABOTAGE_NOT_FOUND`, `MAX_SABOTAGES_REACHED`,
  `GRACE_PERIOD_ACTIVE`, `SABOTAGE_ALREADY_ACTIVE`

`AUTH_FAILED` is sent as `connect_error` when the handshake middleware
rejects (bad/missing token). `AUTO_REJOIN_FAILED` is sent as `room_error`
when middleware passed but the post-connect rejoin can't proceed.

## Validation

- Room codes: 4 digits.
- Player names: 2–20 characters.
- Server enforces role-based authorization (host, director).

## Limits

- Max players per room: 8.
- Idle room lifetime: 2 hours.
- Rounds per game: capped by player count (each player acts once).
