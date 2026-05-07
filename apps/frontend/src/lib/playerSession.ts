// Persists the current player session to localStorage so that closing and
// reopening the tab within the TTL window auto-rejoins the same room/player.
// sessionStorage was the previous home, but it's per-tab and dies on close.

const KEY = 'charades-session';
const TTL_MS = 60 * 60 * 1000; // 1 hour

interface StoredSession {
  readonly playerId: string;
  readonly roomCode: string;
  readonly sessionToken: string;
  readonly savedAt: number;
}

export interface PlayerSession {
  readonly playerId: string;
  readonly roomCode: string;
  readonly sessionToken: string;
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function savePlayerSession(
  playerId: string,
  roomCode: string,
  sessionToken: string
): void {
  const storage = getStorage();
  if (!storage) return;
  const payload: StoredSession = {
    playerId,
    roomCode,
    sessionToken,
    savedAt: Date.now(),
  };
  try {
    storage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // Quota / private mode: silently ignore.
  }
}

export function loadPlayerSession(): PlayerSession | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (
      typeof parsed.playerId !== 'string' ||
      typeof parsed.roomCode !== 'string' ||
      typeof parsed.sessionToken !== 'string' ||
      typeof parsed.savedAt !== 'number'
    ) {
      storage.removeItem(KEY);
      return null;
    }
    if (Date.now() - parsed.savedAt > TTL_MS) {
      storage.removeItem(KEY);
      return null;
    }
    return {
      playerId: parsed.playerId,
      roomCode: parsed.roomCode,
      sessionToken: parsed.sessionToken,
    };
  } catch {
    storage.removeItem(KEY);
    return null;
  }
}

export function clearPlayerSession(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(KEY);
}
