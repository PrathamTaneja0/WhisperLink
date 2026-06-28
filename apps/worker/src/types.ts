export interface Env {
  ROOM: DurableObjectNamespace;
  RATE_LIMIT: KVNamespace;
  ASSETS?: Fetcher;
  JWT_SECRET: string;
  SESSION_RATE_LIMIT_PER_HOUR: string;
  PASSCODE_MAX_ATTEMPTS: string;
  PASSCODE_LOCKOUT_MINUTES: string;
  METERED_API_KEY?: string;
  METERED_APP_NAME?: string;
}

export interface StoredPasswordHash {
  hash: string;
  salt: string;
}

export interface RoomState {
  roomId: string;
  expiresAt: string;
  isProtected: boolean;
  passwordHash?: StoredPasswordHash;
  hostPeerId?: string;
  createdAt: string;
  ended: boolean;
}

export interface JoinTokenPayload {
  roomId: string;
  peerId: string;
  displayName: string;
  isHost: boolean;
  exp: number;
}
