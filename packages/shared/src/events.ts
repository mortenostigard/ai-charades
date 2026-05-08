import type {
  ActiveSabotage,
  CompletedRound,
  GameConfig,
  GameState,
  Player,
  Room,
} from './index.js';

/**
 * Events the client emits to the server.
 *
 * Each property is a function whose parameter list is the event payload.
 * Used as the `ClientToServerEvents` generic on `socket.io`'s `Server` /
 * `Socket` and `socket.io-client`'s `Socket`, giving end-to-end type
 * checking on `emit` and `on` calls.
 */
export interface ClientToServerEvents {
  create_room: (data: {
    playerName: string;
    gameConfig?: Partial<GameConfig>;
  }) => void;
  join_room: (data: { roomCode: string; playerName: string }) => void;
  rejoin_room: (data: {
    playerId: string;
    roomCode: string;
    sessionToken: string;
  }) => void;
  leave_room: () => void;
  start_game: (data: { roomCode: string }) => void;
  start_round: (data: { roomCode: string }) => void;
  deploy_sabotage: (data: { sabotageId: string; roomCode: string }) => void;
  end_round: (data: { roomCode: string; winnerId: string }) => void;
  request_game_state: () => void;
}

/**
 * Events the server emits to the client.
 *
 * `code` fields on error events are typed as `string`: the engine produces
 * a wider set of codes than any one event handler enumerates, so a closed
 * union here would force a cast at every emit site.
 */
export interface ServerToClientEvents {
  room_created: (data: {
    room: Room;
    playerId: string;
    sessionToken: string;
    gameState: GameState;
  }) => void;
  room_joined: (data: {
    room: Room;
    playerId: string;
    sessionToken: string;
    gameState: GameState;
  }) => void;
  room_error: (data: { code: string; message: string }) => void;
  game_error: (data: { code: string; message: string }) => void;
  game_state_update: (data: {
    gameState: GameState;
    message?: string;
    shouldReconnect?: boolean;
  }) => void;
  player_joined: (data: { player: Player; room: Room }) => void;
  player_left: (data: { playerId: string; room: Room }) => void;
  player_reconnected: (data: { player: Player; room: Room }) => void;
  player_disconnected: (data: { playerId: string; room: Room }) => void;
  round_complete: (data: { completedRound: CompletedRound }) => void;
  sabotage_deployed: (data: {
    sabotage: ActiveSabotage;
    targetPlayerId?: string;
  }) => void;
  sabotage_ended: (data: { sabotageId: string }) => void;
  sabotage_error: (data: {
    code: string;
    message: string;
    attemptedSabotageId: string;
  }) => void;
  timer_update: (data: { timeRemaining: number }) => void;
}

/**
 * Per-socket data bound by the connection middleware and create/join/rejoin
 * handlers. Privileged handlers derive the player's identity from this
 * binding rather than trusting payload-supplied ids.
 */
export interface SocketData {
  playerId?: string;
  roomCode?: string;
}
