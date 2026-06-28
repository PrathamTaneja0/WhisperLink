import { SignJWT, jwtVerify } from 'jose';
import { JOIN_TOKEN_TTL_SEC } from '@whisperlink/shared';
import type { JoinTokenPayload } from '../types';

function getSecret(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function issueJoinToken(
  payload: Omit<JoinTokenPayload, 'exp'>,
  secret: string,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + JOIN_TOKEN_TTL_SEC;
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(exp)
    .setIssuedAt()
    .sign(getSecret(secret));
}

export async function verifyJoinToken(
  token: string,
  secret: string,
  expectedRoomId?: string,
): Promise<JoinTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(secret));
    const data = payload as unknown as JoinTokenPayload;
    if (expectedRoomId && data.roomId !== expectedRoomId) return null;
    return data;
  } catch {
    return null;
  }
}

export async function issueHostJoinToken(
  roomId: string,
  peerId: string,
  displayName: string,
  secret: string,
): Promise<string> {
  return issueJoinToken({ roomId, peerId, displayName, isHost: true }, secret);
}
