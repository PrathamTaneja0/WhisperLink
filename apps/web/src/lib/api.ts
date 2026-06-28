import type {
  CreateSessionResponse,
  JoinSessionResponse,
  SessionInfoResponse,
} from '@whisperlink/shared';

const API_BASE = '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: 'Request failed' }))) as {
      error?: string;
    };
    throw new Error(err.error ?? `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export async function createSession(body: {
  durationMinutes: number;
  access: 'public' | 'protected';
  password?: string;
}): Promise<CreateSessionResponse> {
  return apiFetch('/sessions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getSessionInfo(roomId: string): Promise<SessionInfoResponse> {
  return apiFetch(`/sessions/${roomId}`);
}

export async function joinSession(
  roomId: string,
  password?: string,
): Promise<JoinSessionResponse> {
  return apiFetch(`/sessions/${roomId}/join`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function endSession(roomId: string, joinToken: string): Promise<void> {
  await apiFetch(`/sessions/${roomId}/end`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${joinToken}` },
  });
}

export async function getTurnCredentials(): Promise<{ iceServers: RTCIceServer[] }> {
  return apiFetch('/turn');
}

export function getWebSocketUrl(roomId: string, token: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/api/rooms/${roomId}/ws?token=${encodeURIComponent(token)}`;
}

export function storeJoinToken(roomId: string, token: string): void {
  sessionStorage.setItem(`whisperlink:token:${roomId}`, token);
}

export function getStoredJoinToken(roomId: string): string | null {
  return sessionStorage.getItem(`whisperlink:token:${roomId}`);
}

export function clearJoinToken(roomId: string): void {
  sessionStorage.removeItem(`whisperlink:token:${roomId}`);
}
