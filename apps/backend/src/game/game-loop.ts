import { Server } from 'socket.io';
import { GameState } from '@ai-charades/shared';

type EndRoundCallback = (roomCode: string) => void;

/**
 * Manages the game loop and timer for a single game room.
 */
class GameLoop {
  private timer: NodeJS.Timeout | null = null;
  private readonly io: Server;
  private readonly roomCode: string;
  private readonly gameState: GameState;
  private readonly onRoundEnd: EndRoundCallback;

  constructor(
    io: Server,
    roomCode: string,
    gameState: GameState,
    onRoundEnd: EndRoundCallback
  ) {
    this.io = io;
    this.roomCode = roomCode;
    this.gameState = gameState;
    this.onRoundEnd = onRoundEnd;
  }

  public start() {
    if (this.timer || !this.gameState.currentRound) {
      return;
    }

    const { startTime, duration } = this.gameState.currentRound;

    this.timer = setInterval(() => {
      const now = Date.now();
      const timeRemaining = Math.max(0, startTime + duration - now);

      this.io.to(this.roomCode).emit('timer_update', { timeRemaining });

      if (timeRemaining <= 0) {
        this.stop();
        this.onRoundEnd(this.roomCode);
      }
    }, 1000);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

/**
 * A singleton manager for all active game loops across the server.
 */
class GameLoopManager {
  private static instance: GameLoopManager;
  private readonly loops: Map<string, GameLoop> = new Map();
  private io: Server | null = null;
  private onRoundEnd: EndRoundCallback | null = null;

  private constructor() {}

  public static getInstance(): GameLoopManager {
    if (!GameLoopManager.instance) {
      GameLoopManager.instance = new GameLoopManager();
    }
    return GameLoopManager.instance;
  }

  public init(io: Server, onRoundEnd: EndRoundCallback) {
    this.io = io;
    this.onRoundEnd = onRoundEnd;
  }

  public createLoop(roomCode: string, gameState: GameState) {
    if (this.loops.has(roomCode)) {
      this.loops.get(roomCode)?.stop();
    }

    if (!this.io || !this.onRoundEnd) {
      throw new Error('GameLoopManager not initialized!');
    }

    const loop = new GameLoop(this.io, roomCode, gameState, this.onRoundEnd);
    this.loops.set(roomCode, loop);
    loop.start();
  }

  public removeLoop(roomCode: string) {
    if (this.loops.has(roomCode)) {
      this.loops.get(roomCode)?.stop();
      this.loops.delete(roomCode);
    }
  }
}

export const gameLoopManager = GameLoopManager.getInstance();
