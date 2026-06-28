export type WsEventType =
  | 'room:join'
  | 'room:leave'
  | 'room:participants'
  | 'signal:offer'
  | 'signal:answer'
  | 'signal:ice-candidate'
  | 'chat:message'
  | 'session:ended'
  | 'session:warning'
  | 'session:sync'
  | 'error';

export interface Participant {
  peerId: string;
  displayName: string;
  isHost: boolean;
}

export interface WsMessage<T = unknown> {
  type: WsEventType;
  payload: T;
}

export interface RoomJoinPayload {
  peerId: string;
  displayName: string;
  isHost: boolean;
  expiresAt: string;
  serverTime: string;
}

export interface RoomParticipantsPayload {
  participants: Participant[];
}

export interface SignalPayload {
  fromPeerId: string;
  targetPeerId: string;
  sdp?: { type: string; sdp?: string };
  candidate?: { candidate?: string; sdpMid?: string | null; sdpMLineIndex?: number | null };
}

export interface ChatMessagePayload {
  peerId: string;
  displayName: string;
  text: string;
  timestamp: number;
}

export interface SessionWarningPayload {
  remainingSeconds: number;
  message: string;
}

export interface SessionEndedPayload {
  reason: 'expired' | 'ended' | 'full';
}

export interface SessionSyncPayload {
  expiresAt: string;
  serverTime: string;
  isHost: boolean;
}

export interface ErrorPayload {
  message: string;
}

export function createWsMessage<T>(type: WsEventType, payload: T): WsMessage<T> {
  return { type, payload };
}
